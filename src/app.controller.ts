// setup env
import { config } from 'dotenv'
import { resolve } from 'node:path'
config({ path: resolve('./config/.env.development') })

// load express & types
import type { Request, Express, Response } from 'express';
import authController from './modules/Auth/auth.controller'
import express from 'express';

// third party middleware
import cors from 'cors'
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit'
import { globalErrorHandling } from './utils/response/error.response.js';

const limiter = rateLimit({
    windowMs: 60 * 60000,
    limit: 2000,
    message: { error: "Too many Requests, try again later" },
    statusCode: 429
})


// app start-point
const bootstrap = (): void => {
    const port: number | string = process.env.PORT || 5000
    const app: Express = express()

    // global app middlewares
    app.use(limiter)
    app.use(express.json(), cors(), helmet())

    // app routing

    app.get('/', (req: Request, res: Response) => {
        res.json({ message: `welcome to ${process.env.APPLICATION_NAME} ❤️👌` })
    })
    // sub-app-routing modules
    app.use('/auth', authController)
    // app.use('/users')


    // invalid routing
    app.use('{/*dummy}', (req: Request, res: Response) => {
        return res.status(404).json({ message: `invalid routing ❌❌` })
    })

    // error handling global
    app.use(globalErrorHandling)

    // start server 

    app.listen(port, () => {
        console.log(`app is running at port ${port}`);
    })
};


export default bootstrap