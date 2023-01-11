'use strict';

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { body as validateBody, validationResult } from 'express-validator';


import userModel from '../database/user.model.js';
import postModel from '../database/post.model.js';
import commentModel from '../database/comment.model.js';

import authMiddleware from '../misc/auth.middleware.js'

const router = express.Router();

// Post GET Route

router.get("/post", authMiddleware(), function (req, res) {
    res.render("post");
});



// Post POST Route

router.post("/post", authMiddleware(),
    validateBody('postTitle', 'O título não pode estar em branco.').notEmpty(),
    validateBody('postTitle', 'O título deve ser menor que 70 caracteres.').isLength({ min: 1, max: 70 }),
    validateBody('postMessage', 'A mensagem não pode estar em branco.').notEmpty(),
    validateBody('postMessage', 'A mensagem deve ser menor que 2048 caracteres.').isLength({ min: 1, max: 2048 }),
    function (req, res) {

        const errors = validationResult(req).errors;

        if (errors.length > 0) return res.render("post", { errors: errors });
        const post = new postModel({
            postId: uuidv4(),
            author: req.user.userId,
            content: {
                title: req.body.postTitle,
                message: req.body.postMessage
            }
        });

        post.save(function (err) {
            if (err) throw err;
            res.redirect("/");
        });
    }
);



// Show Post GET Route

router.get("/show-post/:postId", function (req, res) {
    postModel.findOne({ postId: req.params.postId }, function (err, post) {
        if (err) throw err;
        if (post === null) return res.redirect("/");
        const allUsers = [];
        commentModel.find({ postId: req.params.postId }, function (err, comments) {
            if (err) throw err;
            allUsers.push(post.author);
            comments.forEach(comment => {
                if (allUsers.indexOf(comment.author) === -1) allUsers.push(comment.author);
                if (allUsers.indexOf(comment.receiver) === -1) allUsers.push(comment.receiver);
            });
            userModel.find({ userId: { $in: allUsers } }, function (err, users) {
                if (err) throw err;
                if (comments === null) return res.render("show-post", { post: post, users: users });
                res.render("show-post", { post: post, comments: comments, users: users })
            });
        });
    });
});



// Remove Post GET Route

router.get("/remove/:postId", authMiddleware(), function (req, res) {
    postModel.findOne({ postId: req.params.postId }, function (err, post) {
        if (err) throw err;
        if (post === null || req.user.userId !== post.author) return res.redirect("/");
        postModel.findOneAndDelete({ postId: post.postId }, function (err) {
            if (err) throw err;
            res.redirect("/");
        });
    });
});



// Comment POST Route

router.post("/comment/:postId", authMiddleware(),
    validateBody('commentMessage', 'O comentário não pode estar em branco.').notEmpty(),
    validateBody('commentMessage', 'O comentário deve ser menor que 2048 caracteres.').isLength({ min: 1, max: 2048 }),
    function (req, res) {

        const errors = validationResult(req).errors;
        if (errors.length > 0) return res.redirect("/");
        const comment = new commentModel({
            commentId: uuidv4(),
            postId: req.params.postId,
            author: req.user.userId,
            content: {
                message: req.body.commentMessage
            }
        });

        comment.save(function (err) {
            if (err) throw err;
            res.redirect(`/show-post/${comment.postId}`);
        });
    }
);



// Remove Comment GET Route

router.get("/comment/remove/:commentId", authMiddleware(), function (req, res) {
    commentModel.findOne({ commentId: req.params.commentId }, function (err, comment) {
        if (err) throw err;
        if (comment === null || req.user.nickName !== comment.author) return res.redirect("back");

        commentModel.findOneAndDelete({ commentId: comment.commentId }, function (err) {
            if (err) throw err;
            res.redirect("back");
        });
    });
});

export default router;
