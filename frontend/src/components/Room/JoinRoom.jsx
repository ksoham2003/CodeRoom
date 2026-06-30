import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useRoom } from "../../context/RoomContext";
import "./Room.css";

const JoinRoom = () => {
	const [username, setUsername] = useState("");
	const [roomCode, setRoomCode] = useState("");
	const [loading, setLoading] = useState(false);
	const { setUsername: setGlobalUsername } = useRoom();
	const navigate = useNavigate();

	const handleJoin = async (e) => {
		e.preventDefault();
		if (!username.trim()) {
			toast.error("Please enter your name");
			return;
		}
		if (!roomCode.trim()) {
			toast.error("Please enter a room code");
			return;
		}

		setLoading(true);
		try {
			await api.post("/rooms/join", {
				roomCode: roomCode.trim().toUpperCase(),
				username: username.trim(),
			});
			setGlobalUsername(username.trim());
			toast.success("Joining room...");
			navigate(`/editor/${roomCode.trim().toUpperCase()}`, {
				state: { username: username.trim(), isCreator: false },
			});
		} catch (err) {
			toast.error(err.message || "Failed to join room");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleJoin} className="room-form">
			<div className="input-group">
				<label htmlFor="join-username">Your Name</label>
				<input
					id="join-username"
					type="text"
					className="input"
					placeholder="e.g. Bob"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					maxLength={30}
					autoComplete="off"
					required
				/>
			</div>

			<div className="input-group">
				<label htmlFor="join-code">Room Code</label>
				<input
					id="join-code"
					type="text"
					className="input input-mono"
					placeholder="A3F9K2"
					value={roomCode}
					onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
					maxLength={6}
					autoComplete="off"
					required
				/>
			</div>

			<button
				type="submit"
				className="btn btn-primary room-form-submit"
				disabled={loading || !username.trim() || !roomCode.trim()}
			>
				{loading ? "Joining..." : "Join Room"}
			</button>
		</form>
	);
};

export default JoinRoom;
