const BLOCKED_IMAGE_PATHS = [
  '/photos/3760262/',
  '/photos/6621337/',
];

export function safeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return BLOCKED_IMAGE_PATHS.some((path) => url.includes(path)) ? null : url;
}
