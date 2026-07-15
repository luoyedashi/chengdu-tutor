// ============ 工具函数 ============

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

function showToast(msg, type) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + (type || 'success');
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 2500);
}

function getVisitorId() {
    let id = localStorage.getItem(APP_INFO.visitorKey);
    if (!id) { id = Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 10); localStorage.setItem(APP_INFO.visitorKey, id); }
    return id;
}

function getTodayDateString() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => showToast('已复制', 'success'));
    } else {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); showToast('已复制', 'success'); } catch(e) { showToast('复制失败', 'error'); }
        document.body.removeChild(ta);
    }
}

function calcDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function parseLocationString(str) {
    if (!str) return null;
    const parts = str.split(',');
    if (parts.length === 2) {
        const lng = parseFloat(parts[0]), lat = parseFloat(parts[1]);
        if (!isNaN(lng) && !isNaN(lat)) return { lng, lat };
    }
    return null;
}

function getOrderDistance(order) {
    if (!referencePoint || !order.location) return Infinity;
    const loc = parseLocationString(order.location);
    if (!loc) return Infinity;
    return calcDistance(referencePoint.lat, referencePoint.lng, loc.lat, loc.lng);
}

function updateDistances() {
    if (!referencePoint) return;
    filteredOrders.forEach(o => o._distance = getOrderDistance(o));
}

function sortOrders() {
    filteredOrders.sort((a, b) => {
        if (currentSortField === 'distance') {
            const aHas = a._distance != null && isFinite(a._distance);
            const bHas = b._distance != null && isFinite(b._distance);
            if (aHas && !bHas) return -1;
            if (!aHas && bHas) return 1;
            if (!aHas && !bHas) return 0;
            return currentSortDirection === 'asc' ? a._distance - b._distance : b._distance - a._distance;
        }
        let va = a[currentSortField] || '', vb = b[currentSortField] || '';
        if (currentSortField === 'orderId') {
            const na = parseInt(String(va).replace(/[^0-9]/g, '')) || 0;
            const nb = parseInt(String(vb).replace(/[^0-9]/g, '')) || 0;
            return currentSortDirection === 'asc' ? na - nb : nb - na;
        }
        va = String(va); vb = String(vb);
        return currentSortDirection === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
}

function toggleSort(field) {
    if (field === 'distance' && !referencePoint) { showToast('请先设置参考位置', 'warning'); return; }
    if (currentSortField === field) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortField = field;
        currentSortDirection = field === 'distance' ? 'asc' : 'desc';
    }
    currentPage = 1;
    updateDistances();
    sortOrders();
    renderTable();
}

function getOrderDisplayId(order) {
    return order.orderId || 'CD-' + Math.random().toString(36).substring(2, 8);
}
