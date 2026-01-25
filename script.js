// ===============================
// COPYRIGHT STENOIP COMPANY!
// COPING IS STRICTLY PROHIBETED
// ===============================

var VERCEL_API = "https://stenoip-github-io.vercel.app/api/metadata";
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
        video.muted = true;
        video.style.display = 'block';
        video.play().catch(function() {});
        document.getElementById('skip-btn').style.display = 'block';
    } else {
        showMainContent();
    }
}

function skipVideo() {
    showMainContent();
}

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', function() {
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
        video.muted = true;
        video.addEventListener('ended', showMainContent);
    }

    if (!introToggle || !introToggle.checked) {
        showMainContent();
    } else {
        var launch = document.getElementById('launch-screen');
        if (launch) launch.style.display = 'flex';
        if (video) video.style.display = 'none';
    }

    renderTiles();
    renderMyThings();
});

// --- WINDOWS 8 STYLE TILE SYSTEM ---

function getTiles() {
    try {
        return JSON.parse(localStorage.getItem(TILE_STORAGE_KEY)) || [];
    } catch(e) { return []; }
}

function saveTiles(tiles) {
    localStorage.setItem(TILE_STORAGE_KEY, JSON.stringify(tiles));
}

function renderTiles() {
    var grid = document.getElementById("tile-grid");
    if (!grid) return;

    grid.innerHTML = '';
    var tiles = getTiles();

    tiles.forEach(function(tile, index) {
        var tileEl = document.createElement('div');
        tileEl.className = 'tile';
        // Apply dynamic color from API
        tileEl.style.backgroundColor = tile.color || '#2d89ef'; 
        tileEl.onclick = function() { window.open(tile.url, '_blank'); };

        tileEl.innerHTML = 
            (tile.favicon ? '<img src="' + tile.favicon + '" style="width:32px; height:32px; margin-bottom:10px;">' : '') +
            '<div class="tile-title">' + escapeHtml(tile.name) + '</div>' +
            '<div class="tile-remove" title="Remove">✕</div>';

        tileEl.querySelector('.tile-remove').onclick = function(e) {
            e.stopPropagation();
            removeTile(index);
        };

        grid.appendChild(tileEl);
    });

    var addTileEl = document.createElement('div');
    addTileEl.className = 'tile add-tile';
    addTileEl.innerHTML = '+';
    addTileEl.onclick = function() { showAddTileForm(addTileEl); };
    grid.appendChild(addTileEl);
}

function showAddTileForm(tileEl) {
    tileEl.onclick = null;
    tileEl.innerHTML = 
        '<form onsubmit="submitNewTile(event)" style="display:flex; flex-direction:column; gap:5px; padding:10px;">' +
            '<input type="text" id="new-tile-name" placeholder="Site name" required style="color:black">' +
            '<input type="text" id="new-tile-url" placeholder="example.com" required style="color:black">' +
            '<button type="submit" style="cursor:pointer">Add</button>' +
        '</form>';
}

async function submitNewTile(event) {
    event.preventDefault();
    var name = document.getElementById('new-tile-name').value.trim();
    var url = document.getElementById('new-tile-url').value.trim();

    if (!name || !url) return;
    if (!url.startsWith('http')) url = 'https://' + url;

    try {
        // Fetch metadata from Vercel
        var response = await fetch(VERCEL_API + "?url=" + encodeURIComponent(url));
        var meta = await response.json();
        
        var tiles = getTiles();
        tiles.push({ 
            name: name, 
            url: url, 
            favicon: meta.favicon, 
            color: meta.color 
        });
        saveTiles(tiles);
        renderTiles();
    } catch (e) {
        console.error("Backend error:", e);
        // Fallback if API fails
        var tilesFallback = getTiles();
        tilesFallback.push({ name: name, url: url, color: '#2d89ef' });
        saveTiles(tilesFallback);
        renderTiles();
    }
}

function removeTile(index) {
    var tiles = getTiles();
    tiles.splice(index, 1);
    saveTiles(tiles);
    renderTiles();
}

// --- UTILS & SEARCH ---

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function filterTiles(query) {
    var tiles = document.querySelectorAll('.tile:not(.add-tile)');
    var lower = query.toLowerCase();
    tiles.forEach(function(tile) {
        var title = tile.querySelector('.tile-title')?.textContent.toLowerCase() || '';
        tile.style.display = title.includes(lower) ? '' : 'none';
    });
}

function handleWebSearch(event) {
    if (event.key === 'Enter') {
        var query = event.target.value.trim();
        if (!query) return;
        var url = "https://stenoip.github.io/oodles/search?q=" + encodeURIComponent(query);
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
    MY_THINGS.forEach(function(item) {
        var tile = document.createElement('div');
        tile.className = 'tile';
        tile.style.backgroundColor = '#333';
        tile.textContent = item.name;
        tile.onclick = function() { window.open(item.url, '_blank'); };
        grid.appendChild(tile);
    });
}

// --- SIDEBAR LOGIC ---

document.querySelectorAll('.sidebar a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        var target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
});

var sidebar = document.getElementById('sidebar');
var toggleBtn = document.getElementById('sidebar-toggle');

if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
        sidebar.classList.toggle('open');
    });
}

document.addEventListener('click', function(e) {
    if (sidebar && toggleBtn && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});
