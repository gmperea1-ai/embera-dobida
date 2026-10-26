import os
import sys
import time

sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
sys.stderr.reconfigure(encoding='utf-8', line_buffering=True)

from playwright.sync_api import sync_playwright

def test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 440, 'height': 880})
        page = context.new_page()

        errors = []
        page.on("pageerror", lambda err: errors.append(str(err)))
        page.on("console", lambda msg: print(f"[CONSOLE {msg.type}] {msg.text}"))

        print("Navigating to http://localhost:8000/index.html ...")
        page.goto("http://localhost:8000/index.html", wait_until="networkidle")
        time.sleep(1)

        # 1. Verify Study / Karaoke tab
        title = page.locator("h1").first.inner_text()
        print("Page loaded. Lesson title:", title)
        app_dir = os.path.dirname(os.path.abspath(__file__))
        page.screenshot(path=os.path.join(app_dir, "screenshot_study_tab.png"))
        print("Captured screenshot_study_tab.png")

        # 2. Test AI Inspector Modal
        token = page.locator(".token-chip").first
        print("Clicking first token chip:", token.inner_text())
        token.click()
        time.sleep(0.5)

        modal = page.locator("#ai-inspector-modal")
        assert not "hidden" in (modal.get_attribute("class") or ""), "AI Inspector modal should be visible"
        word_embera = page.locator("#ai-word-embera").inner_text()
        word_spanish = page.locator("#ai-word-spanish").inner_text()
        word_root = page.locator("#ai-word-root").inner_text()
        print(f"AI Inspector opened: {word_embera} -> {word_spanish} (Raíz: {word_root})")
        page.screenshot(path=os.path.join(app_dir, "screenshot_ai_inspector.png"))
        print("Captured screenshot_ai_inspector.png")

        # Close AI Inspector
        page.locator("#ai-inspector-modal button").first.click()
        time.sleep(0.5)

        # 3. Switch to Grammar & Conjugator Tab
        print("Switching to Grammar tab...")
        page.locator("button[data-tab-target='grammar']").click()
        time.sleep(0.5)

        # Click different verb (e.g., 2nd verb)
        verbs = page.locator("#tab-grammar button")
        verbs.nth(1).click()
        time.sleep(0.3)
        page.screenshot(path=os.path.join(app_dir, "screenshot_grammar_tab.png"))
        print("Captured screenshot_grammar_tab.png")

        # 4. Switch to Dialogue Tab
        print("Switching to Dialogue tab...")
        page.locator("button[data-tab-target='dialogue']").click()
        time.sleep(0.5)
        page.screenshot(path=os.path.join(app_dir, "screenshot_dialogue_tab.png"))
        print("Captured screenshot_dialogue_tab.png")

        # 5. Switch to Phonetics Tab
        print("Switching to Phonetics tab...")
        page.locator("button[data-tab-target='phonetics']").click()
        time.sleep(0.5)
        page.screenshot(path=os.path.join(app_dir, "screenshot_phonetics_tab.png"))
        print("Captured screenshot_phonetics_tab.png")

        # 6. Switch to Glossary / Dictionary Tab
        print("Switching to Dictionary tab...")
        page.locator("button[data-tab-target='dictionary']").click()
        time.sleep(0.5)

        # Click native filter button
        native_filter_btn = page.locator("button:has-text('Solo con Voz de los Personajes')")
        native_filter_btn.click()
        time.sleep(0.3)
        page.screenshot(path=os.path.join(app_dir, "screenshot_dictionary_tab.png"))
        print("Captured screenshot_dictionary_tab.png")

        browser.close()

        print("--- Test Finished Successfully! ---")
        if errors:
            print("Errors detected:", errors)
            sys.exit(1)
        else:
            print("Zero console/page errors detected.")

if __name__ == "__main__":
    test()
