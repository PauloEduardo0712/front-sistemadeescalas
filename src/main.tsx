import React from "react";
import ReactDOM from "react-dom/client";
import "./legacy";
import "../css/global.css";
import "../css/login.css";
import "../css/admin.css";
import "../css/voluntario.css";
import "../css/responsivo.css";
import { App } from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
