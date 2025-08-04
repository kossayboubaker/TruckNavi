import { useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context";

const GoogleCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get("token");

    if (token) {
      login(token); // Ton context va gérer localStorage + redirection
    } else {
      navigate("/auth/login");
    }
  }, [location.search, login, navigate]);

  return null;
};

export default GoogleCallback;
