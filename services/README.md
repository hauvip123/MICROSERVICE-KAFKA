# Microservices Overview

Thư mục `services/` chứa toàn bộ phần demo microservice dùng Kafka để mô phỏng flow thanh toán:

`client -> payment-service -> payment-successful -> order-service -> order-successful -> email-service -> email-successful`

Ngoài ra `analytic-service` sẽ lắng nghe toàn bộ các event để log dữ liệu thống kê.

## Cấu trúc thư mục

```text
services/
├── analytic-service/
├── client/
├── email-service/
├── kafka/
├── order-service/
└── payment-service/
```

## Vai trò từng service

### `client`

- Ứng dụng Next.js làm frontend demo.
- Component `src/components/Pay.jsx` gọi `POST http://localhost:8000/payment-service`.
- Port mặc định: `3000`.

### `payment-service`

- Service HTTP duy nhất trong hệ thống.
- Nhận `cart` từ frontend, gán `userId = "123"` và publish event `payment-successful`.
- Dùng Express + KafkaJS.
- Port mặc định: `8000`.

### `order-service`

- Consumer topic `payment-successful`.
- Mô phỏng tạo đơn hàng với `orderId = "123456789"`.
- Publish tiếp event `order-successful`.

### `email-service`

- Consumer topic `order-successful`.
- Mô phỏng gửi email với `emailId = "123456789"`.
- Publish tiếp event `email-successful`.

### `analytic-service`

- Consumer của 3 topic:
  - `payment-successful`
  - `order-successful`
  - `email-successful`
- In log thống kê tổng tiền, mã đơn hàng và email đã gửi.

### `kafka`

- Chứa `docker-compose.yml` để chạy Kafka và Kafka UI.
- Chứa `admin.js` để tạo topic bằng KafkaJS.

## Event flow

### 1. Payment

Frontend gửi request:

```http
POST /payment-service
Content-Type: application/json
```

Body:

```json
{
  "cart": [
    { "id": 1, "price": 120 },
    { "id": 2, "price": 80 }
  ]
}
```

`payment-service` publish:

```json
{
  "userId": "123",
  "cart": [
    { "id": 1, "price": 120 },
    { "id": 2, "price": 80 }
  ]
}
```

### 2. Order

`order-service` nhận event thanh toán thành công rồi publish:

```json
{
  "userId": "123",
  "orderId": "123456789"
}
```

### 3. Email

`email-service` nhận event đơn hàng thành công rồi publish:

```json
{
  "userId": "123",
  "emailId": "123456789"
}
```

## Cách chạy local

### 1. Chạy Kafka

Từ thư mục `services/kafka`:

```bash
docker compose up -d
```

Kafka broker được expose tại `localhost:9094`.

Kafka UI:

- URL: `http://localhost:8080`

### 2. Cài dependency

Chạy lần lượt trong từng service:

```bash
cd services/payment-service && npm install
cd services/order-service && npm install
cd services/email-service && npm install
cd services/analytic-service && npm install
cd services/client && npm install
```

### 3. Tạo topic Kafka

Nếu muốn dùng script admin:

```bash
cd services/kafka
npm install kafkajs
node admin.js
```

Hoặc tạo topic thủ công đúng theo code đang chạy:

- `payment-successful`
- `order-successful`
- `email-successful`

### 4. Start từng service

Mở 5 terminal khác nhau:

```bash
cd services/payment-service && npm start
```

```bash
cd services/order-service && node index.js
```

```bash
cd services/email-service && node index.js
```

```bash
cd services/analytic-service && node index.js
```

```bash
cd services/client && npm run dev
```

Sau đó mở `http://localhost:3000`.

## API hiện có

### `POST /payment-service`

URL đầy đủ:

```text
http://localhost:8000/payment-service
```

Request body:

```json
{
  "cart": [
    { "title": "Product A", "price": 100 },
    { "title": "Product B", "price": 200 }
  ]
}
```

Response thành công:

```json
{
  "message": "Payment successful"
}
```

## Port và broker

| Thành phần | Địa chỉ |
| --- | --- |
| Client | `http://localhost:3000` |
| Payment API | `http://localhost:8000` |
| Kafka external listener | `localhost:9094` |
| Kafka UI | `http://localhost:8080` |

## Lưu ý quan trọng

### 1. Tên topic trong `admin.js` đang sai chính tả

File `services/kafka/admin.js` đang tạo:

- `order-sucessful`
- `payment-sucessful`

Trong khi các service đang dùng:

- `payment-successful`
- `order-successful`
- `email-successful`

Nếu chạy nguyên `admin.js` hiện tại thì producer/consumer sẽ không khớp topic.

### 2. Các service consumer đang subscribe với `fromBeginning: true`

Điều này có nghĩa là khi restart service, consumer có thể đọc lại message cũ trong topic và log lại dữ liệu.

### 3. Đây là demo flow bất đồng bộ

- Chưa có database
- Chưa có retry / dead-letter queue
- Chưa có validation input
- Chưa có auth thực tế
- `userId`, `orderId`, `emailId` đang là dữ liệu giả lập

## Gợi ý cải thiện

- Đồng bộ lại tên topic trong toàn bộ hệ thống.
- Thêm file `.env` cho port, broker và CORS origin.
- Bổ sung script `start` cho các service còn lại.
- Thêm Docker Compose chung cho toàn bộ microservice.
- Thêm logging có cấu trúc và health check endpoint.
