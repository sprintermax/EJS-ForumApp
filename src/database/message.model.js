'use strict';

import mongoose from "mongoose";

import attachmentSchema from "./attachment.schema.js";

export default mongoose.model('messages', new mongoose.Schema({
    messageId: { type: String, required: true, unique: true },
    author: { type: String, required: true },
    receiver: { type: String, required: true },
    createdDate: { type: Date, default: Date.now },
    content: {
        message: { type: String, required: true }
        //attachments: [attachmentSchema]
    }
}, { versionKey: false }));
