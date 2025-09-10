import { Schema, model, models, Types, HydratedDocument } from "mongoose";

export enum GenderEnum {
    male = "male",
    female = "female"
}
export enum roleEnum {
    admin = "admin",
    user = "user"
}
export enum providerEnum {
    system = "system",
    google = "google"
}

export interface IUser {
    _id: Types.ObjectId,
    username: string,
    firstName?: string,
    lastName?: string,
    password: string,
    email: string,

    profileImage?: string,
    coverImages?: string[],

    createdAt: Date,
    changeCredentialsTime?: Date,
    updatedAt: Date,
    gender: GenderEnum,
    role: roleEnum,

    confirmEmail?: Date,
    confirmEmailOtp?: string,
    resetPasswordOtp?: string,
    phone?: string,
    address?: string,
    provider?: providerEnum
}

const userSchema = new Schema<IUser>({
    firstName: { type: String, required: true, minLength: 2, maxLength: 25 },
    lastName: { type: String, required: true, minLength: 2, maxLength: 25 },
    email: { type: String, required: true, unique: true },
    password: {
        type: String, required: function () {
            return this.provider === providerEnum.google ? false : true
        }
    },

    profileImage: { type: String },
    coverImages: [String],


    gender: { type: String, enum: GenderEnum, default: GenderEnum.male },
    role: { type: String, enum: roleEnum, default: roleEnum.user },
    provider: { type: String, enum: providerEnum, default: providerEnum.system },

    changeCredentialsTime: Date,
    phone: String,
    address: String,
    confirmEmail: Date,
    resetPasswordOtp: String,
    confirmEmailOtp: String,
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

userSchema.virtual('username').set(function (value: string) {
    const [firstName, lastName] = value.split(" ") || []
    this.set({ firstName, lastName })
}).get(function () {
    return this.firstName + " " + this.lastName
})


export const UserModel = models.User || model<IUser>('User', userSchema)
export type HUserDocument = HydratedDocument<IUser>