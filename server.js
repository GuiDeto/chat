const app = require('express')();
const path = require('path');
var mysql = require('mysql');
var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'chatdb'
});
con.connect(function (err) {
    if (err) throw err;
});

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

// server side code
let messages = [];
io.sockets.on('connection', function (socket) {
    socket.on('create', function (room) {

        socket.join(room, function () {

            console.log(`Id: ${socket.id} Sala: ${room}`);
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

server.listen(3000, data => {
    console.log('Server on 3000');
});

function showOldMessagesChat(r, sckId) {
    let dados = [];
    con.query("SELECT * FROM chat WHERE room='" + r + "'", function (err, result) {
        if (err) throw err;
        for (message of result) {
            dados.push( {"user":message.user, "date":message.date_add_message,"message":message.message} );
        }
        io.sockets.in(sckId).emit('previousMessage', dados);
    });
}

function insertMessageDB(r, u, m) {
    con.query('INSERT INTO chat (room, user, message) VALUES (\'' + r + '\',\'' + u + '\',\'' + m + '\')', function (error, results, fields) {
        if (error) throw error;
        if (results.affectedRows) console.log('Cadastro inserido no banco!');
    });
}