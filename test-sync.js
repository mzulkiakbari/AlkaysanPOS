async function testSync() {
    const url = "https://v1.kasir.alkaysan.co.id/tester/13hrym1a-SY3W-7NuN-a13a-VPYH8DQSX6Wz/api/v2/sync/download";
    console.log("Testing POST to:", url);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                timestamps: {
                    // providing some fake recent timestamps to limit data size just in case, or leave empty to test full sync
                    // "master_items": "2024-01-01 00:00:00"
                }
            })
        });

        if (!response.ok) {
            console.error("HTTP Error:", response.status, response.statusText);
            const text = await response.text();
            console.error("Response body:", text.substring(0, 500));
            return;
        }

        const json = await response.json();
        console.log("Success:", json.success);
        
        if (json.data) {
            console.log("--- Rows per table ---");
            for (const [table, rows] of Object.entries(json.data)) {
                console.log(`${table}: ${Array.isArray(rows) ? rows.length : 0} rows`);
            }
            
            // Print a sample from master_items if exists
            if (json.data.master_items && json.data.master_items.length > 0) {
                console.log("\nSample Master Item:");
                console.log(json.data.master_items[0]);
            }
        } else {
            console.log("No data returned:", json);
        }

    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

testSync();
