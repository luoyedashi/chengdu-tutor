// ============ 详情 + 位置 + 天气 ============

let currentDetailOrder = null;

function showDetail(index) {
    const order = filteredOrders[index]; if (!order) return; currentDetailOrder = order;
    const id = getOrderDisplayId(order);
    const dist = order.district || '-', city = order.city || '-', addr = order.address || '-';
    const subj = order.subject || '-', grade = order.grade || '-', sex = order.sex || '-';
    const salary = order.salary || '-', sched = order.schedule || '-';
    const lcount = order.lessonCount || '-', treq = order.teacherRequirement || '-', note = order.note || '';
    const cr = city === '线上' ? '线上' : dist;
    let nb = '';
    if (note.includes('回收')) nb += '<span style=\"background:#e0e0e0;color:#666;padding:2px 8px;border-radius:10px;font-size:0.72rem;\">回收单</span>';
    if (note.includes('重新找')) nb += ' <span style=\"background:#fff3cd;color:#856404;padding:2px 8px;border-radius:10px;font-size:0.72rem;\">重新找</span>';
    const body =
        '<div class=\"detail-row\"><div class=\"detail-label\">编号</div><div class=\"detail-value\"><strong>' + escapeHtml(id) + '</strong> ' + nb + '</div></div>' +
        '<div class=\"detail-row\"><div class=\"detail-label\">城市</div><div class=\"detail-value\">' + escapeHtml(city) + '</div></div>' +
        '<div class=\"detail-row\"><div class=\"detail-label\">区域</div><div class=\"detail-value\">' + escapeHtml(cr) + '</div></div>' +
        '<div class=\"detail-row\"><div class=\"detail-label\">地址</div><div class=\"detail-value\">' + escapeHtml(addr) + '</div></div>' +
        '<div class=\"detail-row\"><div class=\"detail-label\">科目</div><div class=\"detail-value\">' + escapeHtml(subj) + '</div></div>' +
        '<div class=\"detail-row\"><div class=\"detail-label\">年级</div><div class=\"detail-value\">' + escapeHtml(grade) + '</div></div>' +
        '<div class=\"detail-row\"><div class=\"detail-label\">性别</div><div class=\"detail-value\">' + escapeHtml(sex) + '</div></div>' +
        '<div class=\"detail-row\"><div class=\"detail-label\">时薪</div><div class=\"detail-value\"><strong style=\"color:var(--primary);\">' + escapeHtml(salary) + '</strong></div></div>' +
        '<div class=\"detail-row\"><div class=\"detail-label\">时间</div><div class=\"detail-value\">' + escapeHtml(sched) + '</div></div>' +
        '<div class=\"detail-row\"><div class=\"detail-label\">次数</div><div class=\"detail-value\">' + escapeHtml(lcount) + '</div></div>' +
        '<div class=\"detail-row\"><div class=\"detail-label\">要求</div><div class=\"detail-value\">' + escapeHtml(treq) + '</div></div>' +
        (note ? '<div class=\"detail-row\"><div class=\"detail-label\">备注</div><div class=\"detail-value\">' + escapeHtml(note) + '</div></div>' : '') +
        '<div class=\"contact-section\"><p style=\"color:#999;font-size:0.8rem;\">扫码或复制信息咨询</p><img src=\"images/wechat.jpg\" alt=\"联系方式\" style=\"max-width:180px;border-radius:10px;border:1px solid #eee;\"><p style=\"font-size:0.7rem;color:#aaa;margin-top:4px;\">尹檀 \u00b7 成都家教</p></div>';
    document.getElementById('modalBody').innerHTML = body;
    recordOrderView(id);
    document.getElementById('orderModal').classList.add('show');
}

function closeModal() { document.getElementById('orderModal').classList.remove('show'); currentDetailOrder = null; }

function copyOrderInfo() {
    if (!currentDetailOrder) return; const o = currentDetailOrder; const id = getOrderDisplayId(o);
    let text = `${id}\n【地址】${o.city||''} ${o.district||''} ${o.address||''}\n【年级】${o.grade||''} 【性别】${o.sex||''}\n【科目】${o.subject||''}\n【时间】${o.schedule||''}\n【次数】${o.lessonCount||''}\n【要求】${o.teacherRequirement||''}\n【时薪】${o.salary||''}`;
    if (o.note) text += '\n【备注】' + o.note;
    copyToClipboard(text);
}

