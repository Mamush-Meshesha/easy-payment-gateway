import { OutboxPublisher } from '../../src/outbox/publisher';
import { prisma } from '../../src/dal/prisma';
import { KafkaProducer } from '@payment-gateway/shared-kafka';

// Mock Prisma
jest.mock('../../src/dal/prisma', () => ({
  prisma: {
    outboxEvent: {
      findMany: jest.fn(),
      update: jest.fn()
    }
  }
}));

// Mock KafkaProducer
jest.mock('@payment-gateway/shared-kafka', () => {
  return {
    KafkaProducer: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      publish: jest.fn().mockResolvedValue([{ topicName: 'test', partition: 0, errorCode: 0 }])
    }))
  };
});

describe('OutboxPublisher', () => {
  let publisher: OutboxPublisher;
  let mockKafkaProducerInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-ignore
    prisma.outboxEvent.findMany.mockResolvedValue([]);
    publisher = new OutboxPublisher();
    // We can intercept the mocked instance 
    mockKafkaProducerInstance = (KafkaProducer as jest.Mock).mock.results[0].value;
  });

  afterEach(async () => {
    await publisher.stop();
  });

  it('should connect to Kafka on start', async () => {
    await publisher.start();
    expect(mockKafkaProducerInstance.connect).toHaveBeenCalledTimes(1);
  });

  it('should publish unpublished events and mark them as published', async () => {
    const mockEvents = [
      {
        id: 'event-1',
        eventType: 'merchant.created',
        payload: { eventId: 'event-1', merchantId: '123' },
        published: false
      }
    ];

    // @ts-ignore
    prisma.outboxEvent.findMany.mockResolvedValueOnce(mockEvents);
    // @ts-ignore
    prisma.outboxEvent.update.mockResolvedValueOnce({});

    // @ts-ignore
    publisher.isRunning = true;
    await (publisher as any).poll();

    expect(prisma.outboxEvent.findMany).toHaveBeenCalledWith({
      where: { published: false },
      take: 50,
      orderBy: { createdAt: 'asc' }
    });

    expect(mockKafkaProducerInstance.publish).toHaveBeenCalledWith(
      'merchant.events',
      expect.objectContaining({ merchantId: '123', eventId: 'event-1' })
    );

    expect(prisma.outboxEvent.update).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      data: { published: true, publishedAt: expect.any(Date) }
    });
  });

  it('should gracefully handle Kafka publish failure (no db update)', async () => {
    const mockEvents = [
      {
        id: 'event-2',
        eventType: 'merchant.created',
        payload: { merchantId: '456' },
        published: false
      }
    ];

    // @ts-ignore
    prisma.outboxEvent.findMany.mockResolvedValueOnce(mockEvents);
    mockKafkaProducerInstance.publish.mockRejectedValueOnce(new Error('Kafka error'));

    // @ts-ignore
    publisher.isRunning = true;
    await (publisher as any).poll();

    expect(mockKafkaProducerInstance.publish).toHaveBeenCalled();
    // Since publish threw, update should NOT be called
    expect(prisma.outboxEvent.update).not.toHaveBeenCalled();
  });
});
