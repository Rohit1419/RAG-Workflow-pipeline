import { Router, Request, Response } from "express";
import { conversationsStore, documentsStore } from "../storage";
import { Conversation, Message, Citation } from "../types/types";
import {
  generateId,
  getCurrentTimestamp,
  tokenize,
  deduplicateTokens,
  calculateScore,
  generateSnippet,
} from "../utility";

const router = Router();

router.post("/", (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return res
      .status(400)
      .json({ error: "Name is required and must be non-empty" });
  }

  const id = generateId();
  const now = getCurrentTimestamp();

  const conversation: Conversation = {
    id,
    name,
    messages: [],
    createdAt: now,
  };

  conversationsStore.set(id, conversation);
  return res.status(201).json(conversation);
});

router.post("/:id/messages", (req: Request, res: Response) => {
  const { id } = req.params;
  let { query, topK = 3, tag } = req.body;

  const conversation = conversationsStore.get(id);
  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  if (!query || typeof query !== "string" || query.trim() === "") {
    return res
      .status(400)
      .json({ error: "Query is required and must be non-empty" });
  }

  if (tag !== undefined && typeof tag !== "string") {
    return res.status(400).json({ error: "Tag must be a string" });
  }

  tag = tag as string | undefined;

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

  const userId = generateId();
  const now = getCurrentTimestamp();

  const userMessage: Message = {
    id: userId,
    role: "user",
    content: query,
    createdAt: now,
  };

  conversation.messages.push(userMessage);

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

  let answerText: string;
  let citations: Citation[];

  if (topResults.length === 0) {
    answerText = "No relevant context found.";
    citations = [];
  } else {
    citations = topResults.map((result, index) => ({
      rank: index + 1,
      documentId: result.documentId,
      score: result.score,
      snippet: result.snippet,
    }));

    answerText = [
      "Relevant context:",
      ...citations.map((citation) => `[${citation.rank}] ${citation.snippet}`),
    ].join("\n");
  }

  const assistantId = generateId();
  const assistantNow = getCurrentTimestamp();

  const assistantMessage: Message = {
    id: assistantId,
    role: "assistant",
    content: answerText,
    createdAt: assistantNow,
    citations,
  };

  conversation.messages.push(assistantMessage);
  conversationsStore.set(id, conversation);

  return res.status(201).json({
    userMessage,
    assistantMessage,
    citations,
  });
});

router.get("/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const conversation = conversationsStore.get(id);

  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  return res.status(200).json(conversation);
});

export default router;
