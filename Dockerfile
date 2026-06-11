# Базовый образ
FROM node:20-alpine

# Устанавливаем concurrently для запуска двух процессов
RUN npm install -g concurrently

WORKDIR /app

# Копируем package.json обоих проектов
COPY backend/package*.json ./backend/
COPY frontend-next/package*.json ./frontend-next/

# Устанавливаем зависимости
RUN cd backend && npm ci --only=production
RUN cd frontend-next && npm ci

# Копируем исходники
COPY backend/ ./backend/
COPY frontend-next/ ./frontend-next/

# Собираем Next.js
RUN cd frontend-next && npm run build

# Порт, который будет слушать Render (Next.js)
EXPOSE 3000

# Запускаем бекенд и Next.js параллельно
CMD concurrently \
  "cd backend && node index.js" \
  "cd frontend-next && npm start"