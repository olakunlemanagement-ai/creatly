/**
 * Returns a public URL for a resource preview image.
 *
 * Absolute URLs (e.g. picsum.photos dev seed images) are returned as-is.
 * Relative paths are resolved against the Supabase resource-previews bucket.
 */
export function getPreviewImageUrl(path: string): string {
  // Absolute URLs (external seed images) and site-relative paths (/seed/…) pass through unchanged.
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/resource-previews/${path}`;
}
