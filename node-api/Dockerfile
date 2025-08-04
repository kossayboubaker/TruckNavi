FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
RUN npm ci --only=production
RUN npm rebuild bcrypt
COPY src/ ./
EXPOSE 8080
CMD ["node", "index.js"]