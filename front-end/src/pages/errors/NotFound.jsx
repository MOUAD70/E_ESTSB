import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center">
        <h1 className="text-9xl font-extrabold text-black tracking-widest">
          404
        </h1>
        <div className="bg-yellow-400 px-2 text-sm rounded rotate-12 absolute mt-2 ml-4 text-black">
          Not Found
        </div>

        <p className="text-gray-600 mt-8 text-lg mb-4">
          Sorry, the page you're looking for doesn't exist.
        </p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    </div>
  );
};

export default NotFound;
