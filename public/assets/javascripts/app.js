(($) => {
  function status(message) {
    $.getElementById("status").textContent = message;
  }

  function fetchSync(url) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.send(null);
    if (xhr.status === 200) {
      return JSON.parse(xhr.responseText);
    } else {
      throw new Error(`Failed to fetch data: ${xhr.status}`);
    }
  }

  function getHoliday(date, holidays) {
    const tm = date.getTime() / 1000;
    return holidays[String(tm)];
  }

  function getDayOfWeek(date) {
    const week = ["日", "月", "火", "水", "木", "金", "土"];
    return week[date.getDay()];
  }

  function getEto(year) {
    const tenkan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const junishi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const tenkanIndex = (year - 4) % 10;
    const junishiIndex = (year - 4) % 12;
    return tenkan[tenkanIndex] + junishi[junishiIndex];
  }

  function getWind(wind) {
    if (wind >= 30) {
      return "猛烈な風";
    } else if (wind >= 20) {
      return "非常に強い風";
    } else if (wind >= 15) {
      return "強い風";
    } else if (wind >= 10) {
      return "やや強い風";
    }
    return "---";
  }

  function updateCalendar(calendar) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const holiday = getHoliday(new Date(year, month - 1, date), calendar.holidays);

    $.getElementById("calendar-year").textContent = year;
    $.getElementById("calendar-month").textContent = month;
    $.getElementById("calendar-date").textContent = date;
    $.getElementById("calendar-day-of-week").textContent = getDayOfWeek(now);
    $.getElementById("calendar-today-event").textContent = holiday !== undefined ? holiday : "";
    $.getElementById("calendar-wareki").textContent = "令和" + (year - 2018) + "年 " + getEto(year);

    function setCalendar(year, month, target) {
      generateCalendar(year, month).forEach((week, i) => {
        const tr = $.createElement("tr");
        week.forEach((day) => {
          const td = $.createElement("td");
          if (day === null) {
            td.setAttribute("class", "calendar-empty");
            td.textContent = "・";
          } else {
            let clazz = "";
            if (month === now.getMonth() + 1 && day === now.getDate()) {
              clazz = "calendar-today";
            }
            if (getHoliday(new Date(year, month - 1, day), calendar.holidays)) {
              clazz += " calendar-holiday";
            }
            if (clazz.length > 0) {
              td.setAttribute("class", clazz.trim());
            }

            td.textContent = day;
          }
          tr.appendChild(td);
        });
        $.getElementById(target).appendChild(tr);
      });
      const caption = $.createElement("caption");
      caption.textContent = year + "年" + month + "月 " + getJapaneseMonthName(new Date(year, month - 1, 1));
      $.getElementById(target).appendChild(caption);
    }
    setCalendar(year, month, "calendar-this-month");
    setCalendar(year, month + 1, "calendar-next-month");

    calendar.events.forEach((event) => {
      const start = $.createElement("span");
      start.classList.add("calendar-event-start");
      if (event.start === undefined || event.start.length === 10) {
        start.textContent = "終日";
      } else {
        start.textContent = event.start.slice(11, 16);
      }
      const li = $.createElement("li");
      li.appendChild(start);
      li.appendChild($.createTextNode(" " + event.summary));
      $.getElementById("calendar-events").appendChild(li);
    });
  }

  function generateCalendar(year, month) {
    const date = new Date(year, month - 1, 1);
    const calendar = [];
    const firstDay = date.getDay();
    let week = new Array(firstDay).fill(null);
    while (date.getMonth() === month - 1) {
      week.push(date.getDate());
      if (week.length === 7) {
        calendar.push(week);
        week = [];
      }
      date.setDate(date.getDate() + 1);
    }
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      calendar.push(week);
    }
    return calendar;
  }

  function getJapaneseMonthName(date) {
    const japaneseMonths = [
      '睦月', '如月', '弥生', '卯月', '皐月', '水無月',
      '文月', '葉月', '長月', '神無月', '霜月', '師走'
    ];
    return japaneseMonths[date.getMonth()];
  }

  function updateWeather(w) {
    const current = w.weather.hourly[0];
    $.getElementById("weather-icon").setAttribute("src", current.icon);
    $.getElementById("weather-icon").setAttribute("alt", current.description);
    $.getElementById("weather-title").textContent = current.description;
    $.getElementById("weather-temp-value").textContent = current.temperature.toFixed();
    $.getElementById("weather-humidity-value").textContent = current.humidity.toFixed();
    if (current.humidity >= 60) {
      $.getElementById("weather-humidity").style.backgroundImage = "url('/assets/images/weather/humidity60.png')";
    }

    function rainSymbol(pop, rain) {
      return pop >= 0.5 || rain >= 2 ? "☔" : "";
    }

    for (var j = 1; j <= 6; j++) {
      const index = j * 3 + 1;
      const h = w.weather.hourly[index];
      const time = new Date(h.time * 1000);
      $.getElementById("weather-time-h" + j).textContent = "~" + time.getHours() + "h";
      $.getElementById("weather-icon-h" + j).setAttribute("src", h.icon);
      $.getElementById("weather-icon-h" + j).setAttribute("alt", h.description);
      $.getElementById("weather-temp-h" + j).textContent = h.temperature.toFixed(0) + "℃";

      // 3時間前までの降水確率の最大値を取得
      let maxPop = h.pop;
      let maxRain = h.rain;
      for (var k = index - 1; k > index - 3 && k >= 0; k--) {
        maxPop = Math.max(maxPop, w.weather.hourly[k].pop);
        if (maxRain === undefined) {
          maxRain = w.weather.hourly[k].rain;
        } else if (w.weather.hourly[k].rain !== undefined) {
          maxRain = Math.max(maxRain, w.weather.hourly[k].rain);
        }
      }
      const rain = rainSymbol(maxPop, maxRain);
      $.getElementById("weather-pop-h" + j).textContent = rain + (maxPop * 100).toFixed(0) + "%";

      // 風速による表記変更
      // $.getElementById("weather-wind-h" + j).textContent = getWind(h.wind);
    }

    for (var j = 1; j <= 4; j++) {
      const d = w.weather.daily[j - 1];
      const time = new Date(d.time * 1000);
      let dayTitle =
        (time.getDate() === 1 ? time.getMonth() + 1 + "月" : "") + time.getDate() + "日(" + getDayOfWeek(time) + ")";
      if (j === 1) {
        dayTitle = "今日(" + getDayOfWeek(time) + ")";
      } else if (j === 2) {
        dayTitle = "明日(" + getDayOfWeek(time) + ")";
      } else if (j === 3) {
        dayTitle = "明後日(" + getDayOfWeek(time) + ")";
      }
      $.getElementById("weather-time-d" + j).textContent = dayTitle;

      $.getElementById("weather-icon-d" + j).setAttribute("src", d.icon);
      $.getElementById("weather-icon-d" + j).setAttribute("alt", d.description);
      $.getElementById("weather-temp-d" + j).textContent =
        d.temperature.min.toFixed(0) + "℃/" + d.temperature.max.toFixed(0) + "℃";

      const rain = rainSymbol(d.pop, d.rain);
      $.getElementById("weather-pop-d" + j).textContent = rain + (d.pop * 100).toFixed(0) + "%";

      // 風速による表記変更
      // $.getElementById("weather-wind-d" + j).textContent = getWind(d.wind);
    }
  }

  function updateTransite(transite) {
    const delayedLines = transite["delayed-line"];
    const ts = $.getElementById("transite-delayed-lines");
    if (delayedLines.length === 0) {
      ts.textContent = "鉄道の事故・遅延情報はありません";
      return;
    }
    ts.innerHTML = delayedLines.map((line) => `<b>${line["line-name"]}</b>: ${line.status}`).join(" / ");
  }

  function updateNews(news) {
    // ニュース画像の設定
    const article = news.articles.find((a) => a.image !== null);
    const img = $.getElementById("news-headline-image");
    if (article !== undefined) {
      img.onerror = function (event) {
        event.target.setAttribute("style", "display: none;");
      };
      img.setAttribute("src", article.image);
    } else {
      img.setAttribute("style", "display: none;");
    }

    const hl = $.getElementById("news-headline");
    news.articles.forEach((article) => {
      const li = $.createElement("li");
      li.textContent = article.title;
      hl.appendChild(li);
    });
  }

  try {
    const data = fetchSync("/data.json");

    updateCalendar(data.calendar);
    updateWeather(data.weather);
    updateTransite(data.transite);
    updateNews(data.news);
  } catch (e) {
    status("Error fetching data: " + e);
  }
})(document);
