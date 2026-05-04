# 🧪 Guía de Pruebas - Event-Driven System

## 📋 Prerrequisitos

- Docker y Docker Compose instalados
- curl o Postman para pruebas de API
- Acceso a terminal

---

## 🚀 Paso 1: Levantar el sistema

```bash
cd /home/marco/Escritorio/PORTAFOLIO/event-driven-system
docker compose up -d
```

**Verificar que todos los contenedores estén corriendo:**

```bash
docker compose ps
```

**Resultado esperado:**
```
NAME                                         IMAGE           STATUS          PORTS
event-driven-system-api-gateway-1            ...             Up x seconds   3000/tcp
event-driven-system-processor-service-1      ...             Up x seconds   3002/tcp
event-driven-system-postgres-1               postgres:16     Up x seconds   5432/tcp
event-driven-system-redis-1                  redis:7         Up x seconds   6379/tcp
event-driven-system-rabbitmq-1               rabbitmq:3      Up x seconds   5672/tcp, 15672/tcp
```

---

## 🔍 Paso 2: Verificar logs de inicialización

**API Gateway:**
```bash
docker compose logs api-gateway | grep -E "(NestApplication|Mapped|LOG)"
```

**Resultado esperado:**
```
[Nest] Starting Nest application...
[RoutesResolver] TransactionController {/transactions}:
[RouterExplorer] Mapped {/transactions, POST} route
```

**Processor Service:**
```bash
docker compose logs processor-service | grep -E "(NestApplication|Consumer started)"
```

**Resultado esperado:**
```
[Nest] Starting Nest application...
[ProcessorService] Consumer started - listening for transactions
```

---

## ✉️ Paso 3: Enviar una transacción válida

```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000",
    "type": "payment",
    "amount": 100.50,
    "userId": "user-1"
  }'
```

**Resultado esperado:**
```json
{"status":"accepted","id":"550e8400-e29b-41d4-a716-446655440000"}
```
Status: 202 Accepted

---

## 🗄️ Paso 4: Verificar en PostgreSQL

```bash
docker exec event-driven-system-postgres-1 psql -U user -d transactions \
  -c "SELECT \"idempotencyKey\", type, amount, status, createdAt FROM transactions;"
```

**Resultado esperado:**
```
            idempotencyKey            |  type   | amount |  status   |         createdAt
--------------------------------------+---------+--------+-----------+----------------------------
 550e8400-e29b-41d4-a716-446655440000 | payment |  100.5 | processed | 2026-05-04 02:20:05.652675
```

---

## 📨 Paso 5: Verificar que el evento fue procesado

```bash
docker compose logs processor-service | grep "Transaction saved"
```

**Resultado esperado:**
```
[ProcessorService] Transaction saved to database with idempotency key: 550e8400-e29b-41d4-a716-446655440000
```

---

## 🔒 Paso 6: Probar Idempotencia (evitar duplicados)

Enviar la misma transacción nuevamente:

```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000",
    "type": "payment",
    "amount": 100.50,
    "userId": "user-1"
  }'
```

**Verificar en logs que no se reprocesó:**
```bash
docker compose logs processor-service | grep "already processed"
```

**Resultado esperado:**
```
[ProcessorService] Transaction with idempotency key 550e8400-e29b-41d4-a716-446655440000 already processed. Skipping.
```

---

## ❌ Paso 7: Probar validación de DTO (casos de error)

**UUID inválido:**
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"idempotencyKey":"invalid-uuid","type":"payment","amount":100.50,"userId":"user-1"}'
```

**Resultado esperado (400 Bad Request):**
```json
{"message":["idempotencyKey must be a UUID"],"error":"Bad Request","statusCode":400}
```

**Monto negativo:**
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"idempotencyKey":"550e8400-e29b-41d4-a716-446655440002","type":"payment","amount":-50,"userId":"user-1"}'
```

**Resultado esperado (400 Bad Request):**
```json
{"message":["amount must not be less than 0.01"],"error":"Bad Request","statusCode":400}
```

