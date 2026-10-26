import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

url = 'https://b.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS?pub=lff&fileformat=MP3&alllangs=0&langwritten=EMP&txtCMSLang=EMP'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        files = data.get('files', {}).get('EMP', {}).get('MP3', [])
        print(f"Total audio tracks found: {len(files)}")
        for f in files[:15]:
            title = f.get('title', 'No title')
            track = f.get('track', '?')
            dur = f.get('duration', 0)
            url = f.get('file', {}).get('url', '')
            markers = f.get('markers')
            print(f"Track {track}: {title} [{dur}s] (markers: {bool(markers)}) -> {url}")
except Exception as e:
    print('Error:', e)
