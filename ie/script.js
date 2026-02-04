// ===============================
// COPYRIGHT STENOIP COMPANY!
// COPING IS STRICTLY PROHIBETED
// ===============================

var VERCEL_API = "https://stenoip-github-io.vercel.app/api/metadata";
var TILE_STORAGE_KEY = 'stenokonnect_tiles';

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', function() {
    var mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.display = 'block';
    }
    document.body.style.overflowY = 'auto';

    migrateOldTiles();
    renderTiles();
    refreshTileColors();
    renderMyThings();
});

// --- LOCAL STORAGE UTILITIES ---

function getTiles() {
    try {
        var data = localStorage.getItem(TILE_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch(e) { return []; }
}

function saveTiles(tiles) {
    localStorage.setItem(TILE_STORAGE_KEY, JSON.stringify(tiles));
}

// --- MIGRATION ---

function migrateOldTiles() {
    var tiles = getTiles();
    var updated = false;
    for (var i = 0; i < tiles.length; i++) {
        if (!tiles[i].color) {
            tiles[i].color = getRandomWin8Color();
            updated = true;
        }
    }
    if (updated) saveTiles(tiles);
}

// --- WINDOWS 8 STYLE TILE SYSTEM ---

function renderTiles() {
    var grid = document.getElementById("tile-grid");
    if (!grid) return;

    grid.innerHTML = '';
    var tiles = getTiles();

    for (var i = 0; i < tiles.length; i++) {
        (function(tile, index) {
            var tileEl = document.createElement('div');
            tileEl.className = 'tile';
            tileEl.style.backgroundColor = tile.color || '#2d89ef';
            tileEl.onclick = function() { window.open(tile.url, '_blank'); };

            var imgHtml = tile.favicon ? '<img src="' + tile.favicon + '" style="width:32px; height:32px; margin-bottom:10px;">' : '';
            
            tileEl.innerHTML = 
                imgHtml +
                '<div class="tile-title">' + escapeHtml(tile.name) + '</div>' +
                '<div class="tile-remove" title="Remove">✕</div>';

            var removeBtn = tileEl.getElementsByClassName('tile-remove')[0];
            removeBtn.onclick = function(e) {
                if (!e) var e = window.event;
                e.cancelBubble = true;
                if (e.stopPropagation) e.stopPropagation();
                removeTile(index);
            };

            grid.appendChild(tileEl);
        })(tiles[i], i);
    }

    var addTileEl = document.createElement('div');
    addTileEl.className = 'tile add-tile';
    addTileEl.innerHTML = '+';
    addTileEl.onclick = function() { showAddTileForm(addTileEl); };
    grid.appendChild(addTileEl);
}

function showAddTileForm(tileEl) {
    tileEl.onclick = null;
    tileEl.innerHTML = 
        '<form id="new-tile-form" style="display:flex; flex-direction:column; padding:10px;">' +
            '<input type="text" id="new-tile-name" placeholder="Site name" required style="color:black; margin-bottom:5px;">' +
            '<input type="text" id="new-tile-url" placeholder="example.com" required style="color:black; margin-bottom:5px;">' +
            '<button type="submit" style="cursor:pointer">Add</button>' +
        '</form>';

    var form = document.getElementById('new-tile-form');
    form.onsubmit = function(event) {
        submitNewTile(event);
        return false;
    };
}

/**
  UPDATED: Optimistic Tile Submission
  Saves the tile immediately so it works even if the API fails.
 */
function submitNewTile(event) {
    if (event.preventDefault) event.preventDefault();
    
    var name = document.getElementById('new-tile-name').value;
    var url = document.getElementById('new-tile-url').value;

    if (!name || !url) return;
    if (url.indexOf('http') !== 0) url = 'https://' + url;

    // 1. Create the tile object immediately
    var tiles = getTiles();
    var newTile = { 
        name: name, 
        url: url, 
        favicon: '', 
        color: getRandomWin8Color() 
    };

    // 2. Save and Re-render right away
    tiles.push(newTile);
    saveTiles(tiles);
    renderTiles();

    // 3. Background fetch for extra metadata (Favicon/Theme Color)
    if (typeof fetch !== 'undefined') {
        fetch(VERCEL_API + "?url=" + encodeURIComponent(url))
            .then(function(response) { return response.json(); })
            .then(function(meta) {
                // Update the tile in storage with the new metadata
                var currentTiles = getTiles();
                for (var i = 0; i < currentTiles.length; i++) {
                    if (currentTiles[i].url === url && currentTiles[i].name === name) {
                        currentTiles[i].favicon = meta.favicon || currentTiles[i].favicon;
                        currentTiles[i].color = meta.color || currentTiles[i].color;
                        break;
                    }
                }
                saveTiles(currentTiles);
                renderTiles();
            })
            .catch(function(e) {
                console.log("Metadata service unavailable, tile kept with defaults.");
            });
    }
}

function removeTile(index) {
    var tiles = getTiles();
    tiles.splice(index, 1);
    saveTiles(tiles);
    renderTiles();
}

// --- REFRESH TILE COLOURS ---

function refreshTileColors() {
    var tiles = getTiles();
    if (typeof fetch === 'undefined') return;

    var fetchPromises = [];
    for (var i = 0; i < tiles.length; i++) {
        var tile = tiles[i];
        if (!tile.color || tile.color === '#2d89ef') {
            (function(t) {
                var p = fetch(VERCEL_API + "?url=" + encodeURIComponent(t.url))
                    .then(function(res) { return res.json(); })
                    .then(function(meta) { t.color = meta.color || getRandomWin8Color(); })
                    .catch(function() { t.color = getRandomWin8Color(); });
                fetchPromises.push(p);
            })(tile);
        }
    }

    if (fetchPromises.length > 0 && typeof Promise !== 'undefined') {
        Promise.all(fetchPromises).then(function() {
            saveTiles(tiles);
            renderTiles();
        });
    }
}

// --- UTILS & SEARCH ---

function escapeHtml(text) {
    var div = document.createElement('div');
    div.innerText = text; 
    return div.innerHTML;
}

function filterTiles(query) {
    var tiles = document.getElementsByClassName('tile');
    var lower = query.toLowerCase();
    for (var i = 0; i < tiles.length; i++) {
        if (tiles[i].className.indexOf('add-tile') !== -1) continue;
        var titleContainer = tiles[i].getElementsByClassName('tile-title')[0];
        var title = titleContainer ? titleContainer.innerText.toLowerCase() : '';
        tiles[i].style.display = title.indexOf(lower) !== -1 ? '' : 'none';
    }
}

function handleWebSearch(event) {
    var key = event.which || event.keyCode;
    if (key === 13) {
        var query = event.target.value;
        if (!query) return;
        var url = "https://stenoip.github.io/oodles/ie11/search?q=" + encodeURIComponent(query);
        window.open(url, '_blank');
        event.target.value = '';
    }
}

// --- FIXED MY THINGS ---

var MY_THINGS = [
    { name: 'Comics', url: '/comic.html' },
    { name: 'Learn Centre', url: 'https://stenoip.github.io/ie/learn-centre' },
    { name: 'Television Guide', url: 'television_guide.html' }
];

function renderMyThings() {
    var grid = document.getElementById('my-things-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (var i = 0; i < MY_THINGS.length; i++) {
        (function(item) {
            var tile = document.createElement('div');
            tile.className = 'tile';
            tileElStyle(tile);
            tile.innerText = item.name;
            tile.onclick = function() { window.open(item.url, '_blank'); };
            grid.appendChild(tile);
        })(MY_THINGS[i]);
    }
}

function tileElStyle(el) {
    el.style.backgroundColor = '#333';
    el.style.height = '120px';
    el.style.display = 'inline-block';
    el.style.margin = '5px';
    el.style.width = '140px';
}

// --- SIDEBAR LOGIC ---

var sidebar = document.getElementById('sidebar');
var toggleBtn = document.getElementById('sidebar-toggle');

if (toggleBtn) {
    toggleBtn.onclick = function() {
        if (sidebar.className.indexOf('open') !== -1) {
            sidebar.className = 'sidebar';
        } else {
            sidebar.className = 'sidebar open';
        }
    };
}

// --- WINDOWS 8 COLOURS HELPER ---

function getRandomWin8Color() {
    var colors = ["#2d89ef", "#603cba", "#1e7145", "#b91d47", "#e3a21a", "#00a300"];
    return colors[Math.floor(Math.random() * colors.length)];
}
