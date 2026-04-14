import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: "analytic-service",
    brokers: ["localhost:9094"]
});
const consumer = kafka.consumer({ groupId: "analytic-service" });
const connectToKafka = async () => {
    try {
        await consumer.connect();
        await consumer.subscribe({ topic: 'payment-successful', fromBeginning: true })
        await consumer.subscribe({ topic: 'order-successful', fromBeginning: true })
        await consumer.subscribe({ topic: 'email-successful', fromBeginning: true })
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                switch (topic) {
                    case "payment-successful": {
                        const value = message.value.toString();
                        const { userId, cart } = JSON.parse(value);
                        const total = cart.reduce((acc, item) => acc + item.price, 0);
                        console.log(`User ${userId} spent ${total}`);
                        break;
                    }
                    case "order-successful": {
                        const value2 = message.value.toString();
                        const { userId, orderId } = JSON.parse(value2);
                        console.log(`User ${userId} placed order ${orderId}`);
                        break;
                    }
                    case "email-successful": {
                        const value3 = message.value.toString();
                        const { userId, emailId } = JSON.parse(value3);
                        console.log(`User ${userId} sent email ${emailId}`);
                        break;
                    }
                    default:
                        break;
                }
            },
        });
    } catch (error) {
        console.log("Analytic service failed to connect to Kafka", error);
    }
}
connectToKafka();