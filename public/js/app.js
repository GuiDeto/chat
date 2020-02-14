function timeSince(date) {
    var data = new Date(date),
        hora = data.getHours().toString(),
        min = data.getMinutes().toString(),
        seg = data.getSeconds().toString(),
        dia = data.getDate().toString(),
        diaF = (dia.length == 1) ? '0' + dia : dia,
        mes = (data.getMonth() + 1).toString(),
        mesF = (mes.length == 1) ? '0' + mes : mes,
        anoF = data.getFullYear();
    return `${hora}:${min}:${seg} ${diaF}.${mesF}.${anoF}`;
}

function getQueryParams(qs) {
    qs = qs.split("+").join(" ");

    var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while ((tokens = re.exec(qs))) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }

    return params;
}
const socket = io();
const room = getQueryParams(document.location.search).b;
const user = getQueryParams(document.location.search).u;
const messageUsr = document.querySelectorAll(".type_msg")[0];
window.onload = function () {

    socket.on("sendMessage", function (message) {
        renderMessage(message);
    });

    socket.on("erro", function (message) {
        showErro(message);
    });

    socket.on("loadMyPicture", function (i) {
        loadMyPicture(i.img);
    });

    socket.on("loadUsersRoom", function (users) {
        loadUsers(users);
    });

    socket.on("previousMessage", function (messages) {
        for (message of messages) {
            renderMessage(message);
        }
    });

    socket.emit('login',{ user:user });

    if (room != undefined && room.match("sala[1-9]") != null) {
        socket.emit("create", {
            room: room,
            user: user
        });
    }
    messageUsr.addEventListener("keydown", function (event) {
        if(event.keyCode == 13 && event.shiftKey==false){
            sendMessage();
        }
    });
}

function renderMessage(message) {
    var msg = decodeURIComponent(message.message.replace(/%0/ig,'<br />'));
    var data = timeSince(message.date);

    var texto_people = '<div class="d-flex justify-content-start mb-4"><div class="img_cont_msg"><img src="' + message.img + '" class="rounded-circle user_img_msg"></div><div class="msg_cotainer">' + msg + '<span class="msg_time">' + data + '</span></div></div>';

    var text_me = '<div class="d-flex justify-content-end mb-4"><div class="msg_cotainer_send">' +
    msg + '<span class="msg_time_send">' + data + '</span></div><div class="img_cont_msg"><img src="' + message.img + '" class="rounded-circle user_img_msg"></div></div>';

    var usrMsg = message.cod != user ? texto_people : text_me;
    document.getElementById("historyMessage").innerHTML += usrMsg;
    var objDiv = document.getElementById("historyMessage");
    objDiv.scrollTop = objDiv.scrollHeight;
}

function loadUsers(users) {
    var userRoom = '';
    for (const user of users) {
        var stsUsr = user.status?'online_icon':'online_icon offline';
        userRoom += '<li class="active"><div class="d-flex bd-highlight"><div class="img_cont"><img src="' + user.img + '" class="rounded-circle user_img"><span class="'+stsUsr+'"></span></div><div class="user_info"><span>' + user.name + '</span><p>' + user.cargo + '</p></div></div></li>';
    }
    $('#usersRoom').html(userRoom);
}

function showErro(m) {
    toastr.error(m.erro, 'Chat SISC', {
        "timeOut": 0
    });
}

function loadMyPicture(i) {
    $('#myPicture').html('<img src="' + i + '" class="rounded-circle user_img" /><span class="online_icon"></span>');
}

function sendMessage() {
    var textUsr = document.querySelectorAll("#messageUsr")[0].value;
    var msgUsr = encodeURIComponent( textUsr.replace(/(<([^>]+)>)/ig,"") );
    if (user.length && msgUsr.length > 1) {
        var messageObject = {
            cod: user,
            message: msgUsr,
            room: room
        };
        socket.emit("sendMessage", messageObject);
    }
    document.querySelectorAll("#messageUsr")[0].value = '';
}

