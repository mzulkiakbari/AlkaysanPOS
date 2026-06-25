import mysql from 'mysql2/promise';

async function checkDb() {
    try {
        const pool = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'kasir'
        });

        console.log("--- TABLES ---");
        const [tables] = await pool.execute('SHOW TABLES');
        console.log(tables);

        console.log("\n--- TRANSAKSIS ---");
        try {
            const [trans] = await pool.execute('DESCRIBE transaksis');
            console.log(trans);
        } catch(e) { console.log('No transaksis table'); }

        console.log("\n--- PRODUCTS ---");
        try {
            const [prod] = await pool.execute('DESCRIBE products');
            console.log(prod);
        } catch(e) { console.log('No products table'); }

        console.log("\n--- MASTER_ITEMS ---");
        try {
            const [mi] = await pool.execute('DESCRIBE master_items');
            console.log(mi);
        } catch(e) { console.log('No master_items table'); }

        console.log("\n--- CUSTOMERS ---");
        try {
            const [cust] = await pool.execute('DESCRIBE customers');
            console.log(cust);
        } catch(e) { console.log('No customers table'); }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkDb();
