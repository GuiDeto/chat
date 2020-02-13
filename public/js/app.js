
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
    if(interval = NaN){
      return "agora";
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
var room = getQueryParams(document.location.search).b;
var user = getQueryParams(document.location.search).u;

function renderMessage(message) {
    var texto_people = '<div class="d-flex justify-content-start mb-4"><div class="img_cont_msg"><img src="'+message.img+'" class="rounded-circle user_img_msg"></div><div class="msg_cotainer">'+message.message+'<span class="msg_time">'+timeSince(message.date)+'</span></div></div>';
    var text_me = '<div class="d-flex justify-content-end mb-4"><div class="msg_cotainer_send">'+
    message.message +'<span class="msg_time_send">'+timeSince(message.date)+'</span></div><div class="img_cont_msg"><img src="'+message.img+'" class="rounded-circle user_img_msg"></div></div>';

    var usrMsg=message.cod!=user?texto_people:text_me;
    $("#historyMessage").append(
        usrMsg
    );
}

function loadUsers(users){
  var userRoom = '';
  for (const user of users) {
    userRoom += '<li class="active"><div class="d-flex bd-highlight"><div class="img_cont"><img src="'+user.img+'" class="rounded-circle user_img"><span class="online_icon"></span></div><div class="user_info"><span>'+user.name+'</span><p>'+user.cargo+'</p></div></div></li>';
  }
  $('#usersRoom').html(userRoom);
  // online_icon offline
}

function loadMyPicture(i){
  $('#myPicture').html('<img src="'+i+'" class="rounded-circle user_img" /><span class="online_icon"></span>');
}

socket.on("sendMessage", function (message) {
    renderMessage(message);
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

$(document).ready(function () {
    if (room != undefined && room.match("sala[1-9]") != null) {
        socket.emit("create", {room: room, user: user});
    }
});

function sendMessage() {
    var message = $("textarea[name=message]").val();

    if (user.length && message.length) {
        var messageObject = {
            cod: user,
            message: message,
            room: room
        };
        socket.emit("sendMessage", messageObject);
        $("textarea[name=message]").val('');
    }
}