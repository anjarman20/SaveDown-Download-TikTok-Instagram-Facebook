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
| Thumbnail Proxy | Next.js `/api/proxy` route |
| Styling | Custom CSS (light/dark mode) |
| Ads | Google AdSense ready |
| API Protection | Internal Secret Key (`x-api-secret`) |

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
│       │   └── route.js      ← TikTok API (tikwm.com)
│       ├── instagram/
│       │   └── route.js      ← Instagram API → proxy ke Python service
│       ├── facebook/
│       │   └── route.js      ← Facebook API → proxy ke Python service
│       └── proxy/
│           └── route.js      ← Proxy thumbnail CDN Instagram/Facebook
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

### 3. Install Dependencies

```bash
npm install axios
```

### 4. Setup Python Service

```bash
cd python-service
pip install flask instaloader yt-dlp gunicorn
```

Jalankan service:

```bash
# Development
python service.py

# Production
gunicorn -w 4 -b 0.0.0.0:5001 service:app
```

Service berjalan di `http://localhost:5001`. Update yt-dlp secara rutin:

```bash
yt-dlp -U
```

### 5. Set Environment Variables

```bash
cp .env.local.example .env.local
```

Generate internal API secret key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Edit `.env.local`:

```env
# URL Python service (ganti IP jika deploy ke VPS)
SERVICE_URL=http://localhost:5001

# Internal API Secret — lindungi API dari akses luar
NEXT_PUBLIC_INTERNAL_API_SECRET=isi_hasil_generate_di_sini
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

Tambahkan di **Vercel Dashboard → Project Settings → Environment Variables**:

| Key | Value |
|---|---|
| `SERVICE_URL` | `http://YOUR_VPS_IP:5001` |
| `NEXT_PUBLIC_INTERNAL_API_SECRET` | key yang sama dengan `.env.local` |

### Python Service → VPS

```bash
# Di VPS (Ubuntu/Debian)
pip install flask instaloader yt-dlp gunicorn

# Jalankan dengan PM2
npm install -g pm2
pm2 start "gunicorn -w 4 -b 0.0.0.0:5001 service:app" --name savedown-service
pm2 save
pm2 startup
```

Buka port di firewall:

```bash
ufw allow 5001
```

***

## API Endpoints

Semua endpoint diproteksi `x-api-secret` header. Request tanpa header valid → `403 Forbidden`.

### TikTok

```
GET /api/tiktok?url={URL}&type={video|story|audio}
```

- Provider: tikwm.com (gratis, tanpa API key)
- Support: video no watermark, story, audio MP3

### Instagram

```
GET /api/instagram?url={URL}&type={post|reels|story}
```

- Provider: Python service → `instaloader`
- Support: Post, Reel, Carousel, Story (publik)

### Facebook

```
GET /api/facebook?url={URL}&type={video|photo}
```

- Provider: Python service → `yt-dlp`
- Support: Video, Reel, Watch (publik), multi resolusi

### Proxy Thumbnail

```
GET /api/proxy?url={CDN_URL}
```

- Digunakan internal oleh frontend
- Mem-proxy thumbnail dari CDN Instagram/Facebook yang diblokir browser
- Hanya mengizinkan domain `cdninstagram.com` dan `fbcdn.net`

***

## Proteksi API (Internal Secret Key)

Setiap request dari frontend menyertakan header `x-api-secret`. API route memvalidasi header ini — jika tidak cocok, request ditolak `403 Forbidden`.


### Test Proteksi

```bash
# Harus 403 — tanpa secret
curl -i "https://savedown.anjartech.my.id/api/tiktok?url=test"

# Harus lolos — dengan secret benar
curl -i -H "x-api-secret: YOUR_SECRET" "https://savedown.anjartech.my.id/api/tiktok?url=test"

# Harus 403 — secret salah
curl -i -H "x-api-secret: wrongkey" "https://savedown.anjartech.my.id/api/tiktok?url=test"
```

## AdSense Setup

1. Daftar di [adsense.google.com](https://adsense.google.com)
2. Tambahkan URL website
3. Buka `app/layout.js` → uncomment blok AdSense script
4. Ganti `ca-pub-XXXX` dengan Publisher ID kamu
5. Ganti placeholder ad slot di `app/page.js` dengan unit iklan dari dashboard AdSense

Wajib ada sebelum apply AdSense:
- Halaman Privacy Policy
- Halaman Terms of Service

***

## Update Dependencies

```bash
# Wajib rutin (minimal 1x seminggu)
yt-dlp -U
pip install --upgrade instaloader
npm update
```

***

## Troubleshooting

| Error | Penyebab | Solusi |
|---|---|---|
| `403 Forbidden` | Request tanpa / salah secret key | Pastikan `NEXT_PUBLIC_INTERNAL_API_SECRET` sama di `.env.local` dan Vercel |
| Thumbnail tidak muncul | CDN Instagram/Facebook diblokir browser | Pastikan `app/api/proxy/route.js` sudah ada |
| `Empty response from service` | Python service tidak jalan | Jalankan `python service.py` |
| `yt-dlp failed` | yt-dlp outdated | Jalankan `yt-dlp -U` |
| `Post is private` | Konten privat | Login Instagram di `service.py` |
| `API error 500` TikTok | tikwm.com down | Otomatis fallback ke internal API |

***

## Lisensi

MIT — bebas digunakan, dimodifikasi, dan didistribusikan.