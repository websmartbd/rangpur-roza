let DATA = [];
const ASHRA = [
    { label: "১ম আশরা — রহমত", icon: "fa-moon" },
    { label: "২য় আশরা — মাগফেরাত", icon: "fa-hand-holding-heart" },
    { label: "৩য় আশরা — নাজাত", icon: "fa-fire-flame-curved" },
];

const toBn = s => s.toString().replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]);

function getTodayDay() {
    const start = new Date(2026, 1, 19);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const diff = Math.floor((now - start) / 86400000);
    return (diff >= 0 && diff < 30) ? diff + 1 : null;
}

function parseM(t) {
    const e = t.replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d));
    const [h, m] = e.split(':').map(Number);
    return h * 60 + m;
}

function initToday() {
    const day = getTodayDay();
    const row = DATA[(day || 1) - 1];
    document.getElementById('td-day').textContent = toBn(day || 1);
    document.getElementById('td-date').innerHTML =
        `<i class="fa-regular fa-calendar" style="margin-right:4px;"></i>${row.date} ২০২৬`;
    document.getElementById('td-sehri').textContent = row.sehri;
    document.getElementById('td-fajr').textContent = row.fajr;
    document.getElementById('td-iftar').textContent = row.iftar;
    const ai = (day || 1) <= 10 ? 0 : (day || 1) <= 20 ? 1 : 2;
    document.getElementById('ashra-badge').innerHTML =
        `<i class="fa-solid ${ASHRA[ai].icon}" style="margin-right:4px;"></i>${ASHRA[ai].label}`;
    startCD(row);
}

let cdInt = null;
function startCD(row) {
    if (cdInt) clearInterval(cdInt);
    cdInt = setInterval(() => tick(row), 1000);
    tick(row);
}

function tick(row) {
    const now = new Date();
    const nowM = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    const sehriM = parseM(row.sehri);
    const iftarM = parseM(row.iftar) + 12 * 60; // PM
    let title, target;
    if (nowM < sehriM) { title = "সাহরী শেষ হতে বাকি"; target = sehriM; }
    else if (nowM < iftarM) { title = "ইফতার পর্যন্ত বাকি"; target = iftarM; }
    else { title = "পরের সাহরীর অপেক্ষায়"; target = sehriM + 24 * 60; }
    document.getElementById('cd-title').textContent = title;
    let diff = Math.round((target - nowM) * 60); if (diff < 0) diff = 0;
    const h = Math.floor(diff / 3600), m = Math.floor((diff % 3600) / 60), s = diff % 60;
    document.getElementById('cd-h').textContent = toBn(String(h).padStart(2, '0'));
    document.getElementById('cd-m').textContent = toBn(String(m).padStart(2, '0'));
    document.getElementById('cd-s').textContent = toBn(String(s).padStart(2, '0'));
}

function buildTable() {
    const day = getTodayDay();
    const tbody = document.getElementById('tbl-body');
    tbody.innerHTML = '<tr style="height: 12px; border: none;"></tr>'; // Spacer row
    DATA.forEach(row => {
        if (row.r === 1 || row.r === 11 || row.r === 21) {
            const ai = row.r === 1 ? 0 : row.r === 11 ? 1 : 2;
            const sep = document.createElement('tr');
            sep.className = 'ashra-header';
            sep.innerHTML = `<td colspan="5"><i class="fa-solid ${ASHRA[ai].icon}" style="margin-right:6px;"></i>${ASHRA[ai].label}</td>`;
            tbody.appendChild(sep);
        }
        const tr = document.createElement('tr');
        const isToday = row.r === day;
        if (isToday) tr.className = 'today-row';
        tr.innerHTML = `
      <td style="font-weight:600;color:${isToday ? 'var(--accent)' : 'var(--text2)'}">
        ${toBn(row.r)}${isToday ? '<i class="fa-solid fa-star today-star"></i>' : ''}
      </td>
      <td>${row.date}</td>
      <td style="color:var(--sehri);${isToday ? 'font-weight:700' : ''};">${row.sehri}</td>
      <td style="color:var(--fajr);${isToday ? 'font-weight:700' : ''};">${row.fajr}</td>
      <td style="color:var(--iftar);${isToday ? 'font-weight:700' : ''};">${row.iftar}</td>`;
        tbody.appendChild(tr);
    });
}

function showFullTable() {
    buildTable();
    document.getElementById('today-view').style.display = 'none';
    const tv = document.getElementById('table-view');
    tv.style.display = 'block';
    tv.classList.remove('fade-in');
    void tv.offsetWidth; // force reflow
    tv.classList.add('fade-in');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
        const tr = document.querySelector('tr.today-row');
        if (tr) tr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
}

function showToday() {
    document.getElementById('table-view').style.display = 'none';
    const tv = document.getElementById('today-view');
    tv.style.display = 'block';
    tv.classList.remove('fade-in');
    void tv.offsetWidth; // force reflow
    tv.classList.add('fade-in');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// DISTRICT LOGIC
function showModal() {
    document.getElementById('dist-modal').style.display = 'flex';
}

function selectDistrict(id) {
    localStorage.setItem('selectedDistrict', id);
    document.getElementById('dist-modal').style.display = 'none';
    loadData(id);
}

// Cache object to store loaded data
const CACHE = {};

function loadData(id) {
    // Check in-memory cache first
    if (CACHE[id]) {
        renderData(CACHE[id]);
        return;
    }

    // Show loading state
    document.getElementById('today-view').style.display = 'none';
    document.getElementById('table-view').style.display = 'none';
    const statusEl = document.getElementById('status-msg');
    statusEl.style.display = 'block';
    statusEl.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin" style="font-size:30px; color:var(--accent);"></i><div style="margin-top:10px; color:var(--text2);">লোড হচ্ছে...</div>';

    fetch(`assets/data/${id}.json`)
        .then(res => {
            if (!res.ok) throw new Error("HTTP error " + res.status);
            return res.json();
        })
        .then(json => {
            // Store in cache
            CACHE[id] = json;

            // Hide loading, show content
            statusEl.style.display = 'none';
            renderData(json);
        })
        .catch(err => {
            console.error('লোড করতে ব্যর্থ:', err);
            statusEl.innerHTML = `
                        <div style="font-size:30px; color:#ff6b6b; margin-bottom:10px;"><i class="fa-solid fa-triangle-exclamation"></i></div>
                        <div style="color:var(--cream); margin-bottom:15px;">ডেটা লোড করতে সমস্যা হয়েছে</div>
                        <button class="status-retry-btn" onclick="loadData('${id}')">আবার চেষ্টা করুন</button>
                    `;
        });
}

function renderData(json) {
    DATA = json.schedule;
    document.getElementById('current-jela').textContent = json.district + " জেলা";
    document.getElementById('table-jela').textContent = json.district;
    document.title = "রমযান সময়সূচি — " + json.district;
    initToday();
    showToday();
}

// Initial check
const saved = localStorage.getItem('selectedDistrict');
if (saved) {
    loadData(saved);
} else {
    showModal();
}
