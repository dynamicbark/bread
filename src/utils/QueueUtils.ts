import { prismaClient } from '../';
import Queue, { QueueWorkerCallback } from 'queue';

const counterQueue = new Queue({
  concurrency: 1,
  autostart: true,
});

const cachedUserQueue = new Queue({
  concurrency: 1,
  autostart: true,
});

type CounterQueueItem = {
  guildId: string;
  channelId: string;
  userId: string;
};

type CachedUserQueueItem = {
  userId: string;
  username: string;
  discriminator: string;
};

// Counter queue
function counterQueueItemProcess(job: CounterQueueItem, callback: QueueWorkerCallback) {
  prismaClient.usage
    .upsert({
      where: {
        guild_id_channel_id_user_id: {
          guild_id: BigInt(job.guildId),
          channel_id: BigInt(job.channelId),
          user_id: BigInt(job.userId),
        },
      },
      create: {
        guild_id: BigInt(job.guildId),
        channel_id: BigInt(job.channelId),
        counter: 1,
        cached_user: {
          connectOrCreate: {
            where: {
              id: BigInt(job.userId),
            },
            create: {
              id: BigInt(job.userId),
              username: 'Unknown User',
              discriminator: '0000',
              last_update: Math.floor(new Date().getTime() / 1000),
            },
          },
        },
      },
      update: {
        counter: {
          increment: 1,
        },
      },
    })
    .then(() => {
      callback();
    });
}

export function addToCounterQueue(counterQueueItem: CounterQueueItem) {
  counterQueue.push((callback) => {
    counterQueueItemProcess(counterQueueItem, callback!);
  });
}

// Cached user queue
function cachedUserQueueItemProcess(job: CachedUserQueueItem, callback: QueueWorkerCallback) {
  prismaClient.cachedUser
    .upsert({
      where: {
        id: BigInt(job.userId),
      },
      update: {
        username: job.username,
        discriminator: job.discriminator,
        last_update: Math.floor(new Date().getTime() / 1000), // Current epoch time
      },
      create: {
        id: BigInt(job.userId),
        username: job.username,
        discriminator: job.discriminator,
        last_update: Math.floor(new Date().getTime() / 1000), // Current epoch time
      },
    })
    .then(() => {
      callback();
    });
}

export function addToCachedUserQueue(cachedUserQueueItem: CachedUserQueueItem) {
  cachedUserQueue.push((callback) => {
    cachedUserQueueItemProcess(cachedUserQueueItem, callback!);
  });
}
