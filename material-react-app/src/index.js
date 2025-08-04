import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "App";
import { AuthContextProvider } from "context";
import { SocketProvider } from "context/SocketContext/SocketContext";
import './index.css';

// Material Dashboard 2 React Context Provider
import { MaterialUIControllerProvider } from "context";
import "./i18n"; 
const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <BrowserRouter>
    <AuthContextProvider>
      <MaterialUIControllerProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </MaterialUIControllerProvider>
    </AuthContextProvider>
  </BrowserRouter>
);