import { promises as fs } from "node:fs";
import path from "node:path";

export type ContentRecord = {
  id: string;
  title: string;
  body: string;
  sourceUrl?: string;
  createdAt: string;
};

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export type JobRecord = {
  id: string;
  contentId: string;
  status: JobStatus;
  script?: string;
  audioPath?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

type DatabaseShape = {
  contents: ContentRecord[];
  jobs: JobRecord[];
};

export const storageRoot = path.resolve(process.cwd(), "storage");
const audioDir = path.join(storageRoot, "audio");
const dataFile = path.join(storageRoot, "data.json");

let writeQueue: Promise<void> = Promise.resolve();

async function ensureStorage() {
  await fs.mkdir(audioDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    const initial: DatabaseShape = { contents: [], jobs: [] };
    await fs.writeFile(dataFile, JSON.stringify(initial, null, 2));
  }
}

async function readData(): Promise<DatabaseShape> {
  await ensureStorage();
  const raw = await fs.readFile(dataFile, "utf-8");
  return JSON.parse(raw) as DatabaseShape;
}

async function writeData(nextData: DatabaseShape) {
  await ensureStorage();
  await fs.writeFile(dataFile, JSON.stringify(nextData, null, 2));
}

function withWriteLock<T>(task: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(task, task);
  writeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export async function addContent(record: ContentRecord): Promise<void> {
  return withWriteLock(async () => {
    const data = await readData();
    data.contents.push(record);
    await writeData(data);
  });
}

export async function getContent(contentId: string): Promise<ContentRecord | undefined> {
  const data = await readData();
  return data.contents.find((content) => content.id === contentId);
}

export async function addJob(record: JobRecord): Promise<void> {
  return withWriteLock(async () => {
    const data = await readData();
    data.jobs.push(record);
    await writeData(data);
  });
}

export async function getJob(jobId: string): Promise<JobRecord | undefined> {
  const data = await readData();
  return data.jobs.find((job) => job.id === jobId);
}

export async function updateJob(
  jobId: string,
  updates: Partial<JobRecord>
): Promise<JobRecord | undefined> {
  return withWriteLock(async () => {
    const data = await readData();
    const index = data.jobs.findIndex((job) => job.id === jobId);
    if (index === -1) {
      return undefined;
    }
    const updated: JobRecord = { ...data.jobs[index], ...updates };
    data.jobs[index] = updated;
    await writeData(data);
    return updated;
  });
}

export async function saveAudio(jobId: string, content: string): Promise<string> {
  await ensureStorage();
  const filename = `${jobId}.txt`;
  const filePath = path.join(audioDir, filename);
  await fs.writeFile(filePath, content, "utf-8");
  return filePath;
}

export function resolveAudioPath(audioPath: string): string {
  if (path.isAbsolute(audioPath)) {
    return audioPath;
  }
  return path.join(storageRoot, audioPath);
}
