import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  autoConnect: false,
  auth: (callback) => {
    callback({ token: localStorage.getItem("token") });
  },
});

export default socket;