# RAG Workspace API

Build an in-memory REST API for a deterministic RAG workspace: documents, lexical retrieval, citation building, and conversation transcripts. There is no LLM call in this project. The point is to implement the retrieval and answer assembly logic exactly as specified.

## Requirements

### Health

- **GET /api/health** -> `200` with `{ "status": "ok" }`

### Documents

- **POST /api/documents**
  - Body: `{ title, content, tags? }`
  - `title` and `content` are required non-empty strings
  - `tags` is optional array of non-empty strings
  - Returns `201` with the created document
  - New documents start at `version = 1`
- **GET /api/documents/:id**
  - Return `200` with the stored document
  - Return `404` if missing
- **GET /api/documents/:id/history**
  - Response: `{ versions: [...] }`
  - Sort by `version` ascending
  - Each entry must include `version`, `title`, `content`, `tags`, and `updatedAt`
  - Return `404` if missing
- **PUT /api/documents/:id**
  - Replaces `title`, `content`, and `tags`
  - Increments `version` by 1
  - Updates `updatedAt`
  - Return `404` if missing

### Search

- **POST /api/search**
  - Body: `{ query, topK?, tag? }`
  - `query` is required non-empty string
  - `topK` defaults to 3 and must be an integer from 1 to 10
  - If `tag` is provided, only search documents whose tags contain that exact string
  - Response: `{ results: [...] }`
  - Each result object must include at least:
    - `documentId`
    - `title`
    - `version`
    - `score`
    - `snippet`

### Answers

- **POST /api/answers**
  - Body: same as `/api/search`
  - Uses the exact same ranking logic
  - If no documents match, return:
    - `answer: "No relevant context found."`
    - `citations: []`
  - Otherwise return:
    - `answer`: a string in this exact format:
      ```
      Relevant context:
      [1] <snippet 1>
      [2] <snippet 2>
      ...
      ```
    - `citations`: ordered list of citation objects matching the snippets
    - Each citation object must include at least:
      - `rank`
      - `documentId`
      - `score`
      - `snippet`

### Conversations

- **POST /api/conversations**
  - Body: `{ name }`
  - Returns `201` with the created conversation including `id`, `name`, and `messages: []`
- **POST /api/conversations/:id/messages**
  - Body: `{ query, topK?, tag? }`
  - Store a user message with the query
  - Generate the assistant answer using `/api/answers` logic
  - Store the assistant message
  - Return `201` with:
    - `userMessage`
    - `assistantMessage`
    - `citations`
  - Both messages must include `id`, `role`, `content`, and `createdAt`
  - `assistantMessage.content` must contain the same answer text returned by `/api/answers`
  - `assistantMessage` must also store the same citations returned in `citations`
- **GET /api/conversations/:id**
  - Return the conversation and messages in insertion order

## Exact Retrieval Rules

- Tokenize strings with lowercase alphanumeric tokens using regex `/[a-z0-9]+/g`
- Deduplicate query tokens before scoring while preserving their first-seen order
- If query tokenization produces zero tokens, return `400`
- Document score is:
  - `3 * titleTokenHits`
  - `1 * contentTokenHits`
  - `+2` if the lowercased title contains the full lowercased query substring
  - `+5` if the lowercased content contains the full lowercased query substring
- Ignore documents whose score is 0
- Sort by:
  1. score desc
  2. createdAt asc
  3. documentId asc
- Snippet rule:
  - Split content by newlines or sentence boundaries (`. `, `!`, `?`)
  - Use the first segment containing at least one query token
  - If none exists, use the first 160 characters of content
  - Trim outer whitespace from the snippet
  - Cap snippets at 160 characters

## Constraints

- Use in-memory storage only
- IDs can be any unique string format
- Timestamps must be ISO strings

## Start Command

```
npm install && npm start
```
