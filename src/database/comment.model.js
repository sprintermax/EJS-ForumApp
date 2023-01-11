'use strict';

import mongoose from "mongoose";

import attachmentSchema from "./attachment.schema.js";

export default mongoose.model('comments', new mongoose.Schema({
    commentId: { type: String, required: true, unique: true },
    postId: { type: String, required: true },
    author: { type: String, required: true },
    createdDate: { type: Date, default: Date.now },
    content: {
        message: { type: String, required: true }
        //attachments: [attachmentSchema]
    }
}, { versionKey: false }));
