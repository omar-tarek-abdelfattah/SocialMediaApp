"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_security_1 = require("../../utils/security/token.security");
const User_model_1 = require("../../DB/models/User.model");
const user_repository_1 = require("../../DB/repositories/user.repository");
class UserService {
    userModel = new user_repository_1.UserRepository(User_model_1.UserModel);
    constructor() {
    }
    profile = async (req, res) => {
        return res.json({ message: `done`, user: req.user, decoded: req.decoded });
    };
    logout = async (req, res) => {
        const { flag } = req.body;
        const update = {};
        let statusCode = 200;
        switch (flag) {
            case token_security_1.logoutEnum.all:
                update.changeCredentialsTime = new Date();
                break;
            default:
                await (0, token_security_1.createRevokeToken)(req.decoded);
                statusCode = 201;
                break;
        }
        await this.userModel.updateOne({
            filter: {
                _id: req.decoded?._id
            },
            update
        });
        return res.status(statusCode).json({ message: `done` });
    };
    refreshToken = async (req, res) => {
        const credentials = await (0, token_security_1.createLoginCredentials)(req.user);
        await (0, token_security_1.createRevokeToken)(req.decoded);
        return res.status(201).json({ message: 'done', credentials });
    };
}
exports.default = new UserService();
