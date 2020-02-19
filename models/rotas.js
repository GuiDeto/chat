const express = require('express')
const router = express.Router()
const db = require('./models/db');

router.post('/api/sala/:cod', async function (req, res) {
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

router.put('/api/:room/:cod', async function (req, res) {
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

router.get('/:b/:u', async (req, res) => {
    var newLog = await insertInfoUsrDb({cod:req.params.u, room:req.params.b, ip:req.connection.remoteAddress, tipo:'logou'});

    req.params = Object.assign(req.params, {
        ip: req.connection.remoteAddress
    });
    res.render('index.html', req.params);
});


module.exports = router