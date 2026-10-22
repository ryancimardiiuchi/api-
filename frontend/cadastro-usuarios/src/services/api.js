import axios from "axios";

const api = axios.create({
  // Vite only exposes client-side variables with the VITE_ prefix.
  // Keep a production fallback so a missing Vercel variable does not
  // silently redirect API calls to the frontend domain.
  baseURL:
    import.meta.env.VITE_RENDER_URL || "https://lavomais.onrender.com",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (resposta) => {
    return resposta;
  },
  (erro) => {
    if (erro.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(erro);
  }
);

export default api;
