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
    if (holiday !== undefined) {
      $.getElementById("calendar-date-holiday").classList.add("holiday");
    }

    // 今月と来月のカレンダーを作成
    const dateId = (y, m, d) => "date" + y + String(m).padStart(2, "0") + String(d).padStart(2, "0");
    function setCalendar(year, month, target) {
      generateCalendar(year, month).forEach((week, i) => {
        const tr = $.createElement("tr");
        week.forEach((day) => {
          const td = $.createElement("td");
          const dc = $.createElement("span");
          td.appendChild(dc);
          if (day === null) {
            td.setAttribute("class", "calendar-empty");
            dc.textContent = "・";
          } else {
            td.setAttribute("id", dateId(year, month, day));
            if (month === now.getMonth() + 1 && day === now.getDate()) {
              td.classList.add("calendar-today");
            }
            if (getHoliday(new Date(year, month - 1, day), calendar.holidays)) {
              td.classList.add("calendar-holiday");
            }
            dc.textContent = day;
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

    // 7日以内のスケジュールを表示
    const limit = new Date();
    limit.setDate(limit.getDate() + 7);
    calendar.events
      .filter(event => {
        const start = new Date(event.start);
        const end = new Date(event.end === undefined ? event.start : event.end);
        return start.getTime() <= limit.getTime() && now.getTime() <= end.getTime();
      })
      .forEach(event => {
        const diffText = $.createElement("span");
        diffText.classList.add("calendar-event-start");
        if (new Date(event.start).getTime() - now.getTime() <= 24 * 60 * 60 * 1000) {
          diffText.classList.add("alert");
        }
        const prefix = getDateDiffName(now, new Date(event.start));
        if (event.start === undefined || event.start.length === 10) {
          diffText.textContent = prefix === "" ? "終日" : prefix;
        } else {
          diffText.textContent = prefix + event.start.slice(11, 16);
        }
        const li = $.createElement("li");
        li.appendChild(diffText);
        li.appendChild($.createTextNode(" " + event.summary));
        $.getElementById("calendar-events").appendChild(li);
      });

    // 2ヶ月以内のスケジュールをマーク
    calendar.events.forEach(event => {
      const t = new Date(event.start);
      t.setHours(0, 0, 0, 0);
      const end = new Date(event.end === undefined ? event.start : event.end);
      end.setHours(0, 0, 0, 0);
      do {
        const date = $.getElementById(dateId(t.getFullYear(), t.getMonth() + 1, t.getDate()));
        if (date !== null) {
          date.classList.add("calendar-event-exists");
        }
        t.setDate(t.getDate() + 1);
      } while (t.getTime() < end.getTime());
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
    return diff <= 0 ? "" : diff === 1 ? "明日" : diff === 2 ? "明後日" : diff + "日後";
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

    function addWindIfStrong(div, wind) {
      if (wind >= 8.0) {
        addWarning(div, wind < 13.9 ? "wind" : "tornado");
      }
    }

    function addDiscomfortIndex(div, temperature, humidity) {
      // 気温と湿度から不快指数を算出
      const discomfortIndex = 0.81 * temperature + 0.01 * humidity * (0.99 * temperature - 14.3) + 46.3;
      if (discomfortIndex >= 80 || discomfortIndex <= 50) {
        addWarning(div, "emoji-frown");
      }
    }

    function addPressure(div, pressure) {
      addWarning(div, "graph-down-arrow");
      if (pressure < 1000) {
        addWarning(div, "graph-down-arrow");
      }
    }

    function addWarning(div, id) {
      const icon = $.createElement("i");
      icon.setAttribute("class", `bi bi-${id}`);
      div.querySelector(".weather-warnings").appendChild(icon);
    }

    function addWeatherIcon(parent, icon) {
      const i = parent.querySelector(".weather-icon");
      if (!icon.startsWith("#")) {
        i.setAttribute("class", `weather-icon bi bi-${icon}`);
      } else {
        i.setAttribute("class", "weather-icon error");
        i.textContent = icon;
      }
    }

    function num(value) {
      if (value === null || value === undefined) {
        return "---";
      }
      if (typeof value === "string") {
        value = parseFloat(value);
      }
      if (typeof value === "number") {
        return value.toFixed();
      }
      throw new Error("Error: Unsupported value: " + JSON.stringify(value));
    }

    // 現在の天候
    (() => {
      const current = w.current;
      const div = $.getElementById("weather-now");
      div.querySelector(".weather-title").textContent = current.description;
      div.querySelector(".weather-temp").textContent = num(current.temperature);
      div.querySelector(".weather-humidity").textContent = num(current.humidity);
      addWeatherIcon(div, current.icon);
      addSungrassesIfUVI(div, current.uvi);
      addAmbrellaIfRain(div, current.pop, current.rain);
      addDiscomfortIndex(div, current.temperature, current.humidity);
      addPressure(div, current.pressure);
      addWindIfStrong(div, current.wind);
      status(new Date(current.time).toLocaleString("ja-JP", {
        year: "numeric", month: "numeric", day: "numeric", hour: "numeric", "minute": "numeric"
      }));
    })();

    // 0, 3, 6, 9, 12, 15, 18, 21 時の天気を表示する
    for (var j = 1; j <= 6; j++) {
      const h = w["3-hourly"][j - 1];
      const time = new Date(h.time);
      const div = $.getElementById(`weather-h${j}`);
      div.querySelector(".weather-time").textContent = time.getHours() + ":00"
      div.querySelector(".weather-pop").textContent = num(h.pop);
      div.querySelector(".weather-temp").textContent = num(h.temperature);
      addWeatherIcon(div, h.icon);
      addSungrassesIfUVI(div, h.uvi);
      addAmbrellaIfRain(div, h.pop, h.rain);
      addDiscomfortIndex(div, h.temperature, h.humidity);
      addPressure(div, h.pressure);
      addWindIfStrong(div, h.wind);
    }

    const today = new Date(w.current.time);
    for (var j = 1; j <= 4; j++) {
      const d = w.daily[j];
      const time = new Date(d.time);
      const dayTitle = getDateName(today, time);
      const div = $.getElementById(`weather-d${j}`);
      div.querySelector(".weather-time").textContent = dayTitle;
      div.querySelector(".weather-pop").textContent = num(d.pop);
      div.querySelector(".weather-temp-high").textContent = num(d.temperature.max);
      div.querySelector(".weather-temp-low").textContent = num(d.temperature.min);
      addWeatherIcon(div, d.icon);
      addSungrassesIfUVI(div, d.uvi);
      addAmbrellaIfRain(div, d.pop, d.rain);
    }
  }

  // 鉄道運行状況の更新
  function updateTransit(transite) {
    const delayedLines = transite["delayed-line"];
    const ts = $.getElementById("transit-delayed-lines");
    if (delayedLines.length === 0) {
      const dd = $.createElement("dd");
      dd.setAttribute("class", "transit-message");
      dd.textContent = "◆鉄道の事故・遅延情報はありません。";
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
    const c = $.getElementById("news-container");

    // エラー処理
    if (news.error !== undefined) {
      const pre = $.createElement("pre");
      pre.textContent = news.error;
      c.appendChild(pre);
      return;
    }

    // ニュース画像の作成
    const img = (() => {
      const article = news.articles.find((a) => a.image !== null);
      if (article === undefined) {
        return null;
      }
      const img = $.createElement("img");
      img.setAttribute("class", "news-headline-image rounded");
      img.onerror = function () {
        img.setAttribute("style", "display: none;");
      };
      img.setAttribute("src", article.image);
      return img;
    })();

    if (news.summary !== undefined && news.summary !== null) {
      // 生成 AI による要約が作成されている場合はそれを表示する
      const p = $.createElement("p");
      p.setAttribute("class", "news-summary");
      if (img !== null) {
        p.appendChild(img);
      }
      p.appendChild($.createTextNode(news.summary));
      c.appendChild(p);
    } else {
      // ニュースの要約が存在しない場合は個別のニュースをリスト表示する

      // ニュースをランダムにシャッフル
      const keywords = ["速報", "地震"];
      news.articles.sort((a, b) => {
        for (let kwd in keywords) {
          if (a.title.includes(kwd)) return 1;
          if (b.title.includes(kwd)) return -1;
        }
        return Math.random() - 0.5;
      });

      // ニュース見出しの設定
      const hl = $.createElement("ol");
      hl.setAttribute("class", "news-headlines");
      news.articles.forEach((article) => {
        const li = $.createElement("li");
        li.textContent = article.title;
        hl.appendChild(li);
      });
      c.appendChild(hl);
    }
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
    err.textContent = error.replace(/:\/\/.*(?=\/public\/assets\/javascripts\/)/g, "://.");
    $.getElementById("news").appendChild(err);
  }

})(document);
