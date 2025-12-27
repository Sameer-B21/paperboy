type JobTask = () => Promise<void>;

// Simple job queue to serialize job execution
class JobQueue {
  private queue: Promise<void> = Promise.resolve();

  add(task: JobTask): void {
    this.queue = this.queue.then(task).catch(() => undefined);
  }
}

export const jobQueue = new JobQueue();
