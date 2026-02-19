import "dotenv/config";
import Axios from "axios";

const {
    MS_BASE_URL: baseURL,
    MS_PATH_PAYLOAD: FiDocPayload,
    MS_PATH_KAFKAPOSTING: KafkaPosting,
    MS_PATH_POSTINGSTATUS: PostingStatus,
    SAPUSER: username,
    SAPPSW: password
} = process.env;

const axios = Axios.create({
    baseURL,
    timeout: 60000,
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
    },
    auth: { username, password }
});

axios.get(FiDocPayload)
    .then(res => console.log(`Axios Connection: ${res.status}`))
    .catch(error => console.log(`Axios Error Connection: ${error.message}`));

export const sapFiDocPosting = ({ key, value, headers, confirmCode }) => {
    return new Promise(async (resolve, reject) => {
        // Prepare FI Posting Document
        const request = {
            Header: {
                headers: {
                    confirmcode: confirmCode,
                    emailalert: true
                }
            }
        }

        // Prepare request Body
        try {
            request.Body = JSON.parse(value.toString());
        } catch (error) {
            request.Body = {
                value: [value.toString()],
                parsing_error: error.message,
                confirm_code: confirmCode
            }
        }

        // POST data to ESB 
        try {
            const glResponse = await axios.post(KafkaPosting, request.Body, request.Header);
            resolve(glResponse.status);
        } catch (error) {
            reject(new Error(error.message));
        }
    })
}

// Posting data to Endpoint
export const sapFiDocResponse = ({ key, value, headers, confirmcode }) => {
    return new Promise(async (resolve, reject) => {
        const response = {};
        try {
            const sapFiDocReturn = JSON.parse(value.toString());
            const newHeaders = {
                headers: {
                    confirmcode,
                    key,
                    emailalert: true
                }
            };
            // Rturn Document Posting
            const fiResponse = await axios.post(PostingStatus, sapFiDocReturn, newHeaders);
            resolve(fiResponse.status);

        } catch (error) {
            reject(new Error(error.message));
        }
    })
}
