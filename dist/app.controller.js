"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const node_path_1 = require("node:path");
(0, dotenv_1.config)({ path: (0, node_path_1.resolve)('./config/.env.development') });
const auth_controller_1 = __importDefault(require("./modules/Auth/auth.controller"));
const user_controller_1 = __importDefault(require("./modules/User/user.controller"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = require("express-rate-limit");
const error_response_js_1 = require("./utils/response/error.response.js");
const connection_db_1 = __importDefault(require("./DB/connection.db"));
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 60 * 60000,
    limit: 2000,
    message: { error: "Too many Requests, try again later" },
    statusCode: 429
});
const bootstrap = () => {
    const port = process.env.PORT || 5000;
    const app = (0, express_1.default)();
    app.use(limiter);
    app.use(express_1.default.json(), (0, cors_1.default)(), (0, helmet_1.default)());
    (0, connection_db_1.default)();
    app.get('/', (req, res) => {
        res.json({ message: `welcome to ${process.env.APPLICATION_NAME} ❤️👌` });
    });
    app.use('/auth', auth_controller_1.default);
    app.use('/user', user_controller_1.default);
    app.use('{/*dummy}', (req, res) => {
        return res.status(404).json({ message: `invalid routing ❌❌` });
    });
    app.use(error_response_js_1.globalErrorHandling);
    app.listen(port, () => {
        console.log(`app is running at port ${port}`);
    });
};
exports.default = bootstrap;
