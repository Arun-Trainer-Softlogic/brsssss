import "dotenv/config";
import { expressjwt } from "express-jwt";
import JwksRsa from "jwks-rsa";
import createError from "http-errors";
import noderfc from "node-rfc";
import abapsystem from "./abapsystem.js";

const rfcClient = noderfc.Client;

// Extract Tocken from Header
const extractTokenFromHeader = (req) => {
    if (req.cookies[`${process.env.TOKEN}`]) {
        return req.cookies[`${process.env.TOKEN}`];
    } else if (req?.headers?.authorization && req?.headers?.authorization.split(" ")[0] === "Bearer") {
        return req?.headers?.authorization.split(" ")[1];
    }
    return null;
};

// Verify Tocken
const verifytoken = (req, res, next) => {
    if (req?.headers?.authorization && req?.headers?.authorization.split(" ")[0] === "Basic") {
        //create new sap-client for user authentication
        const abapClient = new rfcClient(abapsystem(req));
        abapClient.connect((err) => err ? next(createError(401, err.message)) : next())
    } else {
        return expressjwt({ //Token Based Authentication
            secret: JwksRsa.expressJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: process.env.JWTLINK,
            }),
            getToken: () => extractTokenFromHeader(req),
            requestProperty: process.env.TOKEN,
            algorithms: ["RS256"],
        }).unless({})(req, res, next);
    }
};

//Extend Token
const resetToken = (req, res, next) => {
    const gltoken = extractTokenFromHeader(req);
    if (gltoken) {
        res.cookie(
            process.env.TOKEN,
            gltoken,
            { maxAge: process.env.TOKENEXTEND }
        );
    }
    next();
};

export { verifytoken, resetToken };