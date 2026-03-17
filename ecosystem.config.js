module.exports = {
    apps: [{
        name: "kasir",
        script: "npm",
        args: "start",
        watch: true,
        // Kecualikan folder agar tidak restart terus-menerus
        ignore_watch: [
            "node_modules",
            ".next",
            "public",
            "*.log"
        ],
        // Pantau perubahan hanya pada folder tertentu
        watch_options: {
            "followSymlinks": false
        },
        env: {
            PORT: 3001, // <--- Cek di sini
            NODE_ENV: "development",
        },
        env_production: {
            PORT: 8080, // <--- Atau di sini untuk mode produksi
            NODE_ENV: "production",
        }
    }]
}