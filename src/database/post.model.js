'use strict';

import mongoose from "mongoose";

import attachmentSchema from "./attachment.schema.js";

export default mongoose.model('posts', new mongoose.Schema({
    postId: { type: String, required: true, unique: true },
    author: { type: String, required: true },
    createdDate: { type: Date, default: Date.now },
    content: {
        title: { type: String, required: true },
        message: { type: String, required: true }
        //attachments: [attachmentSchema]
    }
}, { versionKey: false }));
