# Finanzas-App

App web de finanzas personales para registrar ingresos, gastos, transferencias entre cuentas y compras con tarjeta en cuotas.

## Estado

🚧 En desarrollo — Etapa 0: entorno y repositorio.

## Stack

- **Frontend:** React + Vite (PWA)
- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL
- **Infraestructura:** Docker, VPS con Ubuntu, Caddy

## Estructura

- `server/` — API (backend)
- `client/` — interfaz web (frontend)
- `docs/` — documentación y bitácora de decisiones

## Cómo correrlo en local

Reqisitos: Node.js 24+, Docker Desktop.

1. Copiar las variables de entorno y completarlas:
```
   cp .env.example .env
```
2. Levantar la base de datos:
```
   docker compose up -d
```
3. Levantar el servidor:
```
   cd server
   npm install
   npm run dev
```