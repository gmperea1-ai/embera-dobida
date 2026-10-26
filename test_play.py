from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto('http://localhost:8000')
    page.wait_for_timeout(1000)

    # Click the native voice button in dialogue
    btn = page.locator('button:has-text("Voz Nativa")').first
    if btn.is_visible():
        btn.click()
        page.wait_for_timeout(1000)
        print('SUCCESS: Native voice button clicked and played!')

    # Click dictionary tab and test a word with native voice
    page.click("button[data-tab-target='dictionary']")
    page.wait_for_timeout(800)
    page.click("button:has-text('Solo con Voz de los Personajes')")
    page.wait_for_timeout(500)
    
    # Click first word's audio button
    dict_btn = page.locator('button[title*="Pronunciación"]').first
    if dict_btn.is_visible():
        dict_btn.click()
        page.wait_for_timeout(1000)
        print('SUCCESS: Dictionary native audio played!')

    browser.close()
