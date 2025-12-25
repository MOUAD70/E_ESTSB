import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";

const Unauthorized = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-extrabold text-black tracking-widest">
          403
        </h1>
        <div className="bg-red-200 px-3 text-sm rounded rotate-12 absolute mt-2 ml-4 text-red-800">
          Unauthorized
        </div>

        <p className="text-gray-600 mt-8 text-lg mb-4">
          You don't have permission to access this page.
        </p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    </div>
  );
};

export default Unauthorized;