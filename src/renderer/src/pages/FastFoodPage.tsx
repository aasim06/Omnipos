import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/* 
 * FAST FOOD MODULE - COMMENTED OUT FOR NOW
 * To re-enable Fast Food POS in the future:
 * Restore original FastFoodPage component.
 */

export default function FastFoodPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/minimart", { replace: true });
  }, [navigate]);

  return (
    <div className="p-8 text-white font-sans text-xs bg-[#0c0e12] min-h-screen">
      Redirecting to Mini Mart Store Register...
    </div>
  );
}
