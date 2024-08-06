import { useEffect, useState } from "react";
import "./App.css";

function App() {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [pc, setPC] = useState<RTCPeerConnection | null>(null);
    const [meetingId, setMeetingId] = useState<string>("");

    useEffect(() => {
        const socket = new WebSocket("ws://localhost:8080");
        const pc = new RTCPeerConnection();
        setSocket(socket);
        setPC(pc);
    }, []);

    const createMeeting = async () => {
        if (!socket || !pc) return;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            if (message.type === "offerCreated") {
                setMeetingId(message.meetingId);
            } else if (message.type === "createAnswer") {
                console.log(message);
            } else if (message.type === "iceCandidate") {
                console.log("ice candidate");
            }
        };

        socket.send(JSON.stringify({ type: "createOffer", sdp: offer }));
    };

    return (
        <>
            <button onClick={createMeeting}>Create Meeting</button>
            {meetingId && <p>Your meeting id is {meetingId}</p>}
        </>
    );
}

export default App;
