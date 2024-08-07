import ShortUniqueId from "short-unique-id";
import ws from "ws";
import { MeetingDetails } from "./types";

const PORT = 8080;
const meetings = new Map<string, MeetingDetails>();

const uid = new ShortUniqueId({ length: 10 });

const server = new ws.Server({ port: PORT }, () => {
    console.log(`Server started on port: ${PORT}`);
});

server.on("connection", (socket) => {
    socket.on("message", (data: any) => {
        const message = JSON.parse(data);

        if (message.type === "createOffer") {
            console.log("Offer received");

            const meetingId = uid.rnd();
            const { offer } = message;

            meetings.set(meetingId, { sender: socket, offer: offer });

            socket.send(
                JSON.stringify({
                    type: "offerCreated",
                    meetingId,
                    success: true,
                })
            );
        } else if (message.type === "getOffer") {
            const { meetingId } = message;
            let meetingDetails = meetings.get(meetingId);

            if (!meetingDetails) {
                socket.send(
                    JSON.stringify({
                        message:
                            "Invalid meeting id, could not find meeting details",
                        success: false,
                    })
                );
                return;
            }

            const { offer } = meetingDetails;

            socket.send(JSON.stringify({ type: "createOffer", offer }));
        } else if (message.type === "createAnswer") {
            console.log("Answer recieved");

            const { meetingId, answer } = message;
            let meetingDetails = meetings.get(meetingId);

            if (!meetingDetails) {
                socket.send(
                    JSON.stringify({
                        message:
                            "Invalid meeting id, could not find meeting details",
                        success: false,
                    })
                );
                return;
            }

            const { sender, offer } = meetingDetails;
            meetings.set(meetingId, {
                ...meetingDetails,
                answer,
                receiver: socket,
            });

            if (!sender) {
                socket.send(
                    JSON.stringify({
                        message: "Could not find sender",
                        success: false,
                    })
                );
                return;
            }

            sender.send(JSON.stringify({ answer, type: "createAnswer" }));
            socket.send(
                JSON.stringify({ type: "answerCreated", offer, success: true })
            );
        } else if (message.type === "iceCandidate") {
            console.log("Ice candidate received");
            // fetch the value from hashmap verify whether the socket is receiver or sender and share the ice candidates accordingly
            const { meetingId, iceCandidate } = message;
            const meetingDetails = meetings.get(meetingId);

            if (!meetingDetails) {
                socket.send(
                    JSON.stringify({
                        message:
                            "Invalid meeting id, could not find meeting details",
                        success: false,
                    })
                );
                return;
            }

            const { sender, receiver } = meetingDetails;

            if (receiver && socket === sender) {
                receiver.send(
                    JSON.stringify({ type: "iceCandidate", iceCandidate })
                );
            } else if (sender && socket === receiver) {
                sender.send(
                    JSON.stringify({ type: "iceCandidate", iceCandidate })
                );
            }
        }
    });
});
