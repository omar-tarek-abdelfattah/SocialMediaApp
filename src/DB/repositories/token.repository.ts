import { DatabaseRepository } from "./database.repository"
import { IToken as Tdocument } from "../models/Token.model"
import { Model } from "mongoose"


export class TokenRepository extends DatabaseRepository<Tdocument> {
    constructor(protected override readonly model: Model<Tdocument>) {
        super(model)
    }

    
}