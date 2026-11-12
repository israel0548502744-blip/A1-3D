import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/rubik"; // bundled, works offline inside the APK
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
