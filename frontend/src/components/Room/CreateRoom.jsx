import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
			toast.success(`Room created!`);
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
		<form onSubmit={handleCreate} className="room-form">
			<div className="input-group">
				<label htmlFor="create-username">Your Name</label>
				<input
					id="create-username"
					type="text"
					className="input"
					placeholder="e.g. Alice"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					maxLength={30}
					autoComplete="off"
					required
				/>
			</div>

			<button
				type="submit"
				className="btn btn-primary room-form-submit"
				disabled={loading || !username.trim()}
			>
				{loading ? "Creating..." : "Create Room"}
			</button>
		</form>
	);
};

export default CreateRoom;
