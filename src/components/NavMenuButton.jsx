import { useState } from "react"
import { Link } from "react-router-dom"
import "./NavMenuButton.css"

export const NavMenuButton = ({ onToggle }) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleClick = () => {
    setIsOpen(!isOpen)
    onToggle(!isOpen)
  }

  return (
    <div className="nav-menu-container">
      <button
        className={`nav-menu-button ${isOpen ? "open" : ""}`}
        onClick={handleClick}
        aria-label="Toggle menu"
      >
        <span className="line"></span>
        <span className="line"></span>
        <span className="line"></span>
      </button>

      {isOpen && (
        <nav className="nav-menu">
          <Link to="/" onClick={handleClick}>
            Home
          </Link>
          <Link to="/edit-assignments" onClick={handleClick}>
            Assignments
          </Link>
          <Link to="/admin" onClick={handleClick}>
            Admin
          </Link>
        </nav>
      )}
    </div>
  )
}
