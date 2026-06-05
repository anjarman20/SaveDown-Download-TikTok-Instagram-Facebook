export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
  
    if (!url) return new Response('Missing url', { status: 400 });
  
    // Hanya izinkan domain Instagram & Facebook CDN
    const allowed = [
      'cdninstagram.com',
      'fbcdn.net',
      'scontent',
      'instagram.com',
    ];
    const isAllowed = allowed.some(d => url.includes(d));
    if (!isAllowed) return new Response('Forbidden', { status: 403 });
  
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.instagram.com/',
        },
      });
  
      const contentType = res.headers.get('content-type') || 'image/jpeg';
      const buffer = await res.arrayBuffer();
  
      return new Response(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch {
      return new Response('Failed to fetch', { status: 500 });
    }
  }