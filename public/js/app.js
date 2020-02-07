
        function dataAtual(dataAtual) {

            var dia = (dataAtual.getDate() < 10 ? "0" : "") + dataAtual.getDate();
            var mes =
                (dataAtual.getMonth() + 1 < 10 ? "0" : "") +
                (dataAtual.getMonth() + 1);
            var ano = dataAtual.getFullYear();
            var hora =
                (dataAtual.getHours() < 10 ? "0" : "") + dataAtual.getHours();
            var minuto =
                (dataAtual.getMinutes() < 10 ? "0" : "") + dataAtual.getMinutes();
            var segundo =
                (dataAtual.getSeconds() < 10 ? "0" : "") + dataAtual.getSeconds();

            var dataFormatada =
                dia +
                "." +
                mes +
                "." +
                ano +
                " " +
                hora +
                ":" +
                minuto +
                ":" +
                segundo;
            return dataFormatada;
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
            $("#my-textarea").val(
                $("#my-textarea").val() +
                "[" +
                message.user +
                "][" +
                message.date +
                "]: " +
                message.message +
                "\n"
            );
        }

        let room = getQueryParams(document.location.search).b;

        socket.on("sendMessage", function (message) {
            renderMessage(message);
        });

        socket.on("previousMessage", function (messages) {
            for (message of messages) {
                renderMessage(message);
            }
        });

        $("#disconectar").on("click", saiu => {
            socket.leave(room);
        });

        $(document).ready(function () {
            socket.emit("create", room);
        });

        $("#chat").submit(function (event) {
            event.preventDefault();

            var user = $("input[name=user]").val();
            var message = $("input[name=message]").val();

            if (user.length && message.length) {
                var messageObject = {
                    user: user,
                    message: message,
                    room: room
                };
                renderMessage(messageObject);
                socket.emit("sendMessage", messageObject);
            }
        });