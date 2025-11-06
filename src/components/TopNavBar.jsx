import { useState } from "react"
import { Link } from "react-router-dom"
import "./TopNavBar.css"
import { Clock } from "./Clock"
import { NavMenuButton } from "./NavMenuButton"
import NavDate from "./NavbarDate" // <-- import the date component

export const TopNavBar = () => {
  // menu open state kept but prefixed to avoid unused-var lint error until menu is implemented
  const [_isMenuOpen, _setIsMenuOpen] = useState(false)

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <div className="navbar-left">
            <Clock />
            <NavDate />
          </div>
          <NavMenuButton onToggle={_setIsMenuOpen} />
        </div>
      </div>
    </nav>
  )
}