// 位置
function getGeoLocation() {
    document.getElementById('refAddress').textContent = '正在定位...';
    navigator.geolocation.getCurrentPosition(
        pos => { setRefPoint(pos.coords.latitude, pos.coords.longitude, '已定位 (' + pos.coords.latitude.toFixed(4) + ', ' + pos.coords.longitude.toFixed(4) + ')'); showToast('定位成功', 'success'); },
        () => { showToast('定位失败，请手动选择', 'warning'); document.getElementById('refAddress').textContent = '未设置位置'; },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function setRefPoint(lat, lng, addr) {
    referencePoint = { lat, lng, address: addr };
    localStorage.setItem(APP_INFO.refPointKey, JSON.stringify(referencePoint));
    updateRefDisplay(); updateDistances(); currentSortField = 'distance'; currentSortDirection = 'asc';
    sortOrders(); currentPage = 1; renderAll(); updateWeather(lat, lng);
}

function updateRefDisplay() {
    const addrEl = document.getElementById('refAddress');
    const clearBtn = document.getElementById('btnClearRef');
    if (referencePoint) { addrEl.textContent = referencePoint.address || '已设置'; addrEl.classList.remove('text-muted'); addrEl.classList.add('fw-bold'); clearBtn.style.display = ''; }
    else { addrEl.textContent = '未设置位置'; addrEl.classList.add('text-muted'); addrEl.classList.remove('fw-bold'); clearBtn.style.display = 'none'; }
}

function clearRefPoint() {
    referencePoint = null; localStorage.removeItem(APP_INFO.refPointKey); updateRefDisplay();
    currentSortField = 'orderId'; currentSortDirection = 'desc'; sortOrders(); currentPage = 1; renderAll();
    document.getElementById('weatherFloat').style.display = 'none'; showToast('已清除参考位置');
}

// 天气
async function updateWeather(lat, lng) {
    try {
        const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lng + '&current_weather=true&timezone=auto';
        const res = await fetch(url); const data = await res.json(); const w = data.current_weather;
        const codes = {0:'晴',1:'少云',2:'多云',3:'阴',45:'雾',48:'雾',51:'毛毛雨',53:'小雨',55:'中雨',61:'小雨',63:'中雨',65:'大雨',71:'小雪',73:'中雪',75:'大雪',80:'阵雨',81:'中阵雨',82:'大阵雨',95:'雷暴'};
        const icons = {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌧️',61:'🌧️',63:'🌧️',65:'🌧️',71:'❄️',73:'❄️',75:'❄️',80:'🌦️',81:'🌧️',82:'🌧️',95:'⛈️'};
        document.getElementById('weatherIcon').textContent = icons[w.weathercode] || '🌤️';
        document.getElementById('weatherDesc').textContent = codes[w.weathercode] || '晴';
        document.getElementById('weatherTemp').textContent = Math.round(w.temperature) + '°C';
        document.getElementById('weatherFloat').style.display = 'flex';
        const bubble = document.getElementById('weatherBubble');
        bubble.textContent = (codes[w.weathercode]||'晴') + ' \u00b7 成都家教 \u00b7 尹檀';
        bubble.classList.add('show'); clearTimeout(bubble._timer);
        bubble._timer = setTimeout(() => bubble.classList.remove('show'), 4000);
    } catch(e) { console.warn('天气获取失败', e); }
}

// 地图
let mapInstance = null, mapLoaded = false;

async function loadAMap() {
    if (typeof AMap !== 'undefined') return true;
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://webapi.amap.com/maps?v=2.0&key=' + AMAP_CONFIG.key + '&plugin=AMap.PlaceSearch,AMap.AutoComplete,AMap.Geocoder';
        script.onload = () => resolve(true); script.onerror = () => resolve(false);
        document.head.appendChild(script);
    });
}

function openMapPicker() {
    document.getElementById('mapModal').classList.add('show');
    if (!mapLoaded) { loadAMap().then(ok => { if (ok) { mapLoaded = true; initMap(); } else showToast('地图加载失败', 'error'); }); }
    else { initMap(); }
}

function initMap() {
    if (mapInstance) return; const container = document.getElementById('mapContainer');
    if (!container || container.offsetWidth === 0) return;
    mapInstance = new AMap.Map('mapContainer', { zoom: 13, center: [104.0657, 30.6598], resizeEnable: true });
    const geocoder = new AMap.Geocoder();
    mapInstance.on('click', function(e) {
        geocoder.getAddress([e.lnglat.getLng(), e.lnglat.getLat()], (status, result) => {
            if (status === 'complete' && result.regeocode) { setRefPoint(e.lnglat.getLat(), e.lnglat.getLng(), result.regeocode.formattedAddress); closeMapModal(); showToast('参考位置已设置', 'success'); }
        });
    });
}

function searchMapAddress() {
    if (!mapInstance) return; const query = document.getElementById('mapSearchInput').value.trim(); if (!query) return;
    const placeSearch = new AMap.PlaceSearch({ map: mapInstance, pageSize: 10, pageIndex: 1, city: '成都' });
    placeSearch.search(query, function(status, result) {
        if (status === 'complete' && result.pois && result.pois.length > 0) {
            const poi = result.pois[0]; mapInstance.setCenter([poi.location.lng, poi.location.lat]);
            new AMap.Marker({ position: poi.location, map: mapInstance }).setMap(mapInstance);
        }
    });
}

function closeMapModal() { document.getElementById('mapModal').classList.remove('show'); }
