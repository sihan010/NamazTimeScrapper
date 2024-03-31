const syncfs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const https = require("https");

const countries = "https://www.islamicfinder.org/world/";

const scrapeCountries = async () => {
  const browser = await puppeteer.launch({ headless: true }); // if need debugging, headless = true
  const tab = await browser.newPage();
  await tab.goto(countries);

  // Scrape data
  const scrapedCountriesByContinents = await tab.evaluate(() => {
    // This is puppeteer world
    let countriesByContinents = {};
    let currentContinent = "Undocumented";

    const countriesNodes = document.querySelectorAll("#all-countries div div");

    for (const node of countriesNodes) {
      const className = node.getAttribute("class");
      if (className === "large-12 columns pad-top pad-bottom") {
        // Continent Div
        currentContinent = node.querySelector("strong").textContent;
        countriesByContinents[currentContinent] = [];
      } else if (node.getAttribute("class") === "large-4 columns pad-tb") {
        // Country Div
        let anchorNode = node.querySelector("a"); // Has country Details
        let styles = window.getComputedStyle(node.querySelector("span")); // BackgroundImage Has Flag
        let flagUrl = styles.backgroundImage; // format -> url("https://...........png")
        let originalName = anchorNode.textContent;
        let originalTitle = anchorNode.getAttribute("title"); // Need a space at 15th

        //Some Formatting
        let name = originalName.substring(1, originalName.length);
        let title =
          originalTitle.slice(0, 15) +
          " " +
          originalTitle.slice(15, originalTitle.length);
        let href =
          "https://www.islamicfinder.org" + anchorNode.getAttribute("href");
        let flag = flagUrl.substring(5, flagUrl.length - 2);
        let slug = flag.split("/").pop().substring(0, 2).toUpperCase();

        countriesByContinents[currentContinent].push({
          name,
          slug,
          title,
          href,
          flag,
        });
      }
    }
    return countriesByContinents; // Send to Node World
  });

  // Save as JSON
  syncfs.writeFileSync(
    "countries_by_continent.json",
    JSON.stringify(scrapedCountriesByContinents)
  );

  // Get Flag Images
  const flagImages = await tab.$$eval(
    "#all-countries div div span",
    (nodes) => {
      return nodes.map((node) => {
        let styles = window.getComputedStyle(node);
        let flagUrl = styles.backgroundImage;
        return flagUrl.substring(5, flagUrl.length - 2);
      });
    }
  );
  //Download Flag Images
  if (!syncfs.existsSync(path.join(__dirname, "flags"))) {
    syncfs.mkdirSync(path.join(__dirname, "flags"));
  }
  flagImages.forEach((url) => {
    https.get(url, (res) => {
      const stream = syncfs.createWriteStream(
        `${path.join(__dirname, "flags")}/${url.split("/").pop()}`
      );
      res.pipe(stream);
      stream.on("finish", () => {
        stream.close();
      });
    });
  });

  await browser.close();
};

scrapeCountries();
