import { useEffect, useCallback } from "react";
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

	const username = location.state?.username || "Anonymous";

	/**
	 * Join socket room on mount.
	 */
	useEffect(() => {
		if (!socket || !isConnected || !roomCode) return;

		// Emit join event
		socket.emit("room:join", { roomCode, username });

		// Listen for room joined confirmation
		const handleJoined = (data) => {
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

		const handleDelta = (data) => {
			dispatch({
				type: "UPDATE_DOCUMENT",
				payload: {
					content: null, // Will be handled by CodeEditor via applyRemoteDelta
					version: data.version,
				},
			});
			// Apply the remote delta directly
			const { delta, version } = data;
			let content = document.content;
			const { type, position, content: deltaContent } = delta;
			const clampedPos = Math.max(0, Math.min(position, content.length));

			if (type === "insert") {
				content =
					content.slice(0, clampedPos) + deltaContent + content.slice(clampedPos);
			} else if (type === "delete") {
				const deleteEnd = Math.min(clampedPos + deltaContent.length, content.length);
				content = content.slice(0, clampedPos) + content.slice(deleteEnd);
			}

			dispatch({
				type: "UPDATE_DOCUMENT",
				payload: { content, version },
			});
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
			socket.off("doc:delta", handleDelta);
			socket.off("doc:ack", handleAck);
			socket.off("doc:full-sync", handleFullSync);
		};
	}, [socket, isConnected, roomCode]);

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
