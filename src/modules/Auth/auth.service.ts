import type { Request, Response } from "express"
import { ISignupBodyInputsDto } from "./auth.dto.js";
// import { BadRequestException } from "../../utils/response/error.response.js"


class AuthenticationService {
    constructor(
        
    ) { }


    /**
     * 
     * @param req -Express.Request
     * @param res -Express.Response
     * @returns Promise<Response>
     * @example({ username, email, password }: ISignupBodyInputsDto)
     * return {message : 'Done' , statusCode:201}
     */
    signup = (req: Request, res: Response): Response => {


        let { username, email, password }: ISignupBodyInputsDto = req.body;
        console.log(username, email, password);


        return res.status(201).json({ message: "done" })
    }

    login = (req: Request, res: Response): Response => {
        return res.status(201).json({ message: "done" })
    }

}

export default new AuthenticationService()