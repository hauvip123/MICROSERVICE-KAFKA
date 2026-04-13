import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: "kafka-service",
    brokers: ["localhost:9094"]
});

const admin = kafka.admin();

async function run() {
    await admin.connect();
    await admin.createTopics({
        topics: [
            {
                topic: "order-sucessful",
            },
            {
                topic: "payment-sucessful",
            }
        ],
    });
    await admin.disconnect();
}
run().catch(console.error);