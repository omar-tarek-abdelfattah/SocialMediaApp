import { EventEmitter } from 'node:events'
import { deleteFile, getFile } from './s3.config'
import { UserRepository } from '../../DB/repositories/user.repository'
import { UserModel } from '../../DB/models/User.model'

export const s3Event = new EventEmitter({})

s3Event.on("trackProfileImageUpload", (data) => {
    setTimeout(async () => {
        const user = new UserRepository(UserModel)
        try {
            await getFile({ Key: data.key })

            await user.updateOne({
                filter: {
                    _id: data.userId
                },
                update: {
                    $unset: { tempProfileImage: 1 }
                }
            })

            await deleteFile({ Key: data.oldKey })
            console.log(`done s3 event <3`);
        } catch (error: any) {
            console.log(error);

            if (error.Code === "NoSuchKey") {
                await user.updateOne({
                    filter: {
                        _id: data.userId
                    },
                    update: {
                        profileImage: data.oldKey,
                        $unset: { tempProfileImage: 1 }
                    }
                })
            }
        }
    }, data.expiresIn || Number(process.env.AWS_PRE_SIGNED_URL_EXPIRES_IN))
})

