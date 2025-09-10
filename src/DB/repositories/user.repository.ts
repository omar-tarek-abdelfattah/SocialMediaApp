import { CreateOptions, HydratedDocument, Model } from "mongoose";
import { IUser as Tdocument } from "../models/User.model";
import { DatabaseRepository } from "./database.repository";

export class UserRepository extends DatabaseRepository<Tdocument> {
    constructor(protected override readonly model: Model<Tdocument>) {
        super(model)
    }

    async createUser({ data, options }: {
        data: Partial<Tdocument>[],

        options?: CreateOptions
    }): Promise<HydratedDocument<Tdocument>[] | undefined> {

        return await this.model.create(data, options)
    }

}