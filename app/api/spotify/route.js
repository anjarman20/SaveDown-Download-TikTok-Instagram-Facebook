export async function GET(request) {
  const secret = request.headers.get('x-api-secret') || '';
  if (secret !== process.env.NEXT_PUBLIC_INTERNAL_API_SECRET) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  if (!url) return Response.json({ error: 'Missing url' }, { status: 400 });

  const serviceUrl = process.env.SERVICE_URL || 'http://localhost:5001';

  try {
    const res = await fetch(
      `${serviceUrl}/spotify?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(45000) }
    );
    const data = await res.json();
    if (!res.ok) return Response.json(data, { status: res.status });
    return Response.json(data);
  } catch (err) {
    console.error('[/api/spotify]', err);
    return Response.json({ error: 'Spotify service error. Try again.' }, { status: 500 });
  }
}