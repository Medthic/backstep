import React from "react"
import "./NavbarDate.css"

function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100
  return s[(v - 20) % 5] || s[v] || s[0]
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
