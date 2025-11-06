import React, { useEffect, useState } from "react"
import { Calendar, dateFnsLocalizer } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import enUS from "date-fns/locale/en-US"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "./CalanderPage.css"

const locales = { "en-US": enUS }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
})

const CALENDAR_ID =
  "ca0a5ef337ea062aef476550d3c7073c848e8499b2c4a965cc23a7f448ea2bd1@group.calendar.google.com"
const API_KEY = "AIzaSyCCVDsg9pIi8DcGW8S2GvfwuOgHlDVRA1Y"

function EventWithTime({ event }) {
  const isAllDay = event.allDay
  const startTime = !isAllDay ? format(event.start, "HH:mm") : null
  const endTime = !isAllDay ? format(event.end, "HH:mm") : null

  return (
    <span style={{ fontSize: "0.85rem", lineHeight: 1.2 }}>
      {!isAllDay && (
        <span style={{ fontWeight: 500, marginRight: 3 }}>
          {startTime}
          {endTime && `-${endTime} `}
        </span>
      )}
      {event.title}
    </span>
  )
}

function MonthLabelToolbar({ label }) {
  return (
    <div
      className="rbc-toolbar"
      style={{ justifyContent: "center", display: "flex" }}
    >
      <span className="rbc-toolbar-label">{label}</span>
    </div>
  )
}

export const CalanderPage = () => {
  const [events, setEvents] = useState([])

  useEffect(() => {
    fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?key=${API_KEY}&singleEvents=true&orderBy=startTime`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!data.items) return
        const mapped = data.items
          .filter(
            (event) => event.start && (event.start.dateTime || event.start.date)
          )
          .map((event) => ({
            id: event.id,
            title: event.summary,
            start: new Date(event.start.dateTime || event.start.date),
            end: new Date(
              event.end?.dateTime ||
                event.end?.date ||
                event.start.dateTime ||
                event.start.date
            ),
            allDay: !event.start.dateTime,
          }))
        setEvents(mapped)
      })
  }, [])

  return (
    <div
      className="carousel-page calendar-page"
      style={{ height: "100%", width: "100%" }}
    >
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%", width: "100%" }}
        popup
        views={["month"]}
        defaultView="month"
        toolbar={true}
        components={{
          event: EventWithTime,
          toolbar: MonthLabelToolbar, // <-- Only show the month label
        }}
      />
    </div>
  )
}
