import fs from "fs";
import path from "path";

const url = "https://holidays-jp.github.io/api/v1/datetime.json";

async function fetchHolidays() {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch holidays:", error);
  }
}

async function readOrFetchHolidays(path) {
  if (!fs.existsSync(path)) {
    console.log("Fetching holidays...");
    const data = await fetchHolidays();
    fs.writeFile(path, JSON.stringify(data, null, 2), "utf8", () => {});
  }

  return {
    holidays: JSON.parse(fs.readFileSync(path, "utf8")),
  };
}

export function getCalendar(date) {
  const year = date.getFullYear();
  const dir = "cache";
  const cache = path.join(dir, `holidays-${year}.json`);

  return new Promise((resolve, reject) => {
    try {
      fs.mkdir(dir, { recursive: true }, () => {
        readOrFetchHolidays(cache).then((data) => {
          resolve(data);
        });
      });
    } catch (e) {
      reject(e);
    }
  });
}
