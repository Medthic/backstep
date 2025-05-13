import { BrowserRouter } from "react-router-dom"
import { TopNavBar } from "./components/TopNavBar"
import { SlidingMessage } from "./components/SlidingMessage"
import { PageCarousel } from "./components/PageCarousel" // You'll create this
import "./App.css"

function App() {
  return (
    <BrowserRouter>
      <TopNavBar />
      <div className="carousel-container">
        <PageCarousel />
      </div>
      <SlidingMessage />
    </BrowserRouter>
  )
}

export default App
