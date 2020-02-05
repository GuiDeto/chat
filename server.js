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

var roomName = 'Sala1';

// io.on('connection', socket => {
//     console.log(`Id: ${socket.id}` );

//     socket.emit('previousMessage', messages);

//     socket.on('sendMessage', data => {
//         messages.push(data);
//         socket.broadcast.emit('sendMessage', data);
//     })
// });

// io.on('disconnect', function(eve){
//     console.log(eve);
// });

// server side code
io.sockets.on('connection', function (socket) {
    socket.on('create', function (room) {
        socket.join(room, function () {
            console.log(`Id: ${socket.id} Sala: ${room}`);
        });

        socket.on('sendMessage', data => {
            messages.push(data);
            socket.broadcast.to(room).emit('sendMessage', data);
        });
                
        io.sockets.in(room).emit('previousMessage', messages);

        io.sockets.in(room).on('sendMessage', data => {
            messages.push(data);
            socket.broadcast.to(room).emit('sendMessage', data);
        });
    });
});

server.listen(3000, data => {
    console.log('Server on 3000');
});