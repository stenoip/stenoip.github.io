

// ===============================
// COPYRIGHT STENOIP COMPANY!


//COPING IS STRICTLY PROHIBETED

// ===============================

function showMainContent() {
    const video = document.getElementById('intro-video');
    if (video) {
        video.pause();
        video.style.display = 'none';
    }

    document.getElementById('launch-screen').style.display = 'none';
    document.getElementById('skip-btn').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    document.body.style.overflowY = 'auto';
}

function startExperience() {
    const introToggle = document.getElementById('introToggle');
    document.getElementById('launch-screen').style.display = 'none';

    if (introToggle && introToggle.checked) {
        const video = document.getElementById('intro-video');
        video.muted = true; // autoplay-safe
        video.style.display = 'block';
        video.play().catch(() => {});
        document.getElementById('skip-btn').style.display = 'block';
    } else {
        showMainContent();
    }
}

function skipVideo() {
    showMainContent();
}

document.addEventListener('DOMContentLoaded', () => {
    const introToggle = document.getElementById('introToggle');
    const saved = localStorage.getItem('introVideoEnabled');

    if (introToggle) {
        introToggle.checked = saved === null ? true : saved === 'true';

        introToggle.addEventListener('change', function () {
            localStorage.setItem('introVideoEnabled', this.checked);
        });
    }

    const video = document.getElementById('intro-video');
    if (video) {
        video.muted = true;
        video.addEventListener('ended', showMainContent);
    }

    if (!introToggle || !introToggle.checked) {
        showMainContent();
    } else {
        document.getElementById('launch-screen').style.display = 'flex';
        if (video) video.style.display = 'none';
    }

    renderTiles();
});

// ===============================
// WINDOWS 8 STYLE TILE SYSTEM
// ===============================

const TILE_STORAGE_KEY = 'stenokonnect_tiles';

function getTiles() {
    try {
        return JSON.parse(localStorage.getItem(TILE_STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function saveTiles(tiles) {
    localStorage.setItem(TILE_STORAGE_KEY, JSON.stringify(tiles));
}

function renderTiles() {
    const grid = document.getElementById("tile-grid");
    if (!grid) return;

    grid.innerHTML = '';
    const tiles = getTiles();

    // EXISTING TILES
    tiles.forEach((tile, index) => {
        const tileEl = document.createElement('div');
        tileEl.className = 'tile';
        tileEl.onclick = () => window.open(tile.url, '_blank');

        tileEl.innerHTML = `
            <div class="tile-title">${escapeHtml(tile.name)}</div>
            <div class="tile-remove" title="Remove">✕</div>
        `;

        tileEl.querySelector('.tile-remove').onclick = (e) => {
            e.stopPropagation();
            removeTile(index);
        };

        grid.appendChild(tileEl);
    });

    // ADD TILE (PLUS TILE)
    const addTileEl = document.createElement('div');
    addTileEl.className = 'tile add-tile';
    addTileEl.innerHTML = '+';

    addTileEl.onclick = () => showAddTileForm(addTileEl);

    grid.appendChild(addTileEl);
}


function addTile() {
    const nameInput = document.getElementById('tile-name');
    const urlInput = document.getElementById('tile-url');

    if (!nameInput || !urlInput) return;

    const name = nameInput.value.trim();
    let url = urlInput.value.trim();

    if (!name || !url) {
        alert('Please enter a site name and URL.');
        return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    const tiles = getTiles();
    tiles.push({ name, url });
    saveTiles(tiles);

    nameInput.value = '';
    urlInput.value = '';

    renderTiles();
}

function removeTile(index) {
    const tiles = getTiles();
    tiles.splice(index, 1);
    saveTiles(tiles);
    renderTiles();
}

// ===============================
// UTIL
// ===============================

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

  function showAddTileForm(tileEl) {
    tileEl.onclick = null;

    tileEl.innerHTML = `
        <form onsubmit="submitNewTile(event)">
            <input type="text" id="new-tile-name" placeholder="Site name" required>
            <input type="url" id="new-tile-url" placeholder="https://example.com" required>
            <button type="submit">Add</button>
        </form>
    `;
}

function submitNewTile(event) {
    event.preventDefault();

    const name = document.getElementById('new-tile-name').value.trim();
    let url = document.getElementById('new-tile-url').value.trim();

    if (!name || !url) return;

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    const tiles = getTiles();
    tiles.push({ name, url });
    saveTiles(tiles);

    renderTiles();
}
  function filterTiles(query) {
    const tiles = document.querySelectorAll('.tile:not(.add-tile)');
    const lower = query.toLowerCase();

    tiles.forEach(tile => {
        const title = tile.querySelector('.tile-title')?.textContent.toLowerCase() || '';
        tile.style.display = title.includes(lower) ? '' : 'none';
    });
}
function handleWebSearch(event) {
    if (event.key === 'Enter') {
        const query = event.target.value.trim();
        if (!query) return;

        const url = `https://stenoip.github.io/oodles/search?q=${encodeURIComponent(query)}`;
        window.open(url, '_blank');
        event.target.value = '';
    }
}
// Fixed My Things (cannot be removed)
const MY_THINGS = [
    { name: 'StenoKonnect Home', url: 'index.html' },
    { name: 'Learn Centre', url: 'https://stenoip.github.io/learn-centre' },
    { name: 'Television Guide', url: 'television_guide.html' }
];

function renderMyThings() {
    const grid = document.getElementById('my-things-grid');
    if (!grid) return;

    grid.innerHTML = '';

    MY_THINGS.forEach(item => {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.textContent = item.name;

        tile.onclick = () => window.open(item.url, '_blank');
        grid.appendChild(tile);
    });
}

renderMyThings();

document.querySelectorAll('.sidebar a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
});

const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('sidebar-toggle');

toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

// Optional: click outside sidebar to close it
document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});



    
    
