import axios from "axios";
import fs from "fs";
import puppeteer from "puppeteer";
import { getCache } from "./cache.js";

// 天気予報を取得する関数
export async function getWeatherForecast(apiKey, latitude, longitude) {

  // OpenWeather の情報を取得
  // 仕様: https://openweathermap.org/api/one-call-3
  const data = await getCache("openweather", async () => {
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&appid=${apiKey}&lang=ja&units=metric`;
    const response = await axios.get(url);
    return response.data;
  }, 0, 0, 0, 0, 10);

  // tenki.jp の情報を取得
  const tenkiJp = await getCache("tenkijp", async () => {
    return await getWeatherFromTenkiJp();
  }, 0, 0, 0, 0, 10);

  // OpenWeatherMap API のレスポンスを doorstep-navi 互換形式に変換
  function openWeatherToDoorStepNavi(point) {
    return {
      "time": point.dt * 1000,
      "date": new Date(point.dt * 1000).toLocaleString(),
      "temperature": point.temp,
      "humidity": point.humidity,
      "wind": point.wind_speed,
      "pop": point.pop ? point.pop * 100 : undefined,
      "rain": point.rain ? point.rain["1h"] ? point.rain["1h"] : point.rain : undefined,
      "pressure": point.pressure,
      "uvi": point.uvi,
      "clouds": point.clouds,
      "visibility": point.visibility,
      "icon": getWeatherIcon(point.weather[0].icon, new Date(point.dt * 1000)),
      "description": point.weather[0].description
    };
  }
  const openWeather = {
    "location": `${data.lat}/${data.lon}`,
    "current": {
      "sun": {
        "rise": data.current.sunrise,
        "set": data.current.sunset,
      },
      ...openWeatherToDoorStepNavi(data.current)
    },
    "hourly": data.hourly.filter((h) => h.dt > data.current.dt).map((h) => openWeatherToDoorStepNavi(h))
  };

  // OpenWether と tenki.jp の情報を統合する
  const timeToWeather = {};
  openWeather.hourly.forEach((h) => {
    timeToWeather[h.time] = h;
  });
  delete openWeather.hourly;
  tenkiJp["3-hourly"] = tenkiJp["3-hourly"].map((h) => {
    const weather = timeToWeather[h.time];
    if (weather) {
      return {
        "wind": weather.wind,
        "pressure": weather.pressure,
        "uvi": weather.uvi,
        "clouds": weather.clouds,
        "visibility": weather.visibility,
        ...h
      };
    }
    return h;
  });

  // OpenWeather の current に存在しない情報を tenki.jp から取得
  const now = openWeather.current.time;
  const includeCurrent = tenkiJp["3-hourly"].find(h => {
    const end = new Date(h.time);
    end.setHours(end.getHours() + 3);
    return h.time <= now && now < end.getTime();
  });
  if (includeCurrent !== null && includeCurrent !== undefined) {
    if (openWeather.current.rain === undefined) {
      openWeather.current.rain = includeCurrent.rain;
    }
    if (openWeather.current.pop === undefined) {
      openWeather.current.pop = includeCurrent.pop;
    }
  }

  tenkiJp["3-hourly"] = tenkiJp["3-hourly"].filter((h) => h.time >= now);

  return { ...openWeather, ...tenkiJp };
}

async function getWeatherFromTenkiJp() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: 'new'
  });
  const page = await browser.newPage();

  // tenki.jp 墨田区 3時間天気
  await page.goto("https://tenki.jp/forecast/3/16/4410/13107/3hours.html");
  async function getByThreeHours(tableId, date) {
    return page.evaluate((tableId, date) => {
      const hours3 = [];
      const table = document.querySelector(`#${tableId}`);

      const hours = table.querySelectorAll(".hour > td");
      const weathers = table.querySelectorAll(".weather > td");
      const temperatures = table.querySelectorAll(".temperature > td");
      const pops = table.querySelectorAll(".prob-precip > td");
      const rains = table.querySelectorAll(".precipitation > td");
      const humidities = table.querySelectorAll(".humidity > td");
      const winds = table.querySelectorAll(".wind-speed > td");

      for (var i = 0; i < 8; i++) {
        const dateTime = new Date(date);
        dateTime.setHours(parseInt(hours[i].textContent), 0, 0, 0);
        hours3.push({
          "time": dateTime.getTime(),               // 時刻
          "date": dateTime.toLocaleString(),
          "pop": parseFloat(pops[i].textContent),   // 降水確率 [%]
          "rain": parseFloat(rains[i].textContent),   // 降水量 [mm/h]
          "temperature": parseFloat(temperatures[i].textContent), // 気温 [℃]
          "humidity": parseFloat(humidities[i].textContent),  // 湿度 [%]
          "wind": parseFloat(winds[i].textContent),    // 風速 [m/s]
          "description": weathers[i].textContent.trim() // 天気
        });
      }
      return hours3;
    }, tableId, date)
  }

  const threeHourly = await (async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const now = new Date().getTime();
    return (await getByThreeHours("forecast-point-3h-today", today))
      .concat(await getByThreeHours("forecast-point-3h-tomorrow", tomorrow))
  })();

  // tenki.jp 墨田区 2週間天気
  await page.goto("https://tenki.jp/forecast/3/16/4410/13107/10days.html");
  const daily = await page.evaluate(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dl = document.querySelector(".forecast10days-list");
    const daily = [];
    dl.querySelectorAll(".forecast10days-actab").forEach((dd) => {

      // 時刻
      const date = dd.querySelector(".days").textContent;
      const parse = /(\d+)月(\d+)日.*/.exec(date.trim());
      const m = parseInt(parse[1]);
      const d = parseInt(parse[2]);
      const dateTime = new Date(today);
      dateTime.setMonth(m - 1);
      dateTime.setDate(d);
      dateTime.setHours(0, 0, 0, 0);
      if (dateTime.getTime() < today.getTime()) {
        dateTime.setFullYear(dateTime.getFullYear() + 1);
      }

      const forecast = dd.querySelector(".forecast").textContent.trim();
      const highTemp = parseFloat(/(\d+)℃/.exec(dd.querySelector(".high-temp").textContent.trim())[1])
      const lowTemp = parseFloat(/(\d+)℃/.exec(dd.querySelector(".low-temp").textContent.trim())[1])
      const pop = parseFloat(/(\d+)%/.exec(dd.querySelector(".prob-precip").textContent.trim())[1]);
      const rain = parseFloat(/(\d+)(mm)?/.exec(dd.querySelector(".precip").textContent.trim())[1]);

      daily.push({
        "time": dateTime.getTime(),               // 時刻
        "date": dateTime.toLocaleString(),
        "pop": pop,   // 降水確率 [%]
        "rain": rain,   // 降水量 [mm/h]
        "temperature": { // 気温 [℃]
          "min": lowTemp,
          "max": highTemp
        },
        "description": forecast // 天気
      });
    });

    return daily;
  })

  await browser.close();

  function addWeatherIcon(list) {
    return list.map((h) => {
      h["icon"] = getWeatherIcon(h.description, new Date(h.time));
      return h;
    })
  }
  return {
    "3-hourly": addWeatherIcon(threeHourly),
    "daily": addWeatherIcon(daily)
  };
}

