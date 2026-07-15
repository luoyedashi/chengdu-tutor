
// ============ 数据管理模块 ============

let database = null;
let allOrders = [];
let filteredOrders = [];
let referencePoint = null;
let currentSortField = 'orderId';
let currentSortDirection = 'desc';
let currentPage = 1;
let currentFilterTag = '';
const PAGE_SIZE = 15;
let orderViewCountMap = {};

const COLUMN_CONFIG = [
    { field: 'orderId', label: '编号', defaultVisible: true },
    { field: 'cityRegion', label: '区域', defaultVisible: true },
    { field: 'address', label: '地址', defaultVisible: true },
    { field: 'distance', label: '距离', defaultVisible: false },
    { field: 'grade', label: '年级', defaultVisible: true },
    { field: 'sex', label: '性别', defaultVisible: false },
    { field: 'subject', label: '科目', defaultVisible: true },
    { field: 'schedule', label: '时间安排', defaultVisible: false },
    { field: 'lessonCount', label: '上课次数', defaultVisible: false },
    { field: 'teacherRequirement', label: '老师要求', defaultVisible: true },
    { field: 'salary', label: '时薪', defaultVisible: true }
];

let columnVisibility = {};
function initColumnVisibility() {
    COLUMN_CONFIG.forEach(c => columnVisibility[c.field] = c.defaultVisible);
}

async function initCloudBase() {
    if (CLOUDBASE_CONFIG.env === 'YOUR_ENV_ID') {
        console.log('CloudBase unconfigured, using local data');
        return false;
    }
    try {
        const app = cloudbase.init(CLOUDBASE_CONFIG);
        const auth = app.auth();
        await auth.signInAnonymously();
        database = app.database();
        console.log('CloudBase init OK');
        return true;
    } catch(e) {
        console.warn('CloudBase init failed', e);
        return false;
    }
}

async function loadOrders() {
    // 优先使用内嵌数据（避免 file:// 协议下 fetch CORS 限制）
    if (typeof EMBEDDED_ORDERS !== 'undefined' && Array.isArray(EMBEDDED_ORDERS) && EMBEDDED_ORDERS.length > 0) {
        allOrders = EMBEDDED_ORDERS;
        console.log('[DATA] Using embedded orders, count:', allOrders.length);
    }
    // 兜底：尝试 fetch JSON 文件
    if (allOrders.length === 0) {
        try {
            const resp = await fetch('js/orders_data.json');
            const localData = await resp.json();
            if (Array.isArray(localData) && localData.length > 0) {
                allOrders = localData;
                console.log('[DATA] fetch success, allOrders:', allOrders.length);
            }
        } catch(e) {
            console.warn('[DATA] Local data fetch failed:', e.message);
        }
    }
    if (allOrders.length === 0) {
        const cached = localStorage.getItem(APP_INFO.cacheKey);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) allOrders = parsed;
            } catch(e) {}
        }
    }
    if (database) {
        showSyncStatus('loading', '同步云端数据...');
        try {
            const res = await database.collection('orders').get();
            const cloudData = (res.data && res.data.length) ? res.data : [];
            if (cloudData.length > 0) {
                allOrders = cloudData;
                localStorage.setItem(APP_INFO.cacheKey, JSON.stringify(allOrders));
                showSyncStatus('success', '数据同步成功');
            }
        } catch(e) {
            showSyncStatus('success', '显示本地数据');
        }
        setTimeout(() => document.getElementById('syncStatus').style.opacity = '0', 2000);
    } else {
        showSyncStatus('success', '本地数据已加载');
        setTimeout(() => document.getElementById('syncStatus').style.opacity = '0', 2000);
    }
    onDataReady();
}

function onDataReady() {
    console.log('[DATA] onDataReady - allOrders:', allOrders.length);
    filteredOrders = [...allOrders];
    updateDistances();
    sortOrders();
    currentPage = 1;
    renderAll();
    setTimeout(() => { loadOrderViewCounts(); }, 500);
}

function showSyncStatus(type, msg) {
    const el = document.getElementById('syncStatus');
    el.style.display = 'block'; el.style.opacity = '1';
    el.className = 'sync-status sync-' + type; el.textContent = msg;
}
