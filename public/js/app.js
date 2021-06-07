const dropzone_config = {
    dictDefaultMessage: "Clique para selecionar o arquivo",
    dictFallbackMessage: "Seu navegador não suporta arrastar o arquivo.",
    dictFallbackText: "Por favor, use o formulário de fallback abaixo para fazer upload de seus arquivos, como nos velhos tempos.",
    dictFileTooBig: "Arquivo é muito grande ({{filesize}}MiB). Tamanho maximo: {{maxFilesize}}MiB.",
    dictInvalidFileType: "Você não pode fazer upload de arquivos deste tipo.",
    dictResponseError: "Servidor respondeu com {{statusCode}} codigo.",
    dictCancelUpload: "Cancelar upload",
    dictCancelUploadConfirmation: "Tem certeza de que deseja cancelar este upload?",
    dictRemoveFile: "Remover arquivo",
    dictMaxFilesExceeded: "Você não pode enviar mais arquivo."
}

Dropzone.autoDiscover = false;
const socket = io();

function timeSince(date) {
    var data = new Date(date),
        hora = data.getHours().toString(),
        horaF = hora.length == 1 ? '0' + hora : hora,
        min = data.getMinutes().toString(),
        minF = min.length == 1 ? '0' + min : min,
        seg = data.getSeconds().toString(),
        segF = seg.length == 1 ? '0' + seg : seg,
        dia = data.getDate().toString(),
        diaF = (dia.length == 1) ? '0' + dia : dia,
        mes = (data.getMonth() + 1).toString(),
        mesF = (mes.length == 1) ? '0' + mes : mes,
        anoF = data.getFullYear();
    return `${horaF}:${minF}:${segF} ${diaF}/${mesF}/${anoF}`;
}



const messageUsr = document.querySelectorAll(".type_msg")[0];
window.onload = function () {
    let src = '/sounds/beep.mp3';
    let audio = new Audio(src);
    socket.on("sendMessage", function (message) {
        if (!document.hasFocus()) {
            var msg = decodeURIComponent(message.message.replace(/%0A/ig, '<br />'));
            if (message.cod != user) notifyMe({ "icon": message.img, "title": "Mensagem recebida", "body": msg });
            audio.play();
        }
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
    
    if ((typeof (user) == 'string' && 1 < user.length)) {
        socket.emit("create", {
            room: room,
            user: user,
            ip: ipUsr
        });
        socket.emit('login', { user: user });
    } else {
        this.showErro({ erro: 'Informações incorretas!' });
    }
    messageUsr.addEventListener("keyup", function (event) {
        if (event.keyCode == 13 && event.shiftKey == false) {
            sendMessage();
        }
    });

}

function notifyMe(n) {
    if (Notification.permission !== 'granted')
        Notification.requestPermission();
    else {
        var icon = (n.icon && n.icon.length) ? n.icon : '/images/message-icon.png',
            title = (n.title && n.title.length) ? n.title : 'Notificação Chat',
            body = (n.body && n.body.length) ? n.body.replace(/(<([^>]+)>)/ig, "") : 'bla bla bla';

        var notification = new Notification(title, {
            icon: icon,
            body: body,
        });
        notification.onclick = function () {
            window.focus();
            this.cancel();
        };
    }
}

function renderMessage(message) {
    var msg = decodeURIComponent(message.message.replace(/%0A/ig, '<br />'));
    var data = timeSince(message.date);
    var texto_people = '<div class="d-flex justify-content-start mb-4"><div class="img_cont_msg"><img src="' + message.img + '" class="rounded-circle user_img_msg"></div><div class="msg_cotainer">' + msg + '<span class="msg_time">' + data + '</span></div></div>';
    var text_me = '<div class="d-flex justify-content-end mb-4"><div class="msg_cotainer_send">' +
        msg + '<span class="msg_time_send">' + data + '</span></div><div class="img_cont_msg"><img src="' + message.img + '" class="rounded-circle user_img_msg"></div></div>';

    usrMsg = message.cod != user ? texto_people : text_me;

    document.getElementById("historyMessage").innerHTML += usrMsg;
    var objDiv = document.getElementById("historyMessage");
    objDiv.scrollTop = objDiv.scrollHeight;
}

function loadUsers(users) {
    var userRoom = '';
    for (const user of users) {
        var stsUsr = user.status ? 'online_icon' : 'online_icon offline';
        userRoom += '<li class="row"><div class="img_cont"><img src="' + user.img + '" class="rounded-circle user_img"><span class="' + stsUsr + '"></span></div><div class="user_info"><span>' + user.name + '</span><p>' + user.cargo + '</p></div></li>';
    }
    document.querySelector('#usersRoom').innerHTML = userRoom;
}

function showErro(m) {
    Swal.fire({
        icon: 'error',
        title: 'SISC CHAT',
        html: m.erro,
    })
}

function loadMyPicture(i) {
    document.querySelector('#myPicture').innerHTML = '<img src="' + i + '" class="rounded-circle user_img" /><span class="online_icon"></span>';
}

function sendMessage() {
    var textUsr = document.querySelectorAll("#messageUsr")[0].value;
    var msgUsr = encodeURIComponent(textUsr.replace(/(<([^>]+)>)/ig, ""));
    if (user.length && msgUsr.length > 1) {
        var messageObject = {
            cod: user,
            message: msgUsr,
            room: room,
            ip: ipUsr
        };
        socket.emit("sendMessage", messageObject);
    }
    document.querySelectorAll("#messageUsr")[0].value = '';
}

function dropzoneExists(selector) {
    var elements = $(selector).find('.dz-default');
    return elements.length > 0?true:false;
}

let config_drop = {
    url: "/file-upload",
    maxFiles: 1,
    maxFilesize: 5500,
    timeout: 600000,
    addRemoveLinks: false,
    init: function (e) {
        this.on("complete", function (file) {
            $('.modal').modal('hide')
            this.removeFile(file)
        });
    }
}
let configDropZone = { ...config_drop, ...dropzone_config }

document.getElementById('tipo_arquivo').addEventListener("change", (e) => {
    if (!dropzoneExists('.dropzone') && e.target.value != null) ($(".dropzone").dropzone(configDropZone), $('.fallback').removeClass('d-none'));
})