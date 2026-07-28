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
RUN npm run build

# ---------- Etapa 2: servir el build estático con nginx ----------
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
