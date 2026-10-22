import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_RENDER_URL,
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