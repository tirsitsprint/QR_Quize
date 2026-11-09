
import React from "react";
import ReactDOM from "react-dom/client";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import App from "./App.jsx";
import CreatorDashboard from "./CreatorDashboard.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/creator" replace />}
        />

        <Route
          path="/creator"
          element={<CreatorDashboard />}
        />

        <Route
          path="/quiz/:id"
          element={<App />}
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
