FROM node:20-alpine AS base

# Шаг 1: Зависимости
FROM base AS deps
WORKDIR /app

# Копирование файлов package.json и package-lock.json
COPY package.json package-lock.json* ./

# Установка зависимостей с обновлением package-lock.json
RUN npm install

# Шаг 2: Сборка
FROM base AS builder
WORKDIR /app

# Копирование зависимостей из предыдущего шага
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Сборка приложения
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Шаг 3: Рантайм
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

# Создание пользователя nextjs
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копирование сборки из предыдущего шага
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Переключение на пользователя nextjs
USER nextjs

# Экспонирование порта
EXPOSE 3000

# Запуск приложения
CMD ["node", "server.js"] 