**Faltan campos:**
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"type":"payment"}'
```

**Resultado esperado (400 Bad Request):**
```json
{"message":["idempotencyKey must be a UUID","amount must be a number","userId must be a string"],"error":"Bad Request","statusCode":400}
```

---

## 🔁 Paso 8: Enviar múltiples transacciones

```bash
for i in {1..5}; do
  curl -X POST http://localhost:3000/transactions \
    -H "Content-Type: application/json" \
    -d "{\"idempotencyKey\":\"550e8400-e29b-41d4-a716-44665544000$i\",\"type\":\"payment\",\"amount\":$((RANDOM % 1000)).$((RANDOM % 100)),\"userId\":\"user-$i\"}" \
    -s -o /dev/null -w "Transaction $i: %{http_code}\n"
done
```

**Verificar en base de datos:**
```bash
docker exec event-driven-system-postgres-1 psql -U user -d transactions \
  -c "SELECT COUNT(*) as total_transactions FROM transactions;"
```

---

## 📊 Paso 9: Verificar RabbitMQ Management

Acceder a: http://localhost:15672
- Usuario: guest
- Contraseña: guest

Verificar:
- Exchange `transactions` creado
- Queues vinculadas:
  - `transaction_queue` (processor-service)
  - `notification_queue` (notification-service)
- Mensajes publicados y consumidos

---

## 🔴 Paso 10: Probar Dead Letter Queue (DLQ)

Para probar la DLQ, podemos simular un error en el procesamiento (opcional - requiere modificar el código para forzar un error).

Verificar queue DLQ:
```bash
docker exec event-driven-system-rabbitmq-1 rabbitmqctl list_queues | grep dlq
```

---

## 🧪 Paso 11: Prueba de carga (Load Test)

```bash
cd /home/marco/Escritorio/PORTAFOLIO/event-driven-system/load-test
npm install
API_URL=http://localhost:3000/transactions npm run test
```

**Resultado esperado:**
```
Starting load test: 100000 events
Progress: 10000/100000
...
Load test completed in Xs
Average: X events/sec
```

---

## 🛑 Paso 12: Detener el sistema

```bash
cd /home/marco/Escritorio/PORTAFOLIO/event-driven-system
docker compose down
```

Para eliminar también los volúmenes (base de datos):
```bash
docker compose down -v
```

---

## 📝 Resumen de endpoints

| Método | Endpoint | Descripción | Status Code |
|--------|-----------|-------------|------------|
| POST | `/transactions` | Crear nueva transacción | 202 Accepted |
| POST | `/transactions` | Transacción duplicada | 202 Accepted (no se reprocesa) |
| POST | `/transactions` | Datos inválidos | 400 Bad Request |

---

## 🔄 Flujo completo del sistema

```
Cliente → API Gateway (202 Accepted)
         ↓
    RabbitMQ (exchange: transactions, routing key: transaction.created)
         ↓
    Processor Service (guarda en PostgreSQL, publica transaction.processed)
         ↓
    RabbitMQ (exchange: transactions, routing key: transaction.processed)
         ↓
    Notification Service (loggea notificación)
```

---

---

## 🔔 Paso 13: Verificar comunicación entre todos los servicios

**1. Enviar transacción de prueba:**
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"idempotencyKey":"550e8400-e29b-41d4-a716-446655440999","type":"payment","amount":999.99,"userId":"user-final-test"}'
```

**2. Verificar que api-gateway aceptó (202):**
```
{"status":"accepted","id":"550e8400-e29b-41d4-a716-446655440999"}
```

**3. Verificar que processor-service procesó:**
```bash
docker logs processor-service | grep "Transaction saved"
```
```
[ProcessorService] Transaction saved to database with idempotency key: 550e8400-e29b-41d4-a716-446655440999
```

**4. Verificar que processor-service publicó evento:**
```bash
docker logs processor-service | grep "transaction.processed"
```

**5. Verificar que notification-service recibió el evento:**
```bash
docker logs notification-service | grep "Notification sent"
```
```
[NotificationService] Notification sent to user user-final-test: Transaction 550e8400-e29b-41d4-a716-446655440999 processed successfully
```

**6. Verificar en base de datos:**
```bash
docker exec postgres psql -U user -d transactions \
  -c "SELECT \"idempotencyKey\", type, amount, status FROM transactions ORDER BY \"createdAt\" DESC LIMIT 1;"
```

---
