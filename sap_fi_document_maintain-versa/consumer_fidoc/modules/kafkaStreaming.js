import "dotenv/config";
import { Kafka, logLevel } from 'kafkajs';
import { sapFiDocPosting, sapFiDocResponse } from "./callAxios.js";
import { kafkaRetry } from "./db.js";

const {
    KAFKA_CLIENTID: clientId,
    KAFKA_GROUPID: groupId,
    KAFKA_TOPIC_RECEIVED: topic_gl_received,
    KAFKA_TOPIC_SAP_RESPONSE: topic_sap_response
} = process.env;
const brokers = process.env.KAFKA_BROKER.split(',');
const topics = [
    topic_gl_received,
    topic_sap_response
];
const fromBeginning = false;

// const timeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));
// const interval = [10000, 60000, 300000, 600000];

const kafka = new Kafka({
    logLevel: logLevel.NOTHING,
    brokers,
    clientId,
    retry: {
        maxRetryTime: 60000 // 1 min
    }
});

const consumer = kafka.consumer({ groupId });
const getConfirmCode = (partition, offset, timestamp) => {
    const tmp_date = new Date(Number(timestamp));
    const ddate = tmp_date.getFullYear() * 1e4 + (tmp_date.getMonth() + 1) * 1e2 + tmp_date.getDate() + '';
    return `${partition}_${offset}_${ddate}`;
}

// Consumers
const runConsumer = async () => {
    await consumer.connect()
    await consumer.subscribe({ topics, fromBeginning })
    await consumer.run({
        eachBatch: async ({
            batch,
            resolveOffset,
            heartbeat,
            commitOffsetsIfNecessary,
            uncommittedOffsets,
            isRunning,
            isStale,
            pause
        }) => {
            for (let message of batch.messages) {
                if (!isRunning() || isStale()) break;

                const topic = batch.topic;
                const { key, value, headers } = message;
                const confirmCode = getConfirmCode(batch.partition, message.offset, message.timestamp);

                try {
                    switch (topic) {
                        case topic_gl_received: // Standard GL-Posting / Nemayoo / Centric - Received
                            const glStatus = await sapFiDocPosting({ key, value, headers, confirmCode });
                            console.log(`[${topic}] [${confirmCode}] [${glStatus}]`);
                            break;

                        case topic_sap_response: // Update Received from SAP: GL Posting Status
                            const sapStatus = await sapFiDocResponse({ key, value, headers, confirmCode });
                            console.log(`[${topic}] [${confirmCode}] [${sapStatus}]`);
                            break;

                        default: // Do Nothing                            
                            break;
                    }

                } catch (error) {
                    const kjsRetry = await kafkaRetry.findOneAndUpdate(
                        { _id: confirmCode },
                        {
                            $inc: {
                                retry: 1
                            },
                            $set: {
                                error: error.message
                            }
                        },
                        { upsert: true, new: true }
                    );
                    console.log(`[${topic}] [${confirmCode}] [${kjsRetry?.retry} Due To ${error.message}]`);
                    if (kjsRetry.retry < 4) {
                        throw error;
                    }
                }

                // Resolve Offsets
                resolveOffset(message.offset);
                await heartbeat();
            }
        }
    })
}

const errorTypes = ['unhandledRejection', 'uncaughtException']
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2']

errorTypes.forEach(type => {
    process.on(type, async e => {
        try {
            console.log(`process.on ${type}`)
            console.error(e)
            await consumer.disconnect()
            process.exit(0)
        } catch (_) {
            process.exit(1)
        }
    })
})

signalTraps.forEach(type => {
    process.once(type, async () => {
        try {
            await consumer.disconnect()
        } finally {
            process.kill(process.pid, type)
        }
    })
})

export default runConsumer;