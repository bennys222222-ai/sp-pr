from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager


def get_driver():
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1920,1080")

    return webdriver.Chrome(executable_path=ChromeDriverManager().install(), options=options)


def get_upcoming_events():
    driver = get_driver()
    driver.get("https://www.ufc.com/events")

    # Warte, bis Event-Container geladen ist
    try:
        WebDriverWait(driver, 10).until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".view-events .c-card-event--result"))
        )
    except:
        driver.quit()
        return []

    events = []
    cards = driver.find_elements(By.CSS_SELECTOR, ".view-events .c-card-event--result")
    for card in cards:
        try:
            name_elem = card.find_element(By.CSS_SELECTOR, ".c-card-event--result__info a")
            name = name_elem.text.strip()
            href = name_elem.get_attribute("href")
            if "/event/" in href:
                events.append({
                    "name": name,
                    "url": href
                })
        except:
            continue

    driver.quit()
    return events


def scrape_fights(event_url):
    driver = get_driver()
    driver.get(event_url)

    try:
        WebDriverWait(driver, 10).until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".c-listing-fight__content"))
        )
    except:
        driver.quit()
        return []

    fights = []
    fight_cards = driver.find_elements(By.CSS_SELECTOR, ".c-listing-fight__content")
    for fight in fight_cards:
        names = fight.find_elements(By.CSS_SELECTOR, ".c-listing-fight__corner-name")
        if len(names) == 2:
            fighterA = names[0].text.strip()
            fighterB = names[1].text.strip()
            fights.append({
                "fighterA": fighterA,
                "fighterB": fighterB
            })

    driver.quit()
    return fights
