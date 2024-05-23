import axios from "axios";
import { defaultMaxListeners } from "events";
import fs from "fs";
import puppeteer, { ConsoleMessage } from "puppeteer";

// 天気予報を取得する関数
// export async function getWeatherForecast(apiKey, latitude, longitude) {
//   const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&appid=${apiKey}&lang=ja&units=metric`;

//   try {
//     const response = await axios.get(url);
//     const data = response.data;
//     // 仕様: https://openweathermap.org/api/one-call-3
//     fs.writeFileSync("openweather-onecall.json", JSON.stringify(data, null, 2));

//     function conv(ws) {
//       return ws.map((w) => {
//         return {
//           time: w.dt,
//           temperature: w.temp,
//           humidity: w.humidity,
//           wind: w.wind_speed,
//           pop: w.pop,
//           rain: w.rain ? w.rain : undefined,
//           icon: getIconUrl(w.weather[0].icon),
//           description: w.weather[0].description,
//         };
//       });
//     }

//     return {
//       location: `${data.lat}/${data.lon}`,
//       sun: {
//         rise: data.current.sunrise,
//         set: data.current.sunset,
//       },
//       weather: {
//         hourly: conv([...[data.current], ...data.hourly]),
//         daily: conv(data.daily),
//       },
//     };
//   } catch (error) {
//     console.error("Error fetching weather data:", error);
//     throw error;
//   }
// }
export async function getWeatherForecast(apiKey, latitude, longitude) {
  const openWeather = await getWeatherFromOpenWeather(apiKey, latitude, longitude);
  const tenkiJp = await getWeatherFromTenkiJp();
  return { ...openWeather, ...tenkiJp };
}

function getIconUrl(icon) {
  const supported = ["01", "02", "03", "04", "09", "10", "11", "13"];
  let i = icon.substring(0, icon.length - 1);
  if (i === "50") {
    i = "04";
  }
  if (!supported.includes(i)) {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
  }
  return `/assets/images/weather/${i}.png`;
}

async function getWeatherFromOpenWeather(apiKey, latitude, longitude) {
  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&appid=${apiKey}&lang=ja&units=metric`;

  const response = await axios.get(url);
  const data = response.data;
  // 仕様: https://openweathermap.org/api/one-call-3
  fs.writeFileSync("openweather-onecall.json", JSON.stringify(data, null, 2));

  return {
    location: `${data.lat}/${data.lon}`,
    current: {
      sun: {
        rise: data.current.sunrise,
        set: data.current.sunset,
      },
      time: data.current.dt * 1000,
      temperature: data.current.temp,
      humidity: data.current.humidity,
      wind: data.current.wind_speed,
      pop: data.current.pop,
      rain: data.current.rain ? data.current.rain : undefined,
      icon: getIconUrl(data.current.weather[0].icon),
      description: data.current.weather[0].description,
    }
  };
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
      .filter((d) => d.time >= now);
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
      const rain = parseFloat(/(\d+)mm/.exec(dd.querySelector(".precip").textContent.trim())[1]);

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
      h["icon"] = getWeatherIcon(h.description);
      return h;
    })
  }
  return {
    "3-hourly": addWeatherIcon(threeHourly),
    "daily": addWeatherIcon(daily)
  };
}

function getWeatherIcon(desc) {
  const file = (() => {
    switch (desc) {
      case "晴れ":
        return "01.png";
      case "晴時々曇":
      case "曇時々晴":
      case "曇のち晴":
      case "晴のち曇":
        return "02.png";
      case "曇り":
      case "曇":
        return "03.png";
      case "厚い曇":
        return "04.png";
      case "曇一時雨":
      case "曇時々雨":
        return "09.png";
      case "雨":
      case "雨時々曇":
        return "10.png";
      case "雷":
        return "11.png";
      case "雪":
        return "13.png";
      default:
        return `${desc}.png`;
    }
  })();
  return `/assets/images/weather/${file}`;
}
