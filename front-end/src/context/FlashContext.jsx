import { createContext, useContext, useState } from "react";
import FlashMessage from "../components/shared/global/FlashMessage";

const FlashContext = createContext();

export function FlashProvider({ children }) {
  const [message, setMessage] = useState(null);

  const flash = (msg, type = "success", duration = 4000) => {
    setMessage({ msg, type, duration });
  };

  const clearFlash = () => {
    setMessage(null);
  };

  return (
    <FlashContext.Provider value={{ flash, clearFlash }}>
      {children}
      <FlashMessage message={message} onDismiss={clearFlash} />
    </FlashContext.Provider>
  );
}

export function useFlash() {
  return useContext(FlashContext);
}