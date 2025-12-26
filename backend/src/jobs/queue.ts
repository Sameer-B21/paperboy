type JobTask = () => Promise<void>;

class JobQueue {
  private queue: Promise<void> = Promise.resolve();

  add(task: JobTask): void {
    this.queue = this.queue.then(task).catch(() => undefined);
  }
}

export const jobQueue = new JobQueue();
