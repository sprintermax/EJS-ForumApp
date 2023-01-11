'use strict';

import express from 'express';
import bcrypt from 'bcrypt';
import passport from 'passport';
import { v4 as uuidv4 } from 'uuid';
import { body as validateBody, validationResult } from 'express-validator';

import userModel from '../database/user.model.js';
import postModel from '../database/post.model.js';
import messageModel from '../database/message.model.js';
import commentModel from '../database/comment.model.js';

import authMiddleware from '../misc/auth.middleware.js'

const router = express.Router();

// Login GET Route

router.get("/login", function (req, res) {
    res.render("login");
});



// Login POST Route

router.post("/login", function (req, res, next) {
    passport.authenticate('local', function (err, user, info) {
        if (err) return next(err);
        if (!user) return res.render("login", { errors: [{ msg: "Usuáro não encontrado ou Senha incorreta." }] });

        req.login(user, function (err) {
            if (err) console.log(err);
            res.redirect('/');
        });

    })(req, res, next)
});



// Logout GET Route

router.get("/logout", function (req, res) {
    req.logout(function (err) {
        req.session.destroy();
        if (err) console.log(err);
        res.redirect('/');
    });
});



// Signup GET Route

router.get("/signup", function (req, res) {
    res.render("signup");
});



// Signup POST Route

router.post("/signup", validateBody('nickName', 'O apelido não pode estar em branco.').notEmpty(),
    validateBody('nickName', 'O apelido deve ter entre 3 e 16 caracteres.').isLength({ min: 3, max: 16 }),
    validateBody('nickName', 'O apelido deve conter somente letras, números e "_".')
        .matches(/^[a-z0-9_]{3,}$/, "i"),
    validateBody('firstName', 'O nome não pode estar em branco.').notEmpty(),
    validateBody('firstName', 'O nome deve ter entre 3 e 32 caracteres.').isLength({ min: 3, max: 32 }),
    validateBody('password', 'A senha precisa ter entre 8 e 96 caracteres.').isLength({ min: 8, max: 96 }),
    validateBody('password', 'A senha precisa conter pelo menos um caractere minúsculo, um caractere maiúsculo, um número e um caractere especial.')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.* )(?=.*[^a-zA-Z0-9]).{8,}$/, "i"),
    validateBody('confirmPass', 'As duas senhas não são idênticas.').custom((value, { req }) => value === req.body.password),
    function (req, res) {

        const errors = validationResult(req).errors;

        if (errors.length > 0) return res.render("signup", { errors: errors });
        const user = new userModel({
            userId: uuidv4(),
            firstName: req.body.firstName,
            nickName: req.body.nickName,
            password: bcrypt.hashSync(req.body.password, 10)
        });

        user.save(function (err) {
            if (err) return res.render("signup", { uniqueErrors: err });
            req.login(user, function (err) {
                if (err) console.log(err);
                res.redirect("/");
            });
        });
    }
);



// Profile GET Route

router.get("/profile/", function (req, res) {
    userModel.findOne({ nickName: req.user?.nickName }, function (err, user) {
        if (!user) return res.redirect("/");
        postModel.find({ author: user.userId }, function (err, posts) {
            if (err) throw err;
            if (!req.isAuthenticated() || (req.params?.nickName && req.user.nickName !== req.params.nickName)) return res.render("profile", { user: user, posts: posts });
            messageModel.find({ receiver: user.userId }, function (err, messages) {
                if (err) throw err;
                res.redirect(`/profile/${user.nickName}`);
            });
        });
    });
});

router.get("/profile/:nickName", function (req, res) {
    userModel.findOne({ nickName: req.params.nickName }, function (err, user) {
        if (!user) return res.render("404");
        postModel.find({ author: user.userId }, function (err, posts) {
            if (err) throw err;
            commentModel.find({ author: user.userId }, function (err, comments) {
                if (err) throw err;
                if (!req.isAuthenticated() || req.user.nickName !== req.params.nickName) return res.render("profile", { user: user, posts: posts, comments: comments, users: [] });
                const allUsers = [];
                messageModel.find({ receiver: user.userId }, function (err, messages) {
                    if (err) throw err;
                    allUsers.push(user.userId);
                    messages.forEach(message => {
                        if (allUsers.indexOf(message.author) === -1) allUsers.push(message.author);
                        if (allUsers.indexOf(message.receiver) === -1) allUsers.push(message.receiver);
                    });
                    userModel.find({ userId: { $in: allUsers } }, function (err, users) {
                        if (err) throw err;
                        res.render("profile", { user: user, posts: posts, comments: comments, messages: messages, users: users });
                    });
                });
            });
        });
    });
});



// Edit Profile GET Route

router.get("/profile/:nickName/edit", authMiddleware(), function (req, res) {
    userModel.findOne({ nickName: req.params.nickName }, function (err, user) {
        if (err) throw err;
        if (!user || req.user.nickName !== req.params.nickName) return res.render("404");
        res.render("update", { user: user });
    });
});



// Edit Profile POST Route

router.post("/profile/:nickName/edit", authMiddleware(),
    validateBody('firstName', 'O nome não pode estar em branco.').notEmpty(),
    validateBody('firstName', 'O nome deve ter entre 3 e 32 caracteres.').isLength({ min: 3, max: 32 }),
    validateBody('nickName', 'O apelido não pode estar em branco.').notEmpty(),
    validateBody('nickName', 'O apelido deve ter entre 3 e 16 caracteres.').isLength({ min: 3, max: 16 }),
    validateBody('nickName', 'O apelido deve conter somente letras, números e "_".')
        .matches(/^[a-z0-9_]{3,}$/, "i"),
    function (req, res) {

        const errors = validationResult(req).errors;

        if (errors.length > 0) return res.render("update", { user: req.user, errors: errors });

        userModel.findOne({ nickName: req.body.nickName }, function (err, user) {
            if (err) throw err;
            if (user && user.nickName !== req.user.nickName) return res.render("update", { user: req.user, errors: [{ msg: `${req.body.nickName} não está disponível, escolha outro.` }] });
            userModel.findOneAndUpdate({ nickName: req.params.nickName }, {
                firstName: req.body.firstName,
                nickName: req.body.nickName,
            }, function (err, user) {
                if (err) throw err;
                if (!user || req.user.nickName !== req.params.nickName) return res.render("404");

                res.redirect(`/profile/${req.body.nickName}`);
            });
        });
    });



// Remove User Get Route

router.get("/profile/:nickName/remove", authMiddleware(), function (req, res) {
    if (req.user.nickName !== req.params.nickName) return res.redirect("/");

    userModel.findOneAndDelete({ nickName: req.params.nickName },
        function (err, user) {
            if (err) throw err;
            if (!user || req.user.nickName !== req.params.nickName) return res.redirect("/");
            res.redirect("/logout");
        });
});

passport.serializeUser(function (user, done) {
    done(null, user.userId);
});

passport.deserializeUser(function (id, done) {
    userModel.findOne({ userId: id }, function (err, user) {
        done(err, user);
    });
});

export default router;
