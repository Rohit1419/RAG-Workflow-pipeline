# Development Plan for RAG Workspace API

## Phase 1: Data Models & Storage

1. Define TypeScript interfaces for:
   - `Document` (with version history)
   - `SearchResult`
   - `Citation`
   - `Conversation` & `Message`
2. Create in-memory storage maps:
   - `documentsStore` (Map<id, Document>)
   - `conversationsStore` (Map<id, Conversation>)

## Phase 2: Core Utilities

1. **Tokenization**
   - Extract tokens using `/[a-z0-9]+/g`
   - Deduplicate while preserving order

2. **Scoring Engine**
   - Count token hits in title/content
   - Apply substring bonus logic
   - Return score

3. **Snippet Generation**
   - Split by newlines and sentence boundaries
   - Find first segment with query token
   - Trim and cap at 160 characters

## Phase 3: Documents API

- `POST /api/documents` - Create with version 1
- `GET /api/documents/:id` - Retrieve document
- `PUT /api/documents/:id` - Update & increment version
- `GET /api/documents/:id/history` - Return all versions sorted

## Phase 4: Search API

- `POST /api/search`
  - Validate query (non-empty & produces tokens)
  - Validate topK (1-10, default 3)
  - Filter by tag if provided
  - Score all documents
  - Sort and slice to topK
  - Return results with snippets

## Phase 5: Answers API

- `POST /api/answers`
  - Reuse search logic
  - Format answer text with numbered citations
  - Return citations list

## Phase 6: Conversations API

- `POST /api/conversations` - Create conversation
- `POST /api/conversations/:id/messages` - Add message pair
- `GET /api/conversations/:id` - Retrieve with history

## Phase 7: Testing & Refinement

- Test edge cases (empty queries, invalid topK, missing docs)
- Verify exact scoring formula
- Validate timestamp/ID generation

---

**Recommended build order**: Utilities → Documents → Search → Answers → Conversations
