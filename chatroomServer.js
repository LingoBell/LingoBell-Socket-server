var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
const path = require('path')
var socketIO = require('socket.io');

var fileServer = new nodeStatic.Server();
const express = require('express');
const app = express();
const port = 8080;

app.use(express.static(path.join(__dirname, '../../../LingoBell-FrontEnd/dist')));

app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, '../../../LingoBell-FrontEnd/dist/index.html');
    const file = require('fs').readFileSync(indexPath, 'utf-8');
    res.status(200).send(file);
});

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Socket.IO 서버 설정
const io = socketIO(server, {
    cors: {
        origin: ['http://localhost:9000/*', 'https://73b8-59-10-8-230.ngrok-free.app', "https://admin.socket.io", "http://localhost:8000"],
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
    }
});

io.sockets.on('connection', function (socket) {
    console.log('A user connected:', socket.id);

    function log() {
        var array = ['Message from server:'];
        array.push.apply(array, arguments);
        socket.emit('log', array);
    };

    socket.on('message', function (message) {
        console.log('message:', message);
        socket.to(message.roomName).emit('message', message);
    });

    socket.on('OFFER', function ({roomName, offer}) {
        console.log('offer message:', roomName);
        socket.to(roomName).emit('OFFER_RECEIVED', offer);
    });

    socket.on('ANSWER', function ({roomName, answer}) {
        console.log('ANSWER message:', roomName);
        socket.to(roomName).emit('ANSWER_RECEIVED', answer);
    });

    socket.on('CREATE_OR_JOIN', function (roomName) {
        console.log('Received request to create or join room ' + roomName);

        var clientsInRoom = io.sockets.adapter.rooms.get(roomName);
        var numClients = clientsInRoom ? clientsInRoom.size : 0;

        console.log('Room ' + roomName + ' now has ' + numClients + ' client(s)');

        if (numClients === 0) {
            socket.join(roomName);
            console.log('Client ID ' + socket.id + ' created room ' + roomName);
            socket.emit('CREATED', roomName, socket.id);
        } else if (numClients === 1) {
            socket.join(roomName);
            console.log('Client ID ' + socket.id + ' joined room ' + roomName);
            socket.emit('JOINED', roomName, socket.id);
            io.in(roomName).emit('READY');
        } else { // 방에 두 명 이상 있을 경우
            socket.emit('full', roomName);
        }
    });

    socket.on('CANDIDATE', function ({roomName, candidate}) {
        socket.to(roomName).emit('CANDIDATE_RECEIVED', candidate);
    });

    socket.on('LANDMARKS_DATA', function (message) {
        socket.broadcast.emit('LANDMARKS_DATA_RECEIVED', message);
    });

    socket.on('ipaddr', function () {
        var ifaces = os.networkInterfaces();
        for (var dev in ifaces) {
            ifaces[dev].forEach(function (details) {
                if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
                    socket.emit('ipaddr', details.address);
                }
            });
        }
    });

    socket.on('DISCONNECTED', (roomName) => {
        socket.to(roomName).emit('OPP_DISCONNECTED');
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });

});
