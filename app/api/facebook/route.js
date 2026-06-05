export async function GET(request) {
    const secret = request.headers.get('x-api-secret') || '';
    if (secret !== process.env.NEXT_PUBLIC_INTERNAL_API_SECRET) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) return Response.json({ error: 'URL is required' }, { status: 400 });

    const PYTHON_SERVICE = process.env.SERVICE_URL || 'http://localhost:5001';

    try {
        const res = await fetch(
            `${PYTHON_SERVICE}/api/facebook?url=${encodeURIComponent(url)}`,
            { next: { revalidate: 0 } }
        );

        const text = await res.text();
        if (!text || text.trim() === '') throw new Error('Empty response from service');

        let data;
        try { data = JSON.parse(text); } catch { throw new Error('Invalid response format'); }

        if (!res.ok) throw new Error(data?.error || `Service error ${res.status}`);

        return Response.json(data);

    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}