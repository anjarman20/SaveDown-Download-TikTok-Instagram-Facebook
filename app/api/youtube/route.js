// app/api/youtube/route.js
export async function GET(request) {
  const secret = request.headers.get('x-api-secret') || '';
  if (secret !== process.env.NEXT_PUBLIC_INTERNAL_API_SECRET) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const type = searchParams.get('type') || 'video';

  if (!url) return Response.json({ error: 'Missing url' }, { status: 400 });

  const serviceUrl = process.env.SERVICE_URL || 'http://localhost:5001';

  try {
    // Step 1: fetch info saja — cepat (<10 detik)
    const res = await fetch(
      `${serviceUrl}/youtube?url=${encodeURIComponent(url)}&type=${type}`,
      { signal: AbortSignal.timeout(50000) }
    );
    const data = await res.json();
    if (!res.ok) return Response.json(data, { status: res.status });

    // Rewrite merge URL agar mengarah ke /api/youtube/merge
    if (data.downloads) {
      data.downloads = data.downloads.map(d => {
        if (d.needsMerge && d.url.startsWith('/youtube/merge')) {
          const params = d.url.split('?')[1];
          d.url = `/api/youtube/merge?${params}`;
          d.isMergeUrl = true;
        }
        return d;
      });
    }

    return Response.json(data);
  } catch (err) {
    console.error('[/api/youtube]', err);
    return Response.json({ error: 'YouTube service error. Try again.' }, { status: 500 });
  }
}
