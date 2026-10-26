from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto('http://localhost:8000')
    
    intervals = page.evaluate("""async () => {
        const resp = await fetch('/lesson1_audio.mp3');
        const buf = await resp.arrayBuffer();
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuf = await ctx.decodeAudioData(buf);
        const data = audioBuf.getChannelData(0);
        const sr = audioBuf.sampleRate;
        const chunkSize = Math.floor(sr * 0.1); // 100ms
        const maxChunks = Math.min(Math.floor(data.length / chunkSize), 400); // first 40s
        
        const speechSegments = [];
        let inSpeech = false;
        let start = 0;
        
        for (let i = 0; i < maxChunks; i++) {
            let sum = 0;
            for (let j = 0; j < chunkSize; j++) {
                sum += data[i * chunkSize + j] * data[i * chunkSize + j];
            }
            const rms = Math.sqrt(sum / chunkSize);
            const t = (i * 0.1).toFixed(2);
            
            if (rms > 0.02) {
                if (!inSpeech) {
                    inSpeech = true;
                    start = t;
                }
            } else {
                if (inSpeech) {
                    inSpeech = false;
                    speechSegments.push({ start: Number(start), end: Number(t), dur: (Number(t) - Number(start)).toFixed(2) });
                }
            }
        }
        return speechSegments;
    }""")
    print("Lesson 1 first 40s speech segments:")
    for s in intervals:
        print(s)
    browser.close()
