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

    const getCameraStreamAndSend = (pc: RTCPeerConnection) => {
        navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
            const video = document.createElement("video");
            video.srcObject = stream;
            video.play();

            document.getElementById("own-video")?.appendChild(video);
            stream.getTracks().forEach((track) => {
                console.log("Sending track:", track);
                pc.addTrack(track);
            });
        });
    };

    const createMeeting = async () => {
        if (!socket || !pc) return;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            if (message.type === "offerCreated") {
                setMeetingId(message.meetingId);

                pc.onicecandidate = (event) => {
                    if (!event.candidate) return;
                    console.log("ice candidate");
                    socket.send(
                        JSON.stringify({
                            type: "iceCandidate",
                            meetingId: message.meetingId,
                            iceCandidate: event.candidate,
                            from: "sender",
                        })
                    );
                };

                pc.onnegotiationneeded = async () => {
                    console.log("negotation neeeded");
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.send(
                        JSON.stringify({
                            type: "negotationOffer",
                            offer,
                            meetingId: message.meetingId,
                        })
                    );
                };
            } else if (message.type === "createAnswer") {
                console.log("Received answer", message.answer);
                const answer = message.answer;
                await pc.setRemoteDescription(answer);
            } else if (
                message.type === "iceCandidate" &&
                message.iceCandidate
            ) {
                if (pc.remoteDescription)
                    await pc.addIceCandidate(message.iceCandidate);
            }
        };

        socket.send(JSON.stringify({ type: "createOffer", offer }));

        getCameraStreamAndSend(pc);

        pc.ontrack = (event) => {
            console.log(event);
            const video = document.createElement("video");
            document.getElementById("received-video")?.appendChild(video);
            video.srcObject = new MediaStream([event.track]);
            video.muted = true;
            video.play();
        };
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

                pc.onicecandidate = (event) => {
                    if (!event.candidate) return;
                    console.log("ice candidate");
                    socket.send(
                        JSON.stringify({
                            type: "iceCandidate",
                            meetingId,
                            iceCandidate: event.candidate,
                            from: "receiver",
                        })
                    );
                };
            } else if (
                message.type === "iceCandidate" &&
                message.iceCandidate
            ) {
                if (pc.remoteDescription)
                    await pc.addIceCandidate(message.iceCandidate);
            }
        };

        socket.send(JSON.stringify({ type: "getOffer", meetingId }));
        pc.ontrack = (event) => {
            console.log(event);
            const video = document.createElement("video");
            document.getElementById("received-video")?.appendChild(video);
            video.srcObject = new MediaStream([event.track]);
            video.muted = true;
            video.play();
        };

        getCameraStreamAndSend(pc);
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

            <div className="flex flex-row justify-between gap-2">
                <div id="own-video">
                    <h1 className="text-2xl">Your video</h1>
                </div>
                <div id="received-video">
                    <h1 className="text-2xl">Received video</h1>
                </div>
            </div>
        </div>
    );
}

export default App;
