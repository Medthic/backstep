import React, { useEffect, useState } from "react"
import "./WeatherBadge.css"

// Monroeville, PA 15146 coordinates
const LAT = 40.4112
const LON = -79.7878

function codeToEmoji(code) {
  if (code === 0) return "☀️"
  if (code >= 1 && code <= 3) return "⛅"
  if (code === 45 || code === 48) return "🌫️"
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "🌧️"
  if (code >= 71 && code <= 77) return "❄️"
  if (code >= 95 && code <= 99) return "⛈️"
  return "🌤️"
}

export default function WeatherBadge() {
  const [temp, setTemp] = useState(null)
  const [code, setCode] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const fetchWeather = async () => {
      try {
        setLoading(true)
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current_weather=true&temperature_unit=fahrenheit&timezone=America%2FNew_York`
        const res = await fetch(url)
        if (!res.ok) throw new Error("weather fetch failed")
        const json = await res.json()
        if (!mounted) return
        const cw = json.current_weather || {}
        setTemp(typeof cw.temperature === "number" ? Math.round(cw.temperature) : null)
        setCode(typeof cw.weathercode === "number" ? cw.weathercode : null)
      } catch (e) {
        // ignore network errors — show placeholder
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchWeather()
    const id = setInterval(fetchWeather, 15 * 60 * 1000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])

  if (loading) return <span className="nav-weather nav-weather--loading">—</span>

  return (
    <span className="nav-weather" title="Monroeville, PA">
      <span className="nav-weather__icon">{codeToEmoji(code)}</span>
      <span className="nav-weather__temp">{temp !== null ? `${temp}°F` : "—"}</span>
      <span className="nav-weather__loc">Monroeville</span>
    </span>
  )
}
