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
    const tenkan = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
    const junishi = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
    const tenkanIndex = (year - 4) % 10;
    const junishiIndex = (year - 4) % 12;
    return tenkan[tenkanIndex] + junishi[junishiIndex];
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

    // スケジュールの表示
    calendar.events.forEach((event) => {
      const start = $.createElement("span");
      start.classList.add("calendar-event-start");
      const prefix = getDateDiffName(now, new Date(event.start));
      if (event.start === undefined || event.start.length === 10) {
        start.textContent = prefix + "終日";
      } else {
        start.textContent = prefix + event.start.slice(11, 16);
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
      "睦月",
      "如月",
      "弥生",
      "卯月",
      "皐月",
      "水無月",
      "文月",
      "葉月",
      "長月",
      "神無月",
      "霜月",
      "師走",
    ];
    return japaneseMonths[date.getMonth()];
  }

  function getDateDiff(t0, t1) {
    const mover = new Date(t0);
    mover.setHours(23, 59, 59, 999);
    const end = new Date(t1);
    end.setHours(23, 59, 59, 999);
    let diff = 0;
    while (mover.getTime() < end.getTime()) {
      mover.setDate(mover.getDate() + 1);
      diff++;
    }
    return diff;
  }

  function getDateDiffName(t0, t1) {
    const diff = getDateDiff(t0, t1);
    switch (diff) {
      case 0:
        return "";
      case 1:
        return "明日";
      case 2:
        return "明後日";
      default:
        return diff + "日後";
    }
  }

  function getDateName(today, date) {
    const diff = getDateDiff(today, date);
    let name;
    switch (diff) {
      case 0:
        name = "きょう";
        break;
      case 1:
        name = "あす";
        break;
      case 2:
        name = "明後日";
        break;
      default:
        name = ((date.getDate() === 1) ? ((date.getMonth() + 1) + "月") : "") + date.getDate() + "日";
    }
    return name + "(" + getDayOfWeek(date) + ")";
  }

  function updateWeather(w) {
    const current = w.current;

    // 風速による表記変更
    const wind = ((wind) => {
      if (wind >= 24.5) {
        return "・暴風";
      } else if (wind >= 13.9) {
        return "・強風";
      } else if (wind >= 8.0) {
        return "・風";
      }
      return "";
    })(current.wind);

    $.getElementById("weather-icon").setAttribute("src", current.icon);
    $.getElementById("weather-icon").setAttribute("alt", current.description);
    $.getElementById("weather-title").textContent = current.description + wind;
    $.getElementById("weather-temp-value").textContent = current.temperature.toFixed();
    $.getElementById("weather-humidity-value").textContent = current.humidity.toFixed();
    if (current.humidity >= 60) {
      $.getElementById("weather-humidity").style.backgroundImage = "url('/assets/images/weather/humidity60.png')";
    }
    status(new Date(current.time));

    function rainSymbol(pop, rain) {
      return pop >= 50 || rain >= 2 ? "☔" : "";
    }

    // 0, 3, 6, 9, 12, 15, 18, 21 時の天気を表示する
    for (var j = 1; j <= 6; j++) {
      const h = w["3-hourly"][j - 1];
      const time = new Date(h.time);
      const rain = rainSymbol(h.pop, h.rain);
      $.getElementById("weather-time-h" + j).textContent = time.getHours() + ":00";
      $.getElementById("weather-icon-h" + j).setAttribute("src", h.icon);
      $.getElementById("weather-icon-h" + j).setAttribute("alt", h.description);
      $.getElementById("weather-temp-h" + j).textContent = h.temperature.toFixed(0) + "℃";
      $.getElementById("weather-pop-h" + j).textContent = rain + h.pop.toFixed(0) + "%";
    }

    const today = new Date(w.current.time);
    for (var j = 1; j <= 4; j++) {
      const d = w.daily[j - 1];
      const time = new Date(d.time);
      const dayTitle = getDateName(today, time);
      const rain = rainSymbol(d.pop, d.rain);
      $.getElementById("weather-time-d" + j).textContent = dayTitle;
      $.getElementById("weather-icon-d" + j).setAttribute("src", d.icon);
      $.getElementById("weather-icon-d" + j).setAttribute("alt", d.description);
      $.getElementById("weather-temp-d" + j).textContent =
        d.temperature.min.toFixed(0) + "℃/" + d.temperature.max.toFixed(0) + "℃";
      $.getElementById("weather-pop-d" + j).textContent = rain + d.pop.toFixed(0) + "%";
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

  let error = null;
  function exec(f) {
    try {
      f();
    } catch (e) {
      if (error !== null) {
        error = (typeof e.stack !== undefined) ? e.stack : e;
      }
    }
  }

  try {
    const data = fetchSync("/data.json");
    exec(() => updateCalendar(data.calendar));
    exec(() => updateWeather(data.weather));
    exec(() => updateTransite(data.transite));
    exec(() => updateNews(data.news));
    if (data.error !== undefined) {
      error = JSON.stringify(data.error);
    }
  } catch (e) {
    error = (typeof e.stack !== undefined) ? e.stack : e;
  }

  if (error !== null) {
    const err = $.createElement("pre");
    err.setAttribute("id", "error");
    err.textContent = error;
    $.getElementById("news").appendChild(err);
  }

})(document);
