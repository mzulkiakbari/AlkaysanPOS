# Gunakan Node 20 atau 22 (LTS) berbasis Alpine agar ringan tapi lengkap
FROM node:22-alpine

# Install dependencies yang dibutuhkan untuk meng-compile library native (seperti SQLite)
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Jalankan npm install atau npm ci
# Karena sudah ada python & g++, error 'better-sqlite3' tadi akan hilang
RUN npm ci

# Copy sisa kode lainnya
COPY . .

# Lanjutkan dengan build Next.js
RUN npm run build

# Ekspos port dan jalankan
ENV PORT 4200
EXPOSE 4200

# Jika kamu menggunakan mode standalone (sesuai saran log Next.js tadi)
# Gunakan perintah ini:
CMD ["npm", "start", "--", "-p", "4200"]