import sys
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 430, 'height': 880})
    page.goto('http://localhost:8000')
    page.wait_for_timeout(1200)
    
    # Screenshot dialogue tab with native audio buttons on options
    page.screenshot(path='screenshot_dialogue_native.png')
    
    # Go to dictionary tab and toggle native filter
    page.click("button[data-tab-target='dictionary']")
    page.wait_for_timeout(800)
    page.screenshot(path='screenshot_dict_all.png')
    
    # Click filter "Solo con Voz de los Personajes"
    page.click("button:has-text('Solo con Voz de los Personajes')")
    page.wait_for_timeout(800)
    page.screenshot(path='screenshot_dict_native.png')

    print("Screenshots captured successfully!")
    browser.close()
