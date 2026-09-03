import logging
logging.basicConfig(level=logging.DEBUG)
from python.dagster_app.scrapers.gsmarena import GsmarenaScraper

scraper = GsmarenaScraper(output_dir="/tmp")
count = 0
for row in scraper.scrape():
    print(row)
    count += 1
print(f"Total: {count}")
