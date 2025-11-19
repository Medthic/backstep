import React, { useEffect, useState } from "react"
import "./InfoBar.css"
import { supabase } from "../lib/supabase"

const EXTERNAL_AMBULANCES = [18, 19, 58, 59, 68, 69]

const defaultExternalAmbulanceItems = [
  { id: 18, status: "—" },
  { id: 19, status: "—" },
  { id: 58, status: "—" },
  { id: 59, status: "—" },
  { id: 68, status: "—" },
  { id: 69, status: "—" },
]

function statusClass(status) {
  if (!status || status === "—" || status === "Unknown") return "status-unknown"
  const s = String(status).toLowerCase()
  if (["ok", "ready", "online", "active", "medic"].includes(s)) return "status-ok"
  if (["advanced", "adv"].includes(s)) return "status-warn"
  if (["ambulance"].includes(s)) return "status-bad"
  if (["unstaffed"].includes(s)) return "status-unstaffed"
  return "status-unknown"
}

function containerClass(status) {
  if (!status) return ""
  const s = String(status).toLowerCase()
  if (s === "medic") return "external-ambulance--medic"
  if (s === "advanced" || s === "adv") return "external-ambulance--advanced"
  if (s === "ambulance") return "external-ambulance--ambulance"
  if (s === "oos") return "external-ambulance--oos"
  if (s === "unstaffed") return "external-ambulance--unstaffed"
  return ""
}

export const InfoBar = ({ items }) => {
  const [externalAmbulanceStatuses, setExternalAmbulanceStatuses] = useState([])

  useEffect(() => {
    const handler = (e) => {
      try {
        const { station, status } = e.detail || {}
        if (!station) return
        setExternalAmbulanceStatuses((prev = []) => {
          const filtered = (prev || []).filter((p) => p.station !== station)
          return [...filtered, { station, status }]
        })
      } catch (err) {
        
      }
    }
    window.addEventListener("externalAmbulanceStatusChanged", handler)
    return () => window.removeEventListener("externalAmbulanceStatusChanged", handler)
  }, [])

  useEffect(() => {
    let mounted = true

    const fetchStatuses = async () => {
      try {
        const { data, error } = await supabase
          .from("info_statuses")
          .select("station, status")
          .in("station", EXTERNAL_AMBULANCES)
        if (error) throw error
        if (!mounted) return
        setExternalAmbulanceStatuses(data || [])
      } catch (e) {
        console.error("Failed to load info statuses:", e)
      }
    }

    fetchStatuses()

    const channel = supabase
      .channel("realtime:info_statuses")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "info_statuses" },
        (payload) => {
          const row = payload.new || payload.old
          if (!row) return
          if (!EXTERNAL_AMBULANCES.includes(row.station)) return
          setExternalAmbulanceStatuses((prev = []) => {
            const filtered = prev.filter((p) => p.station !== row.station)
            if (payload.eventType === "DELETE") return filtered
            return [...filtered, { station: row.station, status: row.status }]
          })
        }
      )
      .subscribe()

    return () => {
      mounted = false
      try {
        supabase.removeChannel(channel)
      } catch (e) {
        
      }
    }
  }, [])

  const externalAmbulanceStatusMap = Object.fromEntries((externalAmbulanceStatuses || []).map((d) => [d.station, d.status]))
  const displayItems = (items && items.length)
    ? items
    : EXTERNAL_AMBULANCES.map((s) => ({ id: s, status: externalAmbulanceStatusMap[s] ?? "Unknown" }))

  return (
    <div className="info-bar">
      <div className="info-bar-inner">
        {displayItems.map((it, idx) => (
          <div className={`external-ambulance ${containerClass(it.status)}`} key={it.id ?? idx}>
            <div className="external-ambulance__box">{it.id}</div>
            <div className="external-ambulance__status">
              <span className={`external-ambulance__label ${statusClass(it.status)}`}>{it.status ?? "Unknown"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default InfoBar
