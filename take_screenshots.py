import sys
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 430, 'height': 880})
    page.goto('http://localhost:8000')
    page.wait_for_timeout(1500)
    page.screenshot(path='screenshot_dialogue.png')

    # Switch to reader
    page.click("button[data-tab-target='reader']")
    page.wait_for_timeout(1000)
    page.screenshot(path='screenshot_reader.png')

    # Switch to dictionary
    page.click("button[data-tab-target='dictionary']")
    page.wait_for_timeout(1000)
    page.screenshot(path='screenshot_dict.png')

    print("All screenshots captured!")
    browser.close()
