
function timeSince(date) {

    var seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
    var interval = Math.floor(seconds / 31536000);
  
    if (interval > 1) {
      return interval + " anos";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
      return interval + " meses";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
      return interval + " dias";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
      return interval + " horas";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
      return interval + " minutos";
    }
    return Math.floor(seconds) + " segundos";
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

var socket = io();

function renderMessage(message) {
    
    var texto_people = '<div class="d-flex justify-content-start mb-4"><div class="img_cont_msg"><img src="https://i.pinimg.com/280x280_RS/57/a9/77/57a9776d4f78ab1dc2d87a0bf65eb97b.jpg" class="rounded-circle user_img_msg"></div><div class="msg_cotainer">'+message.message+'<span class="msg_time">'+timeSince(message.date)+'</span></div></div>';
    var text_me = '<div class="d-flex justify-content-end mb-4"><div class="msg_cotainer_send">'+
    message.message +'<span class="msg_time_send">'+timeSince(message.date)+'</span></div><div class="img_cont_msg"><img src="https://generali.mediargroup.com.br/assets/img/users/1.jpg" class="rounded-circle user_img_msg"></div></div>';

    var usrMsg = message.user != 'Detonix'?texto_people:text_me;
    $("#historyMessage").append(
        usrMsg
    );
}

socket.on("sendMessage", function (message) {
    renderMessage(message);
});

socket.on("previousMessage", function (messages) {
    for (message of messages) {
        renderMessage(message);
    }
});

let room = getQueryParams(document.location.search).b;

$(document).ready(function () {
    if (room != undefined && room.match("sala[1-9]") != null) {

        socket.emit("create", room);

    }
});

function sendMessage() {
    var user = 'fulano';
    var message = $("textarea[name=message]").val();

    if (user.length && message.length) {
        var d = new Date();
        var messageObject = {
            user: user,
            message: message,
            room: room
        };
        renderMessage(messageObject);
        socket.emit("sendMessage", messageObject);
        $("textarea[name=message]").val('');
    }
}