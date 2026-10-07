import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper: safely extract a string param from Express (avoids exactOptionalPropertyTypes issues)
function strParam(value: unknown): string {
  return String(value ?? '');
}

export const adminKycController = {
  /**
   * GET /api/v1/admin/kyc
   * Lists all KYC profiles. Supports ?status= filter.
   */
  listProfiles: async (req: Request, res: Response): Promise<void> => {
    try {
      const statusFilter = typeof req.query.status === 'string' ? req.query.status : undefined;
      const page = Math.max(1, parseInt(typeof req.query.page === 'string' ? req.query.page : '1', 10));
      const limit = Math.max(1, parseInt(typeof req.query.limit === 'string' ? req.query.limit : '20', 10));
      const skip = (page - 1) * limit;

      const whereClause = statusFilter ? { status: statusFilter } : {};

      const [profiles, total] = await Promise.all([
        prisma.kycProfile.findMany({
          where: whereClause,
          include: {
            documents: true,
            merchant: { select: { id: true, legalName: true, displayName: true, country: true } },
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.kycProfile.count({
          where: whereClause,
        }),
      ]);

      res.status(200).json({
        data: profiles,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      console.error('Error listing KYC profiles:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * GET /api/v1/admin/kyc/:profileId
   */
  getProfile: async (req: Request, res: Response): Promise<void> => {
    try {
      const profileId = strParam(req.params.profileId);

      const profile = await prisma.kycProfile.findUnique({
        where: { id: profileId },
        include: {
          documents: { orderBy: { createdAt: 'asc' } },
          merchant: {
            select: { id: true, legalName: true, displayName: true, country: true, status: true },
          },
        },
      });

      if (!profile) {
        res.status(404).json({ error: 'KYC profile not found' });
        return;
      }

      res.status(200).json(profile);
    } catch (error) {
      console.error('Error fetching KYC profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * POST /api/v1/admin/kyc/:profileId/approve
   * Atomically: marks profile VERIFIED + all docs VERIFIED + activates merchant
   */
  approveProfile: async (req: Request, res: Response): Promise<void> => {
    try {
      const profileId = strParam(req.params.profileId);

      const profile = await prisma.kycProfile.findUnique({
        where: { id: profileId },
      });

      if (!profile) {
        res.status(404).json({ error: 'KYC profile not found' });
        return;
      }

      if (profile.status !== 'UNDER_REVIEW') {
        res.status(400).json({ error: `Cannot approve a profile with status: ${profile.status}` });
        return;
      }

      await prisma.$transaction(async (tx) => {
        await tx.kycProfile.update({
          where: { id: profileId },
          data: { status: 'VERIFIED', verifiedAt: new Date() },
        });

        // Mark all pending docs as VERIFIED
        await tx.kycDocument.updateMany({
          where: { kycProfileId: profileId },
          data: { verificationStatus: 'VERIFIED' },
        });

        // Activate the merchant
        await tx.merchant.update({
          where: { id: profile.merchantId },
          data: { status: 'ACTIVE' },
        });
      });

      // TODO: publish kyc.approved to Kafka → notification-service sends welcome email

      res.status(200).json({
        message: 'KYC profile approved. Merchant account is now ACTIVE.',
      });
    } catch (error) {
      console.error('Error approving KYC profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * POST /api/v1/admin/kyc/:profileId/reject
   * Sets profile to REJECTED. Optionally marks a specific document.
   */
  rejectProfile: async (req: Request, res: Response): Promise<void> => {
    try {
      const profileId = strParam(req.params.profileId);
      const reason = typeof req.body.reason === 'string' ? req.body.reason : '';
      const documentId = typeof req.body.documentId === 'string' ? req.body.documentId : undefined;

      if (!reason) {
        res.status(400).json({ error: 'A rejection reason is required' });
        return;
      }

      const profile = await prisma.kycProfile.findUnique({ where: { id: profileId } });

      if (!profile) {
        res.status(404).json({ error: 'KYC profile not found' });
        return;
      }

      if (profile.status !== 'UNDER_REVIEW') {
        res.status(400).json({ error: `Cannot reject a profile with status: ${profile.status}` });
        return;
      }

      await prisma.$transaction(async (tx) => {
        await tx.kycProfile.update({
          where: { id: profileId },
          data: { status: 'REJECTED' },
        });

        if (documentId) {
          await tx.kycDocument.update({
            where: { id: documentId },
            data: { verificationStatus: 'REJECTED', rejectionReason: reason },
          });
        }
      });

      // TODO: publish kyc.rejected to Kafka → notification-service sends rejection email

      res.status(200).json({ message: 'KYC profile rejected.', reason });
    } catch (error) {
      console.error('Error rejecting KYC profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
