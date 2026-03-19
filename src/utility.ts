export function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) || [];
}

export function deduplicateTokens(tokens: string[]): string[] {
  const seen = new Set<string>();
  return tokens.filter((token) => {
    if (seen.has(token)) return false;
    seen.add(token);
    return true;
  });
}

export function calculateScore(
  title: string,
  content: string,
  queryTokens: string[],
): number {
  const titleTokens = tokenize(title);
  const contentTokens = tokenize(content);

  const titleHits = queryTokens.filter((token) =>
    titleTokens.includes(token),
  ).length;
  const contentHits = queryTokens.filter((token) =>
    contentTokens.includes(token),
  ).length;

  let score = titleHits * 3 + contentHits * 1;

  if (title.toLowerCase().includes(queryTokens.join(""))) {
    score += 2;
  }

  if (content.toLowerCase().includes(queryTokens.join(""))) {
    score += 5;
  }

  return score;
}

export function generateSnippet(
  content: string,
  queryTokens: string[],
): string {
  const segments = content
    .split(/\n|\.\ |!|\?/)
    .map((s) => s.trim())
    .filter((s) => s);

  for (const segment of segments) {
    const segmentTokens = tokenize(segment);
    if (queryTokens.some((token) => segmentTokens.includes(token))) {
      return segment.substring(0, 160).trim();
    }
  }

  return content.substring(0, 160).trim();
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
