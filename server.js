// require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
var Schema = mongoose.Schema;
const db = mongoose.connection;

mongoose.connect(
    process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

var userDataSchema = new Schema({
    user: {
        type: String,
        required: true
    },
    room: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    send_date: {
        type: Date,
        required: true,
        default: Date.now
    }
});

const saveChat = mongoose.model('posts', userDataSchema);
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.set('views', path.join(__dirname, 'public'));
app.engine('html', require('ejs').renderFile);
// app.set('view engine', 'html');

app.use('/scripts', express.static(path.join(__dirname, 'public/js')));

app.use('/', (req, res) => {
    res.render('index.html');
});

io.sockets.on('connection', function (socket) {
    socket.on('create', function (room) {
        socket.join(room, function () {
            db.once('open', function () {
                console.log(`Conexão estabelecida id: ${socket.id} Sala: ${room}`);
            });
            showOldMessagesChat(room, socket.id);
        });
    });

    socket.on('sendMessage', data => {
        var user = data.user,
            room = data.room,
            message = data.message;
        insertMessageDB(room, user, message);

        socket.broadcast.in(data.room).emit('sendMessage', data);
    });
});

const loadApp = server.listen(process.env.PORT || 3000, () => {
    console.log('Server on port: ' + loadApp.address().port);
});

function showOldMessagesChat(r, sckId) {
    let dados = [];

    saveChat.find({
        room: r
    }, function (err, docs) {
        if (err) throw err;
        for (message of docs) {
            dados.push({
                "user": message.user,
                "date": message.date_add_message,
                "message": message.message
            });
        }
        io.sockets.in(sckId).emit('previousMessage', dados);
    });
}

function insertMessageDB(r, u, m) {
    var sendData = {
        user: u,
        room: r,
        message: m
    };

    var data = new saveChat(sendData);
    data.save(function (err, chatMessage) {
        if (err) return console.error(err);
        console.log(chatMessage);
    });
}