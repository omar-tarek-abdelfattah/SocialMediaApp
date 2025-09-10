import {
    CreateOptions,
    FlattenMaps,
    HydratedDocument,
    Model,
    MongooseUpdateQueryOptions,
    ProjectionType,
    QueryOptions,
    RootFilterQuery,
    UpdateQuery,
    UpdateWriteOpResult
} from "mongoose";

export abstract class DatabaseRepository<Tdocument> {
    constructor(protected readonly model: Model<Tdocument>) {

    }

    async create({ data, options }: {
        data: Partial<Tdocument>[],
        options?: CreateOptions
    }): Promise<HydratedDocument<Tdocument>[] | undefined> {
        return await this.model.create(data, options)
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


}