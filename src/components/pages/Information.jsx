import React, { useEffect, useState } from "react"
import "./Information.css"

const SHEET_ID = "1g_BfPk42Cy83PTkVGlAyxC3w5g9MUQXVHyO-I7VA2rE"
const API_KEY = "AIzaSyAqBIZ19jFidOeEii80p_EQSzRtBltLwlc"

const fetchSheet = async (sheetName) => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}?key=${API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  // Assume first row is header, rest are items
  return data.values ? data.values.slice(1).map((row) => row[0]) : []
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

  return (
    <div className="info-full-container">
      <div className="info-col">
        <h2>Department News</h2>
        <ul className="scroll-list">
          <div className="scroll-animate">
            {data.departmentNews.map((item, idx) => (
              <li key={idx}>
                <div className="info-item news-item">{item}</div>
              </li>
            ))}
            {/* Duplicate for seamless loop */}
            {data.departmentNews.map((item, idx) => (
              <li key={`dup-${idx}`}>
                <div className="info-item news-item">{item}</div>
              </li>
            ))}
          </div>
        </ul>
      </div>
      <div className="info-col">
        <h2>Run Statistics</h2>
        <ul>
          {data.runStats.map((item, idx) => (
            <li key={idx}>
              <div className="info-item">{item}</div>
            </li>
          ))}
        </ul>
      </div>
      <div className="info-col">
        <h2>Tools & Equipment Status</h2>
        <ul>
          {data.toolsStatus.map((item, idx) => (
            <li key={idx}>
              <div className="info-item">{item}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
