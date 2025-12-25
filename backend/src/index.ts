import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";
import path from "node:path";
import {
  addContent,
  addJob,
  getContent,
  getJob,
  resolveAudioPath,
  saveAudio,
  storageRoot,
  updateJob,
  type ContentRecord,
  type JobRecord,
} from "./storage.js";

const app = express();
const port = Number.parseInt(process.env.PORT ?? "3001", 10);

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/ingest", async (req, res) => {
  const { title, content, url } = req.body ?? {};
  if (!content && !url) {
    res.status(400).json({ error: "Provide content or url." });
    return;
  }

  let resolvedContent: string = content ?? "";
  let resolvedTitle: string = title ?? "Untitled newsletter";
  let sourceUrl: string | undefined = undefined;

  if (url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        res.status(400).json({ error: `Failed to fetch URL (${response.status}).` });
        return;
      }
      resolvedContent = await response.text();
      sourceUrl = url;
      if (!title) {
        resolvedTitle = url;
      }
    } catch (error) {
      res.status(400).json({ error: "Unable to fetch the provided URL." });
      return;
    }
  }

  if (!resolvedContent.trim()) {
    res.status(400).json({ error: "Content is empty after ingestion." });
    return;
  }

  const record: ContentRecord = {
    id: randomUUID(),
    title: resolvedTitle,
    body: resolvedContent,
    sourceUrl,
    createdAt: new Date().toISOString(),
  };

  await addContent(record);

  res.status(201).json({ contentId: record.id });
});

app.post("/generate", async (req, res) => {
  const { contentId } = req.body ?? {};
  if (!contentId || typeof contentId !== "string") {
    res.status(400).json({ error: "contentId is required." });
    return;
  }

  const content = await getContent(contentId);
  if (!content) {
    res.status(404).json({ error: "Content not found." });
    return;
  }

  const job: JobRecord = {
    id: randomUUID(),
    contentId,
    status: "queued",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await addJob(job);
  void processJob(job.id, content);

  res.status(202).json({ jobId: job.id });
});

app.get("/status/:jobId", async (req, res) => {
  const job = await getJob(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "Job not found." });
    return;
  }
  res.json({
    id: job.id,
    status: job.status,
    error: job.error,
    updatedAt: job.updatedAt,
  });
});

app.get("/podcast/:jobId", async (req, res) => {
  const job = await getJob(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "Job not found." });
    return;
  }
  if (job.status !== "completed") {
    res.status(409).json({ error: "Job is not complete yet." });
    return;
  }
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.json({
    id: job.id,
    contentId: job.contentId,
    script: job.script,
    audioUrl: `${baseUrl}/audio/${job.id}`,
    completedAt: job.updatedAt,
  });
});

app.get("/audio/:jobId", async (req, res) => {
  const job = await getJob(req.params.jobId);
  if (!job || !job.audioPath) {
    res.status(404).json({ error: "Audio not found." });
    return;
  }
  const resolvedPath = resolveAudioPath(job.audioPath);
  res.sendFile(resolvedPath, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
});

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

async function processJob(jobId: string, content: ContentRecord) {
  await updateJob(jobId, {
    status: "processing",
    updatedAt: new Date().toISOString(),
  });

  try {
    const script = buildScript(content);
    const audioText = [
      `Podcast script for: ${content.title}`,
      "",
      script,
      "",
      "(Generated placeholder audio transcript.)",
    ].join("\n");
    const audioPath = await saveAudio(jobId, audioText);
    await updateJob(jobId, {
      status: "completed",
      script,
      audioPath: path.relative(storageRoot, audioPath),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    await updateJob(jobId, {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error.",
      updatedAt: new Date().toISOString(),
    });
  }
}

function buildScript(content: ContentRecord): string {
  const sanitized = content.body.replace(/\s+/g, " ").trim();
  const sentences = sanitized.split(/(?<=[.!?])\s+/).filter(Boolean);
  const snippet = sentences.slice(0, 3).join(" ");
  const fallback = sanitized.slice(0, 600);
  const highlight = snippet.length > 0 ? snippet : fallback;
  return [
    `Welcome back! Here's today's summary from "${content.title}".`,
    highlight,
    "Thanks for listening, and stay tuned for more updates.",
  ].join(" ");
}

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`);
});
