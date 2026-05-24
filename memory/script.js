var cards = document.getElementsByClassName("memory-card");

var hasFlippedCard = false;
var lockBoard = false;
var firstCard = null;
var secondCard = null;

// Create audio elements
var soundGood = new Audio("good.mp3");
var soundError = new Audio("error.mp3");
var soundWin = new Audio("win.mp3");

// Track matched pairs to determine a win
var matchedPairs = 0;
var totalPairs = cards.length / 2;

// Flip card
function flipCard() {
  if (lockBoard) return;
  if (this === firstCard) return;

  this.classList.add("flip");

  if (!hasFlippedCard) {
    hasFlippedCard = true;
    firstCard = this;
    return;
  }

  secondCard = this;

  checkForMatch();
}

// Check match
function checkForMatch() {
  var firstImage =
    firstCard.getElementsByClassName("front-face")[0].src;

  var secondImage =
    secondCard.getElementsByClassName("front-face")[0].src;

  if (firstImage === secondImage) {
    disableCards();
  } else {
    unflipCards();
  }
}

// Disable matched cards
function disableCards() {
  firstCard.removeEventListener("click", flipCard);
  secondCard.removeEventListener("click", flipCard);

  // Play match sound
  soundGood.currentTime = 0;
  soundGood.play();

  // Increment match counter and check for victory
  matchedPairs++;
  if (matchedPairs === totalPairs) {
    setTimeout(celebrateWin, 500);
  }

  resetBoard();
}

// Unflip cards
function unflipCards() {
  lockBoard = true;

  // Play mistake sound
  soundError.currentTime = 0;
  soundError.play();

  setTimeout(function () {
    firstCard.classList.remove("flip");
    secondCard.classList.remove("flip");

    resetBoard();
  }, 1000);
}

// Reset variables
function resetBoard() {
  hasFlippedCard = false;
  lockBoard = false;
  firstCard = null;
  secondCard = null;
}

// Shuffle cards
function shuffleCards() {
  for (var i = 0; i < cards.length; i++) {
    var randomPos = Math.floor(Math.random() * cards.length);
    cards[i].style.order = randomPos;
  }
}

// Trigger win state
function celebrateWin() {
  soundWin.currentTime = 0;
  soundWin.play();
  
  // 1. Change the browser tab title
  document.getElementById("game-title").innerHTML = "You Win!";
  
  // 2. Add the party class to the body tag to start the color changes
  document.body.classList.add("party-mode");

  // 3. Listen for the audio to finish, then turn off party mode
  soundWin.addEventListener("ended", function() {
    document.body.classList.remove("party-mode");
  });
}
// Start game
shuffleCards();

// Add listeners
for (var i = 0; i < cards.length; i++) {
  cards[i].addEventListener("click", flipCard);
}