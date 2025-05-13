import { useState, useEffect, useRef } from "react"
import { AssignmentPage } from "./Pages/AssignmentPage"
import { CalanderPage } from "./pages/CalanderPage"
import "./PageCarousel.css"

const pages = [
  <AssignmentPage key="assignment" />,
  <CalanderPage key="calendar" />,
]

export const PageCarousel = () => {
  const [index, setIndex] = useState(0)
  const [sliding, setSliding] = useState(false)
  const [direction, setDirection] = useState("right")
  const timeoutRef = useRef(null)

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setDirection("right")
      setSliding(true)
      setTimeout(() => {
        setIndex((i) => (i + 1) % pages.length)
        setSliding(false)
      }, 500) // match CSS transition duration
    }, 30000)
    return () => clearTimeout(timeoutRef.current)
  }, [index])

  return (
    <div className="carousel">
      <div className={`carousel-content slide-${sliding ? direction : "none"}`}>
        {pages[index]}
      </div>
    </div>
  )
}
