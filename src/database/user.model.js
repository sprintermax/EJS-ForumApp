'use strict';

import mongoose from "mongoose";

import uniqueValidator from "mongoose-unique-validator";

export default mongoose.model('users', new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    nickName: { type: String, required: true, unique: true },
    createdDate: { type: Date, default: Date.now },
    password: { type: String, required: true }
}, { versionKey: false }).plugin(uniqueValidator, {
    message: "{VALUE} não está disponível, escolha outro.",
}));
