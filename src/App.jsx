import { BrowserRouter } from "react-router-dom"
import { TopNavBar } from "./components/TopNavBar"
import { SlidingMessage } from "./components/SlidingMessage"
import "./App.css"

function App() {
  return (
    <BrowserRouter>
      <TopNavBar />
      <div className="pt-16">{/* ...existing code... */}</div>
      <SlidingMessage />
    </BrowserRouter>
  )
}

export default App
