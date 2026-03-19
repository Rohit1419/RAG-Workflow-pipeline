import { Router, Request, Response } from "express";
import { documentsStore } from "../storage";
import { Document, DocumentVersion } from "../types/types";
import { generateId, getCurrentTimestamp } from "../utility";

const router = Router();

router.post("/", (req: Request, res: Response) => {
  const { title, content, tags = [] } = req.body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res
      .status(400)
      .json({ error: "Title is required and must be non-empty" });
  }

  if (!content || typeof content !== "string" || content.trim() === "") {
    return res
      .status(400)
      .json({ error: "Content is required and must be non-empty" });
  }

  if (
    !Array.isArray(tags) ||
    tags.some((tag) => typeof tag !== "string" || tag.trim() === "")
  ) {
    return res
      .status(400)
      .json({ error: "Tags must be an array of non-empty strings" });
  }

  const id = generateId();
  const now = getCurrentTimestamp();
  const initialVersion: DocumentVersion = {
    version: 1,
    title,
    content,
    tags,
    updatedAt: now,
  };

  const document: Document = {
    id,
    createdAt: now,
    ...initialVersion,
    history: [initialVersion],
  };

  documentsStore.set(id, document);
  return res.status(201).json(document);
});

router.get("/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const document = documentsStore.get(id);

  if (!document) {
    return res.status(404).json({ error: "Document not found" });
  }

  return res.status(200).json(document);
});

router.get("/:id/history", (req: Request, res: Response) => {
  const { id } = req.params;
  const document = documentsStore.get(id);

  if (!document) {
    return res.status(404).json({ error: "Document not found" });
  }

  const versions = document.history.sort((a, b) => a.version - b.version);
  return res.status(200).json({ versions });
});

router.put("/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content, tags = [] } = req.body;

  const document = documentsStore.get(id);
  if (!document) {
    return res.status(404).json({ error: "Document not found" });
  }

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res
      .status(400)
      .json({ error: "Title is required and must be non-empty" });
  }

  if (!content || typeof content !== "string" || content.trim() === "") {
    return res
      .status(400)
      .json({ error: "Content is required and must be non-empty" });
  }

  if (
    !Array.isArray(tags) ||
    tags.some((tag) => typeof tag !== "string" || tag.trim() === "")
  ) {
    return res
      .status(400)
      .json({ error: "Tags must be an array of non-empty strings" });
  }

  const newVersion = document.version + 1;
  const now = getCurrentTimestamp();

  const versionEntry: DocumentVersion = {
    version: newVersion,
    title,
    content,
    tags,
    updatedAt: now,
  };

  document.version = newVersion;
  document.title = title;
  document.content = content;
  document.tags = tags;
  document.updatedAt = now;
  document.history.push(versionEntry);

  documentsStore.set(id, document);
  return res.status(200).json(document);
});

export default router;
