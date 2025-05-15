import React from "react"
import "./CalanderPage.css"

export const CalanderPage = () => (
  <div className="carousel-page calendar-page calendar-embed-container">
    <iframe
      className="calendar-embed-iframe"
      src="https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=America%2FNew_York&showPrint=0&showTz=0&showCalendars=0&showTabs=0&showNav=0&showTitle=0&src=Y2EwYTVlZjMzN2VhMDYyYWVmNDc2NTUwZDNjNzA3M2M4NDhlODQ5OWIyYzRhOTY1Y2MyM2E3ZjQ0OGVhMmJkMUBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&color=%238E24AA"
      title="Google Calendar"
      allowFullScreen
    />
  </div>
)
