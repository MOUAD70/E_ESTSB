import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./css/index.css";
import { AuthContextProvider } from "./context/AuthContext.jsx";
import { FlashProvider } from "./context/FlashContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <FlashProvider>
      <AuthContextProvider>
        <App />
      </AuthContextProvider>
    </FlashProvider>
  </StrictMode>
);
