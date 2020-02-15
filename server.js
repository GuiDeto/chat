require('dotenv').config();
const express = require('express');
const path = require('path');
const assert = require('assert');
const upload_files = require('multer')();
const mongo = require('mongodb').MongoClient;
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const usrsOnline = {};
const CryptoJS = require('crypto-js');

app.set('views', path.join(__dirname, 'public'));
app.engine('html', require('ejs').renderFile);

app.use('/plgs', express.static(path.join(__dirname, 'node_modules')));
app.use('/scripts', express.static(path.join(__dirname, 'public/js')));
app.use('/styles', express.static(path.join(__dirname, 'public/css')));
app.use('/download', express.static(path.join(__dirname, 'public/upload_files')));
app.post('/file-upload', upload_files.array('source_file[]'), process_upload);

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var sanitize = require("sanitize-filename");

function process_upload(req, res) {
    if (req.files) {
        var upload_dir = path.join(__dirname, 'public/upload_files');
        var room = getUrlVars(req.headers.referer).b;
        var cdgUsr = getUrlVars(req.headers.referer).u;
        const sanitized_filename = [];

        Promise.resolve(req.files)
            .each(function (file_incoming, idx) {
                sanitized_filename.push(sanitize(file_incoming.originalname));
                const file_to_save = path.join(upload_dir, sanitized_filename[0]);
                return fs
                    .writeFileAsync(file_to_save, file_incoming.buffer)
            })
            .then(_ => {
                sendMessageUsr({
                    cod: cdgUsr,
                    room: room,
                    message: encodeURIComponent(`<a href='/download/${sanitized_filename[0]}' target='_blank'>baixar o arquivo</a>`)
                });
                return res.sendStatus(200);
            });
    }
}

app.use('/', (req, res) => {
    res.render('index.html');
});

io.sockets.on('connection', function (socket) {
    socket.on('create', function (data) {
        if((typeof(data.room)=='string' && 1 < data.room.length) && (typeof(data.user)=='string' && 1 <  data.user.length)){
            const showInfoRoom = async function (r) {
                const infoRoom = await getInfoRoom(r);
                console.log(infoRoom);
                if (infoRoom != undefined) {
                    const chkUsrRoom = searchJSON(infoRoom.users, data.user);
                    if (chkUsrRoom != undefined) {
                        socket.join(data.room, function () {
                            console.log(`Conexão estabelecida id: ${socket.id} Sala: ${data.room} Usuario: ${data.user}`);
                            showOldMessagesChat(data.room, socket.id, data.user);
                            usrsOnline[socket.id] = data.user;
                            const showUserRoom = async function (r) {
                                const usersRoom = await getUsrsRoom(r);
                                io.in(data.room).emit('loadUsersRoom', usersRoom);
                            }
                            const getUserImg = async function (u) {
                                const showUserData = await getUsrInfo(u);
                                io.to(socket.id).emit('loadMyPicture', {
                                    img: showUserData.img
                                });
                            }
                            showUserRoom(data.room);
                            getUserImg(data.user);
                        });
                    } else {
                        showErro({msg:'Você não está cadastrado nessa sala!', id:socket.id});
                    }
                } else {
                    showErro({msg:'Caminho incorreto!<br>Verifique o endereço corretamente!', id:socket.id});
                }
            }
            showInfoRoom(data.room);
        }else{
            showErro({msg:'Dados incorretos para montar a sala!', id:socket.id});
        }
    });
    socket.on('sendMessage', data => {
        sendMessageUsr(data);
    });
    socket.on('disconnect', function () {
        delete usrsOnline[socket.id];
    });
});

