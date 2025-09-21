import { Schema, model, models, Types, HydratedDocument } from "mongoose";
import { generateHash } from "../../utils/security/hash.security";
import { emailEvent } from "../../utils/events/email.event";

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
    tempProfileImage?: string,
    coverImages?: string[],

    createdAt: Date,
    changeCredentialsTime?: Date,
    updatedAt: Date,
    gender: GenderEnum,
    role: roleEnum,

    confirmEmail?: Date,
    freezedAt?: Date,
    freezedBy?: Types.ObjectId,
    restoredAt?: Date,
    restoredBy?: Types.ObjectId,
    confirmEmailOtp?: string,
    resetPasswordOtp?: string,
    phone?: string,
    address?: string,
    provider?: providerEnum

    twoFA_Activated?: boolean
    twoFA_Otp?: string,
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
    tempProfileImage: String,


    gender: { type: String, enum: GenderEnum, default: GenderEnum.male },
    role: { type: String, enum: roleEnum, default: roleEnum.user },
    provider: { type: String, enum: providerEnum, default: providerEnum.system },

    freezedBy: { type: Schema.Types.ObjectId, ref: "User" },
    restoredBy: { type: Schema.Types.ObjectId, ref: "User" },
    restoredAt: Date,
    freezedAt: Date,
    changeCredentialsTime: Date,
    phone: String,
    address: String,
    confirmEmail: Date,
    resetPasswordOtp: String,
    confirmEmailOtp: String,
    twoFA_Activated: { type: Boolean, default: false },
    twoFA_Otp: String
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictQuery: true
})

userSchema.virtual('username').set(function (value: string) {
    const [firstName, lastName] = value.split(" ") || []
    this.set({ firstName, lastName })
}).get(function () {
    return this.firstName + " " + this.lastName
})


userSchema.pre("save", async function (this: HUserDocument & { wasNew: boolean, confirmEmailPlainOtp?: string }, next) {
    this.wasNew = this.isNew
    if (this.isModified("password")) {
        this.password = await generateHash(this.password)
    }

    if (this.isModified("confirmEmailOtp")) {
        this.confirmEmailPlainOtp = this.confirmEmailOtp as string
        this.confirmEmailOtp = await generateHash(this.confirmEmailOtp as string)
    }

    next()
})

userSchema.post("save", async function (doc, next) {
    const that = this as HUserDocument & { wasNew: boolean, confirmEmailPlainOtp?: string }
    if (that.wasNew && that.confirmEmailPlainOtp) {
        emailEvent.emit("confirmEmail", { to: this.email, otp: that.confirmEmailPlainOtp })
    }

    next()
})


userSchema.pre(["find", 'findOne'], function (next) {
    const query = this.getQuery()

    if (query.paranoid === false) {
        this.setQuery({ ...query })
    } else {
        this.setQuery({ ...query, freezedAt: { $exists: false } })
    }

    next()
})


export const UserModel = models.User || model<IUser>('User', userSchema)
export type HUserDocument = HydratedDocument<IUser>