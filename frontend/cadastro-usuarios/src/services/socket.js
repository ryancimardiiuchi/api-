import { io } from "socket.io-client";

const socket = io(
  import.meta.env.VITE_RENDER_URL || "https://lavomais.onrender.com",
  {
    // The chat service is imported by authenticated screens. Start the
    // Socket.IO handshake automatically when the service is loaded.
    autoConnect: true,
    auth: (callback) => {
      callback({ token: localStorage.getItem("token") });
    },
  },
);

export default socket;
