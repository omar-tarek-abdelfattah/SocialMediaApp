import { DatabaseRepository } from "./database.repository"
import { IPost as Tdocument } from "../models/Post.model"
import { Model } from "mongoose"


export class PostRepository extends DatabaseRepository<Tdocument> {
    constructor(protected override readonly model: Model<Tdocument>) {
        super(model)
    }

    
}