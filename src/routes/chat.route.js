'use strict';

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { body as validateBody, validationResult } from 'express-validator';

import userModel from '../database/user.model.js';
import messageModel from '../database/message.model.js';

import authMiddleware from '../misc/auth.middleware.js'

const router = express.Router();

// Chat GET Route

router.get("/chat", authMiddleware(), function (req, res) {
    res.render("chat");
});



// Message GET Route

router.get("/message", authMiddleware(), function (req, res) {
    res.render("message");
});

// Message POST Route

router.post("/message", authMiddleware(),
    validateBody('receiver', 'Você precisa especificar um usuário.').notEmpty(),
    validateBody('message', 'A mensagem não pode estar em branco.').notEmpty(),
    validateBody('message', 'A mensagem deve ser menor que 512 caracteres.').isLength({ min: 1, max: 512 }),
    function (req, res) {

        const errors = validationResult(req).errors;

        if (errors.length > 0) return res.render("message", { errors: errors });
        if (req.body.receiver === req.user.nickName) return res.render("message", { errors: [{ msg: "Você não pode enviar uma mensagem a você mesmo!" }] });
        userModel.findOne({ nickName: req.body.receiver }, function (err, user) {
            if (err) throw err;
            if (!user) return res.render("message", { notFound: "Usuário não encontrado na database" });
            const message = new messageModel({
                messageId: uuidv4(),
                receiver: user.userId,
                author: req.user.userId,
                content: {
                    message: req.body.message
                }
            });

            message.save(function (err) {
                if (err) throw err;
                res.render("message", { msgSuccess: true, receiver: req.body.receiver });
            });
        });
    }
);



// Show Message GET Route

router.get("/show-message/:messageId", authMiddleware(), function (req, res) {
    messageModel.findOne({ messageId: req.params.messageId }, function (err, message) {
        if (message === null || req.user.userId !== message.receiver) return res.redirect("/");
        userModel.findOne({ userId: message.author }, function (err, user) {
            if (err) throw err;
            res.render("show-message", { message: message, messageAuthor: user });
        });
    });
});



// Remove Message GET Route

router.get("/remove/message/:messageId", authMiddleware(), function (req, res) {
    messageModel.findOne({ messageId: req.params.messageId }, function (err, message) {
        if (message === null || req.user.userId !== message.receiver) return res.redirect("/");
        messageModel.findOneAndDelete({ messageId: message.messageId }, function (err, message) {
            res.redirect("/profile");
        });
    });
});

export default router;
