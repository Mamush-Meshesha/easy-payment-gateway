import { MerchantConsumer } from '../../src/events/merchant.consumer';
import { prisma } from '../../src/dal/prisma';
import { KafkaConsumer } from '@payment-gateway/shared-kafka';

jest.mock('@payment-gateway/shared-kafka', () => {
  return {
    KafkaConsumer: jest.fn().mockImplementation(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      subscribe: jest.fn(),
      start: jest.fn()
    }))
  };
});

jest.mock('../../src/dal/prisma', () => ({
  prisma: {
    $transaction: jest.fn()
  }
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password')
}));

describe('MerchantConsumer', () => {
  let consumer: MerchantConsumer;
  let mockKafkaConsumerInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    consumer = new MerchantConsumer();
    mockKafkaConsumerInstance = (KafkaConsumer as jest.Mock).mock.results[0].value;
  });

  afterEach(async () => {
    await consumer.stop();
  });

  it('should initialize and start consuming from merchant-events', async () => {
    await consumer.start();

    expect(mockKafkaConsumerInstance.connect).toHaveBeenCalled();
    expect(mockKafkaConsumerInstance.subscribe).toHaveBeenCalledWith('merchant-events', false);
    expect(mockKafkaConsumerInstance.start).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should process merchant.created event idempotently', async () => {
    await consumer.start();

    // Get the handler that was passed to KafkaConsumer.start
    const messageHandler = mockKafkaConsumerInstance.start.mock.calls[0][0];

    const mockPayload = {
      eventId: 'event-uuid',
      eventType: 'merchant.created',
      payload: {
        email: 'test@merchant.com',
        merchantId: 'merch-abc'
      }
    };

    // We will simulate what happens inside the Prisma $transaction wrapper inside the handler
    (prisma.$transaction as jest.Mock).mockImplementationOnce(async (cb) => {
      const tx = {
        processedEvent: {
          findUnique: jest.fn().mockResolvedValue(null), // Not processed yet
          create: jest.fn()
        },
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: 'user-id' })
        },
        credential: {
          create: jest.fn()
        },
        role: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: 'role-id' })
        },
        userRole: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn()
        }
      };
      await cb(tx);
      
      // Assertions on transaction methods
      expect(tx.processedEvent.findUnique).toHaveBeenCalledWith({ where: { eventId: 'event-uuid' } });
      expect(tx.user.create).toHaveBeenCalled();
      expect(tx.userRole.create).toHaveBeenCalled();
      expect(tx.processedEvent.create).toHaveBeenCalledWith({ data: { eventId: 'event-uuid' } });
    });

    await messageHandler(mockPayload);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('should skip processing if event was already processed (Idempotency check)', async () => {
    await consumer.start();
    const messageHandler = mockKafkaConsumerInstance.start.mock.calls[0][0];

    const mockPayload = {
      eventId: 'duplicate-event-id',
      eventType: 'merchant.created',
      payload: { email: 'test@merchant.com', merchantId: 'merch-abc' }
    };

    (prisma.$transaction as jest.Mock).mockImplementationOnce(async (cb) => {
      const tx = {
        processedEvent: {
          findUnique: jest.fn().mockResolvedValue({ eventId: 'duplicate-event-id' }) // Already processed
        },
        user: { findUnique: jest.fn() } // Should never be called
      };
      await cb(tx);
      
      expect(tx.user.findUnique).not.toHaveBeenCalled();
    });

    await messageHandler(mockPayload);
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
