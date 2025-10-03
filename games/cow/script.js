/* IF YOU ARE LOOKING HERE. YOU ARE CHEATING! 

Copyright Stenoip Company 2025
*/

var canvas=document.getElementById('c'), ctx=canvas.getContext('2d');

function resize(){
  // Set canvas dimensions to the current viewport size
  canvas.width=window.innerWidth;
  canvas.height=window.innerHeight;
  }
window.addEventListener('resize',resize); resize();

// --- IMAGE LOADING: ALL ASSETS ---
var images={
    run:[],
    error:new Image(),
    hay:new Image(),
    chicken:new Image(),
    sun:new Image(),
    moon:new Image(),
    restartIcon: new Image()
};

for(var i=1;i<=5;i++){
  var img=new Image();
  img.src='cow'+i+'.png';
  images.run.push(img);
}
images.error.src='cow_error.png';
images.hay.src='hay.png';
images.chicken.src='chicken.png';
images.sun.src='sun.png';
images.moon.src='moon.png';
images.restartIcon.src='ringzauber_browser_b_n_pixel.png';

var last=performance.now(), playing=true, score=0, coins=0;
var highscore = localStorage.getItem('cowrunner_highscore') ?
                parseInt(localStorage.getItem('cowrunner_highscore')) :
                0;

var cow={lane:0,x:0,y:0,vy:0,onGround:true,frame:0,z:0};

var cam={z:0,y:1.2,fov:2.0};

var obstacles=[], groundLines=[], doughnuts=[], clouds=[];

var lanes=[-1,0,1], laneX=180;

// --- AUDIO & VIBRATION SETUP ---
var TILT_BASELINE = 0.3;
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = AudioContext ? new AudioContext() : null;
var lastScoreMilestone = 0;

function playBeep(freq, duration, vol) {
    if (!audioCtx) return;
    var oscillator = audioCtx.createOscillator();
    var gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

function playSuccessTune() {
    if (!audioCtx) return;
    var freqs = [523.25, 659.25, 783.99];
    var duration = 0.15;
    var vol = 0.5;
    freqs.forEach(function(freq, index) {
        var time = audioCtx.currentTime + index * duration;
        var oscillator = audioCtx.createOscillator();
        var gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(freq, time);
        gainNode.gain.setValueAtTime(vol, time);
        oscillator.start(time);
        oscillator.stop(time + duration * 0.9);
    });
}

function vibrateHit() {
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
    }
}
// --- END AUDIO & VIBRATION SETUP ---

// --- GAME LOGIC FUNCTIONS ---
var DAY_NIGHT_CYCLE_SCORE = 700;

function isNightTime(currentScore) {
    return Math.floor(currentScore / DAY_NIGHT_CYCLE_SCORE) % 2 === 1;
}

function spawnObs(){
  var lane=lanes[Math.floor(Math.random()*lanes.length)];
  var isNight = isNightTime(score);
  var isChicken = isNight && Math.random() < 0.25;
  
  if (isChicken) {
    obstacles.push({
        type: 'chicken',
        lane: lane,
        x: lane * laneX,
        y: 1.0,
        z: cam.z + 40,
        w: 60,
        h: 60,
        half: false
    });
  } else {
    obstacles.push({
        type: 'hay',
        lane: lane,
        x: lane * laneX,
        y: 0,
        z: cam.z + 40,
        w: 120,
        h: 120,
        half: false
    });
  }
}
function spawnGround(){
  groundLines.push({z:cam.z+5});
}

function spawnCoin(){
  var lane=lanes[Math.floor(Math.random()*lanes.length)];
  doughnuts.push({lane,x:lane*laneX,y:0.5,z:cam.z+35,r:40});
}
function reset(){
  playing=true; score=0; coins=0; cam.z=0; obstacles=[]; groundLines=[]; doughnuts=[]; clouds=[];
  cow={lane:0,x:0,y:0,vy:0,onGround:true,frame:0,z:cam.z+5};
  lastScoreMilestone = 0;
}
function project(x,y,z){
  var dz=z-cam.z; if(dz<=0.1) return null;
  var s=cam.fov/dz;
  return {x:canvas.width/2+x*s,y:canvas.height*TILT_BASELINE-(y-0.5)*s*320,s};
}

