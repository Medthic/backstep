import React from "react"

export default function DateComponent({ date }) {
  const d = date ? new Date(date) : new Date()
  // Format: May 21
  const formatted = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })

  return <span>{formatted}</span>
}