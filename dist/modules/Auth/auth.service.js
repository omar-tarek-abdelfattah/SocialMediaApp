"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AuthenticationService {
    constructor() { }
    signup = (req, res) => {
        let { username, email, password } = req.body;
        console.log(username, email, password);
        return res.status(201).json({ message: "done" });
    };
    login = (req, res) => {
        return res.status(201).json({ message: "done" });
    };
}
exports.default = new AuthenticationService();
