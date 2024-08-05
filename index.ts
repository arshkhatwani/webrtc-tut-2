import ws from "ws";

const PORT = 8080;

const server = new ws.Server({ port: PORT }, () => {
    console.log(`Server started on port: ${PORT}`);
});

server.on("connection", (socket) => {
    socket.on("message", (data) => {
        console.log(data.toString());
    });
});
