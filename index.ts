import ws from "ws";

const PORT = 8080;

const server = new ws.Server({ port: PORT }, () => {
    console.log(`Server started on port: ${PORT}`);
});

server.on("connection", (socket) => {
    socket.on("message", (data: any) => {
      const message = JSON.parse(data);

      if(message.type === 'createOffer') {
        console.log('Offer received');
        // store it in a hashmap with a random key and its socket and sdp as value
      }
      else if(message.type === 'createAnswer') {
        console.log('Answer recieved')
        // fetch the value from the hashmap using that random key and share the answer with that sender
        // also do something to check if the sender and receiver are already matched or not
      }
      else if(message.type === 'iceCandidate') {
        console.log('Ice candidate received');
        // fetch the value from hashmap verify whether the socket is receiver or sender and share the ice candidates accordingly
      }
    });
});
