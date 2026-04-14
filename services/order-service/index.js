import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: "order-service",
    brokers: ["localhost:9094"]
});
const producer = kafka.producer()
const consumer = kafka.consumer({ groupId: "order-service" });
const connectToKafka = async () => {
    try {
        await producer.connect();
        await consumer.connect();
        await consumer.subscribe({ topic: "payment-successful", fromBeginning: true });
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const value = message.value.toString();
                const { userId, cart } = JSON.parse(value);
                const dumyOrder = "123456789"
                console.log(`Order ${dumyOrder} has been placed by user ${userId}`);
                await producer.send({
                    topic: "order-successful",
                    messages: [
                        { value: JSON.stringify({ userId, orderId: dumyOrder }) }
                    ]
                })
            },
        });
    } catch (error) {
        console.log("Analytic service failed to connect to Kafka", error);
    }
}
connectToKafka();