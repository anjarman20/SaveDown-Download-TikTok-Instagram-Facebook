# python-service/service.py

from flask import Flask, request, jsonify, send_file
import instaloader
import yt_dlp
import os
import re
import uuid
import threading
import time

app = Flask(__name__)

# ─── Temp dir untuk file merge ────────────────────────────────────────────────
TEMP_DIR = '/tmp/savedown'
os.makedirs(TEMP_DIR, exist_ok=True)

def cleanup_old_files():
    while True:
        time.sleep(300)
        now = time.time()
        for f in os.listdir(TEMP_DIR):
            fpath = os.path.join(TEMP_DIR, f)
            if os.path.isfile(fpath) and now - os.path.getmtime(fpath) > 1800:
                try:
                    os.remove(fpath)
                except:
                    pass

threading.Thread(target=cleanup_old_files, daemon=True).start()

# ─── Instaloader ──────────────────────────────────────────────────────────────
L = instaloader.Instaloader(
    download_pictures=False,
    download_videos=False,
    download_video_thumbnails=False,
    download_geotags=False,
    download_comments=False,
    save_metadata=False,
    compress_json=False,
)

def extract_shortcode(url):
    m = re.search(r'/(p|reel|tv)/([A-Za-z0-9_-]+)', url)
    return m.group(2) if m else None


