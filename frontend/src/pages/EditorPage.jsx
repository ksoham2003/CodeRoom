import { useEffect, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Copy, LogOut, FileCode2 } from "lucide-react";
import toast from "react-hot-toast";
import { useSocket } from "../context/SocketContext";
import { useRoom } from "../context/RoomContext";
import CodeEditor from "../components/Editor/CodeEditor";
import ParticipantList from "../components/Presence/ParticipantList";
import TypingIndicator from "../components/Presence/TypingIndicator";
import HostControls from "../components/Host/HostControls";
import "./EditorPage.css";

const EditorPage = () => {
	const { roomCode } = useParams();
	const location = useLocation();
	const navigate = useNavigate();
	const { socket, isConnected } = useSocket();
	const { isInRoom, document, joinRoom, leaveRoom, dispatch } = useRoom();

	// Keep a stable ref to username so it's accessible in callbacks without re-running effects
	const username = location.state?.username || "Anonymous";
	const usernameRef = useRef(username);
	usernameRef.current = username;

	// Track whether we've already successfully joined so we don't re-emit on reconnect
	const hasJoinedRef = useRef(false);

	/**
	 * Emit room:join whenever socket connects (or reconnects) and we haven't joined yet.
	 * This handles both:
	 *   1. First connection (normal flow)
	 *   2. Socket disconnect + reconnect during cold-start latency on Render
	 */
	useEffect(() => {
		if (!socket) return;

		const emitJoin = () => {
			if (!hasJoinedRef.current) {
				console.log("[EditorPage] Emitting room:join for", roomCode);
				socket.emit("room:join", { roomCode, username: usernameRef.current });
			}
		};

		// Emit now if already connected
		if (socket.connected) {
			emitJoin();
		}

		// Also re-emit on every reconnect in case the socket dropped during cold start
		socket.on("connect", emitJoin);

		return () => {
			socket.off("connect", emitJoin);
		};
	}, [socket, roomCode]);

	/**
	 * Register all room/document event handlers.
	 */
	useEffect(() => {
		if (!socket) return;

		const handleJoined = (data) => {
			hasJoinedRef.current = true;
			joinRoom({
				roomCode: data.roomCode,
				roomName: data.roomName,
				isHost: data.isHost,
				hostId: data.hostId,
				isLocked: data.isLocked,
				participants: data.participants,
				document: data.document,
			});
		};

		const handleError = (data) => {
			toast.error(data.message);
			navigate("/");
		};

		const handleParticipantJoined = (data) => {
			dispatch({ type: "PARTICIPANT_JOINED", payload: data });
			toast.success(`${data.username} joined the room`, { duration: 2000 });
		};

		const handleParticipantLeft = (data) => {
			dispatch({ type: "PARTICIPANT_LEFT", payload: data });
			toast(`${data.username} ${data.reason === "kicked" ? "was removed" : "left the room"}`, {
				icon: "👋",
				duration: 2000,
			});
		};

		const handleHostChanged = (data) => {
			dispatch({
				type: "HOST_CHANGED",
				payload: {
					newHostId: data.newHostId,
					isCurrentUser: data.newHostId === socket.id,
				},
			});
			if (data.newHostId === socket.id) {
				toast.success("You are now the host!", { icon: "👑" });
			}
		};

		const handleRenamed = (data) => {
			dispatch({ type: "ROOM_RENAMED", payload: data });
			toast.success(`Room renamed to "${data.roomName}"`);
		};

		const handleLockToggled = (data) => {
			dispatch({ type: "ROOM_LOCK_TOGGLED", payload: data });
			toast.success(data.isLocked ? "Room locked" : "Room unlocked", {
				icon: data.isLocked ? "🔒" : "🔓",
			});
		};

		const handleKicked = () => {
			toast.error("You were removed from the room by the host");
			leaveRoom();
			navigate("/");
		};

		const handleClosed = (data) => {
			toast.error(data.message || "The host has left. This room is now closed.", { duration: 4000 });
			leaveRoom();
			navigate("/");
		};

		const handleDelta = (data) => {
			dispatch({
				type: "UPDATE_DOCUMENT",
				payload: {
					content: null,
					version: data.version,
				},
			});
			const { delta, version } = data;
			let content = document.content;
			const { type, position, content: deltaContent } = delta;
			const clampedPos = Math.max(0, Math.min(position, content.length));

			if (type === "insert") {
				content = content.slice(0, clampedPos) + deltaContent + content.slice(clampedPos);
			} else if (type === "delete") {
				const deleteEnd = Math.min(clampedPos + deltaContent.length, content.length);
				content = content.slice(0, clampedPos) + content.slice(deleteEnd);
			}

			dispatch({ type: "UPDATE_DOCUMENT", payload: { content, version } });
		};

		const handleAck = (data) => {
			dispatch({ type: "UPDATE_VERSION", payload: data.version });
		};

		const handleFullSync = (data) => {
			dispatch({
				type: "UPDATE_DOCUMENT",
				payload: { content: data.content, version: data.version },
			});
		};

		socket.on("room:joined", handleJoined);
		socket.on("room:error", handleError);
		socket.on("room:participant-joined", handleParticipantJoined);
		socket.on("room:participant-left", handleParticipantLeft);
		socket.on("room:host-changed", handleHostChanged);
		socket.on("room:renamed", handleRenamed);
		socket.on("room:lock-toggled", handleLockToggled);
		socket.on("room:kicked", handleKicked);
		socket.on("room:closed", handleClosed);
		socket.on("doc:delta", handleDelta);
		socket.on("doc:ack", handleAck);
		socket.on("doc:full-sync", handleFullSync);

		return () => {
			socket.off("room:joined", handleJoined);
			socket.off("room:error", handleError);
			socket.off("room:participant-joined", handleParticipantJoined);
			socket.off("room:participant-left", handleParticipantLeft);
			socket.off("room:host-changed", handleHostChanged);
			socket.off("room:renamed", handleRenamed);
			socket.off("room:lock-toggled", handleLockToggled);
			socket.off("room:kicked", handleKicked);
			socket.off("room:closed", handleClosed);
			socket.off("doc:delta", handleDelta);
			socket.off("doc:ack", handleAck);
			socket.off("doc:full-sync", handleFullSync);
		};
	}, [socket, dispatch, joinRoom, leaveRoom, navigate, document.content]);

	/**
	 * Copy room code to clipboard.
	 */
	const handleCopyCode = useCallback(() => {
		navigator.clipboard.writeText(roomCode);
		toast.success("Room code copied!", { duration: 1500 });
	}, [roomCode]);

	/**
	 * Leave the room.
	 */
	const handleLeave = useCallback(() => {
		leaveRoom();
		navigate("/");
	}, [leaveRoom, navigate]);

	// Loading state
	if (!isInRoom) {
		return (
			<div className="editor-page-loading">
				<div className="loading-spinner" />
				<p>Connecting to room <strong>{roomCode}</strong>...</p>
				<p className="loading-hint">
					{!isConnected
						? "Waiting for server connection..."
						: "Joining room..."}
				</p>
			</div>
		);
	}

	return (
		<div className="editor-page">
			{/* Sidebar */}
			<aside className="editor-sidebar glass-strong">
				<div className="sidebar-room-info">
					<div className="sidebar-room-code" onClick={handleCopyCode} title="Click to copy">
						<FileCode2 size={14} />
						<span className="room-code-text">{roomCode}</span>
						<Copy size={12} className="copy-icon" />
					</div>
				</div>

				<ParticipantList />
				<HostControls />

				<div className="sidebar-footer">
					<TypingIndicator />
					<button className="btn btn-sm btn-danger sidebar-leave" onClick={handleLeave}>
						<LogOut size={14} />
						Leave Room
					</button>
				</div>
			</aside>

			{/* Main editor area */}
			<main className="editor-main">
				<CodeEditor />

				<div className="editor-status-bar">
					<div className="editor-status-left">
						<div className="status-item">
							<span className={`status-dot ${isConnected ? "" : "syncing"}`} />
							<span>{isConnected ? "Synced" : "Reconnecting..."}</span>
						</div>
						<span className="status-item">v{document.version}</span>
					</div>
					<div className="editor-status-right">
						<span className="status-item">
							{(document.content || "").split("\n").length} lines
						</span>
						<span className="status-item">
							{(document.content || "").length} chars
						</span>
					</div>
				</div>
			</main>
		</div>
	);
};

export default EditorPage;
