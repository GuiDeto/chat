require('dotenv').config();
const express = require('express');
var router = express.Router();
const path = require('path');
const async = require('async');
const assert = require('assert');
const mongo = require('mongodb').MongoClient;
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.set('views', path.join(__dirname, 'public'));
app.engine('html', require('ejs').renderFile);

app.use('/scripts', express.static(path.join(__dirname, 'public/js')));
app.use('/styles', express.static(path.join(__dirname, 'public/css')));

app.use('/', (req, res) => {
    res.render('index.html');
});

io.sockets.on('connection', function (socket) {
    socket.on('create', function (data) {

        const showInfoRoom = async function(r){
                const infoRoom = await getInfoRoom(r);
                if(infoRoom!=undefined){
                    const chkUsrRoom = searchJSON(infoRoom.users, data.user);
                    if(chkUsrRoom != undefined){
                        socket.join(data.room, function () {
                            console.log(`Conexão estabelecida id: ${socket.id} Sala: ${data.room} Usuario: ${data.user}`);
                            showOldMessagesChat(data.room, socket.id, data.user);
                            const showUserRoom = async function(r){
                                const usersRoom = await getUsrsRoom(r);
                                io.in(data.room).emit('loadUsersRoom', usersRoom);
                            }
                            const getUserImg = async function(u){
                                const showUserData = await getUsrInfo(u);
                                io.to(socket.id).emit('loadMyPicture', {img:showUserData.img});
                            }
                            showUserRoom(data.room);
                            getUserImg(data.user);
                        });
                    }else{
                        io.to(socket.id).emit('erro', {erro:"Você não está cadastrado nessa sala!"});
                    }
            }else{
                io.to(socket.id).emit('erro', {erro:"Caminho incorreto!<br>Verifique o endereço corretamente!"});
            }
        }
        showInfoRoom(data.room);
    });

    socket.on('sendMessage', data => {
        sendMessageUsr(data);
    });

});

const sendMessageUsr = async function(arr){
    var infoUsr = await getUsrInfo(arr.cod);
    emitMessage = {cod:arr.cod, room:arr.room, message:arr.message, img:infoUsr.img};
    insertMessageDB(arr.room, arr.cod, arr.message);
}

const getUsrInfo = function(cod){
    return new Promise(function(resolve, reject) {
        mongo.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }, (err, client) => {
            if (err) {
                console.error(err)
                return
            }
            let db = client.db('chat_sisc').collection('posts');
            db.find({ users:{ $elemMatch: {cod:cod}}} ).project({users:1}).limit(1).toArray(function (err, docs) {
                var infoUsr = searchJSON(docs[0].users, cod);
                var dados = docs[0].users[infoUsr];
                resolve(dados);
            });
         })
    })
}

const getUsrsRoom = function(room){
    return new Promise(function(resolve, reject) {
        mongo.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }, (err, client) => {
            if (err) {
                console.error(err)
                return
            }
            let db = client.db('chat_sisc').collection('posts');
            db.find( {room:room} ).project({users:1}).limit(1).toArray(function (err, docs) {
                var salas = docs[0].users;
                resolve(salas);
            });
         })
    })
}

const getInfoRoom = function(room){
    return new Promise(function(resolve, reject) {
        mongo.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }, (err, client) => {
            if (err) {
                console.error(err)
                return
            }
            let db = client.db('chat_sisc').collection('posts');
            db.find( {room:room} ).limit(1).toArray(function (err, docs) {
                resolve(docs[0]);
            });
         })
    })
}

const loadApp = server.listen(process.env.PORT || 3000, () => {
    console.log('Server on port: ' + loadApp.address().port);
});

function showOldMessagesChat(r, sckId, usr) {
    mongo.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, (err, client) => {
        if (err) {
            console.error(err)
            return
        }

        let db = client.db('chat_sisc').collection('posts');
        var dados = [];

        db.find({
            room: r
        }).limit(1).toArray(function (err, docs) {
            if (err) throw err;
            var roomData = docs[0];
            var chkUserRoom = searchJSON(roomData.users, usr);
            if(roomData.posts!=undefined && roomData.posts.length > 0 && chkUserRoom != undefined){
                for (const roomMsg of roomData.posts) {
                    var i = searchJSON(roomData.users, roomMsg.user);
                    if (i > -1) {
                        dados.push({
                            "user": roomData.users[i].name,
                            "message": roomMsg.message,
                            "date": roomMsg.date_add,
                            "img": roomData.users[i].img,
                            "cod": roomData.users[i].cod
                        });
                    }
                }
                io.to(sckId).emit('previousMessage', dados);
            }
        });
    });
}

async function insertMessageDB(r, u, m) {
    mongo.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, (err, client) => {
        if (err) {
            console.error(err)
        }

        let db = client.db('chat_sisc').collection('posts');

        const getUsrData = async function(r, u, m){
            var infoUsr = await getUsrInfo(u);

            var userChat = infoUsr.name;
            var d = new Date().toISOString();

            db.updateOne({
                room: r
            },{
                $push:{
                    posts: {
                            user: userChat,
                            message: m,
                            date_add: d
                    }
                }
            }, function (err, res) {
                assert.equal(null, err);
            });
            io.in(r).emit('sendMessage', {user: userChat, message: m, cod: u, img: infoUsr.img, date:d});
        }
        getUsrData(r, u, m);
    })
}

function getIPInfo(ip) {
    var URL = 'https://ipapi.co/' + ip + '/json';
}


function searchJSON(arr, s) {
    var i, key;

    for (i = arr.length; i--;)
        for (key in arr[i])
            if (arr[i].hasOwnProperty(key) && arr[i][key].indexOf(s) > -1)
                return i;
}