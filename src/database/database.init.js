'use strict';

import mongoose from "mongoose";

mongoose.connect(process.env.MONGODB_URL, /* Config.MongoDB.ConnectionOptions*/);

const db = mongoose.connection;

db.on("error", (err) => console.error(err));

db.once("open", () => {
    console.log('[CONNECTION] Conectado a database com sucesso.\n');
});

export default db;
