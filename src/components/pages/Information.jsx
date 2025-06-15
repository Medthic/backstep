import React, { useEffect, useState } from "react"
import { Pie } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
import "./Information.css"

ChartJS.register(ArcElement, Tooltip, Legend)

const SHEET_ID = "1g_BfPk42Cy83PTkVGlAyxC3w5g9MUQXVHyO-I7VA2rE"
const API_KEY = "AIzaSyAqBIZ19jFidOeEii80p_EQSzRtBltLwlc"

const fetchSheet = async (sheetName) => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}?key=${API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  // For Status, return the whole row (name and status)
  if (sheetName === "Status") {
    return data.values ? data.values.slice(1) : []
  }
  // For RunStats, return both columns (name and numbers)
  if (sheetName === "RunStats") {
    return data.values
      ? data.values.slice(1).map((row) => [row[0], row[1]])
      : []
  }
  // For others, just the first column
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

  // Helper to get status color class
  const getStatusClass = (status) => {
    if (!status) return ""
    const s = status.toLowerCase()
    if (s.includes("in service")) return "status-in"
    if (s.includes("out")) return "status-out"
    if (s.includes("maintenance")) return "status-maint"
    return "status-other"
  }

  // Prepare data for the pie chart
  const pieChartData = {
    labels: ["Fire", "EMS"],
    datasets: [
      {
        data: data.runStats.reduce(
          (acc, [number, description]) => {
            if (description.toLowerCase().includes("fire"))
              acc[0] += parseInt(number, 10)
            if (description.toLowerCase().includes("ems"))
              acc[1] += parseInt(number, 10)
            return acc
          },
          [0, 0]
        ),
        backgroundColor: ["red", "blue"],
        hoverBackgroundColor: ["darkred", "darkblue"],
      },
    ],
  }

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
          </div>
        </ul>
      </div>
      <div className="info-col">
        <h2>Run Statistics</h2>
        <div className="run-stats-grid">
          {data.runStats.map((row, idx) => {
            const [number, description] = row
            const bgColor =
              description.toLowerCase().includes("fire")
                ? "red"
                : description.toLowerCase().includes("ems")
                ? "blue"
                : "gray" // Default color if neither fire nor EMS
            return (
              <div
                key={idx}
                className="run-stat-item"
                style={{ backgroundColor: bgColor }}
              >
                <div className="run-stat-title">{description}</div>
                <div className="run-stat-number" style={{ fontWeight: "bold" }}>
                  {number}
                </div>
              </div>
            )
          })}
        </div>
        {/* Pie Chart */}
        <div className="pie-chart-container">
          <h3>EMS vs Fire Statistics</h3>
          <Pie data={pieChartData} />
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
