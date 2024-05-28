(($) => {
  function status(message) {
    const prefix = "doorstep-navi v0.1";
    $.getElementById("status").textContent = message !== undefined ? `${prefix}: ${message}` : prefix;
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

  function getJapaneseYear(year) {
    let jpy = year - 2018;
    if (jpy === 1) {
      jpy = "元"
    }
    return `令和${jpy}年`;
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
    $.getElementById("calendar-wareki").textContent = getJapaneseYear(year) + " " + getEto(year);
    $.getElementById("calendar-today-event").textContent = holiday !== undefined ? holiday : "";
    if (holiday !== undefined || now.getDay() === 0) {
      $.getElementById("calendar-date-holiday").classList.add("holiday");
    }

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
      if (new Date(event.start).getTime() - now.getTime() <= 24 * 60 * 60 * 1000) {
        start.classList.add("alert");
      }
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

    function addSubIcon(div, image, clazz, alt, selectors) {
      const img = $.createElement("img");
      img.setAttribute("src", `assets/images/weather/${image}.png`);
      img.setAttribute("class", clazz);
      img.setAttribute("alt", alt);
      for (var i = 0; i < selectors.length; i++) {
        const container = div.querySelector(selectors[i]);
        if (container !== null) {
          container.appendChild(img);
          break;
        }
      }
    }

    function addAmbrellaIfRain(div, pop, rain) {
      if (rain !== undefined && rain >= 2.0 && (typeof pop !== "number" || pop >= 30)) {
        addSubIcon(div, "ambrella", "weather-icon-ambrella", "☔", [".weather-icon-container"]);
      }
    }

    function addSungrassesIfUVI(div, uvi) {
      if (uvi !== undefined && uvi >= 6.0) {
        addSubIcon(div, "sungrasses", "weather-icon-uv", "UV", [".weather-icon-container"]);
      }
    }

    function addThermometerIfExtremelyHotDay(div, temp) {
      if (temp !== undefined && temp >= 35.0) {
        addSubIcon(div, "thermometer", "weather-extremely-hot-day", "Extremely Hot Day", [".weather-temp", ".weather-temp-high"]);
      }
    }

    function num(value) {
      if (value === null || value === undefined) {
        return "---";
      }
      return value.toFixed();
    }

    // 現在の天候
    (() => {
      const current = w.current;

      // 風速による表記変更
      const wind = ((wind) => {
        if (wind >= 24.5) {
          return "wind24";
        } else if (wind >= 13.9) {
          return "wind13";
        } else if (wind >= 8.0) {
          return "wind08";
        }
        return null;
      })(current.wind);

      const div = $.getElementById("weather-now");
      div.querySelector(".weather-icon").setAttribute("src", current.icon);
      div.querySelector(".weather-icon").setAttribute("alt", current.description);
      div.querySelector(".weather-title").textContent = current.description;
      div.querySelector(".weather-temp-value").textContent = num(current.temperature);
      div.querySelector(".weather-humidity-value").textContent = num(current.humidity);
      if (current.humidity >= 60) {
        div.querySelector(".weather-humidity-icon").setAttribute("src", "assets/images/weather/humidity60.png");
      }
      if (wind !== null) {
        const w = $.createElement("img");
        w.setAttribute("src", `assets/images/weather/${wind}.png`);
        w.setAttribute("alt", `${current.wind} m/s`);
        w.setAttribute("class", "weather-wind-icon");
        div.querySelector(".weather-title").appendChild(w);
      }
      addSungrassesIfUVI(div, current.uvi);
      addAmbrellaIfRain(div, current.pop, current.rain);
      status(new Date(current.time).toLocaleString());
    })();

    // 0, 3, 6, 9, 12, 15, 18, 21 時の天気を表示する
    for (var j = 1; j <= 6; j++) {
      const h = w["3-hourly"][j - 1];
      const time = new Date(h.time);
      const div = $.getElementById(`weather-h${j}`);
      div.querySelector(".weather-time").textContent = time.getHours() + ":00"
      div.querySelector(".weather-icon").setAttribute("src", h.icon);
      div.querySelector(".weather-icon").setAttribute("alt", h.description);
      div.querySelector(".weather-pop").textContent = num(h.pop) + "%";
      div.querySelector(".weather-temp").textContent = num(h.temperature) + "℃";
      addSungrassesIfUVI(div, h.uvi);
      addAmbrellaIfRain(div, h.pop, h.rain);
      addThermometerIfExtremelyHotDay(div, h.temperature);
    }

    const today = new Date(w.current.time);
    for (var j = 1; j <= 4; j++) {
      const d = w.daily[j];
      const time = new Date(d.time);
      const dayTitle = getDateName(today, time);
      const div = $.getElementById(`weather-d${j}`);
      div.querySelector(".weather-time").textContent = dayTitle;
      div.querySelector(".weather-icon").setAttribute("src", d.icon);
      div.querySelector(".weather-icon").setAttribute("alt", d.description);
      div.querySelector(".weather-pop").textContent = num(d.pop) + "%";
      div.querySelector(".weather-temp-high").textContent = num(d.temperature.max) + "℃";
      div.querySelector(".weather-temp-low").textContent = num(d.temperature.min) + "℃";
      addSungrassesIfUVI(div, d.uvi);
      addAmbrellaIfRain(div, d.pop, d.rain);
      addThermometerIfExtremelyHotDay(div, d.temperature.max);
    }
  }

  // 鉄道運行状況の更新
  function updateTransit(transite) {
    const delayedLines = transite["delayed-line"];
    const ts = $.getElementById("transit-delayed-lines");
    if (delayedLines.length === 0) {
      const dd = $.createElement("dd");
      dd.textContent = "鉄道の事故・遅延情報はありません";
      ts.appendChild(dd);
    } else {
      delayedLines.forEach((line) => {

        // 路線と区間を分離
        const m = line["line-name"].match(/(.*)\[(.*?)\]/);
        let lineText = null;
        let sectionText = null;
        if (m) {
          lineText = m[1].trim();
          sectionText = m[2].trim().replace("～", "-");
        } else {
          lineText = line["line-name"].trim();
        }

        // 路線
        const lineNameNode = $.createElement("dt");
        lineNameNode.appendChild($.createTextNode(lineText))
        ts.appendChild(lineNameNode);

        // 区間
        if (sectionText !== null) {
          const sectionNode = $.createElement("span");
          sectionNode.setAttribute("class", "transit-section");
          sectionNode.textContent = sectionText;
          lineNameNode.appendChild(sectionNode);
        }

        // 運行状況
        const statusNode = $.createElement("dd");
        statusNode.textContent = line.status;
        ts.appendChild(statusNode);
      });
    }
  }

  // ニュースの更新
  function updateNews(news) {
    const img = $.getElementById("news-headline-image");
    const hl = $.getElementById("news-headline");

    // エラー処理
    if (news.error !== undefined) {
      img.setAttribute("style", "display: none;");
      const li = $.createElement("li");
      li.textContent = news.error;
      hl.appendChild(li);
      return;
    }

    // ニュース画像の設定
    const article = news.articles.find((a) => a.image !== null);
    if (article !== undefined) {
      img.onerror = function (event) {
        event.target.setAttribute("style", "display: none;");
      };
      img.setAttribute("src", article.image);
    } else {
      img.setAttribute("style", "display: none;");
    }

    // ニュース見出しの設定
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
      status(e);
      if (error === null) {
        error = (typeof e.stack !== undefined) ? e.stack : e;
      }
    }
  }

  try {
    status();
    const data = DATA;
    exec(() => updateCalendar(data.calendar));
    exec(() => updateWeather(data.weather));
    exec(() => updateTransit(data.transite));
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
