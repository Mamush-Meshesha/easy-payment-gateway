import { NotificationService } from '../src/services/notification.service';
import { EmailSender } from '../src/services/email.sender';
import { PrismaClient } from '@prisma/client';

jest.mock('../src/dal/prisma', () => ({
  __esModule: true,
  default: {
    notificationLog: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../src/services/email.sender');

import prisma from '../src/dal/prisma';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockEmailSender: jest.Mocked<EmailSender>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEmailSender = new (EmailSender as any)() as jest.Mocked<EmailSender>;
    mockEmailSender.send = jest.fn().mockResolvedValue(undefined);
    service = new NotificationService(mockEmailSender);
  });

  it('dispatches an email notification for payment.succeeded', async () => {
    (prisma.notificationLog.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.notificationLog.create as jest.Mock).mockResolvedValue({ id: 'log-1' });
    (prisma.notificationLog.update as jest.Mock).mockResolvedValue({});

    await service.dispatch({
      eventId: 'payment-1:SUCCEEDED',
      merchantId: 'merchant-A',
      recipientEmail: 'customer@example.com',
      channel: 'EMAIL',
      templateId: 'payment.succeeded',
      subject: 'Payment Successful',
      payload: { paymentId: 'payment-1', amount: 1000, currency: 'ETB' },
    });

    expect(mockEmailSender.send).toHaveBeenCalledTimes(1);
    expect(prisma.notificationLog.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'SENT' }) })
    );
  });

  it('skips duplicate events (idempotency)', async () => {
    (prisma.notificationLog.findUnique as jest.Mock).mockResolvedValue({ id: 'existing', status: 'SENT' });

    await service.dispatch({
      eventId: 'payment-1:SUCCEEDED',
      merchantId: 'merchant-A',
      channel: 'EMAIL',
      templateId: 'payment.succeeded',
      payload: {},
    });

    expect(mockEmailSender.send).not.toHaveBeenCalled();
    expect(prisma.notificationLog.create).not.toHaveBeenCalled();
  });

  it('marks notification FAILED and rethrows when email send fails', async () => {
    (prisma.notificationLog.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.notificationLog.create as jest.Mock).mockResolvedValue({ id: 'log-1' });
    (prisma.notificationLog.update as jest.Mock).mockResolvedValue({});
    mockEmailSender.send.mockRejectedValue(new Error('SMTP connection refused'));

    await expect(
      service.dispatch({
        eventId: 'payment-2:FAILED',
        merchantId: 'merchant-A',
        recipientEmail: 'customer@example.com',
        channel: 'EMAIL',
        templateId: 'payment.failed',
        payload: { paymentId: 'payment-2', amount: 500, currency: 'ETB' },
      })
    ).rejects.toThrow('SMTP connection refused');

    expect(prisma.notificationLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'FAILED',
          failureReason: 'SMTP connection refused',
        }),
      })
    );
  });

  it('throws if channel is EMAIL but no recipientEmail is provided', async () => {
    (prisma.notificationLog.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.notificationLog.create as jest.Mock).mockResolvedValue({ id: 'log-1' });
    (prisma.notificationLog.update as jest.Mock).mockResolvedValue({});

    await expect(
      service.dispatch({
        eventId: 'payment-3:SUCCEEDED',
        merchantId: 'merchant-A',
        channel: 'EMAIL',
        templateId: 'payment.succeeded',
        payload: {},
        // No recipientEmail
      })
    ).rejects.toThrow('recipientEmail is required');
  });
});
