import "dotenv/config";
import fs from "node:fs";
import express from "express";
import createError from "http-errors";
import axios from "axios";
import { verifytoken, resetToken } from "../modules/auth.js";
import sapficlient from "../modules/sapficlient.js";
import { runSapResponse, runVersapay } from "../modules/streaming.js";

const router = express.Router();

// Scope
const all = {
    read: 'all:read',
    write: 'all:write'
};

// Account Document Posting Structure
router.get("/Posting/Payload", (req, res, next) => {
    try {
        const fiPayload = JSON.parse(
            fs.readFileSync("files/payloadDescription.json")
        );
        res.status(200).send(fiPayload);
    } catch (error) {
        res.status(400).send(createError(500, error.message));
    }
});

// Bearer token: Signing into the application
router.post("/SignIn", (req, res, next) => {
    if (req.body) {
        axios.post(process.env.JWTLOGIN, req.body)
            .then((axios_res) => {
                res.cookie(process.env.TOKEN, axios_res.data.token, { maxAge: process.env.TOKENEXTEND })
                    .status(axios_res.status)
                    .send(axios_res.data);
            }).catch((axios_err) => {
                res.status(axios_err.response.status)
                    .send(axios_err.response.data)
            })
    } else {
        next(createError(401, "Authentication failed: Wrong username/password!"));
    }
});

// SAP FI Document Posting 
router.post("/KafkaPosting", verifytoken, resetToken, (req, res, next) => {
    const fiDoc = {
        confirmCode: req.headers?.confirmcode,
        emailAlert: req.headers?.emailalert,
        requestBody: req.body
    }
    // SAP Fi Document Posting
    const sapFi = new sapficlient(req);
    sapFi.GeneratePayloadHash(fiDoc)
        .then((sapFiDoc) => sapFi.ValidatePayloadHash(sapFiDoc))
        .then((sapFiDoc) => sapFi.sap_fi_document_post(sapFiDoc))
        .then((sapFiDoc) => res.status(200).send(sapFiDoc))
        .catch((error) => next(error));
});

// Reprocess Posting Data
router.post("/RePosting", verifytoken, resetToken, (req, res, next) => {
    if (req[`${process.env.TOKEN}`]['scopes'].includes(all.write)) {
        const sapFi = new sapficlient(req);
        sapFi.getConfCodeHashKey(req.body)
            .then((sapFiDoc) => sapFi.ValidatePayloadHash(sapFiDoc))
            .then((sapFiDoc) => sapFi.sap_fi_document_post(sapFiDoc))
            .then(sapFiDoc => res.status(200).send(sapFiDoc))
            .catch(error => next(error));
    } else {
        next(createError(403, "Access Denied! You Don’t Have Permission."))
    }
});

// SAP Updating Posting Status to Kafka topic
router.post("/PostingUpdate", verifytoken, resetToken, (req, res, next) => {
    runSapResponse(req.body)
        .then(resPayload => res.status(200).send(resPayload))
        .catch(error => next(error));
});

// SAP Updating Posting Status to SAP
router.post("/PostingStatus", verifytoken, resetToken, (req, res, next) => {
    const sapFi = new sapficlient(req);
    sapFi.updatePostingStatus(req.body)
        .then(resPayload => res.status(200).send(resPayload))
        .catch(error => next(error));
});

// Query FI Document Posting Status
router.get("/FiDocuConf", verifytoken, resetToken, (req, res, next) => {
    if (req[`${process.env.TOKEN}`]['scopes'].includes(all.read)) {
        const sapFi = new sapficlient(req);
        sapFi.GetFiDocuConfsValidate(req.query)
            .then(reqQuery => sapFi.QueryFiDocuConfs(reqQuery))
            .then(resPayload => res.status(200).send(resPayload))
            .catch(error => next(error));
    } else {
        next(createError(403, "Access Denied! You Don’t Have Permission."))
    }
});

// FI Posting Alert Query
router.get("/FiPostingAlert", verifytoken, resetToken, (req, res, next) => {
    if (req[`${process.env.TOKEN}`]['scopes'].includes(all.read)) {
        const sapFi = new sapficlient(req);
        sapFi.GetFiDocuAlertValidate(req.query)
            .then(reqQuery => sapFi.GetFiDocuAlert(reqQuery))
            .then(resPayload => res.status(200).send(resPayload))
            .catch(error => next(error));
    } else {
        next(createError(403, "Access Denied! You Don’t Have Permission."))
    }
});

// FI Posting Alert Save
router.post("/FiPostingAlert", verifytoken, resetToken, (req, res, next) => {
    if (req[`${process.env.TOKEN}`]['scopes'].includes(all.write)) {
        const sapFi = new sapficlient(req);
        sapFi.ValidateSavefiDocuAlert(req.body)
            .then(resBody => sapFi.SavefiDocuAlert(resBody))
            .then(resPayload => res.status(200).send(resPayload))
            .catch(error => next(error));
    } else {
        next(createError(403, "Access Denied! You Don’t Have Permission."))
    }
});

// FI Posting Alert Delete
router.delete("/FiPostingAlert", verifytoken, resetToken, (req, res, next) => {
    if (req[`${process.env.TOKEN}`]['scopes'].includes(all.write)) {
        const sapFi = new sapficlient(req);
        sapFi.GetFiDocuAlertValidate(req.query)
            .then(reqQuery => sapFi.DeleteFiDocuAlert(reqQuery))
            .then(resPayload => res.status(200).send(resPayload))
            .catch(error => next(error));
    } else {
        next(createError(403, "Access Denied! You Don’t Have Permission."))
    }
});

export default router;