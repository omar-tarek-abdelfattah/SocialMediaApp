import { Request } from 'express'
import multer, { FileFilterCallback } from 'multer'
import { BadRequestException } from '../response/error.response'
import os from 'node:os'
import { v4 as uuid } from 'uuid'

export enum StorageEnum {
    memory = "memory",
    disk = "disk"
}

export const fileValidation = {
    image: [`image/jpeg`, `image/png`, `image/gif`]
}


export const cloudFileUpload = ({
    validation = [],
    storageType = StorageEnum.memory,
    maxSizeMb = 2
}: {
    validation?: string[],
    storageType?: StorageEnum,
    maxSizeMb?: number
}): multer.Multer => {
    const storage = storageType === StorageEnum.memory ? multer.memoryStorage() : multer.diskStorage({
        destination: os.tmpdir()
        , filename: function (req: Request, file: Express.Multer.File, callback) {
            callback(null, `${uuid()}_${file.originalname}`)
        }
    })

    function fileFilter(req: Request, file: Express.Multer.File, callback: FileFilterCallback) {
        if (!validation.includes(file.mimetype)) {

            callback(new BadRequestException(`validation error`, {
                validationErrors: [{ key: `file`, issues: [{ path: 'file ', message: `invalid file format` }] }]
            }))
        }
        return callback(null, true)
    }
    return multer({
        fileFilter, limits: {
            fileSize: maxSizeMb * 1024 * 1024
        }, storage: storage
    })
}
