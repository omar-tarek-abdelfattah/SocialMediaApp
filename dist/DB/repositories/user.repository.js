"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const database_repository_1 = require("./database.repository");
class UserRepository extends database_repository_1.DatabaseRepository {
    model;
    constructor(model) {
        super(model);
        this.model = model;
    }
    async createUser({ data, options }) {
        return await this.model.create(data, options);
    }
}
exports.UserRepository = UserRepository;
