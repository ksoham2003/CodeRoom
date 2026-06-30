import { Link } from "react-router-dom";
import { Home, AlertTriangle } from "lucide-react";

const NotFoundPage = () => {
	return (
		<div
			style={{
				flex: 1,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: "1.5rem",
				textAlign: "center",
				padding: "2rem",
			}}
		>
			<AlertTriangle size={48} style={{ color: "var(--warning)", opacity: 0.7 }} />
			<h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800 }}>404</h1>
			<p style={{ color: "var(--text-secondary)", maxWidth: "400px" }}>
				The page you're looking for doesn't exist. Maybe the room code was wrong?
			</p>
			<Link to="/" className="btn btn-primary btn-lg" style={{ marginTop: "0.5rem" }}>
				<Home size={18} />
				Back to Home
			</Link>
		</div>
	);
};

export default NotFoundPage;
