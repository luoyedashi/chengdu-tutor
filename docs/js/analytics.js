// ============ 访客统计 & 浏览计数 ============

async function recordVisit() {
    if (!database) return;
    const today = getTodayDateString();
    if (localStorage.getItem(APP_INFO.visitDateKey) === today) return;
    let cachedLoc = null;
    try { const pts = localStorage.getItem(APP_INFO.refPointKey); if (pts) cachedLoc = JSON.parse(pts); } catch(e) {}
    const record = {
        visitorId: getVisitorId(), date: today,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent.substring(0, 200),
        page: 'order-display'
    };
    if (cachedLoc && cachedLoc.lat && cachedLoc.lng) {
        record.location = { lng: cachedLoc.lng, lat: cachedLoc.lat, address: cachedLoc.address || '' };
    }
    try { await database.collection('visits').add(record); localStorage.setItem(APP_INFO.visitDateKey, today); } catch(e) {}
}

async function recordOrderView(orderId) {
    if (!database || !orderId) return;
    const key = 'cdjiajiao_view_' + orderId;
    if (localStorage.getItem(key)) return;
    try {
        await database.collection('order_views').add({ orderId, visitorId: getVisitorId(), timestamp: new Date().toISOString() });
        localStorage.setItem(key, '1');
        orderViewCountMap[orderId] = (orderViewCountMap[orderId] || 0) + 1;
    } catch(e) {}
}

async function loadOrderViewCounts() {
    if (!database) return;
    const ids = [...new Set(filteredOrders.map(o => getOrderDisplayId(o)).filter(Boolean))];
    if (ids.length === 0) return;
    try {
        const batchSize = 500;
        const batches = [];
        for (let i = 0; i < ids.length; i += batchSize) {
            batches.push(database.collection('order_views').where({ orderId: database.command.in(ids.slice(i, i + batchSize)) }).get());
        }
        const results = await Promise.all(batches);
        const map = {};
        results.forEach(res => {
            (res.data || []).forEach(r => {
                if (r.orderId) { if (!map[r.orderId]) map[r.orderId] = new Set(); map[r.orderId].add(r.visitorId); }
            });
        });
        Object.entries(map).forEach(([oid, s]) => orderViewCountMap[oid] = s.size);
        renderTable();
    } catch(e) {}
}
