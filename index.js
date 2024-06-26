import puppeteer from "puppeteer";
import path from "path";
import { pathToFileURL } from "url";
import { getWeatherForecast } from "./weather.js";
import { getCalendar } from "./calendar.js";
import { getNews } from "./news.js";
import { getTransit } from "./transit.js";
import fs from "fs";

const docroot = "public";

async function update() {
  const secrets = await readJsonFile("secrets.json");
  const config = await readJsonFile("config.json");

  // カレンダー情報を取得
  const calendar = (() => {
    const now = new Date();
    const apiKey = secrets["api-keys"]["google-calendar"];
    const calendarId = config["calendar"]["google-calendar-id"];
    return getCalendar(now, apiKey, calendarId);
  })();

  // 天気情報を取得
  const weather = (() => {
    const apiKey = secrets["api-keys"].openweather;
    const latitude = config.weather.latitude;
    const longitude = config.weather.longitude;
    const language = config.weather.language;
    return getWeatherForecast(apiKey, latitude, longitude, language);
  })();

  // ニュースを取得
  const news = getNews(secrets["api-keys"]["newsapi"], secrets["api-keys"]["chatgpt"]);

  // 乗り換えを取得
  const transite = getTransit();

  // 収集したデータを保存
  const data = JSON.stringify(
    {
      calendar: await calendar,
      weather: await weather,
      transite: await transite,
      news: await news,
    },
    null,
    2
  );
  fs.writeFileSync(`${docroot}/data.js`, `const DATA = ${data};`);
}

(async () => {
  await update();
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: 'new'
  });
  const page = await browser.newPage();
  page.on("pageerror", error => {
    console.log(`[app ${new Date().toLocaleString("ja-JP")}]:`, error);
  });
  await page.setViewport({ width: 1072, height: 1448 });
  await page.goto(pathToFileURL(path.resolve(`${docroot}/index.html`)), {
    waitUntil: "networkidle2",
  });
  await page.screenshot({ path: "output.png" });
  console.log("output image generated");
  await browser.close();
})()

async function readJsonFile(path) {
  try {
    const data = fs.readFileSync(path, "utf8");
    return JSON.parse(data);
  } catch (e) {
    console.error("[" + new Date().toLocaleString("ja-JP") + "] Failed to read JSON file:", e);
    throw e;
  }
}
