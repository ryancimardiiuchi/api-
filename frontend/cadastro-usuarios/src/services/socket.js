import { io } from "socket.io-client";

const socket = io(import.meta.env.RENDER_URL, {
  autoConnect: false,
  auth: (callback) => {
    callback({ token: localStorage.getItem("token") });
  },
});

export default socket;