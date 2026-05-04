1. event-driven-system.md
# 🧠 Real-Time Event-Driven Transaction Processing System

## 🎯 Objetivo
Desarrollar un sistema backend distribuido basado en eventos capaz de procesar transacciones en tiempo real con alta concurrencia, resiliencia y escalabilidad.

---

## 🧩 Requisitos funcionales

- Procesar eventos de transacciones (ej: pagos, apuestas, pedidos)
- Manejo asíncrono mediante cola de mensajes
- Idempotencia en procesamiento
- Retry automático en fallos
- Dead Letter Queue (DLQ)
- Simulación de carga (mínimo 100k eventos)

---

## 🏗 Arquitectura

- Microservicios desacoplados
- API Gateway
- Message Broker (RabbitMQ o Kafka)
- Redis (cache + pub/sub)
- PostgreSQL

### Servicios sugeridos:

- `api-gateway`
- `transaction-service`
- `processor-service`
- `notification-service`

---

## ⚙️ Stack tecnológico

- Node.js con NestJS
- PostgreSQL
- Redis
- RabbitMQ o Kafka
- Docker + Docker Compose
- GitHub Actions

---

## 📦 Requisitos técnicos

- Arquitectura Hexagonal (Ports & Adapters)
- Clean Architecture
- Uso de DTOs y validaciones
- Manejo de errores centralizado
- Logs estructurados

---

## 🔁 Flujo básico

1. Cliente envía request
2. API Gateway recibe
3. Se publica evento en broker
4. Processor consume evento
5. Se guarda resultado en DB
6. Se notifica resultado

---

## 🔥 Características avanzadas

- Idempotency keys
- Retry con backoff exponencial
- DLQ para fallos persistentes
- Rate limiting
- Manejo de concurrencia

---

## 🐳 Docker

Debe incluir:

- Servicios backend
- PostgreSQL
- Redis
- Broker

Comando esperado:

```bash
docker-compose up -d
📘 README requerido

Debe incluir:

Descripción del sistema
Diagrama de arquitectura
Instrucciones para levantar
Ejemplos de requests
Decisiones técnicas
🧪 Testing
Unit tests
Integration tests
Simulación de carga
☁️ Opcional (plus)
Terraform para infraestructura
Observabilidad (Prometheus + Grafana)
OpenTelemetry
🎯 Resultado esperado

Un sistema distribuido funcional, reproducible localmente con Docker, que demuestre manejo de eventos en tiempo real y alta concurrencia.