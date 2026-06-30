import { useCallback, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { useRoom } from "../context/RoomContext";

/**
 * Hook for capturing and applying document deltas.
 *
 * Captures textarea input events and converts them to position-based deltas:
 *   { type: 'insert'|'delete', position, content, timestamp, baseVersion }
 *
 * Also listens for remote deltas and applies them to the local document.
 */
const useDelta = () => {
	const { socket } = useSocket();
	const { roomCode, document, dispatch } = useRoom();
	const contentRef = useRef(document.content);
	const versionRef = useRef(document.version);

	// Keep refs in sync with state
	contentRef.current = document.content;
	versionRef.current = document.version;

	/**
	 * Handle local text input — compute delta from before/after state.
	 * Called by CodeEditor on every input event.
	 */
	const handleLocalChange = useCallback(
		(newContent, selectionStart, prevContent, prevSelectionStart) => {
			if (!socket || !roomCode) return;

			const oldLen = prevContent.length;
			const newLen = newContent.length;

			let delta = null;

			if (newLen > oldLen) {
				// INSERT operation
				const insertLen = newLen - oldLen;
				const position = prevSelectionStart;
				const insertedContent = newContent.slice(
					position,
					position + insertLen,
				);

				delta = {
					type: "insert",
					position,
					content: insertedContent,
					timestamp: Date.now(),
					baseVersion: versionRef.current,
				};
			} else if (newLen < oldLen) {
				// DELETE operation
				const deleteLen = oldLen - newLen;
				const position = selectionStart;
				const deletedContent = prevContent.slice(
					position,
					position + deleteLen,
				);

				delta = {
					type: "delete",
					position,
					content: deletedContent,
					timestamp: Date.now(),
					baseVersion: versionRef.current,
				};
			}

			if (delta) {
				// Update local state immediately
				dispatch({
					type: "UPDATE_DOCUMENT",
					payload: { content: newContent, version: versionRef.current },
				});

				// Send delta to server
				socket.emit("doc:delta", { roomCode, delta });
			}
		},
		[socket, roomCode, dispatch],
	);

	/**
	 * Apply a remote delta to local document content.
	 */
	const applyRemoteDelta = useCallback(
		(delta, version) => {
			let content = contentRef.current;
			const { type, position, content: deltaContent } = delta;

			const clampedPos = Math.max(0, Math.min(position, content.length));

			if (type === "insert") {
				content =
					content.slice(0, clampedPos) +
					deltaContent +
					content.slice(clampedPos);
			} else if (type === "delete") {
				const deleteEnd = Math.min(
					clampedPos + deltaContent.length,
					content.length,
				);
				content = content.slice(0, clampedPos) + content.slice(deleteEnd);
			}

			dispatch({
				type: "UPDATE_DOCUMENT",
				payload: { content, version },
			});
		},
		[dispatch],
	);

	return {
		handleLocalChange,
		applyRemoteDelta,
	};
};

export default useDelta;
