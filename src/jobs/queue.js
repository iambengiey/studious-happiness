class RetryQueue {
  constructor({ maxRetries = 3 } = {}) {
    this.maxRetries = maxRetries;
    this.jobs = [];
  }

  add(job) {
    this.jobs.push({ ...job, attempts: 0, status: 'queued' });
  }

  async drain(worker) {
    for (const job of this.jobs) {
      while (job.attempts < this.maxRetries && job.status !== 'done') {
        try {
          job.attempts += 1;
          await worker(job);
          job.status = 'done';
        } catch (error) {
          job.last_error = error.message;
          if (job.attempts >= this.maxRetries) {
            job.status = 'failed';
          }
        }
      }
    }
    return this.jobs;
  }
}

module.exports = { RetryQueue };
