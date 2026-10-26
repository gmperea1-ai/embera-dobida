import sys
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto('http://localhost:8000')
    
    # Test audio decoding in browser
    result = page.evaluate("""async () => {
        const resp = await fetch('/track2_audio.mp3');
        const buf = await resp.arrayBuffer();
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuf = await ctx.decodeAudioData(buf);
        return {
            duration: audioBuf.duration,
            sampleRate: audioBuf.sampleRate,
            numberOfChannels: audioBuf.numberOfChannels
        };
    }""")
    print("Track 2 decoded:", result)

    result_l1 = page.evaluate("""async () => {
        const resp = await fetch('/lesson1_audio.mp3');
        const buf = await resp.arrayBuffer();
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuf = await ctx.decodeAudioData(buf);
        return {
            duration: audioBuf.duration,
            sampleRate: audioBuf.sampleRate,
            numberOfChannels: audioBuf.numberOfChannels
        };
    }""")
    print("Lesson 1 decoded:", result_l1)
    browser.close()
