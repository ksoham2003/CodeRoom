import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowRight, Sparkles, Users, Zap, Shield } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useRoom } from "../../context/RoomContext";
import "./Room.css";

const CreateRoom = () => {
	const [username, setUsername] = useState("");
	const [loading, setLoading] = useState(false);
	const { setUsername: setGlobalUsername } = useRoom();
	const navigate = useNavigate();

	const handleCreate = async (e) => {
		e.preventDefault();
		if (!username.trim()) {
			toast.error("Please enter your name");
			return;
		}

		setLoading(true);
		try {
			const res = await api.post("/rooms", { username: username.trim() });
			setGlobalUsername(username.trim());
			toast.success(`Room created! Code: ${res.data.roomCode}`);
			navigate(`/editor/${res.data.roomCode}`, {
				state: { username: username.trim(), isCreator: true },
			});
		} catch (err) {
			toast.error(err.message || "Failed to create room");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="room-form-card glass animate-fadeInUp">
			<div className="room-form-header">
				<div className="room-form-icon create">
					<Plus size={20} />
				</div>
				<h2>Create Room</h2>
				<p>Start a new collaborative coding session</p>
			</div>

			<form onSubmit={handleCreate} className="room-form">
				<div className="input-group">
					<label htmlFor="create-username">Your Name</label>
					<input
						id="create-username"
						type="text"
						className="input"
						placeholder="Enter your display name"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						maxLength={30}
						autoComplete="off"
					/>
				</div>

				<button
					type="submit"
					className="btn btn-primary btn-lg room-form-submit"
					disabled={loading || !username.trim()}
				>
					{loading ? (
						<span className="btn-loading">Creating...</span>
					) : (
						<>
							<Sparkles size={18} />
							Create Room
						</>
					)}
				</button>
			</form>

			<div className="room-form-features">
				<div className="feature-item">
					<Users size={14} />
					<span>Invite up to 10 collaborators</span>
				</div>
				<div className="feature-item">
					<Zap size={14} />
					<span>Real-time delta sync</span>
				</div>
				<div className="feature-item">
					<Shield size={14} />
					<span>Host controls & room management</span>
				</div>
			</div>
		</div>
	);
};

export default CreateRoom;
