"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseRepository = void 0;
class DatabaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async insertMany({ data }) {
        return await this.model.insertMany(data);
    }
    async create({ data, options }) {
        return await this.model.create(data, options);
    }
    async deleteOne({ filter }) {
        return await this.model.deleteOne(filter);
    }
    async deleteMany({ filter }) {
        return await this.model.deleteMany(filter);
    }
    async updateOne({ filter, update, options }) {
        return await this.model.updateOne(filter, { ...update, $inc: { __v: 1 } }, options);
    }
    async findByIdAndUpdate({ id, update, options = { new: true } }) {
        return await this.model.findByIdAndUpdate(id, { ...update, $inc: { __v: 1 } }, options);
    }
    async findOneAndUpdate({ filter, update, options = { new: true } }) {
        return await this.model.findOneAndUpdate(filter, { ...update, $inc: { __v: 1 } }, options);
    }
    async findById({ id, select, options }) {
        const doc = this.model.findById(id, undefined, options).select(select || '');
        if (options?.lean) {
            doc.lean(options.lean);
        }
        return await doc.exec();
    }
    async findByIdAndDelete({ id, options }) {
        return await this.model.findByIdAndDelete(id, options);
    }
    async findOne({ filter, select, options }) {
        const doc = this.model.findOne(filter, undefined, options).select(select || '');
        if (options?.lean) {
            doc.lean(options.lean);
        }
        return await doc.exec();
    }
    async find({ filter, select, options }) {
        const doc = this.model.find(filter, undefined, options).select(select || '');
        if (options?.lean) {
            doc.lean(options.lean);
        }
        return await doc.exec();
    }
}
exports.DatabaseRepository = DatabaseRepository;
