import "dotenv/config";
import mongoose from "mongoose";
import runConsumer from "./modules/kafkaStreaming.js";

const dbuser = process.env.MONGO_INITDB_ROOT_USERNAME;
const dbpass = process.env.MONGO_INITDB_ROOT_PASSWORD;
const dbhost = process.env.MONGODB_HOST;
const mongodb_url = `mongodb://${dbuser}:${dbpass}@${dbhost}/${dbuser}?authSource=admin`;
mongoose.set('strictQuery', true);
mongoose.connect(mongodb_url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Mongo DB Connected'))
    .catch((err) => console.error(err));

runConsumer().catch(error => console.error(`[MS-API/receiver] ${error.message}`, e));