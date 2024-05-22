import fs from "fs";
import path from "path";
import { google } from "googleapis";

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
    fs.writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
  }

  return JSON.parse(fs.readFileSync(path, "utf8"));
}

async function fetchGoogleCalendarEvents(apiKey, calendarId, today) {
  const startOfDay = today.toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
  try {
    const calendar = google.calendar({
      version: "v3", auth: new google.auth.JWT(
        apiKey.client_email,
        null,
        apiKey.private_key,
        ["https://www.googleapis.com/auth/calendar.readonly"]
      )
    });
    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: startOfDay,
      timeMax: endOfDay,
      singleEvents: true,
      orderBy: 'startTime'
    });
    return response.data.items.map((event) => {
      return {
        summary: event.summary,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime,
      };
    });
  } catch (e) {
    console.error("Failed to list events:", e);
    return [];
  }
}

export async function getCalendar(date, apiKey, calendarId) {
  const year = date.getFullYear();
  const dir = "cache";
  const cache = path.join(dir, `holidays-${year}.json`);

  try {
    fs.mkdirSync(dir, { recursive: true });
    const holidays = readOrFetchHolidays(cache);
    return {
      holidays: await holidays,
      events: await fetchGoogleCalendarEvents(apiKey, calendarId, date)
    };
  } catch (e) {
    console.error("Failed to get calendar:", e);
    return {};
  }
}
