import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const kycController = {
  getProfile: async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const merchantId = user?.roles?.find((r: any) => r.merchantId)?.merchantId;
      if (!merchantId) {
        res.status(401).json({ error: 'Unauthorized merchant context' });
        return;
      }

      let profile = await prisma.kycProfile.findUnique({
        where: { merchantId },
        include: { documents: true },
      });

      if (!profile) {
        // Create an empty pending profile
        profile = await prisma.kycProfile.create({
          data: {
            merchantId,
            status: 'PENDING',
          },
          include: { documents: true },
        });
      }

      res.status(200).json(profile);
    } catch (error) {
      console.error('Error fetching KYC profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  uploadDocument: async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const merchantId = user?.roles?.find((r: any) => r.merchantId)?.merchantId;
      if (!merchantId) {
        res.status(401).json({ error: 'Unauthorized merchant context' });
        return;
      }

      const { documentType, fileName } = req.body;
      if (!documentType || !fileName) {
        res.status(400).json({ error: 'documentType and fileName are required' });
        return;
      }

      // Find or create profile
      let profile = await prisma.kycProfile.findUnique({ where: { merchantId } });
      if (!profile) {
        profile = await prisma.kycProfile.create({
          data: { merchantId, status: 'PENDING' },
        });
      }

      // Generate a mock S3 pre-signed URL for the MVP
      // In production, this would call AWS SDK getSignedUrl
      const s3Key = `kyc/${merchantId}/${Date.now()}-${fileName}`;
      const preSignedUrl = `https://mock-s3-bucket.s3.amazonaws.com/${s3Key}?signature=mock`;

      // Save the pending document reference
      const doc = await prisma.kycDocument.create({
        data: {
          kycProfileId: profile.id,
          documentType,
          s3Uri: `s3://mock-s3-bucket/${s3Key}`,
          verificationStatus: 'PENDING',
        },
      });

      res.status(201).json({
        document: doc,
        uploadUrl: preSignedUrl,
      });
    } catch (error) {
      console.error('Error uploading KYC document:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  submitKyc: async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const merchantId = user?.roles?.find((r: any) => r.merchantId)?.merchantId;
      if (!merchantId) {
        res.status(401).json({ error: 'Unauthorized merchant context' });
        return;
      }

      const { 
        businessName, registrationNo, taxId, businessType,
        websiteUrl, supportEmail, addressLine1, city, state, postalCode, country,
        expectedVolume, representativeName, representativeDob
      } = req.body;

      const profile = await prisma.kycProfile.findUnique({
        where: { merchantId },
        include: { documents: true },
      });

      if (!profile) {
        res.status(404).json({ error: 'KYC Profile not found' });
        return;
      }

      if (profile.documents.length === 0) {
        res.status(400).json({ error: 'Must upload at least one document before submitting' });
        return;
      }

      const updatedProfile = await prisma.kycProfile.update({
        where: { id: profile.id },
        data: {
          businessName,
          registrationNo,
          taxId,
          businessType,
          websiteUrl,
          supportEmail,
          addressLine1,
          city,
          state,
          postalCode,
          country,
          expectedVolume,
          representativeName,
          representativeDob,
          status: 'UNDER_REVIEW',
        },
      });

      // Here we would typically publish an event "kyc.submitted" to Kafka
      // so the admin-service or a 3rd party vendor (Onfido) can pick it up for review.

      res.status(200).json(updatedProfile);
    } catch (error) {
      console.error('Error submitting KYC:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
