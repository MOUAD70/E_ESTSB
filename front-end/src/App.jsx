import { RouterProvider } from "react-router-dom";
import { router } from "./routes/Router";

function App() {
  return <div className="font-Kedebideri"><RouterProvider router={router} /></div>;
}

export default App;
