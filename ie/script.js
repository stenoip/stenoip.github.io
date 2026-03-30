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
        video.muted = false;
        video.style.display = 'block';
        // IE Fix: Removed the .catch() arrow function to prevent syntax errors
        video.play(); 
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
    refreshTileColors();
    renderMyThings();
});

// --- LOCAL STORAGE UTILITIES ---

function getTiles() {
    try {
        return JSON.parse(localStorage.getItem(TILE_STORAGE_KEY)) || [];
    } catch(e) { return []; }
}

function saveTiles(tiles) {
    localStorage.setItem(TILE_STORAGE_KEY, JSON.stringify(tiles));
}

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

// WINDOWS 8 STYLE TILE SYSTEM 

function renderTiles() {
    var grid = document.getElementById("tile-grid");
    if (!grid) return;

    grid.innerHTML = '';
    var tiles = getTiles();

    // Standard for loop for IE stability
    for (var i = 0; i < tiles.length; i++) {
        (function(index) {
            var tile = tiles[index];
            var tileEl = document.createElement('div');
            tileEl.className = 'tile';
            tileEl.style.backgroundColor = tile.color || '#2d89ef';
            tileEl.onclick = function() { window.open(tile.url, '_blank'); };

            tileEl.innerHTML = 
                (tile.favicon ? '<img src="' + tile.favicon + '" style="width:32px; height:32px; margin-bottom:10px;">' : '') +
                '<div class="tile-title">' + escapeHtml(tile.name) + '</div>' +
                '<div class="tile-remove" title="Remove">✕</div>';

            tileEl.querySelector('.tile-remove').onclick = function(e) {
                if (e.stopPropagation) e.stopPropagation(); else e.cancelBubble = true;
                removeTile(index);
            };

            grid.appendChild(tileEl);
        })(i);
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
        '<form onsubmit="submitNewTile(event)" style="display:flex; flex-direction:column; padding:10px;">' +
            '<input type="text" id="new-tile-name" placeholder="Site name" required style="color:black; margin-bottom:5px;">' +
            '<input type="text" id="new-tile-url" placeholder="example.com" required style="color:black; margin-bottom:5px;">' +
            '<button type="submit" style="cursor:pointer">Add</button>' +
        '</form>';
}

//Replaced async/await with standard Promises (.then)
function submitNewTile(event) {
    if (event.preventDefault) event.preventDefault(); else event.returnValue = false;
    
    var name = document.getElementById('new-tile-name').value.trim();
    var url = document.getElementById('new-tile-url').value.trim();

    if (!name || !url) return;
    if (url.indexOf('http') !== 0) url = 'https://' + url;

    fetch(VERCEL_API + "?url=" + encodeURIComponent(url))
        .then(function(response) { return response.json(); })
        .then(function(meta) {
            var tiles = getTiles();
            tiles.push({ 
                name: name, 
                url: url, 
                favicon: meta.favicon, 
                color: meta.color || getRandomWin8Color()
            });
            saveTiles(tiles);
            renderTiles();
        })
        .catch(function(e) {
            var tilesFallback = getTiles();
            tilesFallback.push({ name: name, url: url, color: getRandomWin8Color() });
            saveTiles(tilesFallback);
            renderTiles();
        });
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
    var fetchPromises = [];

    for (var i = 0; i < tiles.length; i++) {
        (function(tile) {
            if (!tile.color || tile.color === '#2d89ef') {
                if (tile.url) {
                    fetchPromises.push(
                        fetch(VERCEL_API + "?url=" + encodeURIComponent(tile.url))
                            .then(function(response) { return response.json(); })
                            .then(function(meta) {
                                tile.color = meta.color || getRandomWin8Color();
                            })
                            .catch(function() {
                                tile.color = getRandomWin8Color();
                            })
                    );
                }
            }
        })(tiles[i]);
    }

    if (fetchPromises.length > 0) {
        Promise.all(fetchPromises).then(function() {
            saveTiles(tiles);
            renderTiles();
        });
    }
}

// --- UTILS & SEARCH ---

function escapeHtml(text) {
    var div = document.createElement('div');
    div.innerText = text; // innerText is safer in IE for simple escaping
    return div.innerHTML;
}

function filterTiles(query) {
    var tiles = document.querySelectorAll('.tile:not(.add-tile)');
    var lower = query.toLowerCase();
    // IE Fix: Convert NodeList to Array so forEach works
    Array.prototype.slice.call(tiles).forEach(function(tile) {
        var titleEl = tile.querySelector('.tile-title');
        var title = titleEl ? titleEl.innerText.toLowerCase() : '';
        tile.style.display = title.indexOf(lower) !== -1 ? '' : 'none';
    });
}

function handleWebSearch(event) {
    var key = event.which || event.keyCode;
    if (key === 13) {
        var query = event.target.value.trim();
        if (!query) return;
        var url = "https://stenoip.github.io/oodles/search?q=" + encodeURIComponent(query);
        window.open(url, '_blank');
        event.target.value = '';
    }
}

//  FIXED MY THINGS 

var MY_THINGS = [
    { name: 'StenoKonnect Home', url: 'index.html' },
    { name: 'Learn Centre', url: 'https://stenoip.github.io/learn-centre' },
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
            tile.style.backgroundColor = '#333';
            tile.innerText = item.name;
            tile.onclick = function() { window.open(item.url, '_blank'); };
            grid.appendChild(tile);
        })(MY_THINGS[i]);
    }
}

// --- SIDEBAR LOGIC ---

var anchors = document.querySelectorAll('.sidebar a[href^="#"]');
Array.prototype.slice.call(anchors).forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
        if (e.preventDefault) e.preventDefault();
        var targetId = this.getAttribute('href');
        var target = document.querySelector(targetId);
        if (target) {
            // IE Fix: smooth scroll isn't supported natively, this falls back to instant scroll
            target.scrollIntoView(); 
        }
    });
});

var sidebar = document.getElementById('sidebar');
var toggleBtn = document.getElementById('sidebar-toggle');

if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
        if (sidebar.className.indexOf('open') !== -1) {
            sidebar.className = sidebar.className.replace(' open', '');
        } else {
            sidebar.className += ' open';
        }
    });
}

document.addEventListener('click', function(e) {
    if (sidebar && toggleBtn && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
        sidebar.className = sidebar.className.replace(' open', '');
    }
});

function getRandomWin8Color() {
    var colors = ["#2d89ef", "#603cba", "#1e7145", "#b91d47", "#e3a21a", "#00a300"];
    return colors[Math.floor(Math.random() * colors.length)];
}
