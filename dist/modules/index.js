"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postController = exports.authController = exports.userController = void 0;
var User_1 = require("./User");
Object.defineProperty(exports, "userController", { enumerable: true, get: function () { return User_1.router; } });
var Auth_1 = require("./Auth");
Object.defineProperty(exports, "authController", { enumerable: true, get: function () { return Auth_1.router; } });
var Post_1 = require("./Post");
Object.defineProperty(exports, "postController", { enumerable: true, get: function () { return Post_1.router; } });
