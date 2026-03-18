export interface DocumentVersion {
  version: number;
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
}

export interface Document extends DocumentVersion {
  id: string;
  createdAt: string;
  history: DocumentVersion[];
}

export interface SearchResult {
  documentId: string;
  title: string;
  version: number;
  score: number;
  snippet: string;
}

export interface Citation {
  rank: number;
  documentId: string;
  score: number;
  snippet: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  citations?: Citation[];
}

export interface Conversation {
  id: string;
  name: string;
  messages: Message[];
  createdAt: string;
}