function showErro(erros){
    io.to(erros.id).emit('erro', {
        erro: erros.msg
    });
}
function sendMessageUsr(arr) {
    emitMessage = {
        cod: arr.cod,
        room: arr.room,
        message: arr.message
    };
    insertMessageDB(arr.room, arr.cod, arr.message);
}
const getUsrInfo = function (cod) {
    return new Promise(function (resolve, reject) {
        mongo.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }, (err, client) => {
            assert.equal(null, err);
            let db = client.db('chat_sisc').collection('posts');
            db.find({
                users: {
                    $elemMatch: {
                        cod: cod
                    }
                }
            }).project({
                users: 1
            }).limit(1).toArray(function (err, docs) {
                var infoUsr = searchJSON(docs[0].users, cod);
                var dados = docs[0].users[infoUsr];
                resolve(dados);
            });
        })
    })
}
const getUsrsRoom = function (room) {
    return new Promise(function (resolve, reject) {
        mongo.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }, (err, client) => {
            assert.equal(null, err);
            let db = client.db('chat_sisc').collection('posts');
            db.find({
                room: room
            }).project({
                users: 1
            }).limit(1).toArray(function (err, docs) {
                var usrRoom = [];
                var userSign = docs[0].users;
                for (const usr of userSign) {
                    var stsUsr = findArr(usrsOnline, usr.cod) < 0 ? false : true;
                    usrRoom.push({
                        name: usr.name,
                        cod: usr.cod,
                        img: usr.img,
                        cargo: usr.cargo,
                        status: stsUsr
                    })
                }
                resolve(usrRoom);
            });
        })
    })
}
const getInfoRoom = function (room) {
    return new Promise(function (resolve, reject) {
        mongo.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }, (err, client) => {
            assert.equal(null, err);
            let db = client.db('chat_sisc').collection('posts');
            db.find({
                room: room
            }).limit(1).toArray(function (err, docs) {
                resolve(docs[0]);
            });
        })
    })
}

const loadApp = server.listen(process.env.PORT || 3000, () => {
    console.log('Server on port: ' + loadApp.address().port);
});

function showOldMessagesChat(r, sckId, usr){
    mongo.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, function(err, client){
        assert.equal(null, err);

        let db = client.db('chat_sisc').collection('posts');
        db.find({
            room: r
        }).limit(1).toArray(function (err, docs) {
            if (err) throw err;
            var roomData = docs[0];

            if ( roomData.posts.length > 0 ) {
                sendPreviousMessages(roomData, sckId, usr);
            }
        });
    });
}

function sendPreviousMessages(messages, sckId, usr) {
    var dados = [];
    var i = searchJSON(messages.users, usr);
    if ( i > -1) {
    for (const roomMsg of messages.posts) {
        var msg =   CryptoJS.AES.decrypt(roomMsg.message, process.env.CRYPT_KEY).toString(CryptoJS.enc.Utf8);
            dados.push({
                "user": messages.users[i].name,
                "message": encodeURIComponent( msg ),
                "date": roomMsg.date_add,
                "img": messages.users[i].img,
                "cod": messages.users[i].cod
            });
        }
    }
    io.to(sckId).emit('previousMessage', dados);
}

function insertMessageDB(r, u, m) {
    mongo.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, (err, client) => {
        assert.equal(null, err);

        let db = client.db('chat_sisc').collection('posts');

        const getUsrData = async function (r, u, m) {
            var infoUsr = await getUsrInfo(u);

            var userChat = infoUsr.name;
            var d = new Date().toISOString();
            db.updateOne({
                room: r
            }, {
                $push: {
                    posts: {
                        user: userChat,
                        message: CryptoJS.AES.encrypt(decodeURIComponent(m), process.env.CRYPT_KEY).toString(),
                        date_add: d
                    }
                }
            }, function (err, res) {
                assert.equal(null, err);
            });
            io.in(r).emit('sendMessage', {
                user: userChat,
                message: m,
                cod: u,
                img: infoUsr.img,
                date: d
            });
        }
        getUsrData(r, u, m);

    })
}

function getIPInfo(ip) {
    var URL = 'https://ipapi.co/' + ip + '/json';
}

function searchJSON(arr, s) {
    let i, key;

    for (i = arr.length; i--;)
        for (key in arr[i])
            if (arr[i].hasOwnProperty(key) && arr[i][key].indexOf(s) > -1)
                return i;
}

function findArr(arr, s) {
    return Object.values(arr).indexOf(s);
}

function getUrlVars(url) {
    var vars = {};
    var parts = url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
    });
    return vars;
}