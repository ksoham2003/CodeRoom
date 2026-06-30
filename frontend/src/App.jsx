import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "./context/SocketContext";
import { RoomProvider } from "./context/RoomContext";
import Navbar from "./components/common/Navbar";
import HomePage from "./pages/HomePage";
import EditorPage from "./pages/EditorPage";
import NotFoundPage from "./pages/NotFoundPage";
import "./App.css";

function App() {
	return (
		<BrowserRouter>
			<SocketProvider>
				<RoomProvider>
					<Navbar />
					<Routes>
						<Route path="/" element={<HomePage />} />
						<Route path="/editor/:roomCode" element={<EditorPage />} />
						<Route path="*" element={<NotFoundPage />} />
					</Routes>
					<Toaster
						position="bottom-right"
						toastOptions={{
							duration: 3000,
							style: {
								background: "#1a2332",
								color: "#f1f5f9",
								border: "1px solid rgba(148, 163, 184, 0.1)",
								borderRadius: "0.5rem",
								fontSize: "0.875rem",
								fontFamily: "'Inter', sans-serif",
								boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
							},
							success: {
								iconTheme: {
									primary: "#34d399",
									secondary: "#1a2332",
								},
							},
							error: {
								iconTheme: {
									primary: "#f87171",
									secondary: "#1a2332",
								},
							},
						}}
					/>
				</RoomProvider>
			</SocketProvider>
		</BrowserRouter>
	);
}

export default App;
