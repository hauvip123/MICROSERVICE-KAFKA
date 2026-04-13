import express from "express";
import cors from "cors"
import { Kafka } from "kafkajs";
const app = express();
app.use(cors({
    origin: "http://localhost:3000"
}));
app.use(express.json());
const kafka = new Kafka({
    clientId: "payment-service",
    brokers: ["localhost:9094"]
});
const producer = kafka.producer();
const connectToKafka = async () => {
    try {
        await producer.connect();
        console.log("Payment service connected to Kafka");
    } catch (error) {
        console.log("Payment service failed to connect to Kafka", error);
    }
}
app.post("/payment-service", async (req, res) => {
    const { cart } = req.body;
    const userId = "123";
    await producer.send({
        topic: "payment-sucessful",
        messages: [
            { value: JSON.stringify({ cart, userId }) },
        ],
    });
    res.status(200).json({ message: "Payment successful" });
});
app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).send("Something went wrong!");
});
app.listen(8000, () => {
    connectToKafka();
    console.log("Payment service is running on port 8000");
});