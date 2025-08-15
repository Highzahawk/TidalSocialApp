import IORedis from 'ioredis';
import { Queue, Worker, JobsOptions, Job } from 'bullmq';

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const queueName = 'ingest';

export const ingestQueue = new Queue(queueName, { connection });

export type IngestJob = { userId: string };

new Worker<IngestJob>(queueName, async (job: Job<IngestJob>) => {
  const { userId } = job.data;
  console.log('Ingesting for', userId);
}, { connection });

export async function enqueueIngest(userId: string, opts: JobsOptions = {}) {
  await ingestQueue.add('ingest-user', { userId }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    ...opts
  });
}

setInterval(() => {
  console.log('Tick - enqueue users');
}, 60_000);
