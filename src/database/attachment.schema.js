'use strict';

import mongoose from "mongoose";

export default new mongoose.Schema({
    attachmentId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    data: { type: String, required: true }
}, { versionKey: false });
