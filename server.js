require('dotenv').config();
const express = require('express');
const path = require('path');
const assert = require('assert');
const upload_files = require('multer')();
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const usrsOnline = {};
const CryptoJS = require('crypto-js');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const db = require('./models/db');

db.connect(process.env.MONGO_URL, (err)=> {
    if (err) {
        console.log(err);
        process.exit(1)
    }
    console.log('MonngoDB Connected');
});

app.use(bodyParser.json());

app.set('views', path.join(__dirname, 'public'));
app.engine('html', require('ejs').renderFile);
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use('/favicon.ico', express.static('public/img/favicon.ico'));
app.use('/plgs', express.static(path.join(__dirname, 'node_modules')));
app.use('/scripts', express.static(path.join(__dirname, 'public/js')));
app.use('/styles', express.static(path.join(__dirname, 'public/css')));
app.use('/download', express.static(path.join(__dirname, 'public/upload_files')));
app.use('/sounds', express.static(path.join(__dirname, 'public/sounds')));
app.use('/images', express.static(path.join(__dirname, 'public/img')));
app.post('/file-upload', upload_files.array('source_file[]'), process_upload);

app.route('/api/sala/:cod')
    .post(async function (req, res) {
        if (req.params.cod === process.env.API_CHAT_KEY) {
            const chkRoom = await chkRoomExists(req.body.room);
                if(!chkRoom){
                    try {
                        if(req.body.room.length>4){
                            const resp = await createRoom(req.body);
                            let links = [];
                            for (const item of req.body.users) {
                                links.push({link: `${req.headers.host}/${req.body.room}/${item.cod}`, nome: item.name, img: item.img});
                            }
                            if (resp.n === 1) {
                                res.status(201).send({
                                    success: true,
                                    message: `Sala ${req.body.room} criada!`,
                                    status: resp,
                                    links: links
                                });
                            } else {
                                res.status(500).send({
                                    message: "Houve algum problema ao criar sala!",
                                    status: resp,
                                    success: false
                                });
                            }
                        }else{
                            res.status(400).send({
                                success: false,
                                message: `Sala ${req.body.room} não foi criada!`
                            });
                        }
                    } catch (error) {
                        assert.equal(null, error);
                    }
                }else{
                    res.status(400).send({
                        success: false,
                        message: 'Está sala ('+req.body.room+') já existe!'
                    });
                }
        } else {
            res.send('Codigo incorreto:' + req.params.cod).status('200');
        }
    });
app.route('/api/:room/:cod').put(async function (req, res) {
    if (req.params.cod === process.env.API_CHAT_KEY) {
        try {
            if(req.body.room.length && req.body.name.length && req.body.cod.length && req.body.img.length && req.body.cargo.length  ){
                const chkRoom = await chkRoomExists(req.body.room);
                if(chkRoom){
                    const resp = await addUsersRoom(req.body);
                    if ( resp.n === 1) {
                        res.status(202).send({
                            success: true,
                            message: `Novo integrante ${req.body.name} adicionado com sucesso`,
                            sala: req.body.room,
                            status: resp
                        });
                    } else {
                        res.status(500).send({
                            message: 'Houve algum problema ao adicionar usuário!',
                            status: resp,
                            success: false
                        });
                    }
                }else{
                    res.status(400).send({
                        message: 'Sala não existe!',
                        success: false
                    });
                }
            }else{
                res.status(400).send({
                    message: "Falta informações!",
                    success: false
                });
            }
        } catch (error) {
            assert.equal(null, error);
        }
    } else {
        res.send(req).status('404');
    }
});

app.get('/:b/:u', async (req, res) => {
    var newLog = await insertInfoUsrDb({cod:req.params.u, room:req.params.b, ip:req.connection.remoteAddress, tipo:'logou'});

    req.params = Object.assign(req.params, {
        ip: req.connection.remoteAddress
    });
    res.render('index.html', req.params);
});

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var sanitize = require("sanitize-filename");

