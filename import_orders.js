// ============ CloudBase ?????? ============
// ????: node import_orders.js
// ???: npm install @cloudbase/node-sdk

const cloudbase = require('@cloudbase/node-sdk');

const CONFIG = {
    env: 'YOUR_ENV_ID',      // ????? CloudBase ?? ID
    secretId: 'YOUR_SECRET_ID',   // ??? SecretId
    secretKey: 'YOUR_SECRET_KEY'  // ??? SecretKey
};

const app = cloudbase.init({ env: CONFIG.env, secretId: CONFIG.secretId, secretKey: CONFIG.secretKey });
const db = app.database();

const orders = require('./ll_teacher/js/orders_data.json');

async function importOrders() {
    console.log(`???? ${orders.length} ???...`);

    // ????????????
    // await db.collection('orders').where({}).remove();

    const batchSize = 20;
    for (let i = 0; i < orders.length; i += batchSize) {
        const batch = orders.slice(i, i + batchSize);
        const promises = batch.map(order => db.collection('orders').add(order));
        await Promise.all(promises);
        console.log(`??? ${Math.min(i + batchSize, orders.length)}/${orders.length}`);
    }

    console.log('?????');
}

importOrders().catch(console.error);
