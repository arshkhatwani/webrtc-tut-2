import ws from "ws";

export interface MeetingDetails {
    sender?: ws;
    receiver?: ws;
    offer?: {
        sdp: string;
        type: string;
    };
    answer?: {
        sdp: string;
        type: string;
    };
}
