import "dotenv/config";
import createError from "http-errors";
import { Kafka, CompressionTypes, logLevel } from 'kafkajs';

const {
    SYSTEM: system,
    CLIENT: client,
    KAFKA_CLIENTID: clientId,
    KAFKA_TOPIC_RECEIVED: topic,
    KAFKA_TOPIC_SAP_RESPONSE: topic_sap_fi
} = process.env;
const brokers = process.env.KAFKA_BROKER.split(',');

// Generate Kafka instence
const kafka = new Kafka({
    logLevel: logLevel.NOTHING,
    brokers,
    clientId
});

// Producer
const producer = kafka.producer();

// Response from SAP
const runSapResponse = (reqBody) => {
    return new Promise(async (resolve, reject) => {
        try {
            await producer.connect();
            const respKafka = await producer.send({
                topic: topic_sap_fi,
                compression: CompressionTypes.GZIP,
                messages: [{
                    key: Date.now().toString() + Math.random().toString().split('.')[1],
                    value: JSON.stringify(reqBody),
                    headers: {
                        SYSTEMID: system,
                        CLIENT: client,
                    }
                }]
            });
            await producer.disconnect();
            resolve(respKafka);
        } catch (error) {
            await producer.disconnect();
            reject(createError(500, error.message)); // Internal Server Error
        }
    })
}

//Run Producer Versapay
const runVersapay = (sap_fi_docs) => {
    return new Promise(async (resolve, reject) => {
        const resp = {};
        const messages = [];
        sap_fi_docs.forEach(fiDoc => {
            messages.push({
                key: Date.now().toString() + Math.random().toString().split('.')[1],
                value: JSON.stringify(fiDoc),
                headers: {
                    SYSTEMID: system,
                    CLIENT: client,
                }
            })
        });
        try {
            await producer.connect();
            resp.producer = await producer.send({
                topic,
                messages,
                compression: CompressionTypes.GZIP
            });
            await producer.disconnect();
            resolve(resp);
        } catch (error) {
            await producer.disconnect();
            reject(createError(500, error.message)); // Internal Server Error
        }
    })
}

const errorTypes = ['unhandledRejection', 'uncaughtException']
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2']

errorTypes.forEach(type => {
    process.on(type, async () => {
        try {
            console.log(`process.on ${type}`)
            await producer.disconnect()
            process.exit(0)
        } catch (_) {
            process.exit(1)
        }
    })
})

signalTraps.forEach(type => {
    process.once(type, async () => {
        try {
            await producer.disconnect()
        } finally {
            process.kill(process.pid, type)
        }
    })
})

export { runSapResponse, runVersapay };
