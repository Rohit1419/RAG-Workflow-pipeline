import { Router, Request, Response } from "express";
import { documentsStore } from "../storage";
import { Citation } from "../types/types";
import {
  tokenize,
  deduplicateTokens,
  calculateScore,
  generateSnippet,
} from "../utility";

const router = Router();

router.post("/", (req: Request, res: Response) => {
  const { query, topK = 3, tag } = req.body;

  if (!query || typeof query !== "string" || query.trim() === "") {
    return res
      .status(400)
      .json({ error: "Query is required and must be non-empty" });
  }

  const queryTokens = deduplicateTokens(tokenize(query));
  if (queryTokens.length === 0) {
    return res
      .status(400)
      .json({ error: "Query must contain at least one alphanumeric token" });
  }

  if (!Number.isInteger(topK) || topK < 1 || topK > 10) {
    return res
      .status(400)
      .json({ error: "topK must be an integer between 1 and 10" });
  }

  if (tag && typeof tag !== "string") {
    return res.status(400).json({ error: "Tag must be a string" });
  }

  const results: (any & { createdAt: string })[] = [];

  for (const [docId, document] of documentsStore) {
    if (tag && !document.tags.includes(tag)) {
      continue;
    }

    const score = calculateScore(document.title, document.content, queryTokens);

    if (score === 0) {
      continue;
    }

    const snippet = generateSnippet(document.content, queryTokens);

    results.push({
      documentId: docId,
      title: document.title,
      version: document.version,
      score,
      snippet,
      createdAt: document.createdAt,
    });
  }

  results.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }
    if (a.createdAt !== b.createdAt) {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return a.documentId.localeCompare(b.documentId);
  });

  const topResults = results.slice(0, topK);

  if (topResults.length === 0) {
    return res.status(200).json({
      answer: "No relevant context found.",
      citations: [],
    });
  }

  const citations: Citation[] = topResults.map((result, index) => ({
    rank: index + 1,
    documentId: result.documentId,
    score: result.score,
    snippet: result.snippet,
  }));

  const answerText = [
    "Relevant context:",
    ...citations.map((citation) => `[${citation.rank}] ${citation.snippet}`),
  ].join("\n");

  return res.status(200).json({
    answer: answerText,
    citations,
  });
});

export default router;
