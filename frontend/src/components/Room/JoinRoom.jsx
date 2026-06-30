import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, Hash } from "lucide-react";
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
		<div className="room-form-card glass animate-fadeInUp" style={{ animationDelay: "0.1s" }}>
			<div className="room-form-header">
				<div className="room-form-icon join">
					<LogIn size={20} />
				</div>
				<h2>Join Room</h2>
				<p>Enter a room code to collaborate</p>
			</div>

			<form onSubmit={handleJoin} className="room-form">
				<div className="input-group">
					<label htmlFor="join-username">Your Name</label>
					<input
						id="join-username"
						type="text"
						className="input"
						placeholder="Enter your display name"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						maxLength={30}
						autoComplete="off"
					/>
				</div>

				<div className="input-group">
					<label htmlFor="join-code">
						<Hash size={14} style={{ display: "inline", verticalAlign: "middle" }} />
						Room Code
					</label>
					<input
						id="join-code"
						type="text"
						className="input input-mono"
						placeholder="A3F9K2"
						value={roomCode}
						onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
						maxLength={6}
						autoComplete="off"
					/>
				</div>

				<button
					type="submit"
					className="btn btn-primary btn-lg room-form-submit"
					disabled={loading || !username.trim() || !roomCode.trim()}
				>
					{loading ? (
						<span className="btn-loading">Joining...</span>
					) : (
						<>
							<LogIn size={18} />
							Join Room
						</>
					)}
				</button>
			</form>
		</div>
	);
};

export default JoinRoom;
