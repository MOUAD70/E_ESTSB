import { createContext, useContext, useState, useEffect } from "react";
import FlashMessage from "../components/shared/global/FlashMessage";

const FlashContext = createContext();

export function FlashProvider({ children }) {
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const flash = (msg, type = "success") => {
    setMessage({ msg, type });
  };

  return (
    <FlashContext.Provider value={{ flash }}>
      {children}
      <FlashMessage message={message} />
    </FlashContext.Provider>
  );
}

export function useFlash() {
  return useContext(FlashContext);
}