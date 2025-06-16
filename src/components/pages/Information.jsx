import React, { useEffect, useState } from "react"
import "./Information.css"
import { MdOutlineNotificationImportant } from "react-icons/md"
import { HiOutlineDocumentText } from "react-icons/hi"
import { ImNewspaper } from "react-icons/im"

const SHEET_ID = "1g_BfPk42Cy83PTkVGlAyxC3w5g9MUQXVHyO-I7VA2rE"
const API_KEY = "AIzaSyAqBIZ19jFidOeEii80p_EQSzRtBltLwlc"

const fetchSheet = async (sheetName) => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}?key=${API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  if (sheetName === "Status") {
    return data.values ? data.values.slice(1) : []
  }
  if (sheetName === "RunStats") {
    return data.values
      ? data.values.slice(1).map((row) => [row[0], row[1]])
      : []
  }
  // For DepartmentNews: [news, date, icon]
  return data.values
    ? data.values.slice(1).map((row) => [row[0], row[1], row[2]])
    : []
}

export default function Information() {
  const [data, setData] = useState({
    departmentNews: [],
    runStats: [],
    toolsStatus: [],
  })

  useEffect(() => {
    async function fetchAll() {
      const [departmentNews, runStats, toolsStatus] = await Promise.all([
        fetchSheet("DepartmentNews"),
        fetchSheet("RunStats"),
        fetchSheet("Status"),
      ])
      setData({ departmentNews, runStats, toolsStatus })
    }
    fetchAll()
  }, [])

  const getStatusClass = (status) => {
    if (!status) return ""
    const s = status.toLowerCase()
    if (s.includes("in service")) return "status-in"
    if (s.includes("out")) return "status-out"
    if (s.includes("maintenance")) return "status-maint"
    return "status-other"
  }

  const getRunStatClass = (description) => {
    const desc = description.toLowerCase()
    if (desc.includes("fire")) return "run-stat-fire"
    if (desc.includes("ems")) return "run-stat-ems"
    return "run-stat-other"
  }

  // Helper for icon rendering
  const renderNewsIcon = (iconType) => {
    if (!iconType) return null
    const type = iconType.toLowerCase()
    if (type === "important") {
      return <MdOutlineNotificationImportant className="news-icon important" />
    }
    if (type === "policy change") {
      return <HiOutlineDocumentText className="news-icon policy" />
    }
    if (type === "general") {
      return <ImNewspaper className="news-icon general" />
    }
    return null
  }

  return (
    <div className="info-full-container">
      <div className="info-col">
        <h2>Department News</h2>
        <ul>
          {data.departmentNews.map((row, idx) => {
            const [news, date, iconType] = row
            return (
              <li key={idx}>
                <div className="info-item news-item news-flex">
                  <div className="news-content">
                    <div>{news}</div>
                    {date && <div className="news-date">{date}</div>}
                  </div>
                  <div className="news-icon-container">
                    {renderNewsIcon(iconType)}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
      <div className="info-col">
        <h2>Run Statistics</h2>
        <div className="run-stats-grid">
          {data.runStats.map((row, idx) => {
            const [number, description] = row
            return (
              <div
                key={idx}
                className={`run-stat-item ${getRunStatClass(description)}`}
              >
                <div className="run-stat-title">{description}</div>
                <div className="run-stat-number" style={{ fontWeight: "bold" }}>
                  {number}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="info-col">
        <h2>Tools & Equipment Status</h2>
        <ul>
          {data.toolsStatus.map((row, idx) => {
            const [tool, status] = row
            return (
              <li key={idx}>
                <div
                  className={`info-item status-item ${getStatusClass(status)}`}
                >
                  <span className="status-tool">{tool}</span>
                  <span className="status-label">{status}</span>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
