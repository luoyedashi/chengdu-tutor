// ============ 初始化入口 ============

(async function init() {
    console.log('[INIT] Starting...');
    initColumnVisibility();
    
    // Restore reference point
    try {
        var pts = localStorage.getItem(APP_INFO.refPointKey);
        if (pts) {
            referencePoint = JSON.parse(pts);
            updateRefDisplay();
            if (referencePoint.lat && referencePoint.lng) updateWeather(referencePoint.lat, referencePoint.lng);
        }
    } catch(e) { console.warn('[INIT] refPoint error:', e); }

    // Try CloudBase
    var cloudOk = false;
    try { 
        cloudOk = await initCloudBase(); 
    } catch(e) { 
        console.warn('[INIT] CloudBase init failed:', e.message || e); 
    }

    if (cloudOk) {
        try { 
            await loadOrders(); 
        } catch(e) { 
            console.error('[INIT] loadOrders failed:', e);
        }
    } else {
        // 离线模式：加载内嵌数据
        await loadOrders();
        
        if (allOrders.length === 0) {
            var cached = localStorage.getItem(APP_INFO.cacheKey);
            if (cached) {
                try {
                    var parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        allOrders = parsed;
                    }
                } catch(e) {}
            }
        }
        
        if (allOrders.length > 0) {
            var el = document.getElementById('syncStatus');
            el.textContent = '\u2705 \u5df2\u52a0\u8f7d ' + allOrders.length + ' \u6761\u8ba2\u5355';
            el.className = 'sync-status sync-success';
        } else {
            var el = document.getElementById('syncStatus');
            el.textContent = '\u274c \u65e0\u6570\u636e\uff0c\u8bf7\u68c0\u67e5\u6570\u636e\u6587\u4ef6';
            el.className = 'sync-status sync-error';
        }
        setTimeout(function() {
            var el = document.getElementById('syncStatus');
            if (el) { el.style.opacity = '0'; el.style.transition = 'opacity 0.5s'; }
        }, 3000);
    }

    if (cloudOk) { try { await recordVisit(); } catch(e) {} }
    
    if (referencePoint) { 
        currentSortField = 'distance'; 
        currentSortDirection = 'asc'; 
    }
    
    // onDataReady 已在 loadOrders 内部调用，此处确保最终渲染
    if (allOrders.length > 0 && filteredOrders.length === 0) {
        onDataReady();
    } else {
        updateDistances(); 
        sortOrders(); 
        renderAll();
    }
    
    console.log('[INIT] Done - orders:', allOrders.length, 'filtered:', filteredOrders.length);
})();

document.addEventListener('click', function(e) {
    var modal = document.getElementById('orderModal'); if (e.target === modal) closeModal();
    var mapModal = document.getElementById('mapModal'); if (e.target === mapModal) closeMapModal();
});
