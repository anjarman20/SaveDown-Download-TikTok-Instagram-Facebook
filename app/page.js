'use client';

import { useState, useRef, useEffect } from 'react';

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const IconMoon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const IconSun = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
);
const IconChevron = ({ dir = 'down' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: dir === 'up' ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconPlay = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconAlert = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconMusic = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
  </svg>
);

// ─── Helper: proxy thumbnail CDN Instagram/Facebook ───────────────────────────
function proxiedUrl(url) {
  if (!url) return null;
  const needsProxy =
    url.includes('cdninstagram.com') ||
    url.includes('fbcdn.net') ||
    url.includes('scontent') ||
    url.includes('instagram.com/') ||
    url.includes('facebook.com/');
  if (needsProxy) return `/api/proxy?url=${encodeURIComponent(url)}`;
  return url;
}

// ─── Platform config ──────────────────────────────────────────────────────────
const PLATFORMS = [
  {
    id: 'tiktok',
    label: 'TikTok',
    placeholder: 'https://www.tiktok.com/@user/video/...',
    hint: 'Open TikTok → Share → Copy Link → paste here',
    types: [
      { id: 'video', label: 'Video (No Watermark)' },
      { id: 'story', label: 'Story' },
      { id: 'audio', label: 'Audio Only' },
    ],
    color: '#e2175c',
    validate: (url) => url.includes('tiktok.com') || url.includes('vm.tiktok'),
  },
  {
    id: 'instagram',
    label: 'Instagram',
    placeholder: 'https://www.instagram.com/p/...',
    hint: 'Copy URL from post, reel, or story → paste here',
    types: [
      { id: 'post', label: 'Post / Carousel' },
      { id: 'reels', label: 'Reels' },
      { id: 'story', label: 'Story' },
    ],
    color: '#c13584',
    validate: (url) => url.includes('instagram.com'),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    placeholder: 'https://www.facebook.com/watch?v=...',
    hint: 'Copy the video or post URL from Facebook → paste here',
    types: [
      { id: 'video', label: 'Video Post' },
      { id: 'photo', label: 'Photo Post' },
    ],
    color: '#1877f2',
    validate: (url) => url.includes('facebook.com') || url.includes('fb.watch'),
  },
];

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = ({ platform }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 0', color: 'var(--muted)' }}>
    <div className="spinner" />
    <span style={{ fontSize: '0.875rem' }}>
      {platform === 'spotify'
        ? 'Searching track on YouTube Music...'
        : platform === 'youtube'
        ? 'Fetching video info...'
        : 'Fetching media info...'}
    </span>
  </div>
);

// ─── Result Card ──────────────────────────────────────────────────────────────
function ResultCard({ data, platform }) {
  const [activeVideo, setActiveVideo] = useState(null);
  const [thumbError, setThumbError] = useState(false);
  const videoRef = useRef(null);

  if (!data) return null;

  const { title, author, album, thumbnail, duration, downloads = [] } = data;
  const firstVideo = downloads.find(d => d.type === 'video');
  const firstAudio = downloads.find(d => d.type === 'audio');
  const firstImage = downloads.find(d => d.type === 'image');

  const thumbSrc = proxiedUrl(thumbnail);
  const fallbackThumb = firstImage ? proxiedUrl(firstImage.url) : null;
  const isAudioOnly = downloads.length > 0 && downloads.every(d => d.type === 'audio');

  const handleVideoPreview = (url) => setActiveVideo(activeVideo === url ? null : url);

  return (
    <div className="result-card fade-in">
      {/* Media Preview */}
      <div className="preview-area">
        {activeVideo ? (
          <div className="video-player-wrap">
            <video ref={videoRef} src={activeVideo} controls autoPlay className="video-player" onError={() => setActiveVideo(null)} />
            <button className="close-video-btn" onClick={() => setActiveVideo(null)} aria-label="Close preview"><IconX /></button>
          </div>
        ) : isAudioOnly ? (
          // Audio-only preview (Spotify / YouTube audio)
          <div className="audio-preview-wrap">
            {thumbSrc && !thumbError ? (
              <img
                src={thumbSrc}
                alt={title || 'Cover'}
                className="audio-cover"
                onError={() => setThumbError(true)}
              />
            ) : (
              <div className="audio-cover-placeholder"><IconMusic /></div>
            )}
            {firstAudio && (
              <audio controls src={firstAudio.url} className="audio-player" onError={() => {}} />
            )}
          </div>
        ) : (thumbSrc && !thumbError) ? (
          <div className="thumb-wrap">
            <img
              src={thumbSrc}
              alt={title || 'Media preview'}
              className="thumb-img"
              loading="lazy"
              onError={(e) => {
                if (fallbackThumb && e.target.src !== fallbackThumb) {
                  e.target.src = fallbackThumb;
                } else {
                  setThumbError(true);
                }
              }}
            />
            {firstVideo && (
              <button className="play-overlay" onClick={() => handleVideoPreview(firstVideo.url)} aria-label="Preview video">
                <IconPlay />
              </button>
            )}
            {duration && <span className="duration-badge">{duration}</span>}
          </div>
        ) : firstVideo ? (
          <div className="thumb-wrap">
            <video
              src={firstVideo.url}
              className="thumb-img"
              style={{ objectFit: 'cover', cursor: 'pointer' }}
              onClick={() => handleVideoPreview(firstVideo.url)}
              muted playsInline preload="metadata"
              onError={() => {}}
            />
            <button className="play-overlay" onClick={() => handleVideoPreview(firstVideo.url)} aria-label="Preview video">
              <IconPlay />
            </button>
            {duration && <span className="duration-badge">{duration}</span>}
          </div>
        ) : (
          <div className="thumb-placeholder">
            <span style={{ fontSize: '2rem', opacity: 0.3 }}>◻</span>
          </div>
        )}
      </div>

      {/* Info & Downloads */}
      <div className="result-info">
        {title && <h3 className="result-title">{title.slice(0, 100)}{title.length > 100 ? '...' : ''}</h3>}
        {author && <p className="result-author">by {author}{album ? ` · ${album}` : ''}</p>}

        <div className="download-grid">
          {downloads.map((item, i) => (
            <DownloadItem key={i} item={item} index={i} onPreview={handleVideoPreview} activeVideo={activeVideo} />
          ))}
          {downloads.length === 0 && (
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', gridColumn: '1/-1' }}>
              No download links found. The content may be private or unavailable.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function DownloadItem({ item, index, onPreview, activeVideo }) {
  const isPrimary = index === 0;
  const isVideo = item.type === 'video';
  const [merging, setMerging] = useState(false);
  const [mergeUrl, setMergeUrl] = useState(null);
  const [mergeError, setMergeError] = useState('');

  const handleMergeDownload = async () => {
    setMerging(true);
    setMergeError('');
    try {
      // Trigger merge — ini akan makan waktu 1-3 menit
      const res = await fetch(item.url, {
        headers: { 'x-api-secret': process.env.NEXT_PUBLIC_INTERNAL_API_SECRET }
      });
      if (!res.ok) throw new Error('Merge failed. Try again.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setMergeUrl(url);
      // Auto-trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `video_${item.quality || 'hd'}.mp4`;
      a.click();
    } catch (e) {
      setMergeError(e.message);
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="download-item">
      <div className="download-item-label">
        <span className="dl-label-text">{item.label}</span>
        {item.quality && <span className="dl-quality">{item.quality}</span>}
        {item.isMergeUrl && !merging && !mergeUrl && (
          <span className="dl-merge-badge">HD+Audio</span>
        )}
        {merging && <span className="dl-merge-badge merging">Merging… may take 1-3 min</span>}
      </div>

      {mergeError && <p className="dl-merge-error">{mergeError}</p>}

      <div className="dl-actions">
        {isVideo && !item.isMergeUrl && (
          <button
            className={`btn-action btn-preview ${activeVideo === item.url ? 'active' : ''}`}
            onClick={() => onPreview(item.url)}
          >
            {activeVideo === item.url ? 'Hide' : 'Preview'}
          </button>
        )}

        {item.isMergeUrl ? (
          <button
            className={`btn-action btn-download ${isPrimary ? 'btn-download--primary' : ''}`}
            onClick={handleMergeDownload}
            disabled={merging}
          >
            {merging
              ? <><div className="btn-spinner" /> Merging...</>
              : <><IconDownload /> Download</>
            }
          </button>
        ) : (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn-action btn-download ${isPrimary ? 'btn-download--primary' : ''}`}
            download
          >
            <IconDownload /> Download
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Platform Tab ─────────────────────────────────────────────────────────────
function PlatformTab({ platform, active, onClick }) {
  return (
    <button
      className={`platform-tab ${active ? 'active' : ''}`}
      onClick={onClick}
      style={active ? { '--tab-color': platform.color } : {}}
    >
      {platform.label}
    </button>
  );
}

// ─── Downloader Panel ─────────────────────────────────────────────────────────
function DownloaderPanel({ platform }) {
  const [url, setUrl] = useState('');
  const [activeType, setActiveType] = useState(platform.types[0].id);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setUrl(''); setResult(null); setError(''); setActiveType(platform.types[0].id);
  }, [platform.id]);

  const handleFetch = async () => {
    setError(''); setResult(null);
    const trimmed = url.trim();
    if (!trimmed) { setError('Please paste a URL first.'); return; }
    let isValid = false;
    try { new URL(trimmed); isValid = true; } catch {}
    if (!isValid || !platform.validate(trimmed)) {
      setError(`This does not look like a valid ${platform.label} URL.`); return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/${platform.id}?url=${encodeURIComponent(trimmed)}&type=${activeType}`,
        { headers: { 'x-api-secret': process.env.NEXT_PUBLIC_INTERNAL_API_SECRET } }
      );
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `Server error ${res.status}`);
      setResult(data);
    } catch (e) {
      setError(e.message || 'Failed to fetch. Check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      {/* Spotify warning */}
      {platform.id === 'spotify' && (
        <div className="info-banner">
          <IconInfo />
          <span>Track tunggal saja. Proses mungkin 10–20 detik karena mencari source dari YouTube Music.</span>
        </div>
      )}

      {/* Type selector */}
      <div className="type-row">
        {platform.types.map(t => (
          <button
            key={t.id}
            className={`type-chip ${activeType === t.id ? 'active' : ''}`}
            onClick={() => { setActiveType(t.id); setResult(null); setError(''); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* URL input */}
      <div className="input-row">
        <input
          type="url"
          className="url-input"
          value={url}
          onChange={e => { setUrl(e.target.value); setError(''); setResult(null); }}
          onKeyDown={e => e.key === 'Enter' && handleFetch()}
          placeholder={platform.placeholder}
          spellCheck={false}
          autoComplete="off"
        />
        <button className="btn-fetch" onClick={handleFetch} disabled={loading}>
          {loading ? <div className="btn-spinner" /> : <IconSearch />}
          {loading ? 'Fetching...' : 'Fetch'}
        </button>
      </div>

      {/* Hint */}
      <p className="hint-text"><IconInfo /> {platform.hint}</p>

      {/* Error */}
      {error && (
        <div className="error-banner fade-in">
          <IconAlert /> <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && <Spinner platform={platform.id} />}

      {/* Result */}
      {!loading && result && <ResultCard data={result} platform={platform.id} />}
    </div>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'Is this service free?', a: 'Yes, completely free. No registration, no hidden fees.' },
  { q: 'How do I download TikTok without watermark?', a: 'Select the TikTok tab, choose "Video (No Watermark)", paste the link, and click Fetch.' },
  { q: 'Can I download YouTube videos?', a: 'Yes. Paste any YouTube video or Shorts URL, choose Video (MP4) or Audio (MP3), then click Fetch.' },
  { q: 'How does Spotify download work?', a: 'SaveDown finds the matching audio from YouTube Music based on the Spotify track metadata, then lets you download it as MP3. Only single tracks are supported.' },
  { q: 'Can I download private Instagram content?', a: 'Only publicly accessible content can be downloaded. Private accounts or stories require the original account to be public.' },
  { q: 'Why does the download link expire?', a: 'Download links are generated on-demand by the platform CDN and typically expire within a few hours. Simply re-fetch the URL to get a fresh link.' },
  { q: 'Is it legal to download these videos?', a: "Downloading for personal offline viewing is generally acceptable. Re-uploading or monetizing without the creator's consent may violate copyright law and platform ToS." },
];

function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <section className="section section--alt" id="faq">
      <div className="container">
        <div className="section-header"><h2>Frequently Asked Questions</h2></div>
        <div className="faq-list">
          {FAQS.map((f, i) => (
            <div key={i} className={`faq-item ${open === i ? 'open' : ''}`}>
              <button className="faq-q" onClick={() => setOpen(open === i ? null : i)}>
                <span>{f.q}</span>
                <IconChevron dir={open === i ? 'up' : 'down'} />
              </button>
              {open === i && <div className="faq-a fade-in">{f.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Page() {
  const [activePlatform, setActivePlatform] = useState(PLATFORMS[0]);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <a href="/" className="logo">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
              <rect width="26" height="26" rx="7" fill="currentColor" opacity=".1"/>
              <path d="M13 5v9.5M13 14.5l-3.5-3.5M13 14.5l3.5-3.5M6.5 19.5h13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            SaveDown
          </a>
          <nav className="nav">
            <a href="#platforms">Platforms</a>
            <a href="#how-to">How It Works</a>
            <a href="#faq">FAQ</a>
          </nav>
          <button
            className="theme-toggle"
            onClick={() => setDark(d => !d)}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <IconSun /> : <IconMoon />}
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container">
            <div className="hero-text">
              <span className="badge">Free · No Watermark · No Sign-up</span>
              <h1>Download from Any Social Platform</h1>
              <p className="hero-sub">
                TikTok, Instagram, Facebook, YouTube, and Spotify — download videos, reels, stories, and music all in one place.
              </p>
            </div>

            <div className="ad-slot ad-slot--728">
              <span className="ad-label">Advertisement</span>
            </div>

            <div className="downloader-card">
              <div className="platform-tabs" role="tablist">
                {PLATFORMS.map(p => (
                  <PlatformTab key={p.id} platform={p} active={activePlatform.id === p.id} onClick={() => setActivePlatform(p)} />
                ))}
              </div>
              <DownloaderPanel key={activePlatform.id} platform={activePlatform} />
            </div>

            <div className="ad-slot ad-slot--rect">
              <span className="ad-label">Advertisement</span>
            </div>
          </div>
        </section>

        <section className="section section--alt" id="platforms">
          <div className="container">
            <div className="section-header">
              <h2>Supported Platforms</h2>
              <p>Everything you can download, organized by platform.</p>
            </div>
            <div className="platforms-grid">
              {[
                { name: 'TikTok', color: '#e2175c', items: ['Videos without watermark (HD)', 'Stories', 'Audio / MP3 extraction'] },
                { name: 'Instagram', color: '#c13584', items: ['Posts (single & carousel)', 'Reels (up to 1080p)', 'Stories (photo & video)'] },
                { name: 'Facebook', color: '#1877f2', items: ['Video posts (HD & SD)', 'Reels', 'Public page videos'] },
                { name: 'YouTube', color: '#ff0000', items: ['Videos up to 1080p (MP4)', 'Shorts', 'Audio extraction (MP3)'] },
                { name: 'Spotify', color: '#1db954', items: ['Single track (MP3)', 'Full metadata (title, artist, cover)', 'Matched from YouTube Music'] },
              ].map(pl => (
                <div key={pl.name} className="platform-card" style={{ '--pc': pl.color }}>
                  <h3 style={{ color: pl.color }}>{pl.name}</h3>
                  <ul>{pl.items.map(it => <li key={it}>{it}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="how-to">
          <div className="container">
            <div className="section-header">
              <h2>How It Works</h2>
              <p>Three simple steps, no account needed.</p>
            </div>
            <div className="steps-grid">
              {[
                { n: '1', title: 'Copy the URL', desc: 'Open the app, find the content, tap Share, then "Copy Link".' },
                { n: '2', title: 'Paste & Fetch', desc: 'Select the platform tab, paste the URL, and press Fetch.' },
                { n: '3', title: 'Preview & Download', desc: 'Preview the video or audio, choose your quality, and download.' },
              ].map(s => (
                <div key={s.n} className="step">
                  <div className="step-num">{s.n}</div>
                  <div><h3>{s.title}</h3><p>{s.desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="container">
          <div className="ad-slot ad-slot--728">
            <span className="ad-label">Advertisement</span>
          </div>
        </div>

        <FAQ />
      </main>

      <footer className="footer">
        <div className="container">
          <p>© {new Date().getFullYear()} SaveDown. For personal use only. Respect content creators. Created by Anjar</p>
          <div className="footer-links">
            {['Privacy Policy', 'Terms of Service', 'DMCA', 'Contact'].map(l => (
              <a key={l} href="#">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}
