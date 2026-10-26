import os
import sys
import time

sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
from playwright.sync_api import sync_playwright

def test_karaoke():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto("http://localhost:8000/index.html")
        time.sleep(1)

        # Trigger play button
        play_btn = page.locator("#btn-karaoke-play")
        play_btn.click()
        print("Clicked play button...")
        time.sleep(2)

        # Seek to 14 seconds (Paragraph 1)
        page.evaluate("state.audioElement.currentTime = 14.0")
        time.sleep(1)

        # Check which karaoke card has active class
        active_card = page.locator(".karaoke-card.active")
        if active_card.count() > 0:
            print("Active card found:", active_card.locator(".karaoke-embera-text").inner_text())
            print("Spanish translation:", active_card.locator(".karaoke-spanish-text").inner_text())
        else:
            print("No active card yet, waiting...")

        app_dir = os.path.dirname(os.path.abspath(__file__))
        page.screenshot(path=os.path.join(app_dir, "screenshot_karaoke_active.png"))
        print("Captured screenshot_karaoke_active.png")

        browser.close()
        print("Karaoke test completed!")

if __name__ == "__main__":
    test_karaoke()
