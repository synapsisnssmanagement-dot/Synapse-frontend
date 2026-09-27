"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "@/utils/config";

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

// Reads the token once on mount; crossing an auth boundary is done with a full
// page reload so this provider re-mounts with the new session.
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    // The backend rejects unauthenticated sockets, so logged-out visitors never connect.
    if (!token) return undefined;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect -- the socket is an external system; it can only be created client-side after mount
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};
