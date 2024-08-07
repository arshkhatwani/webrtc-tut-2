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

        socket.send(JSON.stringify({ type: "createOffer", offer }));
    };

    const joinMeeting = async () => {
        if (!socket || !pc || !meetingId) return;

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            if (message.type === "createOffer") {
                const offer = message.offer;
                await pc.setRemoteDescription(offer);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.send(
                    JSON.stringify({
                        type: "createAnswer",
                        meetingId,
                        answer,
                    })
                );
            } else if (message.type === "iceCandidate") {
                console.log("ice candidate");
            }
        };

        socket.send(JSON.stringify({ type: "getOffer", meetingId }));
    };

    return (
        <div>
            <div className="mb-4">
                <button onClick={createMeeting}>Create Meeting</button>
                {meetingId && <p>Your meeting id is {meetingId}</p>}
            </div>

            <div className="flex flex-row gap-2">
                <input
                    type="text"
                    value={meetingId}
                    onChange={(e) => setMeetingId(e.target.value.trim())}
                />
                <button onClick={joinMeeting}>Join Meeting</button>
            </div>
        </div>
    );
}

export default App;