function drawGround(){
  var night = isNightTime(score);
  var skyColor = night ? '#112244' : '#87CEEB';
  var groundColor = night ? '#154320' : '#228B22';

  // sky
  ctx.fillStyle=skyColor; ctx.fillRect(0,0,canvas.width,canvas.height*TILT_BASELINE);
  // Sun/Moon
  var cycleProgress = (score % DAY_NIGHT_CYCLE_SCORE) / DAY_NIGHT_CYCLE_SCORE;
  var objectAngle = cycleProgress * Math.PI;
  var objectY = Math.sin(objectAngle) * (canvas.height * 0.45) + (canvas.height * 0.05);
  var objectX = canvas.width * 0.9;
  var objectSize = 120;
  
  if (!night && images.sun.complete) {
    ctx.drawImage(images.sun, objectX - objectSize/2, objectY - objectSize/2, objectSize, objectSize);
  } else if (night && images.moon.complete) {
    ctx.drawImage(images.moon, objectX - objectSize/2, objectY - objectSize/2, objectSize * 0.6, objectSize * 0.6);
  }

  // horizon line
  ctx.strokeStyle='#000'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(0,canvas.height*TILT_BASELINE); ctx.lineTo(canvas.width,canvas.height*TILT_BASELINE); ctx.stroke();
  // ground
  ctx.fillStyle=groundColor;
  ctx.fillRect(0,canvas.height*TILT_BASELINE,canvas.width,canvas.height*(1-TILT_BASELINE));
}

function drawGroundLines(){
  var night = isNightTime(score);
  ctx.strokeStyle= night ? '#444' : '#333';
  
  groundLines.forEach(function(gl){
    var p=project(0,0,gl.z); if(!p) return;
    var s=p.s;
    ctx.lineWidth=4*s;
    ctx.beginPath();
    ctx.moveTo(p.x-canvas.width*s*0.5, p.y);
    ctx.lineTo(p.x+canvas.width*s*0.5, p.y);
    ctx.stroke();
  });
}

function drawCow(){
  var p=project(cow.lane*laneX,cow.y,cow.z); if(!p) return;
  var img=playing?images.run[(cow.frame|0)%images.run.length]:images.error;
  var w=140*p.s,h=140*p.s;
  ctx.drawImage(img,p.x-w/2,p.y-h,w,h);
}

function drawObs(){
  obstacles.forEach(function(o){
    var p=project(o.x,o.y,o.z); if(!p) return;
    var w=o.w*p.s,h=o.h*p.s;
    
    var imgToDraw = null;
    if (o.type === 'hay' && images.hay.complete) {
        imgToDraw = images.hay;
    } else if (o.type === 'chicken' && images.chicken.complete) {
        imgToDraw = images.chicken;
    }

    if (imgToDraw) {
        ctx.drawImage(imgToDraw, p.x - w / 2, p.y - h, w, h);
    } else {
        ctx.fillStyle = o.type === 'chicken' ? 'red' : '#8B4513';
        ctx.fillRect(p.x-w/2,p.y-h,w,h);
    }
  });
}

function drawCoins(){
  doughnuts.forEach(function(d){
    var p=project(d.x,d.y,d.z); if(!p) return;
    var r=d.r*p.s;
    ctx.strokeStyle='gold'; ctx.lineWidth=8*p.s;
    ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.stroke();
  });
}

function collide(){
  for(var i = 0; i < obstacles.length; i++){
    var o = obstacles[i];
    var minZ = o.z - 3;
    var maxZ = o.z + 3;
    var isCollisionZ = cow.z > minZ && cow.z < maxZ;
    var isCollisionLane = o.lane === cow.lane;

    if(isCollisionZ && isCollisionLane){
        var isHit = false;
        
        if (o.type === 'hay') {
            if (cow.y < 0.8) isHit = true;
        } else if (o.type === 'chicken') {
            if (cow.y > 0.4 && cow.y < 1.4) isHit = true;
        }

        if (isHit) {
            if(playing) {
                vibrateHit();
                var finalScore = score | 0;
                if (finalScore > highscore) {
                    highscore = finalScore;
                    localStorage.setItem('cowrunner_highscore', highscore);
                }
            }
            playing=false;
            return true;
        }
    }
  }
  return false;
}

function collectCoins(){
  doughnuts=doughnuts.filter(function(d){
    if(Math.abs(d.z-cow.z)<2 && d.lane===cow.lane && Math.abs(cow.y-d.y)<0.6){
      coins++; return false;
    }
    return true;
  });
}

function update(){
  var now=performance.now(), dt=(now-last)/1000; last=now;
  if(!playing) return;

  // --- scoring by time and milestone check ---
  // 1 point per 0.2 seconds = 5.0 points per second
  var POINTS_PER_SECOND = 5.0;
  var scoreChange = dt * POINTS_PER_SECOND;
  var oldScoreInt = score | 0;

  score += scoreChange;
  var newScoreInt = score | 0;

  if (newScoreInt > oldScoreInt) {
    if (Math.floor(newScoreInt / 100) > Math.floor(lastScoreMilestone / 100)) {
        lastScoreMilestone = newScoreInt;
        playSuccessTune();
    }
  }

  // --- speed scaling ---
  var speed = 6;
  if(score >= 100){
    speed = Math.min(8890, 6 + (score-100)*0.05);
  }

  cam.z+=speed*dt; cow.z=cam.z+5;

  if(obstacles.length===0||(obstacles[obstacles.length-1].z-cam.z)<20) spawnObs();
  if(Math.random()<0.02) spawnCoin();
  if(groundLines.length===0||(groundLines[groundLines.length-1].z-cam.z)<4) spawnGround();

  obstacles=obstacles.filter(function(o){ return o.z>cam.z-2; });
  groundLines=groundLines.filter(function(gl){ return gl.z>cam.z-2; });
  doughnuts=doughnuts.filter(function(d){ return d.z>cam.z-2; });

  cow.x+=(cow.lane*laneX-cow.x)*Math.min(1,dt*12);
  if(!cow.onGround){
    cow.vy-=20*dt; cow.y+=cow.vy*dt;
    if(cow.y<=0){ cow.y=0; cow.vy=0; cow.onGround=true; }
  }
  cow.frame+=dt*12;

  collide();
  collectCoins();
}

