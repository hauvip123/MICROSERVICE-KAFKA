import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: "email-service",
    brokers: ["localhost:9094"]
});
const producer = kafka.producer()
const consumer = kafka.consumer({ groupId: "email-service" });
const connectToKafka = async () => {
    try {
        await producer.connect();
        await consumer.connect();
        await consumer.subscribe({ topic: "order-successful", fromBeginning: true });
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const value = message.value.toString();
                const { userId, orderId } = JSON.parse(value);
                const dumyEmailId = "123456789"
                console.log(`Order ${dumyEmailId} has been sent to user ${userId}`);
                await producer.send({
                    topic: "email-successful",
                    messages: [
                        { value: JSON.stringify({ userId, emailId: dumyEmailId }) }
                    ]
                })
            },
        });
    } catch (error) {
        console.log("Analytic service failed to connect to Kafka", error);
    }
}
connectToKafka();