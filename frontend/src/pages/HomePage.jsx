import { useState, useEffect } from "react";
import CreateRoom from "../components/Room/CreateRoom";
import JoinRoom from "../components/Room/JoinRoom";
import { useRoom } from "../context/RoomContext";
import { useSocket } from "../context/SocketContext";
import "./HomePage.css";

const HomePage = () => {
	const [activeTab, setActiveTab] = useState("join");
	const { socket } = useSocket();
	const { roomCode, leaveRoom } = useRoom();

	useEffect(() => {
		if (roomCode && socket) {
			socket.emit("room:leave", { roomCode });
		}
		leaveRoom();
	}, [roomCode, socket, leaveRoom]);

	return (
		<div className="home-page">
			<div className="hero-section">
				<h1 className="hero-title">
					CodeRoom
				</h1>
				<p className="hero-subtitle">
					Simple real-time collaborative code editor.
				</p>
			</div>

			<div className="home-card-container">
				<div className="tabs-header">
					<button
						className={`tab-btn ${activeTab === "join" ? "active" : ""}`}
						onClick={() => setActiveTab("join")}
					>
						Join Room
					</button>
					<button
						className={`tab-btn ${activeTab === "create" ? "active" : ""}`}
						onClick={() => setActiveTab("create")}
					>
						Create Room
					</button>
				</div>

				<div className="tab-content">
					{activeTab === "join" ? <JoinRoom /> : <CreateRoom />}
				</div>
			</div>
		</div>
	);
};

export default HomePage;
