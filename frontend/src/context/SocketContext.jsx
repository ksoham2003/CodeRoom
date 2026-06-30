import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const SocketProvider = ({ children }) => {
	const [isConnected, setIsConnected] = useState(false);
	const socketRef = useRef(null);

	useEffect(() => {
		const socket = io(SOCKET_URL, {
			transports: ["websocket", "polling"],
			reconnection: true,
			reconnectionAttempts: 10,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000,
		});

		socketRef.current = socket;

		socket.on("connect", () => {
			console.log("[Socket] Connected:", socket.id);
			setIsConnected(true);
		});

		socket.on("disconnect", (reason) => {
			console.log("[Socket] Disconnected:", reason);
			setIsConnected(false);
		});

		socket.on("connect_error", (err) => {
			console.error("[Socket] Connection error:", err.message);
			setIsConnected(false);
		});

		return () => {
			socket.disconnect();
			socketRef.current = null;
		};
	}, []);

	const value = {
		socket: socketRef.current,
		isConnected,
	};

	return (
		<SocketContext.Provider value={value}>
			{children}
		</SocketContext.Provider>
	);
};

export const useSocket = () => {
	const context = useContext(SocketContext);
	if (!context) {
		throw new Error("useSocket must be used within a SocketProvider");
	}
	return context;
};

export default SocketContext;
