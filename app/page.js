'use client';

import { useState, useRef, useEffect } from 'react';

// ─── Icons (inline SVG components) ───────────────────────────────────────────
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
const Spinner = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 0', color: 'var(--muted)' }}>
    <div className="spinner" />
    <span style={{ fontSize: '0.875rem' }}>Fetching media info...</span>
  </div>
);

// ─── Result Card ──────────────────────────────────────────────────────────────
function ResultCard({ data, platform }) {
  const [activeVideo, setActiveVideo] = useState(null);
  const videoRef = useRef(null);

  if (!data) return null;

  const { title, author, thumbnail, duration, downloads = [] } = data;

  const handleVideoPreview = (url) => {
    setActiveVideo(activeVideo === url ? null : url);
  };

  return (
    <div className="result-card fade-in">
      {/* Media Preview */}
      <div className="preview-area">
        {activeVideo ? (
          <div className="video-player-wrap">
            <video
              ref={videoRef}
              src={activeVideo}
              controls
              autoPlay
              className="video-player"
              onError={() => setActiveVideo(null)}
            />
            <button className="close-video-btn" onClick={() => setActiveVideo(null)} aria-label="Close preview">
              <IconX />
            </button>
          </div>
        ) : thumbnail ? (
          <div className="thumb-wrap">
            <img src={thumbnail} alt={title || 'Media preview'} className="thumb-img" loading="lazy" />
            {downloads.find(d => d.type === 'video') && (
              <button
                className="play-overlay"
                onClick={() => handleVideoPreview(downloads.find(d => d.type === 'video')?.url)}
                aria-label="Preview video"
              >
                <IconPlay />
              </button>
            )}
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
        {author && <p className="result-author">by {author}</p>}

        <div className="download-grid">
          {downloads.map((item, i) => (
            <DownloadItem key={i} item={item} index={i} onPreview={handleVideoPreview} activeVideo={activeVideo} />
          ))}
          {downloads.length === 0 && (
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', gridColumn: '1/-1' }}>
              No download links found. The content may be private.
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

  return (
    <div className="download-item">
      <div className="download-item-label">
        <span className="dl-label-text">{item.label}</span>
        {item.size && <span className="dl-size">{item.size}</span>}
        {item.quality && <span className="dl-quality">{item.quality}</span>}
      </div>
      <div className="dl-actions">
        {isVideo && (
          <button
            className={`btn-action btn-preview ${activeVideo === item.url ? 'active' : ''}`}
            onClick={() => onPreview(item.url)}
          >
            {activeVideo === item.url ? 'Hide' : 'Preview'}
          </button>
        )}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`btn-action btn-download ${isPrimary ? 'btn-download--primary' : ''}`}
          download
        >
          <IconDownload />
          Download
        </a>
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
      const res = await fetch(`/api/${platform.id}?url=${encodeURIComponent(trimmed)}&type=${activeType}`);
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
      <p className="hint-text">
        <IconInfo /> {platform.hint}
      </p>

      {/* Error */}
      {error && (
        <div className="error-banner fade-in">
          <IconAlert /> <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && <Spinner />}

      {/* Result */}
      {!loading && result && <ResultCard data={result} platform={platform.id} />}
    </div>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'Is this service free?', a: 'Yes, completely free. No registration, no hidden fees.' },
  { q: 'How do I download TikTok without watermark?', a: 'Select the TikTok tab, choose "Video (No Watermark)", paste the link, and click Fetch. The downloaded file will have no TikTok watermark.' },
  { q: 'Can I download private Instagram content?', a: 'Only publicly accessible content can be downloaded. Private accounts or stories require the original account to be public.' },
  { q: 'Why does the download link expire?', a: 'Download links are generated on-demand by the platform CDN and typically expire within a few hours. Simply re-fetch the URL to get a fresh link.' },
  { q: 'What quality can I download?', a: 'SaveDown fetches the highest available quality from each platform — typically 720p to 1080p for TikTok/Instagram Reels, and HD/SD for Facebook videos.' },
  { q: 'Is it legal to download these videos?', a: 'Downloading for personal offline viewing is generally acceptable. Re-uploading, distributing, or monetizing without the creator\'s consent may violate copyright law and platform ToS.' },
];

function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <section className="section section--alt" id="faq">
      <div className="container">
        <div className="section-header">
          <h2>Frequently Asked Questions</h2>
        </div>
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
      {/* HEADER */}
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
        {/* HERO + DOWNLOADER */}
        <section className="hero">
          <div className="container">
            <div className="hero-text">
              <span className="badge">Free · No Watermark · No Sign-up</span>
              <h1>Download from Any Social Platform</h1>
              <p className="hero-sub">
                TikTok videos without watermark, Instagram posts, reels, stories, and Facebook videos — all in one place.
              </p>
            </div>

            {/* Ad slot — leaderboard top */}
            <div className="ad-slot ad-slot--728">
              {/* <ins className="adsbygoogle" style={{display:'block'}} data-ad-client="ca-pub-XXXX" data-ad-slot="XXXX" data-ad-format="auto" data-full-width-responsive="true"></ins> */}
              <span className="ad-label">Advertisement</span>
            </div>

            {/* Downloader card */}
            <div className="downloader-card">
              <div className="platform-tabs" role="tablist">
                {PLATFORMS.map(p => (
                  <PlatformTab
                    key={p.id}
                    platform={p}
                    active={activePlatform.id === p.id}
                    onClick={() => setActivePlatform(p)}
                  />
                ))}
              </div>
              <DownloaderPanel key={activePlatform.id} platform={activePlatform} />
            </div>

            {/* Ad slot — rectangle */}
            <div className="ad-slot ad-slot--rect">
              {/* <ins className="adsbygoogle" style={{display:'block'}} data-ad-client="ca-pub-XXXX" data-ad-slot="XXXX" data-ad-format="rectangle"></ins> */}
              <span className="ad-label">Advertisement</span>
            </div>
          </div>
        </section>

        {/* PLATFORMS */}
        <section className="section section--alt" id="platforms">
          <div className="container">
            <div className="section-header">
              <h2>Supported Platforms</h2>
              <p>Everything you can download, organized by platform.</p>
            </div>
            <div className="platforms-grid">
              {[
                { name: 'TikTok', color: '#e2175c', items: ['Videos without watermark (HD)', 'Stories', 'Audio / MP3 extraction', 'Slideshows'] },
                { name: 'Instagram', color: '#c13584', items: ['Posts (single & carousel)', 'Reels (up to 1080p)', 'Stories (photo & video)', 'IGTV'] },
                { name: 'Facebook', color: '#1877f2', items: ['Video posts (HD & SD)', 'Reels', 'Photo posts', 'Public page videos'] },
              ].map(pl => (
                <div key={pl.name} className="platform-card" style={{ '--pc': pl.color }}>
                  <h3 style={{ color: pl.color }}>{pl.name}</h3>
                  <ul>
                    {pl.items.map(it => <li key={it}>{it}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
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
                { n: '3', title: 'Preview & Download', desc: 'Preview the video or photo, choose your quality, and download.' },
              ].map(s => (
                <div key={s.n} className="step">
                  <div className="step-num">{s.n}</div>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ad between sections */}
        <div className="container">
          <div className="ad-slot ad-slot--728">
            <span className="ad-label">Advertisement</span>
          </div>
        </div>

        {/* FAQ */}
        <FAQ />
      </main>

      {/* FOOTER */}
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
