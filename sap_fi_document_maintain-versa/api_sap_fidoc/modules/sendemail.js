import "dotenv/config";
import fs from "node:fs";
import axios from "axios";
import { fiDocuConf, fiDocuAlert } from "../model/fipostingstatus.js";

//Prepare html Body
const emailhtmlbody = ({ compcode, creationDate, hashKey, bapiReturn }) => {
    return new Promise(async (resolve) => {
        const msgtype = {
            S: "Success",
            E: "Error",
            W: "Warning",
            I: "Info",
            A: "Abort"
        }
        const creationdate = new Date(creationDate);
        let tr = `<tr><td><b>Company&nbsp;</b></td><td>${compcode}</td></tr>`;
        tr = `${tr}<tr><td><b>Date</b></td><td>${creationdate.toLocaleString()}</td></tr>`;
        tr = `${tr}<tr><td><b>Hash#</b></td><td>${hashKey}</td></tr>`;
        // Get Confirmation Code
        const confcode = await fiDocuConf.find({ hashKey });
        if (confcode) {
            confcode.forEach(cc => {
                tr = `${tr}<tr><td><b>Confirmation Code&nbsp;</b></td><td>${cc._id}</td></tr>`;
            });
        }
        tr = `${tr}<tr><td><b>&nbsp;</b></td><td>&nbsp;</td></tr>`;
        if (bapiReturn) {
            bapiReturn.forEach(bapi => {
                tr = `${tr}<tr><td><b>${msgtype[bapi.TYPE]}</b></td><td>${bapi.MESSAGE}&nbsp;</td></tr>`;
            });
        }
        resolve(tr);
    })
}

// Send Email Alert
const sendEmail = ({ compcode, creationDate, hashKey, bapiReturn }) => {
    return new Promise(async (resolve) => {
        if (compcode) {
            // Prepare Email Configuration
            const fiDocusAlert = await fiDocuAlert.find({ Comp: compcode });
            if (fiDocusAlert) {
                const emails = fiDocusAlert.map(e => e.Email);
                const toEmail = emails.join(";");
                const emailSubject = `SAP-FI Document Posting Status for Company Code ${compcode}`;
                // BAPI Return as Email html body
                const tr = await emailhtmlbody({ compcode, creationDate, hashKey, bapiReturn });
                let htmlbody = fs.readFileSync("./files/email_body_template.html", "utf8");
                htmlbody = htmlbody.replace("%bapimessage%", tr);
                // Email Template for Posting in PO
                let emailTemplate = fs.readFileSync('./files/email_template.xml', 'utf8');
                emailTemplate = emailTemplate.replace("%toEmail%", toEmail);
                emailTemplate = emailTemplate.replace("%subject%", emailSubject);
                emailTemplate = emailTemplate.replace("%htmlContent%", htmlbody);
                // Send Email
                try {
                    const response = await axios({
                        url: process.env.PIPO_EMAIL_URL,
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/xml',
                        },
                        auth: {
                            username: process.env.PIPO_EMAIL_USR,
                            password: process.env.PIPO_EMAIL_PWD
                        },
                        data: emailTemplate
                    });
                    resolve('Email Sent.');
                } catch (error) {
                    resolve(error.message);
                }
            } else {
                resolve("No email configuration found!");
            }
        } else {
            resolve("Header Company Code Missing!");
        }
    })
}

export default sendEmail;