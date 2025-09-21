"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const node_path_1 = require("node:path");
(0, dotenv_1.config)({ path: (0, node_path_1.resolve)('./config/.env.development') });
const modules_1 = require("./modules");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = require("express-rate-limit");
const error_response_js_1 = require("./utils/response/error.response.js");
const connection_db_1 = __importDefault(require("./DB/connection.db"));
const s3_config_1 = require("./utils/multer/s3.config");
const node_util_1 = require("node:util");
const node_stream_1 = require("node:stream");
const createS3WriteStreamPipe = (0, node_util_1.promisify)(node_stream_1.pipeline);
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
    app.use('/auth', modules_1.authController);
    app.use('/user', modules_1.userController);
    app.use('/post', modules_1.postController);
    app.get("/upload/pre-signed/*path", async (req, res) => {
        const { downloadName, download = "false" } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const url = await (0, s3_config_1.createGetPreSignedUploadLink)({ Key, download, downloadName: downloadName });
        return res.json({ message: 'done', data: url });
    });
    app.get("/upload/*path", async (req, res) => {
        const { downloadName, download = "false" } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const s3Response = await (0, s3_config_1.getFile)({ Key });
        if (!s3Response?.Body) {
            throw new error_response_js_1.BadRequestException("fail to fetch this asset");
        }
        if (download == "true") {
            res.setHeader("Content-Disposition", `attachment; filename="${downloadName || Key.split('/').pop()}"`);
        }
        res.setHeader("Content-type", `${s3Response.ContentType}`);
        return await createS3WriteStreamPipe(s3Response.Body, res);
    });
    app.use('{/*dummy}', (req, res) => {
        return res.status(404).json({ message: `invalid routing ❌❌` });
    });
    app.use(error_response_js_1.globalErrorHandling);
    app.listen(port, () => {
        console.log(`app is running at port ${port}`);
    });
};
exports.default = bootstrap;
