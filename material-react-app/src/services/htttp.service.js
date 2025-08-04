import Axios from "axios";

const API_URL = "http://localhost:8080";

class HttpService {
  constructor() {
    this._axios = Axios.create({
      baseURL: API_URL,
      withCredentials: true, // Allow cookies to be sent
      headers: {
        "Content-Type": "application/vnd.api+json",
        "Accept": "application/vnd.api+json",
      },
    });

    this.addInterceptors();
  }

  // Add request interceptor
  addRequestInterceptor(onSuccess, onError) {
    return this._axios.interceptors.request.use(onSuccess, onError);
  }

  // Add response interceptor
  addResponseInterceptor(onSuccess, onError) {
    return this._axios.interceptors.response.use(onSuccess, onError);
  }

  addInterceptors() {
    this.addRequestInterceptor(
      (config) => {
        const token = localStorage.getItem("authToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`; // Attach token to header
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.addResponseInterceptor(
      (response) => response,
      (error) => {
        console.error("Axios response error:", error.response?.data || error.message);
        return Promise.reject(error.response?.data || error.message);
      }
    );
  }

  get = async (url) => await this.request({ method: "get", url });
  post = async (url, data) => await this.request({ method: "post", url, data });
  put = async (url, data) => await this.request({ method: "put", url, data });
  patch = async (url, data) => await this.request({ method: "patch", url, data });
  delete = async (url) => await this.request({ method: "delete", url });

  async request(options) {
    try {
      const response = await this._axios.request(options);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new HttpService();
