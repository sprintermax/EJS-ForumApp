$(function () {
    const socket = io();
    const m = document.getElementById("message");
    const nickName = document.getElementById("handle").innerText;

    $("form").submit(function () {
        if (!$("#message").val().replace(' ', '')) return false;
        socket.emit("chat_msg", nickName + ": " + $("#message").val());
        $("#message").val("");
        return false;
    });

    m.addEventListener("keypress", function () {
        socket.emit("typing_start", nickName);
    });

    socket.on("connect", function () {
        socket.emit("user_add", nickName);
    });

    socket.on("chat_msg", function (msg) {
        const messageArray = msg.split(':');
        const senderName = messageArray.shift();
        const messageText = messageArray.join(':');
        document.getElementById("feedback").innerHTML = "";
        $("#output").append($("<p>").html(`<b>${senderName}</b>${messageText ? ': ' + messageText : ''}`));
    });

    socket.on("typing_start", function (data) {
        document.getElementById("feedback").innerHTML =
            "<p><em>" + data + " está digitando...</em></p>";
    });

    socket.on("users_update", function (data) {
        $("#users").empty();
        $.each(data, function (key, value) {
            $("#users").append('<li class="list-group-item">' + key + "</li>");
        });
    });
});
