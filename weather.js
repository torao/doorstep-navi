import axios from "axios";
import fs from "fs";

// 天気予報を取得する関数
export async function getWeatherForecast(apiKey, latitude, longitude) {
  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&appid=${apiKey}&lang=ja&units=metric`;

  try {
    const response = await axios.get(url);
    const data = response.data;
    // 仕様: https://openweathermap.org/api/one-call-3
    fs.writeFileSync("openweather-onecall.json", JSON.stringify(data, null, 2));

    function conv(ws) {
      return ws.map((w) => {
        return {
          time: w.dt,
          temperature: w.temp,
          pressure: w.pressure,
          humidity: w.humidity,
          wind: w.wind_speed,
          icon: getIconUrl(w.weather[0].icon),
          title: w.weather[0].main,
          description: w.weather[0].description,
        };
      });
    }

    return {
      location: `${data.lat}/${data.lon}`,
      sun: {
        rise: data.current.sunrise,
        set: data.current.sunset,
      },
      weather: {
        hourly: conv([...[data.current], ...data.hourly]),
        daily: conv(data.daily),
      },
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    throw error;
  }
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
