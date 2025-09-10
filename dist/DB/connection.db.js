"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const User_model_1 = require("./models/User.model");
const connectDB = async () => {
    const localConnection = process.env.LOCAL_DB_URI;
    try {
        await (0, mongoose_1.connect)(`${localConnection}`);
        console.log(`connected to DB successfully 🚀`);
        await User_model_1.UserModel.syncIndexes();
    }
    catch (error) {
        console.log(`failed to connect to DB ❌`);
    }
};
exports.default = connectDB;