io.sockets.on('connection', async function (socket) {
    socket.on('create', async function (data) {
        if ((typeof (data.room) == 'string' && 1 < data.room.length) && (typeof (data.user) == 'string' && 1 < data.user.length)) {
                const infoRoom = await getInfoRoom(data.room);
                if (infoRoom != undefined) {
                    const chkUsrRoom = searchJSON(infoRoom.users, data.user);

                    if (chkUsrRoom != undefined) {
                        socket.join(data.room, async function () {
                            console.log(`Conexão estabelecida id: ${socket.id} Sala: ${data.room} Usuario: ${data.user}`);
                            showOldMessagesChat(data.room, socket.id, data.user);
                            usrsOnline[socket.id] = data.user;
                            const usersRoom = await getUsrsRoom(data.room);
                            io.in(data.room).emit('loadUsersRoom', usersRoom);

                            const showUserData = await getUsrInfo(data.user);
                            io.to(socket.id).emit('loadMyPicture', {
                                img: showUserData.img
                            });
                        });
                    } else {
                        showErro({
                            msg: 'Você não está cadastrado nessa sala!',
                            id: socket.id
                        });
                    }
                } else {
                    showErro({
                        msg: 'Caminho incorreto!<br>Verifique o endereço corretamente!',
                        id: socket.id
                    });
                }
        } else {
            showErro({
                msg: 'Dados incorretos para montar a sala!',
                id: socket.id
            });
        }
    });
    socket.on('sendMessage', data => {
        insertMessageDB(data);
    });
    socket.on('disconnect', function () {
        delete usrsOnline[socket.id];
    });
});

const loadApp = server.listen(process.env.PORT || 3000, () => {
    console.log('Server on port: ' + loadApp.address().port);
});

function showErro(erros) {
    io.to(erros.id).emit('erro', {
        erro: erros.msg
    });
}

function process_upload(req, res) {
    if (req.files) {
        var upload_dir = path.join(__dirname, 'public/upload_files');
        var room = req.headers.referer.split('/')[3];
        var cdgUsr = req.headers.referer.split('/')[4];
        const sanitized_filename = [];

        Promise.resolve(req.files)
            .each(function (file_incoming, idx) {
                sanitized_filename.push(sanitize(file_incoming.originalname.toLowerCase()));
                const file_to_save = path.join(upload_dir, sanitized_filename[0]);
                return fs
                    .writeFileAsync(file_to_save, file_incoming.buffer)
            })
            .then(function (e) {
                insertMessageDB({
                    cod: cdgUsr,
                    room: room,
                    message: encodeURIComponent(`<a href='/download/${sanitized_filename[0]}' title='${sanitized_filename[0]}' target='_blank'><i class='fas fa-download text-warning pisca_pisca' style='font-size:20px'></i> baixar o arquivo</a>`),
                    ip: req.connection.remoteAddress
                });
                return res.sendStatus(200);
            });
    }
}

const createRoom = function (dados) {
    return new Promise(function (resolve, reject) {
        let Posts = db.get().collection('posts');
        try{
            Posts.insertOne({
                room: dados.room,
                id: dados.id,
                users: dados.users,
                posts: []
            }).then(e => {
                resolve(e.result);
            });
        } catch (error) {
            assert.equal(null, error);
        }
    })
}
const addUsersRoom = function (dados) {
    return new Promise(function (resolve, reject) {
        let Posts = db.get().collection('posts');
            try {
                Posts.updateOne({
                    room: dados.room
                }, {
                    $push: {
                        users: {
                            name: dados.name,
                            cod: dados.cod,
                            img: dados.img,
                            cargo: dados.cargo
                        }
                    }
                }).then(e => {
                    resolve(e.result);
                });
            } catch (error) {
                assert.equal(null, error);
            }
    })
}

const getUsrInfo = function (cod) {
    return new Promise(function (resolve, reject) {
        let Posts = db.get().collection('posts');
        try{
            Posts.find({
                users: {
                    $elemMatch: {
                        cod: cod
                    }
                }
            }).project({
                users: 1
            }).limit(1).toArray(function (err, docs) {
                assert.equal(null, err);
                if(docs[0] && docs[0].users.length){
                    var infoUsr = searchJSON(docs[0].users, cod);
                    var dados = docs[0].users[infoUsr];
                    resolve(dados);
                }
            })
        }catch(err){
            assert.equal(null, err);
        }
    })
}