function render(){
  var dt = (performance.now()-last)/1000;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawGround();
  drawGroundLines();
  drawObs(); drawCoins(); drawCow();
  
  // --- Scoreboard (Pixel Font) ---
  ctx.fillStyle='#fff';
  ctx.font='16px "Courier New", monospace';
  ctx.fillText('Score: '+(score|0),10,22);
  ctx.fillText('Doughnuts: '+coins,10,42);
  ctx.fillText('Hi-Score: '+highscore, 10, 62);
  // --- End Scoreboard ---
  
  if(!playing){
    var gameOverX = canvas.width/2;
    var gameOverY = canvas.height/2;
    
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#fff';
    
    // New High Score Message
    if ((score | 0) > highscore) {
        ctx.textAlign = 'center';
        ctx.font = '24px "Courier New", monospace';
        ctx.fillText('NEW HIGHSCORE!', gameOverX, gameOverY - 100);
    }

    // Game Over Text
    ctx.textAlign = 'center';
    ctx.font='28px "Courier New", monospace';
    ctx.fillText('Game Over', gameOverX, gameOverY - 20);
    
    // Restart Prompt Text
    ctx.font='18px "Courier New", monospace';
    var restartText = 'Press R / Swipe or Click';
    var textWidth = ctx.measureText(restartText).width;
    var textY = gameOverY + 10;
    
    // Small text near top
    ctx.font='10px "Courier New", monospace';
    ctx.fillText('Game for Ringzauber by Stenoip Company, 2025', gameOverX, gameOverY - 90);
    
    // Calculate position for image next to centered text
    ctx.font='18px "Courier New", monospace'; // Reset font for accurate measurement
    var iconSize = 20;
    var combinedWidth = textWidth + iconSize + 5;
    var iconX = gameOverX - combinedWidth/2;
    var iconY = textY - iconSize;
    
    // Draw icon next to text
    if(images.restartIcon.complete) {
        ctx.drawImage(images.restartIcon, iconX, iconY + 2, iconSize, iconSize);
    }
    
    // Draw text
    ctx.fillText(restartText, iconX + iconSize + 5, textY);
    ctx.textAlign = 'left'; // Reset alignment
  }
}
function loop(){ update(); render(); requestAnimationFrame(loop); }
loop();

// --- INPUT HANDLERS ---
function left(){ if(playing&&cow.lane>lanes[0]) cow.lane--; }
function right(){ if(playing&&cow.lane<lanes[lanes.length-1]) cow.lane++; }
function jump(){
    if(playing&&cow.onGround){
        cow.onGround=false;
        cow.vy=10;
        playBeep(880, 0.1, 0.5);
    }
}
function restart(){ reset(); }

// Keyboard event listener
addEventListener('keydown',function(e){
  var k=e.key.toLowerCase();
  if(k==='arrowleft'||k==='a') left();
  else if(k==='arrowright'||k==='d') right();
  else if(k==='arrowup'||k==='w'||k===' ') jump();
  else if(k==='r') restart();
});

// Full canvas click listener for restart screen
canvas.addEventListener('click', function() {
    if (!playing) {
        restart();
    }
});

var touchStart=null;
var SWIPE_THRESHOLD = 30; // Minimum pixel distance for a recognized swipe

canvas.addEventListener('touchstart',function(e){
  if(audioCtx && audioCtx.state === 'suspended'){
    audioCtx.resume();
  }
    // If game is over, any touch acts as a restart
    if (!playing) {
        restart();
        e.preventDefault();
        return;
    }
    
  var t=e.changedTouches[0]; touchStart={x:t.clientX,y:t.clientY};
});

canvas.addEventListener('touchend',function(e){
  if(!touchStart || !playing) return; // Only process swipes when playing
  
  var t=e.changedTouches[0], dx=t.clientX-touchStart.x, dy=t.clientY-touchStart.y;
  touchStart = null; // Clear touch immediately

  // Check for dominant direction (horizontal or vertical)
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal Swipe (Lane Change)
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
        if (dx < 0) left();
        else right();
    }
  } else {
    // Vertical Swipe (Jump)
    if (Math.abs(dy) > SWIPE_THRESHOLD && dy < 0) { // Swipe up
        jump();
    }
  }
  e.preventDefault(); // Consume the touch event after processing
});