# ─── Instagram ────────────────────────────────────────────────────────────────
@app.route('/instagram')
def instagram():
    url = request.args.get('url', '')
    if not url:
        return jsonify({'error': 'Missing url'}), 400
    try:
        shortcode = extract_shortcode(url)
        if not shortcode:
            return jsonify({'error': 'Invalid Instagram URL'}), 400

        post = instaloader.Post.from_shortcode(L.context, shortcode)
        downloads = []

        if post.is_video:
            downloads.append({
                'label': 'Video HD',
                'url': post.video_url,
                'type': 'video',
                'quality': 'HD',
            })
        else:
            if post.mediacount and post.mediacount > 1:
                for i, node in enumerate(post.get_sidecar_nodes()):
                    if node.is_video:
                        downloads.append({'label': f'Video {i+1}', 'url': node.video_url, 'type': 'video'})
                    else:
                        downloads.append({'label': f'Photo {i+1}', 'url': node.display_url, 'type': 'image'})
            else:
                downloads.append({'label': 'Photo HD', 'url': post.url, 'type': 'image', 'quality': 'HD'})

        return jsonify({
            'title': post.caption[:120] if post.caption else '',
            'author': post.owner_username,
            'thumbnail': post.url,
            'downloads': downloads,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── Facebook ─────────────────────────────────────────────────────────────────
@app.route('/facebook')
def facebook():
    url = request.args.get('url', '')
    if not url:
        return jsonify({'error': 'Missing url'}), 400
    try:
        ydl_opts = {'quiet': True, 'no_warnings': True, 'skip_download': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        downloads = []
        formats = info.get('formats', [])
        seen = set()
        for f in reversed(formats):
            height = f.get('height')
            furl = f.get('url')
            if not furl or not height or height in seen:
                continue
            seen.add(height)
            downloads.append({
                'label': f'Video {height}p',
                'url': furl,
                'type': 'video',
                'quality': f'{height}p',
            })
        if not downloads and info.get('url'):
            downloads.append({'label': 'Video', 'url': info['url'], 'type': 'video'})

        return jsonify({
            'title': info.get('title', ''),
            'author': info.get('uploader', ''),
            'thumbnail': info.get('thumbnail', ''),
            'duration': str(info.get('duration_string', '')),
            'downloads': downloads,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── YouTube ──────────────────────────────────────────────────────────────────
def _find_downloaded(base_path):
    """Cari file hasil download — ekstensi bisa berbeda dari yang diset."""
    base_no_ext = os.path.splitext(base_path)[0]
    for ext in ['.mp4', '.webm', '.mkv', '.m4a', '.opus', '.ogg', '.wav', '.mp3']:
        p = base_no_ext + ext
        if os.path.exists(p):
            return p
    if os.path.exists(base_path):
        return base_path
    # Cari file apapun dengan prefix yang sama di TEMP_DIR
    prefix = os.path.basename(base_no_ext)
    for f in os.listdir(TEMP_DIR):
        if f.startswith(prefix):
            return os.path.join(TEMP_DIR, f)
    return None


def merge_video_audio(video_id, height):
    """Download video+audio via yt-dlp, merge dengan ffmpeg, return path file."""
    import subprocess

    uid = uuid.uuid4().hex[:8]
    tmp_video = os.path.join(TEMP_DIR, f'{video_id}_{height}p_v_{uid}')
    tmp_audio = os.path.join(TEMP_DIR, f'{video_id}_{height}p_a_{uid}')
    out_file  = os.path.join(TEMP_DIR, f'{video_id}_{height}p_{uid}.mp4')

    yt_url = f'https://www.youtube.com/watch?v={video_id}'

    try:
        # Download video stream
        with yt_dlp.YoutubeDL({
            'quiet': True,
            'no_warnings': True,
            'outtmpl': tmp_video,
            'format': f'bestvideo[height={height}][ext=mp4]/bestvideo[height={height}]/bestvideo[height<={height}]',
        }) as ydl:
            ydl.download([yt_url])

        # Download audio stream
        with yt_dlp.YoutubeDL({
            'quiet': True,
            'no_warnings': True,
            'outtmpl': tmp_audio,
            'format': 'bestaudio[ext=m4a]/bestaudio',
        }) as ydl:
            ydl.download([yt_url])

        vid_file = _find_downloaded(tmp_video)
        aud_file = _find_downloaded(tmp_audio)

        print(f'[merge] vid={vid_file} aud={aud_file}')

        if not vid_file or not aud_file:
            return None

        # Merge
        cmd = [
            'ffmpeg', '-y',
            '-i', vid_file,
            '-i', aud_file,
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-shortest',
            '-movflags', '+faststart',
            out_file
        ]
        result = subprocess.run(cmd, capture_output=True, timeout=300)

        # Hapus source
        for f in [vid_file, aud_file]:
            try: os.remove(f)
            except: pass

        if result.returncode == 0 and os.path.exists(out_file):
            print(f'[merge] OK: {out_file}')
            return out_file
        else:
            print('[merge] ffmpeg error:', result.stderr.decode()[-400:])
            return None

    except Exception as e:
        import traceback
        print('[merge] Exception:', traceback.format_exc())
        return None


@app.route('/youtube')
def youtube():
    """Step 1: Fetch info & resolusi tersedia. Merge dilakukan di /youtube/merge."""
    url = request.args.get('url', '')
    media_type = request.args.get('type', 'video')

    if not url:
        return jsonify({'error': 'Missing url'}), 400

    try:
        ydl_opts = {'quiet': True, 'no_warnings': True, 'skip_download': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        video_id = info.get('id', '')
        formats = info.get('formats', [])
        duration_sec = info.get('duration', 0)
        duration_str = f"{duration_sec // 60}:{str(duration_sec % 60).zfill(2)}" if duration_sec else ''
        downloads = []

        if media_type == 'audio':
            audio_formats = [
                f for f in formats
                if f.get('vcodec') in ('none', None, '')
                and f.get('acodec') not in ('none', None, '')
                and f.get('url')
            ]
            audio_formats.sort(key=lambda x: x.get('abr') or x.get('tbr') or 0, reverse=True)
            seen_abr = set()
            for f in audio_formats:
                abr = int(f.get('abr') or f.get('tbr') or 0)
                if abr in seen_abr:
                    continue
                seen_abr.add(abr)
                downloads.append({
                    'label': f'Audio {abr}kbps' if abr else 'Audio',
                    'url': f['url'],
                    'type': 'audio',
                    'quality': f'{abr}kbps' if abr else '',
                })
                if len(downloads) >= 3:
                    break

        else:
            video_formats = [
                f for f in formats
                if f.get('vcodec') not in ('none', None, '')
                and f.get('height')
                and f.get('url')
            ]
            heights = sorted(set(f['height'] for f in video_formats), reverse=True)
            heights = [h for h in heights if h >= 360][:5]

            for height in heights:
                progressive = [
                    f for f in video_formats
                    if f['height'] == height
                    and f.get('acodec') not in ('none', None, '')
                ]
                if progressive:
                    best = sorted(progressive, key=lambda x: x.get('vbr') or x.get('tbr') or 0, reverse=True)[0]
                    downloads.append({
                        'label': f'Video {height}p',
                        'url': best['url'],
                        'type': 'video',
                        'quality': f'{height}p',
                        'needsMerge': False,
                    })
                else:
                    # Belum di-merge — return merge URL, Next.js akan hit /youtube/merge
                    downloads.append({
                        'label': f'Video {height}p',
                        'url': f'/youtube/merge?id={video_id}&height={height}',
                        'type': 'video',
                        'quality': f'{height}p',
                        'needsMerge': True,
                    })

        return jsonify({
            'title': info.get('title', ''),
            'author': info.get('uploader', ''),
            'thumbnail': info.get('thumbnail', ''),
            'duration': duration_str,
            'downloads': downloads,
        })

    except Exception as e:
        import traceback
        print('YOUTUBE ERROR:', traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@app.route('/youtube/merge')
def youtube_merge():
    """Step 2: Merge video+audio on-demand, stream file hasil ke client."""
    video_id = request.args.get('id', '')
    height = request.args.get('height', '')

    if not video_id or not height:
        return jsonify({'error': 'Missing id or height'}), 400

    try:
        height = int(height)
    except:
        return jsonify({'error': 'Invalid height'}), 400

    # Cek apakah sudah pernah di-merge (cache)
    cached = _find_cached(video_id, height)
    if cached:
        print(f'[merge] Cache hit: {cached}')
        return send_file(cached, as_attachment=True,
                         download_name=f'video_{height}p.mp4', mimetype='video/mp4')

    print(f'[merge] Merging {height}p for {video_id}...')
    merged = merge_video_audio(video_id, height)

    if not merged:
        return jsonify({'error': 'Merge failed. Try again.'}), 500

    return send_file(merged, as_attachment=True,
                     download_name=f'video_{height}p.mp4', mimetype='video/mp4')


def _find_cached(video_id, height):
    """Cek apakah file hasil merge sudah ada di TEMP_DIR."""
    prefix = f'{video_id}_{height}p_'
    for f in os.listdir(TEMP_DIR):
        if f.startswith(prefix) and f.endswith('.mp4') and '_v_' not in f and '_a_' not in f:
            fpath = os.path.join(TEMP_DIR, f)
            if os.path.exists(fpath):
                return fpath
    return None


def merge_video_audio(video_id, height):
    uid = uuid.uuid4().hex[:8]
    tmp_video = os.path.join(TEMP_DIR, f'{video_id}_{height}p_v_{uid}')
    tmp_audio = os.path.join(TEMP_DIR, f'{video_id}_{height}p_a_{uid}')
    out_file  = os.path.join(TEMP_DIR, f'{video_id}_{height}p_{uid}.mp4')
    yt_url = f'https://www.youtube.com/watch?v={video_id}'

    try:
        with yt_dlp.YoutubeDL({
            'quiet': True, 'no_warnings': True, 'outtmpl': tmp_video,
            'format': f'bestvideo[height={height}][ext=mp4]/bestvideo[height={height}]/bestvideo[height<={height}]',
        }) as ydl:
            ydl.download([yt_url])

        with yt_dlp.YoutubeDL({
            'quiet': True, 'no_warnings': True, 'outtmpl': tmp_audio,
            'format': 'bestaudio[ext=m4a]/bestaudio',
        }) as ydl:
            ydl.download([yt_url])

        vid_file = _find_downloaded(tmp_video)
        aud_file = _find_downloaded(tmp_audio)

        if not vid_file or not aud_file:
            return None

        import subprocess
        result = subprocess.run([
            'ffmpeg', '-y',
            '-i', vid_file, '-i', aud_file,
            '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
            '-shortest', '-movflags', '+faststart',
            out_file
        ], capture_output=True, timeout=300)

        for f in [vid_file, aud_file]:
            try: os.remove(f)
            except: pass

        if result.returncode == 0 and os.path.exists(out_file):
            return out_file
        print('[merge] ffmpeg error:', result.stderr.decode()[-400:])
        return None

    except Exception:
        import traceback
        print('[merge] Exception:', traceback.format_exc())
        return None


def _find_downloaded(base_path):
    base_no_ext = os.path.splitext(base_path)[0]
    for ext in ['.mp4', '.webm', '.mkv', '.m4a', '.opus', '.ogg']:
        p = base_no_ext + ext
        if os.path.exists(p): return p
    if os.path.exists(base_path): return base_path
    prefix = os.path.basename(base_no_ext)
    for f in os.listdir(TEMP_DIR):
        if f.startswith(prefix):
            return os.path.join(TEMP_DIR, f)
    return None


# ─── Spotify ──────────────────────────────────────────────────────────────────
@app.route('/spotify')
def spotify():
    url = request.args.get('url', '')
    if not url:
        return jsonify({'error': 'Missing url'}), 400

    if 'spotify.com' not in url and 'spotify:' not in url:
        return jsonify({'error': 'Invalid Spotify URL'}), 400

    if '/playlist/' in url or '/album/' in url:
        return jsonify({'error': 'Playlist/album tidak didukung. Gunakan URL track tunggal.'}), 400

    try:
        import urllib.request, json

        clean_url = url.split('?')[0]
        oembed_req = urllib.request.Request(
            f'https://open.spotify.com/oembed?url={clean_url}',
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        oembed_res = urllib.request.urlopen(oembed_req, timeout=10)
        oembed = json.loads(oembed_res.read())

        track_title = oembed.get('title', '')
        thumbnail = oembed.get('thumbnail_url', '')
        author = ''
        if ' - ' in track_title:
            parts = track_title.split(' - ', 1)
            track_title = parts[0].strip()
            author = parts[1].strip()

        if not track_title:
            return jsonify({'error': 'Could not fetch track metadata'}), 500

        print(f'[Spotify] Searching: {track_title} {author}')

        search_query = f'ytsearch5:{track_title} {author}'
        ydl_opts = {'quiet': True, 'no_warnings': True, 'skip_download': True}

        downloads = []
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            search_info = ydl.extract_info(search_query, download=False)
            entries = search_info.get('entries', []) if search_info else []

            for entry in entries:
                if not entry:
                    continue
                formats = entry.get('formats', [])

                audio_only = [
                    f for f in formats
                    if f.get('vcodec') in ('none', None, '')
                    and f.get('acodec') not in ('none', None, '')
                    and f.get('url')
                ]
                audio_only.sort(key=lambda x: x.get('abr') or x.get('tbr') or 0, reverse=True)

                if audio_only:
                    for f in audio_only[:3]:
                        abr = int(f.get('abr') or f.get('tbr') or 0)
                        downloads.append({
                            'label': f'MP3 {abr}kbps' if abr else 'Audio',
                            'url': f['url'],
                            'type': 'audio',
                            'quality': f'{abr}kbps' if abr else '',
                        })
                    break

                # Fallback: format apapun yang ada audio
                with_audio = [
                    f for f in formats
                    if f.get('acodec') not in ('none', None, '')
                    and f.get('url')
                ]
                with_audio.sort(key=lambda x: x.get('filesize') or x.get('tbr') or 0)
                if with_audio:
                    f = with_audio[0]
                    abr = int(f.get('abr') or f.get('tbr') or 0)
                    downloads.append({
                        'label': f'Audio {abr}kbps' if abr else 'Audio',
                        'url': f['url'],
                        'type': 'audio',
                        'quality': f'{abr}kbps' if abr else '',
                    })
                    break

        if not downloads:
            return jsonify({'error': f'No audio found for: {track_title}'}), 404

        return jsonify({
            'title': track_title,
            'author': author,
            'thumbnail': thumbnail,
            'downloads': downloads,
        })

    except Exception as e:
        import traceback
        print('SPOTIFY ERROR:', traceback.format_exc())
        return jsonify({'error': str(e)}), 500


# ─── Run ──────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
