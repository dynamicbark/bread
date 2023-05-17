import Queue, { QueueWorkerCallback } from 'queue';
import { prismaClient } from '../index.js';

const databaseQueue = new Queue({
  concurrency: 1,
  autostart: true,
});

type CounterQueueItem = {
  guildId: string;
  channelId: string;
  userId: string;
};

type UserQueueItem = {
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
        user: {
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
  databaseQueue.push((callback) => {
    counterQueueItemProcess(counterQueueItem, callback!);
  });
}

// User queue
export function userQueueItemProcess(job: UserQueueItem, callback: QueueWorkerCallback) {
  prismaClient.user
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

export function addToUserQueue(userQueueItem: UserQueueItem) {
  databaseQueue.push((callback) => {
    userQueueItemProcess(userQueueItem, callback!);
  });
}