// 指定された日時が昼かどうかを判断する
function isDaytime(tm) {
  return tm.getHours() >= 4 && tm.getHours() <= 16;
}

function getWeatherIcon(desc, tm) {
  const file = (() => {
    switch (desc) {
      case "01d":
      case "01n":
      case "晴れ":
        return isDaytime(tm) ? "01.png" : "01n.png";
      case "02d":
      case "02n":
      case "晴時々曇":
      case "曇時々晴":
      case "曇のち晴":
      case "晴のち曇":
        return "02.png";
      case "03d":
      case "03n":
      case "曇り":
      case "曇":
        return "03.png";
      case "04d":
      case "04n":
      case "05d":
      case "05n":
      case "50d":
      case "50n":
      case "厚い曇":
      case "霧":
        return "04.png";
      case "09d":
      case "09n":
      case "小雨":
      case "弱雨":
      case "曇一時雨":
      case "曇時々雨":
      case "晴一時雨":
      case "晴時々雨":
        return "09.png";
      case "10d":
      case "10n":
      case "雨":
      case "雨のち曇":
      case "雨のち晴":
      case "曇のち雨":
      case "晴のち雨":
      case "雨時々曇":
      case "雨時々晴":
        return "10.png";
      case "11d":
      case "11n":
      case "雷":
        return "11.png";
      case "13d":
      case "13n":
      case "雪":
        return "13.png";
      default:
        console.log(`Error: Unsupported weather identifier: "${desc}"`);
        return `${desc}.png`;
    }
  })();
  return `assets/images/weather/${file}`;
}
