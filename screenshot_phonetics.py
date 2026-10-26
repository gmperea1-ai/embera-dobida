import sys
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 430, 'height': 880})
    page.goto('http://localhost:8000')
    page.wait_for_timeout(1000)
    
    # Click phonetics tab
    page.click("button[data-tab-target='phonetics']")
    page.wait_for_timeout(1000)
    page.screenshot(path='screenshot_phonetics_native.png')
    print("Phonetics screenshot saved!")
    browser.close()
