import { useState } from "react"
import { Link } from "react-router-dom"
import "./TopNavBar.css"
import { Clock } from "./Clock"
import { NavMenuButton } from "./NavMenuButton"
import NavDate from "./NavbarDate" // <-- import the date component

export const TopNavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <div className="navbar-left">
            <Clock />
            <NavDate />
          </div>
          <NavMenuButton onToggle={setIsMenuOpen} />
        </div>
      </div>
    </nav>
  )
}
