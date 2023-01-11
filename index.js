'use strict';

import { createServer } from 'http';

import 'dotenv/config';
import express from 'express';
import expressSession from 'express-session';
import { Server } from 'socket.io';
import bcrypt from 'bcrypt';
import bodyParser from 'body-parser';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local'

import db from './src/database/database.init.js';
import postModel from './src/database/post.model.js';
import userModel from './src/database/user.model.js';

import userRoute from './src/routes/user.route.js';
import postRoute from './src/routes/post.route.js';
import chatRoute from './src/routes/chat.route.js';

const app = express();
const httpServer = createServer(app);
const socketIO = new Server(httpServer)

app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('./public'));

app.use(expressSession({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    store: MongoStore.create({
        client: db.getClient()
    })
}));



// Passport Local Strategy

passport.use(new LocalStrategy({ usernameField: 'nickName' },
    function (nickName, password, done) {
        userModel.findOne({ nickName: nickName }, function (err, user) {
            if (!user) return done(null, false, { message: err });
            bcrypt.compare(password, user.password, function (err, response) {
                if (response) return done(null, user);
                else return done(null, false, { message: "Senha Incorreta" });
            })
        });
    })
);



// Passport

app.use(passport.initialize());
app.use(passport.session());



// Global Variables for Views

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    if (req.isAuthenticated()) {
        res.locals.nickName = req.user.nickName;
        res.locals.firstName = req.user.firstName;
    } else res.locals.nickName = "";
    next();
});

app.use('/', userRoute, postRoute, chatRoute);



// Home Route

app.get('/', function (req, res) {
    postModel.find(function (err, posts) {
        if (err) throw err;
        if (posts === null) return res.render('home');
        res.render('home', { posts: posts });
    });
});



// 404 Route

app.get('*', function (req, res) {
    res.render('404');
});



// Socket.io Chat

const nickNames = {};

socketIO.on('connection', function (socket) {
    socket.on('user_add', function (nickName) {
        socket.nickName = nickName;
        nickNames[nickName] = nickName;
        socket.emit('chat_msg', 'Você foi conectado.');
        socket.broadcast.emit('chat_msg', nickName + ' entrou no chat.');
        socketIO.sockets.emit('users_update', nickNames);
    });

    socket.on('chat_msg', function (data) {
        socketIO.sockets.emit('chat_msg', data);
    });

    socket.on("typing_start", function (data) {
        socket.broadcast.emit("typing_start", data);
    });

    socket.on('disconnect', function () {
        socket.broadcast.emit('chat_msg', socket.nickName + ' saiu do chat.');
        delete nickNames[socket.nickName];
        socketIO.sockets.emit('users_update', nickNames);
    });
});

httpServer.listen(process.env.SERVER_PORT || 3000);
