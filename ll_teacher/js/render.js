// ============ 渲染模块 ============

function renderAll() { renderStats(); renderFilterBar(); renderTable(); }
function renderStats() {
    const total = filteredOrders.length;
    document.getElementById('totalCount').textContent = total;
    const districtMap = new Map(); let onlineCount = 0;
    filteredOrders.forEach(o => {
        const dist = o.district || ''; const city = o.city || '';
        if (city === '线上' || dist === '线上') { onlineCount++; return; }
        if (dist) districtMap.set(dist, (districtMap.get(dist)||0)+1);
    });
    const sorted = Array.from(districtMap.entries()).sort((a,b)=>b[1]-a[1]);
    let html = '';
    sorted.forEach(([d,c]) => {
        const active = currentFilterTag === d ? ' active' : '';
        html += '<span class="stats-badge' + active + '" onclick="setFilterTag(\'' + d.replace(/'/g,"\\'") + '\')">' + d + ' <span class="count">' + c + '</span></span>';
    });
    if (onlineCount > 0) {
        const active = currentFilterTag === '线上' ? ' active' : '';
        html += '<span class="stats-badge' + active + '" onclick="setFilterTag(\'线上\')">线上 <span class="count">' + onlineCount + '</span></span>';
    }
    document.getElementById('districtStats').innerHTML = html || '<span style="color:#999;">暂无数据</span>';
}
function renderFilterBar() {
    const grades = new Set();
    filteredOrders.forEach(o => { const g = o.grade || ''; if(g) grades.add(g); });
    let html = '<span class="filter-chip' + (!currentFilterTag ? ' active' : '') + '" onclick="setFilterTag(\'\')">全部</span>';
    const gradeOrder = ['幼儿园','幼小衔接','小学','一年级','二年级','三年级','四年级','五年级','六年级','小升初','初一','初二','初三','初升高','高一','高二','高三','考研','成人'];
    const sorted = [...grades].sort((a,b) => { const ia=gradeOrder.findIndex(x=>String(a).includes(x)); const ib=gradeOrder.findIndex(x=>String(b).includes(x)); return (ia===-1?999:ia)-(ib===-1?999:ib); });
    sorted.forEach(g => {
        const active = currentFilterTag === g ? ' active' : '';
        html += '<span class="filter-chip' + active + '" onclick="setFilterTag(\'' + g.replace(/'/g,"\\'") + '\')">' + g + '</span>';
    });
    document.getElementById('filterBar').innerHTML = html;
}
function setFilterTag(tag) { currentFilterTag = currentFilterTag === tag ? '' : tag; applyFilters(); }
function applyFilters() {
    const search = document.getElementById('searchInput').value.trim().toLowerCase();
    filteredOrders = [...allOrders];
    if (currentFilterTag) {
        filteredOrders = filteredOrders.filter(o => {
            const d=(o.district||'').toLowerCase(), g=(o.grade||'').toLowerCase(), c=(o.city||'').toLowerCase();
            return d===currentFilterTag.toLowerCase() || g.includes(currentFilterTag.toLowerCase()) || c.includes(currentFilterTag.toLowerCase());
        });
    }
    if (search) {
        filteredOrders = filteredOrders.filter(o => ['orderId','address','subject','grade','teacherRequirement','sex','salary','note','district'].some(f => String(o[f]||'').toLowerCase().includes(search)));
    }
    updateDistances(); sortOrders(); currentPage = 1; renderAll();
}
function renderTable() {
    console.log('[RENDER] filteredOrders:', filteredOrders.length, 'allOrders:', allOrders.length);
    const thead = document.getElementById('tableHead'), tbody = document.getElementById('tableBody');
    thead.innerHTML = ''; tbody.innerHTML = '';
    let visibleCols = 0;
    const headerRow = document.createElement('tr');
    COLUMN_CONFIG.forEach(col => { if(columnVisibility[col.field]) { visibleCols++;
        const th = document.createElement('th'); th.textContent = col.label; th.onclick = () => toggleSort(col.field);
        if(col.field === currentSortField) th.innerHTML += ' <span class=\"sort-indicator\">' + (currentSortDirection==='asc'?'↑':'↓') + '</span>';
        headerRow.appendChild(th); } });
    const actionTh = document.createElement('th'); actionTh.textContent = '操作'; actionTh.style.textAlign = 'center';
    headerRow.appendChild(actionTh); thead.appendChild(headerRow); visibleCols++;
    const total = filteredOrders.length, totalPages = Math.ceil(total / PAGE_SIZE) || 1;
    if(currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageOrders = filteredOrders.slice(start, start + PAGE_SIZE);
    if(pageOrders.length === 0) { const tr=document.createElement('tr'); const td=document.createElement('td'); td.colSpan=visibleCols;
        td.innerHTML = '<div class=\"empty-state\"><div class=\"e-icon\">📭</div><p>暂无匹配订单</p></div>'; tr.appendChild(td); tbody.appendChild(tr); }
    else { pageOrders.forEach((order, pageIdx) => { const realIndex = start + pageIdx; const tr = document.createElement('tr');
        tr.onclick = () => showDetail(realIndex); const id = getOrderDisplayId(order);
        const district = order.district || '', city = order.city || '';
        const cityRegion = city === '线上' ? '线上' : district;
        COLUMN_CONFIG.forEach(col => { if(columnVisibility[col.field]) {
            const td = document.createElement('td'); let val = '-';
            switch(col.field) {
                case 'orderId': val = '<strong>' + escapeHtml(id) + '</strong>'; break;
                case 'cityRegion': val = escapeHtml(cityRegion); break;
                case 'address': val = escapeHtml(order.address || ''); break;
                case 'distance':
                    if(referencePoint && order._distance!=null && isFinite(order._distance))
                        val = order._distance < 1 ? (order._distance*1000).toFixed(0)+'m' : order._distance.toFixed(1)+'km';
                    else val = '-'; break;
                case 'grade': val = escapeHtml(order.grade||''); break;
                case 'sex': val = escapeHtml(order.sex||''); break;
                case 'subject': val = escapeHtml(order.subject||''); break;
                case 'schedule': val = escapeHtml(order.schedule||''); break;
                case 'lessonCount': val = escapeHtml(order.lessonCount||''); break;
                case 'teacherRequirement': val = escapeHtml(order.teacherRequirement||''); break;
                case 'salary': val = escapeHtml(order.salary||''); break;
            } td.innerHTML = val; tr.appendChild(td); } });
        const actionTd = document.createElement('td'); actionTd.className = 'action-cell';
        actionTd.innerHTML = '<button class=\"btn-action\" onclick=\"event.stopPropagation(); showDetail(' + realIndex + ')\">详情</button><span class=\"view-count\">👀' + (orderViewCountMap[id]||0) + '人看过</span>';
        tr.appendChild(actionTd); tbody.appendChild(tr); }); }
    renderPagination(total, totalPages);
}
function renderPagination(total, totalPages) {
    document.getElementById('pageInfo').textContent = '共 ' + total + ' \u00b7 第 ' + currentPage + '/' + totalPages + ' 页';
    const wrap = document.getElementById('paginationWrap'); wrap.innerHTML = ''; if(totalPages <= 1) return;
    const addBtn = (label, page, disabled) => { const btn=document.createElement('button');
        btn.className='page-btn'+(page===currentPage?' active':''); btn.textContent=label;
        if(disabled) btn.disabled=true; else btn.onclick=()=>{currentPage=page;renderTable();window.scrollTo({top:0,behavior:'smooth'});}; wrap.appendChild(btn); };
    addBtn('上一页', currentPage-1, currentPage<=1);
    const maxVisible=7; let pStart=Math.max(1,currentPage-Math.floor(maxVisible/2));
    let pEnd=Math.min(totalPages, pStart+maxVisible-1); pStart=Math.max(1,pEnd-maxVisible+1);
    if(pStart>1){addBtn('1',1); if(pStart>2){const s=document.createElement('span'); s.textContent='...'; s.style.padding='0 4px'; wrap.appendChild(s);}}
    for(let p=pStart;p<=pEnd;p++) addBtn(String(p),p);
    if(pEnd<totalPages){if(pEnd<totalPages-1){const s=document.createElement('span');s.textContent='...';s.style.padding='0 4px';wrap.appendChild(s);} addBtn(String(totalPages),totalPages);}
    addBtn('下一页', currentPage+1, currentPage>=totalPages);
}
