// setup env
import { config } from 'dotenv'
import { resolve } from 'node:path'
config({ path: resolve('./config/.env.development') })

// load express & types
import type { Request, Express, Response } from 'express';
import { authController, userController, postController } from './modules'
import express from 'express';

// third party middleware
import cors from 'cors'
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit'
import { BadRequestException, globalErrorHandling } from './utils/response/error.response.js';
import connectDB from './DB/connection.db';
import { createGetPreSignedUploadLink, getFile } from './utils/multer/s3.config';

import { promisify } from 'node:util'
import { pipeline } from 'node:stream'
const createS3WriteStreamPipe = promisify(pipeline)

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

    // DB connection
    connectDB()

    // app routing

    app.get('/', (req: Request, res: Response) => {
        res.json({ message: `welcome to ${process.env.APPLICATION_NAME} ❤️👌` })
    })
    // sub-app-routing modules
    app.use('/auth', authController)
    app.use('/user', userController)
    app.use('/post', postController)

    app.get("/upload/pre-signed/*path", async (req: Request, res: Response): Promise<Response> => {
        const { downloadName, download = "false" } = req.query as {
            downloadName?: string,
            download?: string
        }
        const { path } = req.params as unknown as { path: string[] }

        const Key = path.join("/")
        const url = await createGetPreSignedUploadLink({ Key, download, downloadName: downloadName as string })

        return res.json({ message: 'done', data: url })


    })
    app.get("/upload/*path", async (req: Request, res: Response): Promise<void> => {
        const { downloadName, download = "false" } = req.query as {
            downloadName?: string,
            download?: string
        }
        const { path } = req.params as unknown as { path: string[] }

        const Key = path.join("/")
        const s3Response = await getFile({ Key })

        if (!s3Response?.Body) {
            throw new BadRequestException("fail to fetch this asset")
        }
        if (download == "true") {
            res.setHeader("Content-Disposition", `attachment; filename="${downloadName || Key.split('/').pop()}"`)
        }

        res.setHeader("Content-type", `${s3Response.ContentType}`)
        return await createS3WriteStreamPipe(s3Response.Body as NodeJS.ReadableStream, res)
    })
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