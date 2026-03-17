# Stage 1: Install dependencies & build aplikasi
FROM node:18-alpine AS builder

# Tentukan direktori kerja
WORKDIR /app

# Salin package.json dan package-lock.json
COPY package.json package-lock.json* ./

# Install dependencies (termasuk devDependencies)
RUN npm ci

# Salin seluruh kode sumber
COPY . .

# Jalankan proses build Next.js
# Pastikan next.config.js sudah diset ke 'standalone'
RUN npm run build

# Stage 2: Runner (Hanya berisi file produksi yang dibutuhkan)
FROM node:18-alpine AS runner

# Tentukan direktori kerja
WORKDIR /app

# Set variabel lingkungan ke produksi
ENV NODE_ENV production

# Salin file-file penting yang dihasilkan di Stage 1
# 'public' untuk aset statis
COPY --from=builder /app/public ./public
# 'standalone' berisi server Node.js minimal & node_modules produksi
COPY --from=builder /app/.next/standalone ./
# '.next/static' untuk aset kustom Next.js
COPY --from=builder /app/.next/static ./.next/static

# Expose port (biasanya 3000 untuk Next.js)
EXPOSE 4200

# Set user agar Docker tidak jalan sebagai root (opsional tapi disarankan)
USER node

# Tentukan perintah untuk menjalankan aplikasi
# Kita jalankan server Node.js standalone yang dibuat Next.js
CMD ["node", "server.js"]