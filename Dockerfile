# ---------- Etapa 1: build ----------
FROM node:20-alpine AS build
WORKDIR /app

# Se copian primero los manifiestos para aprovechar el cache de capas de Docker:
# si solo cambia el código fuente, no se vuelven a instalar las dependencias.
# (se usa "npm install" y no "npm ci" porque el lockfile actual, generado en
# Windows, no trae las dependencias opcionales de la variante linux-musl)
COPY package*.json ./
RUN npm install

COPY . .

# Vite incrusta las variables VITE_* en el bundle en tiempo de compilación,
# no de ejecución — así que hace falta un ARG/ENV acá, no en el contenedor
# final de nginx. Por defecto apunta a localhost:9769 para no romper
# "docker compose up" tal como estaba documentado en el README; para
# desplegar contra un backend real se pasa con --build-arg o en
# docker-compose.yml (ver ese archivo).
ARG VITE_API_URL=http://localhost:9769
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---------- Etapa 2: servir el build estático con nginx ----------
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
