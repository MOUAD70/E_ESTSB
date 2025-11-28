import NavBar from "../components/NavBar";
import { BackgroundRippleEffect } from "../components/ui/aceternity/background-ripple-effect";

const GlobalLayout = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <BackgroundRippleEffect className="fixed inset-0 -z-10" />

      <div className="relative z-10">
        <NavBar />
      </div>
    </div>
  );
};

export default GlobalLayout;
