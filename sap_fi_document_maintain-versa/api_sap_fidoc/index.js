import "dotenv/config";
import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import logger from "morgan";
import helmet from "helmet";
import createError from "http-errors";
import mongoose from "mongoose";
import accountdocument from "./routes/accountdocument.js";

const dbuser = process.env.MONGO_INITDB_ROOT_USERNAME;
const dbpass = process.env.MONGO_INITDB_ROOT_PASSWORD;
const dbhost = process.env.MONGODB_HOST;
const mongodb_url = `mongodb://${dbuser}:${dbpass}@${dbhost}/${dbuser}?authSource=admin`;
mongoose.set('strictQuery', true);
mongoose.connect(mongodb_url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Mongo DB Connected'))
    .catch((err) => console.error(err));

const app = express();

// all environments
app.disable("x-powered-by");
app.set("port", process.env.PORT || 3000);
app.use(helmet());
app.use(logger("dev"));
app.use(
    session({
        resave: true,
        saveUninitialized: true,
        secret: process.env.APISECRET,
    }));
app.use(cookieParser());
app.use(express.json({
    limit: "10mb"
}));
app.use(express.urlencoded({
    extended: true
}));

app.use("/AccountDocument", accountdocument);

// When any Invalid Path Provided
app.use((req, res, next) => {
    next(createError(404, `Path '${req.path}' Not found`));
});

// An error handling middleware
app.use((error, req, res, next) => {
    res.status(error.status || 500).send({ Error: error.message });
});

// Instantiate the server
const port = app.get("port");
app.listen(port, () => console.log(`Server listening on port ${port}`));
