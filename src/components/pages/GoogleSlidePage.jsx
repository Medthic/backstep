import React, { useEffect, useState, useRef } from 'react'
import './GoogleSlidePage.css'

const PRESENTATION_ID = '178Ew3mhPWUgj6QwGDJcG_veuyd7hXle-SQj_6D7aQCk'
const API_KEY_FALLBACK = null



function extractPresentationId(url) {
  if (!url) return null
  try {
    const u = new URL(url)

    const path = u.pathname
    const m1 = path.match(/\/d\/([a-zA-Z0-9_-]+)/)
    if (m1 && m1[1]) return m1[1]
    const m2 = path.match(/\/d\/([a-zA-Z0-9_-]+)/)
    if (m2 && m2[1]) return m2[1]
    return null
  } catch (e) {
    return null
  }
}

export function GoogleSlidePage({ src }) {
  const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || API_KEY_FALLBACK
  const [thumbnails, setThumbnails] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [index, setIndex] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    let mounted = true
    async function loadThumbnails() {
      setLoading(true)
      setError(null)
      setThumbnails([])
      const presentationId = PRESENTATION_ID || extractPresentationId(src)
      if (!presentationId || !API_KEY) {
        setLoading(false)
        setError('missing presentation id or API key')
        return
      }

      try {
        const presRes = await fetch(
          `https://slides.googleapis.com/v1/presentations/${presentationId}?key=${API_KEY}`
        )
        if (!presRes.ok) throw new Error(`presentation fetch ${presRes.status}`)
        const pres = await presRes.json()
        const slideIds = (pres.slides || []).map((s) => s.objectId).filter(Boolean)


        const thumbs = await Promise.all(
          slideIds.map(async (id) => {
            try {
              const qs = new URLSearchParams({
                'thumbnailProperties.mimeType': 'PNG',
                'thumbnailProperties.imageSize': 'LARGE',
                key: API_KEY,
              }).toString()
              const url = `https://slides.googleapis.com/v1/presentations/${presentationId}/pages/${encodeURIComponent(
                id
              )}/thumbnail?${qs}`
              const r = await fetch(url)
              if (!r.ok) throw new Error(`thumb ${r.status}`)
              const d = await r.json()
              return d.contentUrl || null
            } catch (e) {
              console.warn('thumb fetch failed', e)
              return null
            }
          })
        )

        if (!mounted) return
        const filtered = thumbs.filter(Boolean)
        if (filtered.length === 0) {
          setError('no thumbnails')
        }
        setThumbnails(filtered)
      } catch (err) {
        console.error(err)
        if (mounted) setError(String(err.message || err))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadThumbnails()

    return () => {
      mounted = false
    }
  }, [src, API_KEY])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (thumbnails.length > 1) {
      intervalRef.current = setInterval(() => {
        setIndex((i) => (i + 1) % thumbnails.length)
      }, 10000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [thumbnails])

  if (!API_KEY) {
    return (
      <div className="google-slide-page">
        <div className="slide-error">Missing Google API key. Set `VITE_GOOGLE_API_KEY` in your environment.</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="google-slide-page">
        <div className="slide-error">Error loading slides: {error}</div>
      </div>
    )
  }

  return (
    <div className="google-slide-page">
      {loading && <div className="slide-loading">Loading slides…</div>}
      {!loading && thumbnails.length > 0 && (
        <img
          className="slide-thumb"
          src={thumbnails[index]}
          alt={`slide ${index + 1}`}
          draggable={false}
        />
      )}
      {!loading && thumbnails.length === 0 && (
        <div className="slide-error">Unable to load slide thumbnails</div>
      )}
    </div>
  )
}

export default GoogleSlidePage
