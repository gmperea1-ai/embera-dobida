from playwright.sync_api import sync_playwright
import sys

sys.stdout.reconfigure(encoding='utf-8')

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto('http://localhost:8000')

    # Analyze RMS energy in 50ms windows for first 150 seconds of Lesson 1
    segments = page.evaluate("""async () => {
        const resp = await fetch('/lesson1_audio.mp3');
        const buf = await resp.arrayBuffer();
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuf = await ctx.decodeAudioData(buf);
        const data = audioBuf.getChannelData(0);
        const sr = audioBuf.sampleRate;
        const windowSize = Math.floor(sr * 0.05); // 50ms
        const startIdx = Math.floor(sr * 60);
        const totalWindows = Math.floor(sr * 70 / windowSize); // 70s starting from 60s
        
        const bursts = [];
        let inBurst = false;
        let start = 0;
        
        for (let i = 0; i < totalWindows; i++) {
            let sum = 0;
            const offset = startIdx + i * windowSize;
            for (let j = 0; j < windowSize; j++) {
                sum += data[offset + j] * data[offset + j];
            }
            const rms = Math.sqrt(sum / windowSize);
            const timeSec = (60 + i * 0.05).toFixed(2);
            
            if (rms > 0.02) {
                if (!inBurst) {
                    inBurst = true;
                    start = timeSec;
                }
            } else {
                if (inBurst) {
                    inBurst = false;
                    const dur = (Number(timeSec) - Number(start)).toFixed(2);
                    if (Number(dur) > 0.3) {
                        bursts.push({ start: Number(start), end: Number(timeSec), dur: Number(dur) });
                    }
                }
            }
        }
        return bursts;
    }""")

    print(f"Detected {len(segments)} spoken bursts in first 150s:")
    for s in segments[:35]:
        print(f"  {s['start']}s -> {s['end']}s (dur: {s['dur']}s)")
    browser.close()
