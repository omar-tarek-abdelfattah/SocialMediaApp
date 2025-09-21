import { type HydratedDocument, model, models, Schema, Types } from "mongoose";

export enum LikeActionEnum {
    like = "like",
    unlike = "unlike"
}

export enum AllowCommentsEnum {
    allow = "allow",
    deny = "deny"
}
export enum AvailabilityEnum {
    public = "public",
    friends = "friends",
    onlyMe = "only-me"
}
export interface IPost {
    content?: string;
    attachments?: string[];
    accessFolderId: string;

    allowComment: AllowCommentsEnum;
    availability: AvailabilityEnum;

    tags?: Types.ObjectId[];
    likes?: Types.ObjectId[];


    createdBy: Types.ObjectId;

    freezedBy?: Types.ObjectId;
    freezedAt?: Date;

    restoredBy?: Types.ObjectId;
    restoredAt?: Date;

    createdAt?: Date;
    updatedAt?: Date;
}

const postSchema = new Schema<IPost>({
    content: {
        type: String, minLength: 2, maxLength: 500000, required: function () {
            return !this.attachments?.length
        }
    },
    attachments: [String],
    accessFolderId: { type: String, required: true },

    allowComment: { type: String, enum: AllowCommentsEnum, default: AllowCommentsEnum.allow },
    availability: { type: String, enum: AvailabilityEnum, default: AvailabilityEnum.public },

    tags: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],


    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    freezedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    freezedAt: Date,

    restoredBy: { type: Schema.Types.ObjectId, ref: 'User' },
    restoredAt: Date,

}, {
    timestamps: true,
    strictQuery: true
})

export type HPostDocument = HydratedDocument<IPost>



postSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
    const query = this.getQuery()

    if (query.paranoid === false) {
        this.setQuery({ ...query })
    }
    else {
        this.setQuery({ ...query, freezedAt: { $exists: false } })
    }

    next()
})
export const PostModel = models.Post || model<IPost>("Post", postSchema)