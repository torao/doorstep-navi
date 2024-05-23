import puppeteer from "puppeteer";
import path from "path";
import express from "express";
import { fileURLToPath } from "url";
import { getWeatherForecast } from "./weather.js";
import { getCalendar } from "./calendar.js";
import { getNews } from "./news.js";
import { getTransite } from "./transit.js";
import fs from "fs";

const docroot = "public";
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
const news = getNews();

// 乗り換えを取得
// const lines = ["中央総武線(各停)", "横須賀線", "東京メトロ半蔵門線"];
const transite = getTransite();

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
fs.writeFileSync(`${docroot}/data.json`, data);

const app = express();
const port = 3000;

let server;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, docroot)));

const startServer = () => {
  return new Promise((resolve, reject) => {
    server = app.listen(port, () => {
      console.log(`Listening at http://localhost:${port}`);
      resolve(server);
    });
    server.on("error", reject);
  });
};

(async () => {
  try {
    await startServer();
    console.log("Server started successfully");
  } catch (err) {
    console.error("Failed to start server", err);
  }
})()
  .then(async () => {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: 'new'
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1072, height: 1448 });
    await page.goto(`http://localhost:${port}/index.html`, {
      waitUntil: "networkidle2",
    });
    await page.screenshot({ path: "output.png" });
    await browser.close();
  })
  .then(() => {
    server.close();
  });

async function readJsonFile(path) {
  try {
    const data = fs.readFileSync(path, "utf8");
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to read JSON file:", e);
    throw e;
  }
}
