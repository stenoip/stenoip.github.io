// ===============================
// COPYRIGHT STENOIP COMPANY!
// COPING IS STRICTLY PROHIBETED
// ===============================

var TILE_STORAGE_KEY = 'stenokonnect_tiles';

// --- INTRO & CONTENT CONTROL ---

function showMainContent() {
    var video = document.getElementById('intro-video');
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
    var introToggle = document.getElementById('introToggle');
    document.getElementById('launch-screen').style.display = 'none';

    if (introToggle && introToggle.checked) {
        var video = document.getElementById('intro-video');
        video.muted = false;
        video.style.display = 'block';
        video.play().catch(function () {});
        document.getElementById('skip-btn').style.display = 'block';
    } else {
        showMainContent();
    }
}

function skipVideo() {
    showMainContent();
}

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', function () {
    var introToggle = document.getElementById('introToggle');
    var saved = localStorage.getItem('introVideoEnabled');

    if (introToggle) {
        introToggle.checked = saved === null ? true : saved === 'true';
        introToggle.addEventListener('change', function () {
            localStorage.setItem('introVideoEnabled', this.checked);
        });
    }

    var video = document.getElementById('intro-video');
    if (video) {
        video.muted = false;
        video.addEventListener('ended', showMainContent);
    }

    if (!introToggle || !introToggle.checked) {
        showMainContent();
    } else {
        var launch = document.getElementById('launch-screen');
        if (launch) launch.style.display = 'flex';
        if (video) video.style.display = 'none';
    }

    migrateOldTiles();
    renderTiles();
    renderMyThings();
});

// --- LOCAL STORAGE UTILITIES ---

function getTiles() {
    try {
        return JSON.parse(localStorage.getItem(TILE_STORAGE_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function saveTiles(tiles) {
    localStorage.setItem(TILE_STORAGE_KEY, JSON.stringify(tiles));
}

// --- MIGRATION: ensure all tiles have a colour ---

function migrateOldTiles() {
    var tiles = getTiles();
    var updated = false;

    tiles.forEach(function (tile) {
        if (!tile.color) {
            tile.color = getRandomWin8Color();
            updated = true;
        }
    });

    if (updated) saveTiles(tiles);
}

// --- TILE RENDERING ---

function renderTiles() {
    var grid = document.getElementById('tile-grid');
    if (!grid) return;

    grid.innerHTML = '';
    var tiles = getTiles();

    tiles.forEach(function (tile, index) {
        var tileEl = document.createElement('div');
        tileEl.className = 'tile';
        tileEl.style.setProperty('--tile-colour', tile.color || '#2d89ef');

        tileEl.onclick = function () {
            window.open(tile.url, '_blank');
        };

        tileEl.innerHTML =
            (tile.favicon
                ? '<img src="' + tile.favicon + '" style="width:32px; height:32px; margin-bottom:10px;">'
                : '') +
            '<div class="tile-title">' + escapeHtml(tile.name) + '</div>' +
            '<div class="tile-remove" title="Remove">✕</div>';

        tileEl.querySelector('.tile-remove').onclick = function (e) {
            e.stopPropagation();
            removeTile(index);
        };

        grid.appendChild(tileEl);
    });

    var addTileEl = document.createElement('div');
    addTileEl.className = 'tile add-tile';
    addTileEl.textContent = '+';
    addTileEl.onclick = function () {
        showAddTileForm(addTileEl);
    };

    grid.appendChild(addTileEl);
}

// --- ADD TILE FORM ---

function showAddTileForm(tileEl) {
    tileEl.onclick = null;
    tileEl.innerHTML =
        '<form onsubmit="submitNewTile(event)" style="display:flex; flex-direction:column; gap:6px; padding:10px;">' +
            '<input type="text" id="new-tile-name" placeholder="Site name" required style="color:black">' +
            '<input type="text" id="new-tile-url" placeholder="example.com" required style="color:black">' +
            '<label style="font-size:12px; color:black;">Tile colour</label>' +
            '<input type="color" id="new-tile-colour" value="#2d89ef">' +
            '<button type="submit" style="cursor:pointer">Add</button>' +
        '</form>';
}

function submitNewTile(event) {
    event.preventDefault();

    var name = document.getElementById('new-tile-name').value.trim();
    var url = document.getElementById('new-tile-url').value.trim();
    var colour = document.getElementById('new-tile-colour').value;

    if (!name || !url) return;
    if (!url.startsWith('http')) url = 'https://' + url;

    var tiles = getTiles();

    tiles.push({
        name: name,
        url: url,
        color: colour,
        favicon: ''
    });

    saveTiles(tiles);
    renderTiles();
}

// --- REMOVE TILE ---

function removeTile(index) {
    var tiles = getTiles();
    tiles.splice(index, 1);
    saveTiles(tiles);
    renderTiles();
}

// --- UTILS ---

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function filterTiles(query) {
    var tiles = document.querySelectorAll('.tile:not(.add-tile)');
    var lower = query.toLowerCase();

    tiles.forEach(function (tile) {
        var title = tile.querySelector('.tile-title')?.textContent.toLowerCase() || '';
        tile.style.display = title.includes(lower) ? '' : 'none';
    });
}

function handleWebSearch(event) {
    if (event.key === 'Enter') {
        var query = event.target.value.trim();
        if (!query) return;
        var url = 'https://stenoip.github.io/oodles/search?q=' + encodeURIComponent(query);
        window.open(url, '_blank');
        event.target.value = '';
    }
}

// --- FIXED MY THINGS ---

var MY_THINGS = [
    { name: 'StenoKonnect Home', url: 'index.html' },
    { name: 'Learn Centre', url: 'https://stenoip.github.io/learn-centre' },
    { name: 'Television Guide', url: 'television_guide.html' }
];

function renderMyThings() {
    var grid = document.getElementById('my-things-grid');
    if (!grid) return;

    grid.innerHTML = '';

    MY_THINGS.forEach(function (item) {
        var tile = document.createElement('div');
        tile.className = 'tile';
        tile.style.setProperty('--tile-colour', '#333');
        tile.textContent = item.name;
        tile.onclick = function () {
            window.open(item.url, '_blank');
        };
        grid.appendChild(tile);
    });
}

// --- SIDEBAR LOGIC ---

document.querySelectorAll('.sidebar a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
});

var sidebar = document.getElementById('sidebar');
var toggleBtn = document.getElementById('sidebar-toggle');

if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
        sidebar.classList.toggle('open');
    });
}

document.addEventListener('click', function (e) {
    if (sidebar && toggleBtn && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});

// --- WINDOWS 8 COLOURS HELPER ---

function getRandomWin8Color() {
    var colors = ['#2d89ef', '#603cba', '#1e7145', '#b91d47', '#e3a21a', '#00a300'];
    return colors[Math.floor(Math.random() * colors.length)];
}
