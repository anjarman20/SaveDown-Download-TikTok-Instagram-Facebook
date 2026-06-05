from flask import Flask, request, jsonify
import instaloader
import subprocess
import json
import re

app = Flask(__name__)

L = instaloader.Instaloader(
    download_videos=False,
    download_video_thumbnails=False,
    download_geotags=False,
    download_comments=False,
    save_metadata=False,
    compress_json=False,
)

# ── Instagram ─────────────────────────────────────────────────────────────────
def extract_shortcode(url):
    match = re.search(r'/(p|reel|tv)/([A-Za-z0-9_-]+)', url)
    return match.group(2) if match else None

@app.route('/api/instagram', methods=['GET'])
def download_instagram():
    url = request.args.get('url')
    if not url:
        return jsonify({'error': 'URL is required'}), 400

    shortcode = extract_shortcode(url)
    if not shortcode:
        return jsonify({'error': 'Cannot parse Instagram URL'}), 400

    try:
        post = instaloader.Post.from_shortcode(L.context, shortcode)
        downloads = []

        if post.typename == 'GraphSidecar':
            for i, node in enumerate(post.get_sidecar_nodes()):
                if node.is_video:
                    downloads.append({'label': f'Video {i+1}', 'type': 'video', 'quality': 'HD', 'url': node.video_url})
                else:
                    downloads.append({'label': f'Photo {i+1}', 'type': 'image', 'quality': 'HD', 'url': node.display_url})
        elif post.is_video:
            downloads.append({'label': 'Video HD', 'type': 'video', 'quality': 'HD', 'url': post.video_url})
        else:
            downloads.append({'label': 'Photo HD', 'type': 'image', 'quality': 'HD', 'url': post.url})

        if not downloads:
            return jsonify({'error': 'No media found'}), 404

        duration = None
        if post.is_video and post.video_duration:
            m, s = int(post.video_duration // 60), int(post.video_duration % 60)
            duration = f"{m}:{str(s).zfill(2)}"

        return jsonify({
            'title': post.caption[:100] if post.caption else 'Instagram Media',
            'author': post.owner_username,
            'thumbnail': post.url,
            'duration': duration,
            'downloads': downloads,
        })

    except instaloader.exceptions.LoginRequiredException:
        return jsonify({'error': 'Post is private or login required'}), 403
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ── Facebook (yt-dlp) ─────────────────────────────────────────────────────────
@app.route('/api/facebook', methods=['GET'])
def download_facebook():
    url = request.args.get('url')
    if not url:
        return jsonify({'error': 'URL is required'}), 400

    try:
        # Jalankan yt-dlp --dump-json untuk ambil info tanpa download
        result = subprocess.run(
            [
                'yt-dlp',
                '--dump-json',
                '--no-playlist',
                '--no-warnings',
                '--extractor-args', 'facebook:checkpoint_url=',
                url
            ],
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode != 0:
            error_msg = result.stderr.strip().split('\n')[-1] if result.stderr else 'yt-dlp failed'
            return jsonify({'error': error_msg}), 500

        data = json.loads(result.stdout)

        downloads = []
        formats = data.get('formats', [])

        # Filter hanya format video+audio (bukan DASH terpisah)
        # Urutkan dari kualitas tertinggi
        combined = [
            f for f in formats
            if f.get('vcodec') != 'none' and f.get('acodec') != 'none'
        ]
        combined.sort(key=lambda f: f.get('height', 0) or 0, reverse=True)

        seen_heights = set()
        for f in combined:
            height = f.get('height', 0) or 0
            if height in seen_heights:
                continue
            seen_heights.add(height)
            quality = 'HD' if height >= 720 else 'SD'
            label = f"Video {height}p" if height else 'Video'
            downloads.append({
                'label': label,
                'type': 'video',
                'quality': quality,
                'url': f.get('url'),
                'ext': f.get('ext', 'mp4'),
            })

        # Fallback: ambil URL langsung jika tidak ada format gabungan
        if not downloads and data.get('url'):
            downloads.append({
                'label': 'Video',
                'type': 'video',
                'quality': 'HD',
                'url': data['url'],
            })

        if not downloads:
            return jsonify({'error': 'No download links found. Post may be private.'}), 404

        duration = None
        if data.get('duration'):
            m, s = int(data['duration'] // 60), int(data['duration'] % 60)
            duration = f"{m}:{str(s).zfill(2)}"

        return jsonify({
            'title': data.get('title') or data.get('description', 'Facebook Video')[:100],
            'author': data.get('uploader') or data.get('channel') or None,
            'thumbnail': data.get('thumbnail') or None,
            'duration': duration,
            'downloads': downloads,
        })

    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Request timeout. Try again.'}), 504
    except json.JSONDecodeError:
        return jsonify({'error': 'Failed to parse video info'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)