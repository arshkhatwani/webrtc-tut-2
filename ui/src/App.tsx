import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [pc, setPC] = useState<RTCPeerConnection | null>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    const pc = new RTCPeerConnection();
    setSocket(socket)
    setPC(pc);
  }, []);

  const createMeeting = async () => {
    if(!socket || !pc) return;
    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.send(JSON.stringify({type: 'createOffer', sdp: offer}));
  }

    return (
        <>
            <h1>Hello world</h1>
        </>
    );
}

export default App;
