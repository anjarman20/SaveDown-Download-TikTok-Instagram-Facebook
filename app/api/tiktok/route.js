export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const type = searchParams.get('type') || 'video';
  
    if (!url) return Response.json({ error: 'URL is required' }, { status: 400 });
  
    try {
      // Menggunakan tikwm.com API — gratis, stabil, tanpa API key
      const apiRes = await fetch(
        `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://www.tikwm.com/',
          },
          next: { revalidate: 0 },
        }
      );
  
      const json = await apiRes.json();
  
      if (!json || json.code !== 0 || !json.data) {
        throw new Error(json?.msg || 'Failed to fetch TikTok media');
      }
  
      const d = json.data;
      const downloads = [];
  
      if (type === 'video' || type === 'story') {
        if (d.hdplay)
          downloads.push({ label: 'Video HD (No Watermark)', type: 'video', quality: 'HD', url: d.hdplay });
        if (d.play)
          downloads.push({ label: 'Video SD (No Watermark)', type: 'video', quality: 'SD', url: d.play });
        if (d.wmplay)
          downloads.push({ label: 'Video (With Watermark)', type: 'video', quality: 'SD', url: d.wmplay });
      }
      if (type === 'audio' || type === 'video') {
        if (d.music)
          downloads.push({ label: 'Audio MP3', type: 'audio', quality: 'MP3', url: d.music });
      }
  
      if (!downloads.length) throw new Error('No download links found for this video');
  
      return Response.json({
        title: d.title || 'TikTok Video',
        author: d.author?.nickname || d.author?.unique_id || 'TikTok',
        thumbnail: d.cover || d.origin_cover || null,
        duration: d.duration ? formatDuration(d.duration) : null,
        downloads,
      });
  
    } catch (e) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }
  
  function formatDuration(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }