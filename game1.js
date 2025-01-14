var Tile = function(x, y, face) {
    this.x = x;
    this.y = y;
    this.size = 100;  // Adjust tile size for better fit
    this.face = face;
    this.isFaceUp = false;
    this.isMatch = false;
};

Tile.prototype.draw = function() {
    fill(255, 255, 0);
    strokeWeight(2);
    rect(this.x, this.y, this.size, this.size, 10);
    if (this.isFaceUp) {
        image(this.face, this.x, this.y, this.size, this.size);
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
var faces = [
    getImage("space/0"),
    getImage("space/6"),
    getImage("space/1"),
    getImage("space/2"),
    getImage("space/3"),
    getImage("space/4"),
    getImage("space/5"),
    getImage("space/7"),
    getImage("space/8"),
    getImage("space/9")
];

// Make an array which has 2 of each, then randomize it
var possibleFaces = faces.slice(0);
var selected = [];
for (var i = 0; i < (NUM_COLS * NUM_ROWS) / 2; i++) {
    var randomInd = floor(random(possibleFaces.length));
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

background(255, 255, 255);

var numTries = 0;
var numMatches = 0;
var flippedTiles = [];
var delayStartFC = null;

// Player-specific variables
var currentPlayer = 1;
var playerScores = [0, 0];

mouseClicked = function() {
    for (var i = 0; i < tiles.length; i++) {
        var tile = tiles[i];
        if (tile.isUnderMouse(mouseX, mouseY)) {
            if (flippedTiles.length < 2 && !tile.isFaceUp) {
                tile.isFaceUp = true;
                flippedTiles.push(tile);
                if (flippedTiles.length === 2) {
                    numTries++;
                    if (flippedTiles[0].face === flippedTiles[1].face) {
                        flippedTiles[0].isMatch = true;
                        flippedTiles[1].isMatch = true;
                        flippedTiles.length = 0;
                        playerScores[currentPlayer - 1]++;
                        numMatches++;
                    } else {
                        currentPlayer = currentPlayer === 1 ? 2 : 1;
                    }
                    delayStartFC = frameCount;
                }
            }
            loop();
        }
    }
};

draw = function() {
    background(255, 64, 0);
    if (delayStartFC && (frameCount - delayStartFC) > 30) {
        for (var i = 0; i < tiles.length; i++) {
            var tile = tiles[i];
            if (!tile.isMatch) {
                tile.isFaceUp = false;
            }
        }
        flippedTiles = [];
        delayStartFC = null;
        noLoop();
    }

    for (var i = 0; i < tiles.length; i++) {
        tiles[i].draw();
    }

    // Display player scores
    fill(0, 0, 0);
    textSize(20);
    text("Player 1: " + playerScores[0], 20, 20);
    text("Player 2: " + playerScores[1], 320, 20);

    if (numMatches === tiles.length / 2) {
        textSize(30);
        text("Game Won!", 20, 575);
        var winner = playerScores[0] > playerScores[1] ? "Player 1" : "Player 2";
        if (playerScores[0] === playerScores[1]) {
            winner = "It's a tie!";
        }
        text(winner + " wins with " + numTries + " tries!", 20, 605);
    }
};

noLoop();
