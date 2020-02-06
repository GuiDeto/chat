const app = require('express')();
const path = require('path');

// const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use('/', (req, res) => {
    res.render('index.html');
});

let messages = [];

// server side code
io.sockets.on('connection', function (socket) {
    socket.on('create', function (room) {
        socket.join(room, function () {
            console.log(`Id: ${socket.id} Sala: ${room}`);
            if(messages.room == room)io.sockets.to(socket.id).emit('previousMessage', messages);
        });

        socket.on('sendMessage', data => {
            messages.push(data);
            socket.broadcast.to(room).emit('sendMessage', data);
        });
    });
});

server.listen(3000, data => {
    console.log('Server on 3000');
});