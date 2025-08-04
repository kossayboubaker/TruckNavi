import HttpService from "./htttp.service";
import axios from "axios";

class AuthService {
  // authEndpoint = process.env.API_URL;
  
  login = async (payload) => {
    const loginEndpoint = 'login';
    return await HttpService.post(loginEndpoint, payload);
  };

  register = async (credentials) => {
    const registerEndpoint = 'register';
    return await HttpService.post(registerEndpoint, credentials);
  };

  logout = async () => {
  return await axios.get("http://localhost:8080/user/logout", {
    withCredentials: true, // IMPORTANT pour que les cookies soient envoyés
  });
};


  forgotPassword = async (payload) => {
    const forgotPassword = 'password-forgot';
    return await HttpService.post(forgotPassword, payload);
  }

  resetPassword = async (credentials) => {
    const resetPassword = 'password-reset';
    return await HttpService.post(resetPassword, credentials);
  }
 // User Profile Methods
 getProfile = async () => {
  const getProfileEndpoint = 'admin/me'; // For regular user
  return await HttpService.get(getProfileEndpoint);
};

updateProfile = async (newInfo) => {
  const updateProfileEndpoint = 'me'; // For regular user
  return await HttpService.patch(updateProfileEndpoint, newInfo);
};

// Admin Profile Methods
getAdminProfile = async () => {
  const getProfileEndpoint = 'admin/me'; // For admin profile
  return await HttpService.get(getProfileEndpoint);
};

updateAdminProfile = async (newInfo) => {
  const updateProfileEndpoint = 'admin/update-profile'; // For admin profile
  return await HttpService.put(updateProfileEndpoint, newInfo);
};
}

export default new AuthService();
