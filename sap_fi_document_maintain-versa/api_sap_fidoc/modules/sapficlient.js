import "dotenv/config";
import createError from "http-errors";
import crypto from "crypto";
import noderfc from "node-rfc";
import abapsystem from "./abapsystem.js";
import SchemaJoi from "../schema/sapfischema.js";
import sendEmail from "./sendemail.js";
import {
    fiDocModel,
    fiDocuConf,
    fiDocuAlert,
    newObjectId
} from "../model/fipostingstatus.js";

const rfcClient = noderfc.Client;

export default class sapClient {
    // SAP Client
    #abapClient

    // Constructor Method
    constructor(req) {
        // create new sap-client 
        this.#abapClient = new rfcClient(abapsystem(req));
    }

    // Payload Schema validation
    GeneratePayloadHash({ confirmCode, emailAlert, requestBody }) {
        return new Promise(async (resolve, reject) => {
            try {
                // Calling createHash method - updating data - Encoding to be used
                const hashKey = crypto.createHash('sha256')
                    .update(JSON.stringify(requestBody))
                    .digest('hex');

                if (hashKey) {
                    if (confirmCode) {
                        // Upsert Kafka Confirmation Code Entry 
                        await fiDocuConf.findOneAndUpdate(
                            { _id: confirmCode },
                            { $set: { hashKey } },
                            { upsert: true, new: true }
                        )
                    }

                    const FiDocStatus = await fiDocModel.findById(hashKey);
                    if (!FiDocStatus) {
                        // Upsert HASH Entry Log
                        await fiDocModel.findOneAndUpdate(
                            { _id: hashKey },
                            {
                                $set: {
                                    requestBody,
                                    emailAlert,
                                    statusCode: 100,
                                    bapiReturn: null,
                                    changeDate: Date.now()
                                }
                            },
                            { upsert: true, new: true }
                        )
                    }
                    resolve({ hashKey });
                }
            } catch (error) {
                reject(createError(400, error.message)); // Bad Request
            }
        })
    }

    // During Reprocess :: Get Confirmation Code & Hash Key
    getConfCodeHashKey(reqBody) {
        return new Promise(async (resolve, reject) => {
            try {
                if (reqBody) {
                    // Hash Key
                    if (reqBody?.hashKey) resolve({ hashKey: reqBody?.hashKey });

                    // Confirmation Code
                    if (reqBody?.confirmCode) {
                        const sapfiDocuConf = await fiDocuConf.findById(reqBody?.confirmCode);
                        if (sapfiDocuConf) {
                            resolve({ hashKey: sapfiDocuConf?.hashKey })
                        } else {
                            reject(createError(400, `${reqBody?.confirmCode} Not Found`))
                        }
                    }
                } else {
                    reject(createError(400, "Query Parameters required : 'hashKey' or 'confirmCode'"));
                }
            } catch (error) {
                reject(createError(400, error.message));
            }
        })
    }

    // Hash-Payload validation and duplicate Check
    ValidatePayloadHash({ hashKey }) {
        return new Promise(async (resolve, reject) => {
            try {
                let FiDocStatus = await fiDocModel.findById(hashKey);
                if (FiDocStatus) {
                    // No-SAP Posting Status: "201 Success", "102 Processing" and "406 Critical"
                    const noProcessCodes = [201, 102, 406];
                    if (noProcessCodes.includes(FiDocStatus?.statusCode)) {
                        // Set Body Empty for No-SAP Posting
                        FiDocStatus.requestBody = null;
                        resolve(FiDocStatus);
                    }

                    // Prepare For SAP Processing: "100 New" and "400 Error" 
                    const yesProcessCodes = [100, 400];
                    let {
                        requestBody,
                        statusCode,
                        bapiReturn
                    } = FiDocStatus;

                    // Schema validatiopn for the "New" Payload
                    if (yesProcessCodes.includes(statusCode)) {
                        const { error, value } = SchemaJoi?.FiPostingPayload?.validate(requestBody);
                        if (error) {
                            // Important: Do not Send to SAP for Posting
                            statusCode = 406; // Cannot Process further
                            requestBody = null;
                            // Prepare BAPI Return
                            bapiReturn = [{
                                TYPE: "E",
                                ID: "MS",
                                NUMBER: 999,
                                MESSAGE: error?.message
                            }];
                        } else {
                            if (value) requestBody = value;
                            statusCode = 102; // Processing
                        }

                        // Upsert HASH Entry Log
                        let FiDocStatus_final = await fiDocModel.findOneAndUpdate(
                            { _id: hashKey },
                            {
                                $set: {
                                    statusCode,
                                    bapiReturn,
                                    changeDate: Date.now()
                                }
                            },
                            { upsert: true, new: true }
                        );

                        FiDocStatus_final.requestBody = requestBody;
                        resolve(FiDocStatus_final);
                    }
                } else {
                    reject(createError(400, "No Data Found!"));
                }
            } catch (error) {
                reject(createError(400, error.message)); // Internal Server Error
            }
        })
    }

