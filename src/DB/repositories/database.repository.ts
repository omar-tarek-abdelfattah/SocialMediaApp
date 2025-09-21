import {
    CreateOptions,
    DeleteResult,
    FlattenMaps,
    HydratedDocument,
    Model,
    MongooseUpdateQueryOptions,
    ProjectionType,
    QueryOptions,
    RootFilterQuery,
    Types,
    UpdateQuery,
    UpdateWriteOpResult
} from "mongoose";

export type Lean<T> = HydratedDocument<FlattenMaps<T>>

export abstract class DatabaseRepository<Tdocument> {
    constructor(protected readonly model: Model<Tdocument>) {

    }

    async insertMany({ data }: {
        data: Partial<Tdocument>[]
    }): Promise<HydratedDocument<Tdocument>[] | undefined> {
        return await this.model.insertMany(data) as HydratedDocument<Tdocument>[]
    }
    async create({ data, options }: {
        data: Partial<Tdocument>[],
        options?: CreateOptions
    }): Promise<HydratedDocument<Tdocument>[] | undefined> {
        return await this.model.create(data, options)
    }


    async deleteOne({ filter }:
        {
            filter: RootFilterQuery<Tdocument>,
        })
        : Promise<DeleteResult> {
        return await this.model.deleteOne(filter)
    }
    async deleteMany({ filter }:
        {
            filter: RootFilterQuery<Tdocument>,
        })
        : Promise<DeleteResult> {
        return await this.model.deleteMany(filter)
    }

    async updateOne({ filter, update, options }:
        {
            filter: RootFilterQuery<Tdocument>,
            update: UpdateQuery<Tdocument>,
            options?: MongooseUpdateQueryOptions<Tdocument>
        })
        : Promise<UpdateWriteOpResult> {

        return await this.model.updateOne(filter, { ...update, $inc: { __v: 1 } }, options)


    }

    async findByIdAndUpdate({ id, update, options = { new: true } }:
        {
            id: Types.ObjectId
            update: UpdateQuery<Tdocument>,
            options?: QueryOptions<Tdocument>
        })
        : Promise<HydratedDocument<Tdocument> | Lean<Tdocument> | null> {

        return await this.model.findByIdAndUpdate(id, { ...update, $inc: { __v: 1 } }, options)


    }
    async findOneAndUpdate({ filter, update, options = { new: true } }:
        {
            filter: RootFilterQuery<Tdocument>
            update: UpdateQuery<Tdocument>,
            options?: QueryOptions<Tdocument>
        })
        : Promise<HydratedDocument<Tdocument> | Lean<Tdocument> | null> {

        return await this.model.findOneAndUpdate(filter, { ...update, $inc: { __v: 1 } }, options)


    }


    async findById({ id, select, options }:
        {
            id: Types.ObjectId,
            select?: ProjectionType<Tdocument>,
            options?: QueryOptions
        })
        : Promise<FlattenMaps<Tdocument> | HydratedDocument<Tdocument> | null> {

        const doc = this.model.findById(id, undefined, options).select(select || '')
        if (options?.lean) {
            doc.lean(options.lean)
        }
        return await doc.exec()
    }

    async findByIdAndDelete({ id, options }:
        {
            id: Types.ObjectId,
            options?: QueryOptions
        })
        : Promise<FlattenMaps<Tdocument> | HydratedDocument<Tdocument> | null> {

        return await this.model.findByIdAndDelete(id, options)

    }
    async findOne({ filter, select, options }:
        {
            filter: RootFilterQuery<Tdocument>,
            select?: ProjectionType<Tdocument>,
            options?: QueryOptions
        })
        : Promise<FlattenMaps<Tdocument> | HydratedDocument<Tdocument> | null> {

        const doc = this.model.findOne(filter, undefined, options).select(select || '')
        if (options?.lean) {
            doc.lean(options.lean)
        }
        return await doc.exec()
    }
    async find({ filter, select, options }:
        {
            filter: RootFilterQuery<Tdocument>,
            select?: ProjectionType<Tdocument>,
            options?: QueryOptions
        })
        : Promise<FlattenMaps<Tdocument>[] | HydratedDocument<Tdocument>[] | null> {

        const doc = this.model.find(filter, undefined, options).select(select || '')
        if (options?.lean) {
            doc.lean(options.lean)
        }
        return await doc.exec()
    }


}