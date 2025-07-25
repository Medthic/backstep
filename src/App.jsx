import { BrowserRouter, Routes, Route } from "react-router-dom"
import { TopNavBar } from "./components/TopNavBar"
import { SlidingMessage } from "./components/SlidingMessage"
import { PageCarousel } from "./components/PageCarousel"
import { AssignmentEditPage } from "./components/pages/AssignmentEditPage"
import { AdminPage } from "./components/pages/AdminPage"
import "./App.css"
import CheckInDisplay from "./components/checkindisplay"

function App() {
  return (
    <BrowserRouter basename="/backstep">
      <TopNavBar />
      <Routes>
        <Route
          path="/"
          element={
            <div className="carousel-container">
              <PageCarousel />
            </div>
          }
        />
        <Route
          path="/edit-assignments"
          element={
            <div className="main-content">
              <AssignmentEditPage />
            </div>
          }
        />
        <Route
          path="/admin"
          element={
            <div className="main-content">
              <AdminPage />
            </div>
          }
        />
      </Routes>
      <SlidingMessage />
    </BrowserRouter>
  )
}

export default App
