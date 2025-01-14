// Initialize canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Define the Tile class
var Tile = function(x, y, face) {
    this.x = x;
    this.y = y;
    this.size = 100;  // Adjust tile size for better fit
    this.face = face;
    this.isFaceUp = false;
    this.isMatch = false;
};

Tile.prototype.draw = function() {
    ctx.fillStyle = 'yellow';
    ctx.fillRect(this.x, this.y, this.size, this.size);
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.size, this.size);
    if (this.isFaceUp) {
        ctx.drawImage(this.face, this.x, this.y, this.size, this.size);
    }
};

Tile.prototype.isUnderMouse = function(x, y) {
    return x >= this.x && x <= this.x + this.size &&
           y >= this.y && y <= this.y + this.size;
};

// Global config
var NUM_COLS = 4;  // Adjust number of columns for better fit
var NUM_ROWS = 4;  // Adjust number of rows for better fit

// Declare an array of all possible faces
var faces = [];
for (let i = 0; i < 10; i++) {
    let img = new Image();
    img.src = `https://www.khanacademy.org/computer-programming/space/${i}`;
    faces.push(img);
}

// Make an array which has 2 of each, then randomize it
var possibleFaces = faces.slice(0);
var selected = [];
for (var i = 0; i < (NUM_COLS * NUM_ROWS) / 2; i++) {
    var randomInd = Math.floor(Math.random() * possibleFaces.length);
    var face = possibleFaces[randomInd];
    selected.push(face);
    selected.push(face);
    possibleFaces.splice(randomInd, 1);
}

// Now shuffle the elements of that array
var shuffleArray = function(array) {
    var counter = array.length;
    while (counter > 0) {
        var ind = Math.floor(Math.random() * counter);
        counter--;
        var temp = array[counter];
        array[counter] = array[ind];
        array[ind] = temp;
    }
};
shuffleArray(selected);

// Create the tiles
var tiles = [];
for (var i = 0; i < NUM_COLS; i++) {
    for (var j = 0; j < NUM_ROWS; j++) {
        var tileX = i * 150 + 20;  // Adjust spacing for better fit
        var tileY = j * 150 + 20;  // Adjust spacing for better fit
        var tileFace = selected.pop();
        tiles.push(new Tile(tileX, tileY, tileFace));
    }
}

var numTries = 0;
var numMatches = 0;
var flippedTiles = [];
var delayStartFC = null;

// Player-specific variables
var currentPlayer = 1;
var playerScores = [0, 0];

canvas.addEventListener('click', function(event) {
    var rect = canvas.getBoundingClientRect();
    var mouseX = event.clientX - rect.left;
    var mouseY = event.clientY - rect.top;
    for (var i = 0; i < tiles.length; i++) {
        var tile = tiles[i];
        if (tile.isUnderMouse(mouseX, mouseY)) {
            if (flippedTiles.length < 2 && !tile.isFaceUp) {
                tile.isFaceUp = true;
                flippedTiles.push(tile);
                if (flippedTiles.length === 2) {
                    numTries++;
                    if (flippedTiles[0].face.src === flippedTiles[1].face.src) {
                        flippedTiles[0].isMatch = true;
                        flippedTiles[1].isMatch = true;
                        flippedTiles.length = 0;
                        playerScores[currentPlayer - 1]++;
                        numMatches++;
                    } else {
                        currentPlayer = currentPlayer === 1 ? 2 : 1;
                    }
                    delayStartFC = performance.now();
                }
            }
        }
    }
});

function draw() {
    ctx.fillStyle = 'rgb(255, 64, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (delayStartFC && (performance.now() - delayStartFC) > 1000) {
        for (var i = 0; i < tiles.length; i++) {
            var tile = tiles[i];
            if (!tile.isMatch) {
                tile.isFaceUp = false;
            }
        }
        flippedTiles = [];
        delayStartFC = null;
    }

    for (var i = 0; i < tiles.length; i++) {
        tiles[i].draw();
    }

    // Display player scores
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText("Player 1: " + playerScores[0], 20, 20);
    ctx.fillText("Player 2: " + playerScores[1], 320, 20);

    if (numMatches === tiles.length / 2) {
        ctx.font = '30px Arial';
        ctx.fillText("Game Won!", 20, canvas.height - 80);
        var winner = playerScores[0] > playerScores[1] ? "Player 1" : "Player 2";
        if (playerScores[0] === playerScores[1]) {
            winner = "It's a tie!";
        }
        ctx.fillText(winner + " wins with " + numTries + " tries!", 20, canvas.height - 40);
    }

    requestAnimationFrame(draw);
}

draw();