    // sap Accounting Document posting
    sap_fi_document_post(sapFiDocStatus) {
        return new Promise(async (resolve, reject) => {
            try {
                // SAP FI Document in Processing Status
                if (sapFiDocStatus?.statusCode === 102 && sapFiDocStatus.requestBody) {
                    // Prepare BAPI/RFC parameters
                    let sapBapi = this.#prepareBapi(sapFiDocStatus.requestBody);

                    // Trigger sap BAPI Asynchonous
                    sapBapi.ID = sapFiDocStatus._id;
                    sapBapi.PROSTAT = "B"; // Run BGRFC

                    // BAPI Account Document Posting
                    await this.#abapClient.open();
                    await this.#abapClient.call("ZFI_ACC_DOCUMENT_POST", sapBapi);
                    await this.#abapClient.close();
                    resolve(sapBapi);
                }
                // Response
                resolve({
                    _id: sapFiDocStatus?._id,
                    creationDate: sapFiDocStatus?.creationDate,
                    statusCode: sapFiDocStatus?.statusCode,
                    bapiReturn: sapFiDocStatus?.bapiReturn,
                    changeDate: sapFiDocStatus?.changeDate,
                    key: sapFiDocStatus?.key,
                    sys: sapFiDocStatus?.sys,
                    type: sapFiDocStatus?.type
                })
            } catch (error) {
                reject(createError(400, error.message)); // Internal Server Error
            }
        })
    }

