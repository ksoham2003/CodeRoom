import { useState } from "react";
import { Lock, Unlock, UserMinus, Edit3, Crown } from "lucide-react";
import { useSocket } from "../../context/SocketContext";
import { useRoom } from "../../context/RoomContext";
import toast from "react-hot-toast";
import "./HostControls.css";

const HostControls = () => {
	const { socket } = useSocket();
	const { isHost, roomCode, roomName, isLocked, participants } = useRoom();
	const [editingName, setEditingName] = useState(false);
	const [newName, setNewName] = useState(roomName);

	if (!isHost) return null;

	const handleRename = () => {
		if (editingName && newName.trim() && newName !== roomName) {
			socket.emit("room:rename", { roomCode, newName: newName.trim() });
			toast.success("Room renamed");
		}
		setEditingName(!editingName);
	};

	const handleToggleLock = () => {
		socket.emit("room:toggle-lock", { roomCode });
		toast.success(isLocked ? "Room unlocked" : "Room locked");
	};

	const handleKick = (targetSocketId, username) => {
		if (window.confirm(`Remove ${username} from the room?`)) {
			socket.emit("room:kick", { roomCode, targetSocketId });
			toast.success(`${username} removed from room`);
		}
	};

	const kickableParticipants = participants.filter(
		(p) => p.socketId !== socket?.id,
	);

	return (
		<div className="host-controls">
			<div className="host-controls-header">
				<Crown size={14} />
				<span>Host Controls</span>
			</div>

			<div className="host-controls-actions">
				{/* Rename Room */}
				<div className="host-action-group">
					{editingName ? (
						<div className="rename-input-group">
							<input
								type="text"
								className="input"
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								maxLength={100}
								autoFocus
								onKeyDown={(e) => e.key === "Enter" && handleRename()}
							/>
							<button className="btn btn-sm btn-primary" onClick={handleRename}>
								Save
							</button>
						</div>
					) : (
						<button className="btn btn-sm btn-secondary" onClick={handleRename}>
							<Edit3 size={14} />
							Rename Room
						</button>
					)}
				</div>

				{/* Lock/Unlock Room */}
				<button
					className={`btn btn-sm ${isLocked ? "btn-danger" : "btn-secondary"}`}
					onClick={handleToggleLock}
				>
					{isLocked ? <Unlock size={14} /> : <Lock size={14} />}
					{isLocked ? "Unlock Room" : "Lock Room"}
				</button>

				{/* Kick Participants */}
				{kickableParticipants.length > 0 && (
					<div className="kick-section">
						<span className="kick-label">Remove Participant</span>
						{kickableParticipants.map((p) => (
							<button
								key={p.socketId}
								className="btn btn-sm btn-danger kick-btn"
								onClick={() => handleKick(p.socketId, p.username)}
							>
								<UserMinus size={14} />
								{p.username}
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default HostControls;
