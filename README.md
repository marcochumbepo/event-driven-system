# 🧠 Real-Time Event-Driven Transaction Processing System

![NestJS](https://img.shields.io/badge/NestJS-10.0-red)
![TypeScript](https://img.shields.io/badge/TypeScript-5.1-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Redis](https://img.shields.io/badge/Redis-7-green)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3-orange)
![Docker](https://img.shields.io/badge/Docker-Ready-brightgreen)

## 📋 Descripción

Sistema backend distribuido basado en eventos capaz de procesar transacciones en tiempo real con alta concurrencia, resiliencia y escalabilidad. Implementa arquitectura hexagonal (Clean Architecture) con comunicación asíncrona mediante message broker.

## 🏗 Arquitectura

```
┌─────────────┐     HTTP/REST     ┌──────────────────┐
│   Cliente   │ ────────────────> │   API Gateway    │
└─────────────┘                   └────────┬─────────┘
                                           │
                                           │ Publish (transaction.created)
                                           ▼
                                   ┌──────────────────┐
                                   │    RabbitMQ      │
                                   └───────┬──────────┘
                                           │
                    ┌──────────────────────┴───────────────────────┐
                    │ Consume                                      │
                    ▼                                              │
            ┌──────────────────┐                          ┌──────────────────┐
            │ Processor Service│                          │ Notification Svc │
            └────────┬─────────┘                          └──────────────────┘
                     │
                     │ Save to DB
                     ▼
            ┌──────────────────┐
            │  PostgreSQL DB   │
            └────────┬─────────┘
                     │
                     │ Cache check
                     ▼
            ┌──────────────────┐
            │      Redis       │
            └──────────────────┘
```

## 🔄 Event Flow

1. El cliente envía una petición → API Gateway  
2. El API Gateway valida el DTO y publica el evento `transaction.created` en RabbitMQ  
3. El Processor Service consume el evento, valida idempotencia y guarda en PostgreSQL  
4. El Processor Service publica el evento `transaction.processed`  
5. El Notification Service consume el evento y registra la notificación  

## 📁 Project Structure

```
event-driven-system/
├── apps/
│   ├── api-gateway/           # Punto de entrada (Puerto 3000)
│   │   ├── src/
│   │   │   ├── domain/      # Puerto MessageBroker
│   │   │   ├── application/ # Servicios de aplicación
│   │   │   ├── infrastructure/ # Adaptadores (RabbitMQ)
│   │   │   └── interfaces/  # Controllers, DTOs
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── transaction-service/   # Consultas de transacciones (Puerto 3001)
│   │   └── (estructura similar)
│   │
│   ├── processor-service/     # Procesamiento de eventos (Puerto 3002)
│   │   ├── src/
│   │   │   ├── domain/      # Entities, Ports
│   │   │   ├── application/ # ProcessorService
│   │   │   ├── infrastructure/ # TypeORM, RabbitMQ, Redis, Retry
│   │   │   └── interfaces/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── notification-service/ # Notificaciones (Puerto 3003)
│       ├── src/
│       │   ├── domain/      # Ports
│       │   ├── application/ # NotificationService
│       │   └── infrastructure/ # RabbitMQ
│       ├── Dockerfile
│       └── package.json
│
├── load-test/                # Script de carga (50k eventos)
│   ├── load-test.ts
│   └── package.json
│
├── docker-compose.yml       # Orquestación de servicios
├── .env.example            # Variables de entorno
├── project-details.md      # Requisitos del sistema
├── project-phases.md       # Fases de desarrollo (100% completado)
├── TESTING.md             # Guía de pruebas paso a paso
├── postman-collection.json # Colección de Postman
└── README.md              # Este archivo
```


---

## ⚖️ Trade-offs & Design Decisions

### RabbitMQ vs Kafka
Se eligió RabbitMQ por su simplicidad de configuración y facilidad para entornos locales, además de soportar patrones como routing y DLQ. Kafka sería más adecuado para escenarios de streaming de muy alto volumen.

### Entrega "at-least-once"
El sistema garantiza procesamiento al menos una vez, lo que implica la necesidad de manejar idempotencia para evitar duplicados.

### Monorepo
Se utilizó un monorepo para simplificar el desarrollo y mantener consistencia entre servicios, a costa de un mayor acoplamiento en la gestión del código.

### PostgreSQL vs NoSQL
Se eligió PostgreSQL por su consistencia fuerte, necesaria en escenarios tipo transacciones financieras.

---

## 📊 Performance Results

Prueba de carga ejecutada con **50,000 eventos**:

- Throughput: ~X req/sec  
- Tiempo promedio de procesamiento: X ms  
- Tasa de error: < X%  
- El sistema se mantuvo estable bajo alta concurrencia  

*(Los resultados pueden variar según los recursos de la máquina)*

---

## 🐳 Cómo Ejecutar con Docker

### Prerrequisitos
- Docker instalado
- Docker Compose instalado

### Pasos

1. **Clonar el repositorio**
```bash
git clobe https://github.com/marcochumbepo/event-driven-system.git
```

2. **Levantar todo el sistema**
```bash
docker compose up -d
```

3. **Verificar que todos los contenedores estén corriendo**
```bash
docker compose ps
```

4. **Probar el endpoint**
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

**Respuesta esperada:**
```json
{"status":"accepted","id":"550e8400-e29b-41d4-a716-446655440000"}
```

5. **Detener el sistema**
```bash
docker compose down
```

Para eliminar volúmenes (base de datos):
```bash
docker compose down -v
```

## 📝 Variables de Entorno

Crear archivo `.env` basado en `.env.example`:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/transactions
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://guest:guest@localhost:5672

POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=transactions

RABBITMQ_DEFAULT_USER=guest
RABBITMQ_DEFAULT_PASS=guest
```

## 🔌 API Endpoints

### POST /transactions
Crea una nueva transacción (procesamiento asíncrono).

**URL:** `http://localhost:3000/transactions`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000",
  "type": "payment",
  "amount": 100.50,
  "userId": "user-1"
}
```

**Respuestas:**
- `202 Accepted` - Transacción aceptada para procesamiento
- `400 Bad Request` - Datos inválidos (UUID, monto, campos faltantes)

**Validaciones:**
- `idempotencyKey` debe ser UUID válido
- `type` debe ser string
- `amount` debe ser número mayor a 0.01
- `userId` debe ser string

## 🧪 Testing

### Pruebas Manuales
Ver `TESTING.md` para guía paso a paso.

### Postman
Importar `postman-collection.json` en Postman para pruebas automatizadas.

### Load Testing
```bash
cd load-test
npm install
API_URL=http://localhost:3000/transactions npm run test
```

## 📈 Monitoreo

### RabbitMQ Management
Acceder a: http://localhost:15672
- Usuario: `guest`
- Contraseña: `guest`

Verificar:
- Exchange: `transactions`
- Queues: `transaction_queue`, `notification_queue`
- Message rates

### Logs de Servicios
```bash
# API Gateway
docker logs api-gateway --follow

# Processor Service
docker logs processor-service --follow

# Notification Service
docker logs notification-service --follow
```

### Base de Datos
```bash
docker exec postgres psql -U user -d transactions \
  -c "SELECT COUNT(*) FROM transactions;"
```

## 🛠 Stack Tecnológico

| Tecnología | Propósito |
|-------------|-----------|
| **NestJS** | Framework backend |
| **TypeScript** | Lenguaje de programación |
| **PostgreSQL** | Base de datos relacional |
| **Redis** | Cache y pub/sub |
| **RabbitMQ** | Message broker |
| **Docker** | Contenedorización |
| **TypeORM** | ORM para PostgreSQL |
| **Winston** | Logging estructurado |
| **class-validator** | Validación de DTOs |


## 🔥 Features
- Arquitectura orientada a eventos
- Manejo de idempotencia
- Retry con backoff exponencial
- Dead Letter Queue (DLQ)
- Cache con Redis
- Manejo de alta concurrencia
- Pruebas de carga (50k eventos)
- Logging estructurado
- Pipeline CI/CD

## 📈 Monitoring

### RabbitMQ Dashboard

http://localhost:15672

### Logs

docker logs api-gateway --follow
docker logs processor-service --follow


## 📜 Licencia

MIT
---


## Autor

**Desarrollado por Marco Chumbe**   
Linkedin: https://linkedin.com/in/mchumbe
correo: marcochumbepo@gmail.com
