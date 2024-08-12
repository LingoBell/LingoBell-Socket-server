// 'use strict';

var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
const path = require('path')
var socketIO = require('socket.io');

var fileServer = new nodeStatic.Server();
const express = require('express');
const app = express();
const port = 8080;

// 정적 파일을 제공할 폴더 설정
// app.use(express.static(path.join(__dirname, '../../../LingoBell-FrontEnd/dist')));


// 루트 URL 요청 처리
app.get('*', (req, res) => {
    // const indexPath = path.join(__dirname, '../../../LingoBell-FrontEnd/dist/index.html')
    // const file = require('fs').readFileSync(indexPath, 'utf-8')

    res.status(200).send(file)
    //   res.send('Hello, World!');
});

const server = http.createServer(app);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Socket.IO 서버 설정
const io = socketIO(server, {
    cors: {
        origin: ['http://localhost:9000/*', 'https://73b8-59-10-8-230.ngrok-free.app', "https://admin.socket.io", "http://localhost:8000"],// 'https://73b8-59-10-8-230.ngrok-free.app',    // 허용할 클라이언트의 URL
        methods: ['GET', 'POST', 'PUT'],           // 허용할 HTTP 메서드
        allowedHeaders: ['Content-Type'],   // 허용할 HTTP 헤더
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
        console.log('messgae ')
        console.log(message)
        socket.to(roomName).emit('message', message);
    });

    socket.on('OFFER', function ({ roomName, offer }) {
        console.log('offer meesage ', roomName)
        console.log('offer ??? : ', offer)
        socket.to(roomName).emit('OFFER_RECEIVED', offer)
    });

    socket.on('ANSWER', function ({ roomName, answer }) {
        console.log('ANSWER meesage ', roomName)
        socket.to(roomName).emit('ANSWER_RECEIVED', answer)
    });

    socket.on('CREATE_OR_JOIN', function (roomName) {
        const room = roomName

        console.log('Received request to create or join room ' + room);

        var clientsInRoom = io.sockets.adapter.rooms.get(room);
        console.log('ddddddddddddddd', io.sockets.adapter.rooms.get(room));
        var numClients = clientsInRoom ? clientsInRoom.size : 0;

        console.log('clientsInRoom', clientsInRoom);
        console.log('Room ' + room + ' now has ' + numClients + ' client(s)');

        if (numClients === 0) {
            console.log('new room', room);
            socket.join(room);
            console.log('Client ID ' + socket.id + ' created room ' + room);
            socket.emit('CREATED', room, socket.id);

        } else if (numClients === 1) {
            console.log('Client ID ' + socket.id + ' joined room ' + room);
            // io.sockets.in(room).emit('JOIN', room);
            socket.join(room);
            socket.emit('JOINED')
            io.in(roomName).emit('READY')
            socket.emit('JOINED', room, socket.id);

        // } else if (numClients === 2) {
        //     console.log('Client ID ' + socket.id + ' joined room ' + room);
        //     // io.sockets.in(room).emit('JOIN', room);
        //     // 상대방에게만 보냄
        //     socket.join(room);
        //     socket.emit('JOINED')
        //     // io.sockets.to(room).emit('READY')
        //     io.in(roomName).emit('READY')
        //     // socket.join(room);
        //     socket.emit('JOINED', room, socket.id);
        //     // io.sockets.to(room).emit('ready');

        } else { // max two clients
            socket.emit('full', room);
        }
        console.log('Current clients in room: ' + room);
        console.log('clientsInRoom', clientsInRoom);
    });

    socket.on('CANDIDATE', function ({ roomName, candidate }) {
        socket.to(roomName).emit('CANDIDATE_RECEIVED', candidate)
    });

    socket.on('LANDMARKS_DATA', function (message) {
        socket.broadcast.emit('LANDMARKS_DATA_RECEIVED', message);
    });

    socket.on('MASK_CHANGED', function ({ roomName, maskImage }) {
        console.log('Mask changed in room:', roomName, 'New mask:', maskImage);
        socket.to(roomName).emit('MASK_CHANGED_RECEIVED', { maskImage });
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
        socket.to(roomName).emit('OPP_DISCONNECTED')
    });

    // 클라이언트 연결 해제 처리
    socket.on('disconnect', () => {

        // socket.broadcast.emit('OPP_DISCONNECTED')
        console.log('User disconnected:', socket.id);
    });

});