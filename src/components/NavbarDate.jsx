import React from "react"
import "./NavbarDate.css"

function getOrdinal(n) {
  if (n % 100 >= 11 && n % 100 <= 13) return "th"
  switch (n % 10) {
    case 1:
      return "st"
    case 2:
      return "nd"
    case 3:
      return "rd"
    default:
      return "th"
  }
}

export default function NavDate({ date }) {
  const d = date ? new Date(date) : new Date()
  const month = d
    .toLocaleDateString(undefined, { month: "short" })
    .toUpperCase()
  const day = d.getDate()
  const ordinal = getOrdinal(day)

  return (
    <span className="nav-date">
      {month} {day}
      <sup style={{ fontSize: "0.5em" }}>{ordinal}</sup>
    </span>
  )
}
