import { Request, Response } from "express";
import { ILogoutBodyInput } from "./user.dto";
import { createLoginCredentials, createRevokeToken, logoutEnum } from "../../utils/security/token.security";
import { UpdateQuery } from "mongoose";
import { HUserDocument, IUser, UserModel } from "../../DB/models/User.model";
import { UserRepository } from "../../DB/repositories/user.repository";
import { JwtPayload } from "jsonwebtoken";


class UserService {
    private userModel = new UserRepository(UserModel)
    // private tokenModel = new TokenRepository(TokenModel)
    constructor() {

    }

    profile = async (req: Request, res: Response): Promise<Response> => {


        return res.json({ message: `done`, user: req.user, decoded: req.decoded })
    }



    logout = async (req: Request, res: Response): Promise<Response> => {

        const { flag }: ILogoutBodyInput = req.body
        const update: UpdateQuery<IUser> = {}
        let statusCode: number = 200



        switch (flag) {
            case logoutEnum.all:
                update.changeCredentialsTime = new Date()
                break;

            default:
                await createRevokeToken(req.decoded as JwtPayload)
                statusCode = 201
                break;
        }

        await this.userModel.updateOne({
            filter: {
                _id: req.decoded?._id
            },
            update
        })

        return res.status(statusCode).json({ message: `done` })
    }


    refreshToken = async (req: Request, res: Response): Promise<Response> => {

        const credentials = await createLoginCredentials(req.user as HUserDocument)
        await createRevokeToken(req.decoded as JwtPayload)

        return res.status(201).json({ message: 'done', credentials })
    }

}

export default new UserService()