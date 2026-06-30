import { useEffect, useRef, useCallback } from "react";
import { useSocket } from "../context/SocketContext";
import { useRoom } from "../context/RoomContext";

/**
 * Hook for managing real-time presence (typing indicators).
 * Emits typing/stop-typing events and listens for others' presence.
 */
const usePresence = () => {
	const { socket } = useSocket();
	const { roomCode, dispatch } = useRoom();
	const typingTimeoutRef = useRef(null);
	const isTypingRef = useRef(false);

	/**
	 * Notify the room that the current user is typing.
	 * Automatically stops after 2 seconds of inactivity.
	 */
	const emitTyping = useCallback(() => {
		if (!socket || !roomCode) return;

		if (!isTypingRef.current) {
			isTypingRef.current = true;
			socket.emit("presence:typing", { roomCode });
		}

		// Reset the stop-typing timer
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current);
		}

		typingTimeoutRef.current = setTimeout(() => {
			isTypingRef.current = false;
			socket.emit("presence:stop-typing", { roomCode });
		}, 2000);
	}, [socket, roomCode]);

	/**
	 * Listen for typing/stop-typing events from other users.
	 */
	useEffect(() => {
		if (!socket) return;

		const handleTyping = ({ socketId, username }) => {
			dispatch({
				type: "ADD_TYPING_USER",
				payload: { socketId, username },
			});
		};

		const handleStopTyping = ({ socketId }) => {
			dispatch({
				type: "REMOVE_TYPING_USER",
				payload: { socketId },
			});
		};

		socket.on("presence:typing", handleTyping);
		socket.on("presence:stop-typing", handleStopTyping);

		return () => {
			socket.off("presence:typing", handleTyping);
			socket.off("presence:stop-typing", handleStopTyping);

			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}
		};
	}, [socket, dispatch]);

	return { emitTyping };
};

export default usePresence;
