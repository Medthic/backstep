import React from "react"
import "./NavbarDate.css"

export default function NavDate({ date }) {
  const d = date ? new Date(date) : new Date()
  const formatted = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })

  return <span className="nav-date">{formatted}</span>
}
