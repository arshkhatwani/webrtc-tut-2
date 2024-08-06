import ws from "ws";

export interface MeetingDetails {
    sender?: ws;
    receiver?: ws;
    offer?: string;
    answer?: string;
}
