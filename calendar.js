import { google } from "googleapis";
import { getCache } from "./cache.js"

async function fetchGoogleCalendarEvents(apiKey, calendarId, today) {
  if(apiKey === undefined || calendarId === undefined) {
    return [];
  }
  const startOfDay = today.toISOString();
  const end = new Date(today);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  const endOfDay = end.toISOString();
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

  try {
      // 日本の祝日を取得する
    const holidays = getCache("holidays", async () => {
      const url = "https://holidays-jp.github.io/api/v1/datetime.json";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      return await response.json();
    }, 0, 1);

    // Google Calendar からイベントを取得する
    const events = getCache("google-calendar-events", async () => {
      return await fetchGoogleCalendarEvents(apiKey, calendarId, date);
    }, 0, 0, 0, 0, 10);

    return {
      holidays: await holidays,
      events: await events
    };
  } catch (e) {
    console.error("Failed to get calendar:", e);
    return {
      holidays: {},
      events: [],
      error: (typeof e.stack !== undefined) ? e.stack : e
    };
  }
}
