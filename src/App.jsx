import { BrowserRouter, Routes, Route } from "react-router-dom"
import { TopNavBar } from "./components/TopNavBar"
import { SlidingMessage } from "./components/SlidingMessage"
import { PageCarousel } from "./components/PageCarousel"
import { AssignmentEditPage } from "./components/pages/AssignmentEditPage"
import "./App.css"

function App() {
  return (
    <BrowserRouter>
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
        <Route path="/edit-assignments" element={<AssignmentEditPage />} />
      </Routes>
      <SlidingMessage />
    </BrowserRouter>
  )
}

export default App
