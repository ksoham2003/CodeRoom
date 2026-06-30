import { Code2, Wifi, WifiOff } from "lucide-react";
import { useSocket } from "../../context/SocketContext";
import { useRoom } from "../../context/RoomContext";
import "./common.css";

const Navbar = () => {
	const { isConnected } = useSocket();
	const { isInRoom, roomCode, roomName } = useRoom();

	return (
		<nav className="navbar glass-strong">
			<div className="navbar-brand">
				<div className="navbar-logo">
					<Code2 size={22} />
				</div>
				<span className="navbar-title">CodeRoom</span>
				{isInRoom && (
					<div className="navbar-room-info animate-fadeIn">
						<span className="navbar-separator">/</span>
						<span className="navbar-room-name">{roomName}</span>
						<span className="navbar-room-code">{roomCode}</span>
					</div>
				)}
			</div>

			<div className="navbar-status">
				<div
					className={`connection-badge ${isConnected ? "connected" : "disconnected"}`}
				>
					{isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
					<span>{isConnected ? "Connected" : "Disconnected"}</span>
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
