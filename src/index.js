
import './index.css';
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Game from "./components/Game";
import Homepage from "./components/Homepage";

const root = ReactDOM.createRoot(
  document.getElementById("root")
);
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="Game" element={<Game />} />
    </Routes>
  </BrowserRouter>
  )