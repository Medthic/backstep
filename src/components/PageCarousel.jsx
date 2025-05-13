import { AssignmentPage } from "./pages/AssignmentPage";
import { CalanderPage } from "./pages/CalanderPage";
import { useState } from "react";
import "./PageCarousel.css";

const pages = [
  <AssignmentPage key="assignment" />, 
  <CalanderPage key="calendar" />
];

export const PageCarousel = () => {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((i) => (i + 1) % pages.length);
  const prev = () => setIndex((i) => (i - 1 + pages.length) % pages.length);

  return (
    <div className="carousel">
      <button onClick={prev}>Prev</button>
      <div className="carousel-content">{pages[index]}</div>
      <button onClick={next}>Next</button>
    </div>
  );
};
