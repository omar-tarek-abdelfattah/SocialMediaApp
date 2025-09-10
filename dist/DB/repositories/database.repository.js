"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseRepository = void 0;
class DatabaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create({ data, options }) {
        return await this.model.create(data, options);
    }
    async updateOne({ filter, update, options }) {
        return await this.model.updateOne(filter, { ...update, $inc: { __v: 1 } }, options);
    }
    async findOne({ filter, select, options }) {
        const doc = this.model.findOne(filter, undefined, options).select(select || '');
        if (options?.lean) {
            doc.lean(options.lean);
        }
        return await doc.exec();
    }
}
exports.DatabaseRepository = DatabaseRepository;