const chkRoomExists = function (room) {
    return new Promise(function (resolve, reject) {
        let Posts = db.get().collection('posts');
        try {
            Posts.find({
                room: room
            }).project({
                room: 1
            }).limit(1).toArray(function (err, docs) {
                assert.equal(null, err);
                if(docs.length && docs[0].room.length){
                    resolve(true);
                }else{
                    resolve(false);
                }
            });
        } catch (error) {
            assert.equal(null, err);
        }
    })
}
const getUsrsRoom = function (room) {
    return new Promise(function (resolve, reject) {
        let Posts = db.get().collection('posts');
        try {
            Posts.find({
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
        } catch (error) {
            assert.equal(null, err);
        }
    })
}
const getInfoRoom = function (room) {
    return new Promise(function (resolve, reject) {
        let Posts = db.get().collection('posts');
        try {
            Posts.find({
                room: room
            }).limit(1).toArray(function (err, docs) {
                resolve(docs[0]);
            });
        } catch (error) {
            assert.equal(null, err);
        }
    })
}
function showOldMessagesChat(r, sckId, usr) {
    let Posts = db.get().collection('posts');
    try {
        Posts.find({
        room: r
        }).limit(1).toArray(function (err, docs) {
            if (err) throw err;
            if (!isEmpty(docs[0].posts)) {
            var roomData = docs[0];
                sendPreviousMessages(roomData, sckId, usr);
            }
        });
    } catch (error) {
        assert.equal(null, err);
    }
}
function isEmpty(obj) {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            if(obj[key].length === 0)return true
        }
    }
    return false;
}
async function montMsgsRoom(data) {
    var infoUsr = await getUsrInfo(data.cod);
    return {
        "message": encodeURIComponent(data.message),
        "date": data.date,
        "img": infoUsr.img,
        "cod": data.cod
    };
}
async function sendPreviousMessages(messages, sckId, usr) {
let dados = [];
    for (const roomMsg of messages.posts) {
        var msg = CryptoJS.AES.decrypt(roomMsg.message, process.env.CRYPT_KEY).toString(CryptoJS.enc.Utf8);
        const mstMsg = await montMsgsRoom( {cod: roomMsg.user, message:msg, date: roomMsg.date_add} ) ;
        dados.push(mstMsg);
    }
    io.to(sckId).emit('previousMessage', dados);
}
async function insertMessageDB(data) {
    let Posts = db.get().collection('posts');
    try {
        var infoUsr = await getUsrInfo(data.cod);
        var d = new Date().toISOString();
        Posts.updateOne({
            room: data.room
        }, {
            $push: {
                posts: {
                    user: data.cod,
                    message: CryptoJS.AES.encrypt(decodeURIComponent(data.message), process.env.CRYPT_KEY).toString(),
                    date_add: d,
                    ip: data.ip
                }
            }
        }, function (err, res) {
            assert.equal(null, err);
        });
        io.in(data.room).emit('sendMessage', {
            user: data.cod,
            message: data.message,
            cod: data.cod,
            img: infoUsr.img,
            date: d
        });
    } catch (error) {
        assert.equal(null, error);
    }
}
async function insertInfoUsrDb(data) {
    return new Promise( async function(resolve, reject){
        let Posts = db.get().collection('posts');
        try {
            var d = new Date().toISOString();
            // var infoIP = await getIPInfo(data.ip);
            Posts.updateOne({
                room: data.room
            }, {
                $push: {
                    logs: {
                        user: data.cod,
                        date_add: d,
                        ip: data.ip,
                        tipo: data.tipo
                        // info: infoIP
                    }
                }
            }, function (err, res) {
                assert.equal(null, err);
            });
            resolve('update!');
        } catch (error) {
            assert.equal(null, error);
        }
    })
}

async function getIPInfo(ip) {
    let response = await fetch('https://ipapi.co/'+ip+'/json');

    if (response.ok) {
        return await response.json();
    } else {
        return response.status;
    }
}
function searchJSON(arr, s) {
     for (var i = 0; i < arr.length; i++)
         if (arr[i].cod == s)return i

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