    // Prepare RFC/BAPI Parameters
    #prepareBapi(fiDocPayload) {
        const bapiParameters = {
            ACCOUNTGL: [],
            ACCOUNTRECEIVABLE: [],
            ACCOUNTPAYABLE: [],
            ACCOUNTTAX: [],
            CURRENCYAMOUNT: [],
            CLEARING: []
        };
        // Header Data 
        bapiParameters.DOCUMENTHEADER = fiDocPayload.Header;
        // Item Data
        fiDocPayload.Items.forEach(item => {
            // Prepare G/L account item
            if (item.General_Ledger) {
                item.General_Ledger.ITEMNO_ACC = item.Item_Number;
                // if (!bapiParameters.ACCOUNTGL) bapiParameters.ACCOUNTGL = [];
                bapiParameters.ACCOUNTGL.push(item.General_Ledger);
            }
            // Prepare Customer Item
            if (item.Customer) {
                item.Customer.ITEMNO_ACC = item.Item_Number;
                // if (!bapiParameters.ACCOUNTRECEIVABLE) bapiParameters.ACCOUNTRECEIVABLE = [];
                bapiParameters.ACCOUNTRECEIVABLE.push(item.Customer);
            }
            // Prepare Customer Clearing Item
            if (item.CustomerClearing) {
                // if (!bapiParameters.CLEARING) bapiParameters.CLEARING = [];
                // bapiParameters.CLEARING = item.CustomerClearing;
                item.CustomerClearing.forEach(row => bapiParameters.CLEARING.push(row));
            }
            // Prepare Vendor Item
            if (item.Vendor) {
                item.Vendor.ITEMNO_ACC = item.Item_Number;
                // if (!bapiParameters.ACCOUNTPAYABLE) bapiParameters.ACCOUNTPAYABLE = [];
                bapiParameters.ACCOUNTPAYABLE.push(item.Vendor);
            }
            // Prepare Tax item
            if (item.Tax) {
                item.Tax.ITEMNO_ACC = item.Item_Number;
                // if (!bapiParameters.ACCOUNTTAX) bapiParameters.ACCOUNTTAX = [];
                bapiParameters.ACCOUNTTAX.push(item.Tax);
            }
            // Prepare Currency Items
            if (item.Currency) {
                item.Currency.ITEMNO_ACC = item.Item_Number;
                // if (!bapiParameters.CURRENCYAMOUNT) bapiParameters.CURRENCYAMOUNT = [];
                bapiParameters.CURRENCYAMOUNT.push(item.Currency);
            }
        });
        return bapiParameters;
    }

    // Updating Status From SAP
    updatePostingStatus(reqBody) {
        return new Promise(async (resolve, reject) => {
            try {
                // Check if Bapi response has any error
                const ifError = reqBody?.RETURN ? reqBody?.RETURN.find((e) => e.TYPE === "E") : null;

                // Prepare Final Data                
                const sapFiDocStatus = {
                    bapiReturn: reqBody?.RETURN,
                    key: reqBody?.KEY,
                    type: reqBody?.TYPE,
                    sys: reqBody?.SYS,
                    changeDate: Date.now(),
                    statusCode: ifError ? 400 : 201,
                }

                // Finally Upsert Data
                const fiDocModelNew = await fiDocModel.findOneAndUpdate(
                    { _id: reqBody?.ID },
                    { $set: sapFiDocStatus },
                    { upsert: true, new: true }
                );

                const textlines = [];

                // Success: In case of No Error
                if (!ifError && fiDocModelNew?.requestBody?.Items.length > 0) {
                    // Update Long Text
                    fiDocModelNew?.requestBody?.Items.forEach((item, indx) => {
                        let ltext = "";

                        if (item?.General_Ledger?.ITEM_TEXT) ltext = item?.General_Ledger?.ITEM_TEXT;
                        if (item?.Customer?.ITEM_TEXT) ltext = item?.Customer?.ITEM_TEXT;
                        if (item?.Vendor?.ITEM_TEXT) ltext = item?.Vendor?.ITEM_TEXT;

                        if (ltext.length > 50) {
                            const tdname = fiDocModelNew?.key.slice(10, 14)
                                + fiDocModelNew?.key.slice(0, 10)
                                + fiDocModelNew?.key.slice(14, 18)
                                + Number(item?.Item_Number).toString().padStart(3, '0');

                            for (let i = 0; i < ltext.length; i += 132) {
                                textlines.push({
                                    TDOBJECT: "DOC_ITEM",
                                    TDNAME: tdname,
                                    TDID: "0001",
                                    TDSPRAS: "EN",
                                    COUNTER: (indx + 1).toString().padStart(3, '0'),
                                    TDFORMAT: "*",
                                    TDLINE: ltext.substring(i, (i + 132))
                                })
                            }
                        }
                    });

                    if (textlines.length > 0) {
                        // SAP Update Long Text
                        await this.#abapClient.open();
                        await this.#abapClient.call("RFC_SAVE_TEXT", { TEXT_LINES: textlines });
                        await this.#abapClient.close();
                    }
                }

                // Send email alert in case of error posting
                if (ifError && fiDocModelNew?.emailAlert) {
                    await sendEmail({
                        compcode: fiDocModelNew?.requestBody?.Header?.COMP_CODE,
                        creationDate: fiDocModelNew?.creationDate,
                        hashKey: fiDocModelNew?._id,
                        bapiReturn: fiDocModelNew?.bapiReturn
                    });
                }
                resolve("Status Updated Successfully.");

            } catch (error) {
                reject(createError(500, error.message)); // Internal Server Error
            }
        })
    }

    // Query Confirmation Validation
    GetFiDocuConfsValidate(reqQuery) {
        return new Promise(async (resolve, reject) => {
            try {
                const sapFiDocQuery = await SchemaJoi.getFiDocuQuery.validateAsync(reqQuery);
                resolve(sapFiDocQuery);
            } catch (error) {
                reject(createError(400, error.message)); //Server Error
            }
        })
    }

    QueryFiDocuConfs(reqQuery) {
        return new Promise(async (resolve, reject) => {
            try {
                const match = {};
                const pagination = {};
                Object.keys(reqQuery).forEach(e => {
                    const regexQry = { $regex: new RegExp(reqQuery[e], 'i') };
                    switch (e) {
                        case 'confirmCode':
                            match['_id'] = regexQry
                            break;

                        case 'creationDate':
                            const start = new Date(Number(reqQuery[e].split('-')[0])); // Past Date
                            const end = new Date(Number(reqQuery[e].split('-')[1])); // Recent Date
                            match['creationDate'] = { $lte: new Date(end.toGMTString()), $gte: new Date(start.toGMTString()) };
                            break;

                        case 'statusCode':
                            match['fidocus.statusCode'] = Number(reqQuery[e])
                            break;

                        case 'key':
                            match['fidocus.key'] = regexQry
                            break;

                        case 'COMP_CODE':
                            match['fidocus.requestBody.Header.COMP_CODE'] = regexQry
                            break;

                        case 'DOC_TYPE':
                            match['fidocus.requestBody.Header.DOC_TYPE'] = regexQry
                            break;

                        case 'DOC_DATE':
                            match['fidocus.requestBody.Header.DOC_DATE'] = regexQry
                            break;

                        case 'PSTNG_DATE':
                            match['fidocus.requestBody.Header.PSTNG_DATE'] = regexQry
                            break;

                        case 'HEADER_TXT':
                            match['fidocus.requestBody.Header.HEADER_TXT'] = regexQry
                            break;

                        case 'REF_DOC_NO':
                            match['fidocus.requestBody.Header.REF_DOC_NO'] = regexQry
                            break;

                        case 'page':
                            pagination.page = reqQuery[e];
                            break;

                        case 'limit':
                            pagination.limit = reqQuery[e];
                            break;
                    }
                });

                const lookup = {
                    from: "fidocus",
                    localField: "hashKey",
                    foreignField: "_id",
                    as: "fidocus"
                }

                const count = await fiDocuConf.aggregate([
                    { $lookup: lookup },
                    { $match: match },
                    { $count: "rows" },
                ]);

                pagination.totalPages = count[0]?.rows ? Math.ceil(count[0]?.rows / pagination.limit) : 1;

                const skip = ((pagination.page - 1) * pagination.limit);

                const fiDocuConfs = await fiDocuConf.aggregate([
                    { $lookup: lookup },
                    { $match: match },
                    { $sort: { creationDate: -1 } },
                    { $skip: skip },
                    { $limit: pagination.limit },
                ]);

                pagination.pages = this.pageNumbers({ max: 10, ...pagination });
                resolve({ ...pagination, fiDocuConfs });
            } catch (error) {
                reject(createError(400, error.message)); //Server Error
            }
        })
    }

    pageNumbers({ totalPages, max, page }) {
        const half = Math.floor(max / 2);
        let to = max;
        if (page + half >= totalPages) {
            to = totalPages;
        } else if (page > half) {
            to = page + half;
        }
        let from = Math.max(to - max, 0);
        return Array.from({ length: Math.min(totalPages, max) }, (_, i) => (i + 1) + from);
    }

    // Email Alert Query Parameter Validations 
    GetFiDocuAlertValidate(reqQuery) {
        return new Promise(async (resolve, reject) => {
            try {
                const sapFiDocAlert = await SchemaJoi.getfiDocuAlert.validateAsync(reqQuery);
                resolve(sapFiDocAlert);
            } catch (error) {
                reject(createError(400, error.message)); //Server Error
            }
        })
    }

    // Email Alert Query
    GetFiDocuAlert(reqQuery) {
        return new Promise(async (resolve, reject) => {
            try {
                const fiDocusAlert = await fiDocuAlert.find(reqQuery);
                resolve(fiDocusAlert);
            } catch (error) {
                reject(createError(400, error.message)); //Server Error
            }
        })
    }

    // Email Alert Post Body Validations     
    ValidateSavefiDocuAlert(reqBody) {
        return new Promise(async (resolve, reject) => {
            try {
                // Validate the parameters & Values
                const sapFiDoc = await SchemaJoi.SavefiDocuAlert.validateAsync(reqBody);
                resolve(sapFiDoc);
            } catch (error) {
                reject(createError(400, error.message)); // Internal Server Error
            }
        })
    }

    //Email Alert Post Body Save       
    SavefiDocuAlert(reqBody) {
        return new Promise(async (resolve, reject) => {
            try {
                const fiDocuAlert_new = await fiDocuAlert.findOneAndUpdate(
                    { _id: reqBody._id || newObjectId() },
                    { $set: reqBody },
                    { upsert: true, new: true }
                )
                resolve(fiDocuAlert_new);
            } catch (error) {
                reject(createError(400, error.message)); // Internal Server Error
            }
        })
    }

    //Email Alert Post Body Save      
    DeleteFiDocuAlert(reqQuery) {
        return new Promise(async (resolve, reject) => {
            try {
                const fiDocusAlert = await fiDocuAlert.deleteOne(reqQuery);
                resolve(fiDocusAlert);
            } catch (error) {
                reject(createError(400, error.message)); //Server Error
            }
        })
    }

}
