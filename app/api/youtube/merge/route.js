// app/api/youtube/merge/route.js
export async function GET(request) {
    const secret = request.headers.get('x-api-secret') || '';
    if (secret !== process.env.NEXT_PUBLIC_INTERNAL_API_SECRET) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const height = searchParams.get('height');
  
    if (!id || !height) return Response.json({ error: 'Missing params' }, { status: 400 });
  
    const serviceUrl = process.env.SERVICE_URL || 'http://localhost:5001';
  
    try {
      // Merge bisa makan waktu 1-3 menit — timeout 5 menit
      const res = await fetch(
        `${serviceUrl}/youtube/merge?id=${id}&height=${height}`,
        { signal: AbortSignal.timeout(300000) }
      );
  
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Merge failed' }));
        return Response.json(data, { status: res.status });
      }
  
      // Stream file langsung ke browser
      const blob = await res.blob();
      return new Response(blob, {
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': `attachment; filename="video_${height}p.mp4"`,
        },
      });
    } catch (err) {
      console.error('[/api/youtube/merge]', err);
      return Response.json({ error: 'Merge timeout or failed. Try again.' }, { status: 500 });
    }
  }
  