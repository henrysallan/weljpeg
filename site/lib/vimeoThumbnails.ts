/**
 * Fetch Vimeo video thumbnails via the public oEmbed API.
 * Results are cached in-memory for the session.
 */

const cache = new Map<string, string>();

export async function fetchVimeoThumbnail(
  vimeoId: string,
  width = 1280,
): Promise<string> {
  const cached = cache.get(vimeoId);
  if (cached !== undefined) return cached;

  try {
    const res = await fetch(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(
        `https://vimeo.com/${vimeoId}`,
      )}&width=${width}`,
    );
    if (!res.ok) throw new Error(`oEmbed ${res.status}`);
    const data = await res.json();
    const url: string = data.thumbnail_url ?? "";
    cache.set(vimeoId, url);
    return url;
  } catch {
    cache.set(vimeoId, "");
    return "";
  }
}
