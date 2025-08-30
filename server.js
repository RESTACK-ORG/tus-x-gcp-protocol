import express from "express";
import cors from "cors";
import { Server } from "@tus/server";
import { GCSStore } from "@tus/gcs-store";
import { Storage } from "@google-cloud/storage";

const app = express();
const port = process.env.PORT || 8080;

const bucketName = process.env.GCS_BUCKET_NAME;
const projectId = process.env.GCS_PROJECT_ID;

const storage = new Storage({
  projectId,
  credentials: process.env.GCP_SA_KEY ? JSON.parse(process.env.GCP_SA_KEY) : undefined,
});

const bucket = storage.bucket(bucketName);

// Global CORS
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "tus-resumable",
      "upload-length",
      "upload-offset",
      "upload-metadata",
      "upload-defer-length",
      "upload-concat",
    ],
    exposedHeaders: [
      "location",
      "upload-offset",
      "upload-length",
      "tus-resumable",
      "upload-metadata",
    ],
  })
);

// Express 5-safe preflight (regex, not "*")
app.options(/.*/, cors());

// tus server
const tusServer = new Server({
  path: "/files",
  datastore: new GCSStore({ bucket }),
  onUploadCreate: async (req, upload) => {
    console.log("Upload created:", upload.id);
    return { metadata: upload.metadata };
  },
  onUploadFinish: async (req, upload) => {
    console.log("Upload finished:", upload.id, "Size:", upload.size);
    return { metadata: upload.metadata };
  },
});

// Short-circuit OPTIONS before tus
app.use("/files", (req, res) => {
  if (req.method === "OPTIONS") return res.sendStatus(204);
  return tusServer.handle(req, res);
});

app.get("/", (req, res) => {
  res.json({
    message: "TUS Upload Server",
    endpoints: { upload: "/files", health: "/health" },
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`TUS upload server running on http://localhost:${port}`);
  console.log(`Upload endpoint: http://localhost:${port}/files`);
});
