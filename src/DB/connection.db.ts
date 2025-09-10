import { connect } from "mongoose"
import { UserModel } from "./models/User.model";


const connectDB = async () => {
    const localConnection = process.env.LOCAL_DB_URI
    // const AtlasConnection = process.env.ATLAS_DB_URI

    try {
        await connect(`${localConnection}`)
        console.log(`connected to DB successfully 🚀`);

        await UserModel.syncIndexes()

    } catch (error) {
        console.log(`failed to connect to DB ❌`);

    }
}


export default connectDB