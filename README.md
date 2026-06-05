# SaveDown — Social Media Downloader

Free multi-platform downloader: TikTok (no watermark), Instagram, Facebook — all in one website.

***

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend + API Routes | Next.js (App Router) |
| Instagram Downloader | Python service (`instaloader`) |
| Facebook Downloader | Python service (`yt-dlp`) |
| TikTok Downloader | tikwm.com API (free, no key) |
| Styling | Custom CSS (light/dark mode) |
| Ads | Google AdSense ready |

***

## Project Structure

```
savedown/
├── app/
│   ├── page.js               ← Main UI
│   ├── layout.js             ← Root layout + fonts + AdSense script
│   ├── globals.css           ← Design system + all styles
│   └── api/
│       ├── tiktok/
│       │   └── route.js      ← TikTok API (tikwm.com, gratis)
│       ├── instagram/
│       │   └── route.js      ← Instagram API → proxy ke Python service
│       └── facebook/
│           └── route.js      ← Facebook API → proxy ke Python service
├── python-service/
│   └── service.py            ← Flask server: Instagram + Facebook downloader
├── .env.local                ← API keys (jangan di-commit)
├── .env.local.example        ← Template env
└── README.md
```

***

## Setup

### 1. Buat Next.js Project

```bash
npx create-next-app@latest savedown
cd savedown
```

Saat ditanya:
- TypeScript → **No**
- Tailwind → **No**
- App Router → **Yes**

### 2. Copy File

Copy semua file dari zip ini ke folder `savedown/`, replace file yang sudah ada.

### 3. Install Dependencies Next.js

```bash
npm install axios
```

> Package `@tobyg74/tiktok-api-dl` dan `instagram-url-direct` sudah **tidak dipakai** — diganti dengan tikwm.com API dan Python service.

### 4. Setup Python Service

Install Python dependencies:

```bash
cd python-service
pip install flask instaloader yt-dlp gunicorn
```

Jalankan service:

```bash
# Development
python service.py

# Production (pakai gunicorn)
gunicorn -w 4 -b 0.0.0.0:5001 service:app
```

Service berjalan di `http://localhost:5001`

Update yt-dlp secara rutin agar tidak error:

```bash
yt-dlp -U
```

### 5. Set Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# URL Python service (ganti IP jika deploy ke VPS)
INSTAGRAM_SERVICE_URL=http://localhost:5001

# RapidAPI key (opsional — hanya sebagai fallback Instagram)
# Daftar gratis di rapidapi.com
RAPIDAPI_KEY=your_rapidapi_key_here
```

### 6. Jalankan Lokal

```bash
# Terminal 1 — Python service
cd python-service
python service.py

# Terminal 2 — Next.js
npm run dev
```

Buka `http://localhost:3000`

***

## Deploy ke Vercel + VPS

### Next.js → Vercel

```bash
npm install -g vercel
vercel
```

Tambahkan environment variable di **Vercel Dashboard → Project Settings → Environment Variables**:

| Key | Value |
|---|---|
| `INSTAGRAM_SERVICE_URL` | `http://YOUR_VPS_IP:5001` |
| `RAPIDAPI_KEY` | key RapidAPI kamu (opsional) |

### Python Service → VPS

```bash
# Di VPS (Ubuntu/Debian)
pip install flask instaloader yt-dlp gunicorn

# Clone / upload python-service/service.py ke VPS
# Jalankan dengan PM2
npm install -g pm2
pm2 start "gunicorn -w 4 -b 0.0.0.0:5001 service:app" --name savedown-service
pm2 save
pm2 startup
```

Pastikan port `5001` terbuka di firewall VPS:

```bash
ufw allow 5001
```

***

## API Endpoints

### TikTok

```
GET /api/tiktok?url={URL}&type={video|story|audio}
```

- Provider: **tikwm.com** (gratis, tanpa API key)
- Fallback: TikTok internal API
- Support: video no watermark, story, audio MP3

### Instagram

```
GET /api/instagram?url={URL}&type={post|reels|story}
```

- Provider: **Python service** → `instaloader`
- Support: Post, Reel, Carousel, Story (publik)
- Private post: butuh session cookie (lihat bagian Instagram Login di bawah)

### Facebook

```
GET /api/facebook?url={URL}&type={video|photo}
```

- Provider: **Python service** → `yt-dlp`
- Support: Video, Reel, Watch (publik)
- Output: multi resolusi (360p, 480p, 720p, 1080p)

***

## Instagram Login (Opsional, untuk Private Post)

Untuk download post privat, buat akun Instagram dummy lalu login di `service.py`:

```python
# Di python-service/service.py, uncomment baris ini:
L.login("your_username", "your_password")
```

> **Penting:** Jangan pakai akun Instagram utama. Gunakan akun khusus/dummy.

Session akan di-cache otomatis oleh instaloader. Jika kena checkpoint, login ulang atau ganti akun.

***

## AdSense Setup

1. Daftar di [adsense.google.com](https://adsense.google.com)
2. Tambahkan URL website kamu
3. Buka `app/layout.js` — uncomment blok AdSense script
4. Ganti `ca-pub-XXXX` dengan Publisher ID kamu
5. Ganti placeholder ad slot di `app/page.js` dengan unit iklan dari dashboard AdSense

Wajib ada sebelum apply AdSense:
- Halaman **Privacy Policy**
- Halaman **Terms of Service**
- Konten original yang cukup

***

## Update Dependencies

```bash
# Update yt-dlp (lakukan rutin, minimal 1x seminggu)
yt-dlp -U

# Update instaloader
pip install --upgrade instaloader

# Update npm packages
npm update
```

***

## Troubleshooting

| Error | Penyebab | Solusi |
|---|---|---|
| `Empty response from service` | Python service tidak jalan | Jalankan `python service.py` |
| `Session expired` | Cookie Instagram expired | Update session di `service.py` |
| `yt-dlp failed` | yt-dlp outdated | Jalankan `yt-dlp -U` |
| `Post is private` | Konten privat | Login Instagram di service.py |
| `API error 500` TikTok | tikwm.com down | Otomatis fallback ke internal API |
| `RAPIDAPI_KEY not set` | Env tidak diset | Isi `.env.local` atau biarkan (opsional) |

***

## Lisensi

MIT — bebas digunakan, dimodifikasi, dan didistribusikan.