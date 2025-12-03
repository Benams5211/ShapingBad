/////////////////////////////////////////////////////
//General project vars
/////////////////////////////////////////////////////
//sprint 9

let gameOver = false;
let round = 1;
const StartTime = 60;       // length of a round in seconds (set what you want)
let Timer = StartTime;      // countdown mirror
let startMillis = 0;        // when the round started
let TimeOver = false;       // flag used in drawGame
let times = StartTime;      // display value

let sfxCorrect = null;      // sound effect for correct shape click
let sfxIncorrect = null;    // sound effect for incorrect shape click
let sfxMenu = null;         // sound effect for menu selections
let bgmHard = null;         // bgm

let stars = [];             // shapes of +1 round indicator
let circleBursts = [];      // shapes of -1 round indicator
let bossKills = [];         // for boss kill indicator
let bonusStars = [];         // for bonus shape indicator

let difficulty = "medium";  // default difficulty
const MENU_SHAPE_CAP=80; 

let startBtnImg1, startBtnImg2;
const startButtonScale = 1.8;
let pauseButton, backToMenuButton;
let optionsBtnImg1, optionsBtnImg2;
let builderButton0, builderButton1;
let statsButton0, statsButton1;
const optionsButtonScale = 5.5;

//colorblind buttons
let defaultColorBtn, protanopiaBtn, deuteranopiaBtn, tritanopiaBtn;

// stuff for paused
let pauseStartMillis = 0;
let totalPausedTime = 0;

//checkbox business
let flashlightFreeze = true;
let flashlightEnabled = true;
let slowMoEnabled = false;
let checkboxLight;
let checkboxSlow;
// three lamps overlay option (created in modes screen)
let checkboxLamps;
let threeLampsEnabled = false;
// lightning options
let checkboxLightning;
let lightningEnabled = false;
//relax
let relaxMode = false;
let checkboxRelax;

//combo counter
let combo = 0;

//for slow motion (obviously)
let slowMo = false;


let Stats;
let gameOverTriggered = false;
let shownGameOverScreen = false;
//Builder
let consoleInput;
let consoleMessages = [];
let fileInput;
//Boss Stats
let bossImages = {}
let delozierMode = false;

//////////////////////////////////////////////////
//Classes and stuff for menu
//////////////////////////////////////////////////

// tracks which part of the program we are in, right now its just  "menu", "game", or "modes", "stats", "builder"
let gameState = "menu"; 
// the two button definitions, x, y, width, height, and label
let startButton, modesButton, againButton, builderButton, statsButton, backButton;

// image variables
let menuBgImg;   // optional menu background
let logoImg;     // optional title/logo image
let buttonImg;   // optional button image
let pixelFont;

let localstorageRoundManager; // This manages round objects in localstorage
let finalRoundPopup;  // The pop-up window that shows the round details.

let finalRoundPopupShown = false; // Flag that maintain the round pop-up window visibility status.

let topRoundsBeforeUpdate = []; // Keep the records without the latest one to compare againt those records.

/////////////////////////////////////////////////////
//localstorage keys
/////////////////////////////////////////////////////
const localstorageRoundObjectsKey = "roundObjects"
const localstorageDateKey = "date"
const localstorageIDKey = "id";
const localstorageValueKey = "value";

const logoImagePath = "assets/images/gameLogo.png"

function preload() {
  // optionally load images here
  // menuBgImg = loadImage("menuBackground.png");
  logoImg = loadImage(logoImagePath);
  startBtnImg1 = loadImage("assets/images/startButton1.png");
  startBtnImg2 = loadImage("assets/images/startButton2.png");
  optionsBtnImg1 = loadImage("assets/images/optionsButton1.png");
  optionsBtnImg2 = loadImage("assets/images/optionsButton2.png");
  pauseButton0 = loadImage("assets/images/pauseButton0.png");
  pauseButton1 = loadImage("assets/images/pauseButton1.png");
  resumeButton0 = loadImage("assets/images/resumeButton0.png");
  resumeButton1 = loadImage("assets/images/resumeButton1.png");
  menuButton0 = loadImage("assets/images/menuButton0.png");
  menuButton1 = loadImage("assets/images/menuButton1.png");
  easyButton0 = loadImage("assets/images/easyButton0.png");
  easyButton1 = loadImage("assets/images/easyButton1.png");
  mediumButton0 = loadImage("assets/images/mediumButton0.png");
  mediumButton1 = loadImage("assets/images/mediumButton1.png");
  hardButton0 = loadImage("assets/images/hardButton0.png");
  hardButton1 = loadImage("assets/images/hardButton1.png");
  builderButton0 = loadImage("assets/images/builderButton0.png");
  builderButton1 = loadImage("assets/images/builderButton1.png");
  statsButton0 = loadImage("assets/images/statsButton0.png");
  statsButton1 = loadImage("assets/images/statsButton1.png");

  bossImages = {
          golagon: loadImage("assets/images/golagon.png"),
          tsunoctagon: loadImage("assets/images/tsunoctagon.png"),
          abyssagon: loadImage("assets/images/abyssagon.png"),
          flaregon: loadImage("assets/images/flaregon.png"),
          heartagon: loadImage("assets/images/heartagon.png"),
          nullshape: loadImage("assets/images/nullshape.png"),
          rotangle: loadImage("assets/images/rotangle.png"),
          delozier: loadImage("assets/images/delozier.png"),
          perfect: loadImage("assets/images/perfect.png"),
      };

  // Load font
  pixelFont = loadFont("assets/fonts/pixelFont.ttf");

   // 
  // Preload the Audio Manager:
  // 
  if (window.AudioManager && typeof AudioManager.preload === 'function') {
    // List of Audio Files to be proloaded by the Audio Manager:
    AudioManager.preload([
      { name: 'sfxCorrect', path: 'assets/audio/correct.mp3' },
      { name: 'sfxIncorrect', path: 'assets/audio/incorrect.mp3' },
      { name: 'sfxMenu', path: 'assets/audio/menuSelect.mp3' },
      { name: 'bossHit', path: 'assets/audio/bossHit.mp3' },
      { name: 'bossKill', path: 'assets/audio/bossKill.mp3' },
      { name: 'bgmHard', path: 'assets/audio/gameBGM.mp3' },
      { name: 'bgmBoss', path: 'assets/audio/bgmBoss.mp3' },
      { name: 'mainMenu', path: 'assets/audio/mainMenu.mp3' },
      { name: 'rain_looping', path: 'assets/audio/rain_looping.mp3' },
      { name: 'thunder1', path: 'assets/audio/thunder-1.mp3' },
      { name: 'thunder2', path: 'assets/audio/thunder-2.mp3' },
      { name: 'thunder3', path: 'assets/audio/thunder-3.mp3' },
      { name: 'bonusBGM', path: 'assets/audio/bonusBGM.mp3' },
    ]);

    if (AudioManager.sounds['sfxCorrect']) sfxCorrect = AudioManager.sounds['sfxCorrect'].obj;
    if (AudioManager.sounds['sfxIncorrect']) sfxIncorrect = AudioManager.sounds['sfxIncorrect'].obj;
    if (AudioManager.sounds['sfxMenu']) sfxMenu = AudioManager.sounds['sfxMenu'].obj;
    if (AudioManager.sounds['bossHit']) bossHit = AudioManager.sounds['bossHit'].obj;
    if (AudioManager.sounds['bossKill']) bossHit = AudioManager.sounds['bossKill'].obj;
    if (AudioManager.sounds['bgmHard']) bgmHard = AudioManager.sounds['bgmHard'].obj;
    if (AudioManager.sounds['bgmBoss']) bgmBoss = AudioManager.sounds['bgmBoss'].obj;
    if (AudioManager.sounds['mainMenu']) bgmBoss = AudioManager.sounds['mainMenu'].obj;
        if (AudioManager.sounds['bonusBGM']) bonusBGM = AudioManager.sounds['bonusBGM'].obj;
  } else if (typeof loadSound === 'function') { // If the Audio Manager can't be loaded properly, then just load the sound effects like from previous iteration (with "loadSound()"):
    try {
      sfxCorrect = loadSound('assets/audio/correct.mp3');
    } catch (e) {
      sfxCorrect = null;
      console.warn('Failed to preload "correct.mp3"!', e);
    }
    try {
      sfxIncorrect = loadSound('assets/audio/incorrect.mp3');
    } catch (e) {
      sfxIncorrect = null;
      console.warn('Failed to preload "incorrect.mp3"!', e);
    }
    try {
      sfxMenu = loadSound('assets/audio/menuSelect.mp3');
    } catch (e) {
      sfxMenu = null;
      console.warn('Failed to preload "menuSelect.mp3!"' );
    }
    try {
      bgmHard = loadSound('assets/audio/gameBGM.mp3');
    } catch (e) {
      bgmHard = null;
      console.warn('Failed to preload "gameBGM.mp3!"' );
    }
    try {
      bgmHard = loadSound('assets/audio/bgmBoss.mp3');
    } catch (e) {
      bgmHard = null;
      console.warn('Failed to preload "bgmBoss.mp3!"' );
    }
    try {
      bossHit = loadSound('assets/audio/bossHit.mp3');
    } catch (e) {
      bossHit = null;
      console.warn('Failed to preload "bossHit.mp3!"' );
    }
    try {
      bossHit = loadSound('assets/audio/bossKill.mp3');
    } catch (e) {
      bossHit = null;
      console.warn('Failed to preload "bossKill.mp3!"' );
    }
    try {
      bossHit = loadSound('assets/audio/mainMenu.mp3');
    } catch (e) {
      bossHit = null;
      console.warn('Failed to preload "mainMenu.mp3!"' );
    }
    try {
      bonusBGM = loadSound('assets/audio/bonusBGM.mp3');
    } catch (e) {
      bonusBGM = null;
      console.warn('Failed to preload "bonusBGM.mp3!"' );
    }
  }

  // Preload correct sound effect if p5.sound/audio file is available:
  if (typeof loadSound === 'function') {
    try { // Attempt to load "correct.mp3":
      sfxCorrect = loadSound('assets/audio/correct.mp3');
    } catch (e) {
      sfxCorrect = null;
      console.warn('Failed to preload "correct.mp3"!', e);
    }
    try { // Attempt to load "incorrect.mp3":
      sfxIncorrect = loadSound('assets/audio/incorrect.mp3');
    } catch (e) {
      sfxIncorrect = null;
      console.warn('Failed to preload "incorrect.mp3"!', e);
    }
    try { // Attempt to load "menuSelect.mp3":
      sfxMenu = loadSound('assets/audio/menuSelect.mp3');
    } catch (e) {
      sfxMenu = null;
      console.warn('Failed to preload "menuSelect.mp3!"' );
    }
    try {
      bgmHard = loadSound('assets/audio/gameBGM.mp3');
    } catch (e) {
      bgmHard = null;
      console.warn('Failed to preload "gameBGM.mp3!"' );
    }
    try {
      bgmHard = loadSound('assets/audio/bgmBoss.mp3');
    } catch (e) {
      bgmHard = null;
      console.warn('Failed to preload "bgmBoss.mp3!"' );
    }
    try {
      bossHit = loadSound('assets/audio/bossHit.mp3');
    } catch (e) {
      bossHit = null;
      console.warn('Failed to preload "bossHit.mp3!"' );
    }
    try {
      bossHit = loadSound('assets/audio/bossKill.mp3');
    } catch (e) {
      bossHit = null;
      console.warn('Failed to preload "bossKill.mp3!"' );
    }
    try {
      bossHit = loadSound('assets/audio/mainMenu.mp3');
    } catch (e) {
      bossHit = null;
      console.warn('Failed to preload "mainMenu.mp3!"' );
    }
    try {
      bonusBGM = loadSound('assets/audio/bonusBGM.mp3');
    } catch (e) {
      bonusBGM = null;
      console.warn('Failed to preload "bonusBGM.mp3!"' );
    }
  }

  localstorageRoundManager = new LocalStorageRoundManager();
  finalRoundPopup = new FinalRoundPopup(localstorageRoundManager, logoImagePath);
}

function drawMenu() {
  // if menu background image exists, draw it, else default background
  if (menuBgImg) {
    image(menuBgImg, 0, 0, width, height);
  } else {
    background(200);
  }

  // draw drifting shapes in background
  playModeMenu();

  // overlay darkness
  fill(0, 180);
  noStroke();
  rect(0, 0, width, height);
  
  // Title text or logo image
  if (logoImg) {
    imageMode(CENTER);
    image(logoImg, width/2, height/2 - 280);
    fill(255); // white
    textAlign(CENTER, CENTER);
    textSize(width/35);
    textFont(pixelFont);
    text("THAT TIME I GOT REINCARNATED INTO A NEW WORLD\nAND USED MY LEVEL 100 FLASHLIGHT SKILLS TO FIND THE WANTED SHAPE!", width/2, height/2 - 155);
    imageMode(CORNER);
  } else {
    fill(255); // white
    textAlign(CENTER, CENTER);
    textSize(48);
    text("Shape Finder!\nVersion 7.0", width/2, height/2 - 120);
  }

  // Draw buttons
  drawButton(startButton);
  drawButton(modesButton);
  drawButton(statsButton);
}

function spawnMenuShape() {
  const r = random(20, 40);
  const x = random(r, width - r);
  const y = random(r, height - r);
  mods = [];
  if (random() < 0.50) {
    mods.push(new FigureSkateModifier({
      director: formationDirector,
      joinChance: 0.001,
      strength: 0.20,
        types: ['circle','orbit','figure8','line','sinWave','triangle','orbitTriangle','square','orbitSquare'],
      minGapFrames: 180,
    }));
  }
  const opts = {
    movement: { enabled: true, lerpStrength: 0.2, velocityLimit: 0.3, switchRate: 60 },
    modifiers: mods,
    deleteOnClick: false,
    randomColor: true,
    outline: true,
    stroke: { enabled: true, weight: 9, color: [255,255,255] },
  };
  const choice = random(['circle', 'rect', 'tri']);
  if (choice === 'circle') {
    interactors.push(new ClickCircle(x, y, r, randomColor(), {...opts}));
  } else if (choice === 'rect') {
    interactors.push(new ClickRect(x, y, r*1.5, r*1.5, randomColor(), 8, {...opts}));
  } else {
    interactors.push(new ClickTri(x, y, r*2, randomColor(), {...opts}));
  }
}


// helper function to draw a button
function drawButton(btn) {
  const hovering = mouseX > btn.x && mouseX < btn.x + btn.w &&
                   mouseY > btn.y && mouseY < btn.y + btn.h;

  if (btn.img) {
    imageMode(CORNER);
    noSmooth(); // ← prevent smoothing
    if (hovering && btn.hoverImg) {
      image(btn.hoverImg, btn.x, btn.y, btn.w, btn.h);
    } else {
      image(btn.img, btn.x, btn.y, btn.w, btn.h);
    }
  } else {
    fill(hovering ? color(120,180,255) : color(80,140,255));
    rect(btn.x, btn.y, btn.w, btn.h, 12);
    fill(255);
    textSize(24);
    textAlign(CENTER, CENTER);
    text(btn.label, btn.x + btn.w/2, btn.y + btn.h/2);
  }
}

// modes
function drawModes() {
  background(200);
  playModeMenu();

  fill(0, 180);
  noStroke();
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);
  textSize(40);
  fill(255);
  textFont(pixelFont);
  text("Select Difficulty", width/2, height/2 - 300);

  // Move difficulty buttons higher and align vertically
  easyButton.y = height / 2 - 220;
  mediumButton.y = height / 2 - 100;
  hardButton.y = height / 2 + 20;

  const buttonScale = 1.4; // smaller scale for start
  startGameButton.w = startBtnImg1.width * buttonScale +50;
  startGameButton.h = startBtnImg1.height * buttonScale +50;
  startGameButton.x = width / 2 - startGameButton.w / 2;
  startGameButton.y = height / 2 + 160;

  drawButton(easyButton);
  drawButton(mediumButton);
  drawButton(hardButton);

  // Selected difficulty text
  textSize(28);
  fill(255);
  const titleY = height / 2 - 300;
  text(`Current: ${difficulty.toUpperCase()}`, width / 2, titleY + 60);

  // Draw the Start button (reuse main menu art)
  drawButton(startGameButton);
  
  text("Select Modifiers", width/4, height/2 - 150);
  textFont('Arial');
  text("Flashlight Freeze", width/4-width/32, height / 4 + height * 0.11);
  text("Slow-Mo Enabled", width/4-width/32, height / 4 + height * 0.23);
  text("Three Lamps Mode", width/4-width/32, height / 4 + height * 0.35);
  text("Lightning Mode", width/4-width/32, height / 4 + height * 0.47);
  text("Relax Mode", width/4-width/32, height / 4 + height * 0.60);
  textFont(pixelFont);

  if (!checkboxLight) {
    checkboxLight = createCheckbox("", flashlightFreeze);
    checkboxLight.style("transform", "scale(4)");
  }
  checkboxLight.position(width / 4 + width/10, height / 4 + height * 0.10);

  if (!checkboxSlow) {
    checkboxSlow = createCheckbox("", slowMoEnabled);
    checkboxSlow.style("transform", "scale(4)");
  }
  checkboxSlow.position(width / 4 + width/10, height / 4 + height * 0.22);

  // Three Lamps overlay checkbox
  if (!checkboxLamps) {
    checkboxLamps = createCheckbox("", threeLampsEnabled);
    checkboxLamps.style("transform", "scale(4)");
  }
  checkboxLamps.position(width / 4 + width/10, height / 4 + height * 0.34);

  // Lightning Mode overlay checkbox 
  if (!checkboxLightning) {
    checkboxLightning = createCheckbox("", lightningEnabled);
    checkboxLightning.style("transform", "scale(4)");
  }
  checkboxLightning.position(width / 4 + width/10, height / 4 + height * 0.46);

  // Lightning Mode overlay checkbox 
  if (!checkboxRelax) {
    checkboxRelax = createCheckbox("", relaxMode);
    checkboxRelax.style("transform", "scale(4)");
  }
  checkboxRelax.position(width / 4 + width/10, height / 4 + height * 0.58);

  if (checkboxSlow.checked()) {slowMoEnabled = true; } else {slowMoEnabled = false;}

  if (checkboxLight.checked()) {flashlightFreeze = true;} else {flashlightFreeze = false;}

  if (checkboxLamps.checked()) { threeLampsEnabled = true; } else { threeLampsEnabled = false; }

  if (checkboxLightning.checked()) { lightningEnabled = true; } else { lightningEnabled = false; }

  if (checkboxRelax.checked()) { relaxMode = true; } else { relaxMode = false; }


  text("Select Color Scheme", width/4+width/2, height/2 - 150);
  textFont('Arial');
  drawButton(defaultColorBtn);
  drawButton(protanopiaBtn);
  drawButton(deuteranopiaBtn);
  drawButton(tritanopiaBtn);
  textFont(pixelFont);

  // place backToMenuButton in top-left for modes
  backToMenuButton.x = 20;
  backToMenuButton.y = 20;

  drawButton(backToMenuButton);
}
// helper for a single card
function drawBossCard(x, y, w, h, boss) {
    push();
    const bossKey = boss["key"];
    const defeated = Stats.lifetime.get("defeatedBosses")

    // Card frame
    fill(40, 40, 60, 240);
    stroke(defeated.includes(bossKey) ? color(100, 255, 150) : color(120));
    rect(x, y, w, h, 10);

    // Inner preview area
    noStroke();
    fill(80, 80, 130, 180);
    const innerW = w - 30;
    const innerH = h - 80;
    const innerY = y - 20;
    rect(x, innerY, innerW, innerH, 8);

    // Draw boss image
    const img = bossImages[boss.key];
    if (img) {
        const aspect = img.width / img.height;
        let displayW = innerW - 10;
        let displayH = displayW / aspect;

        if (displayH > innerH - 10) {
            displayH = innerH - 10;
            displayW = displayH * aspect;
        }

        imageMode(CENTER);
        image(img, x, innerY, displayW, displayH);
    }

    // Boss text
    fill(255);
    textSize(13);
    text(boss.name, x, y + h / 2 - 30);

    textSize(12);
    fill(defeated.includes(bossKey) ? color(100, 255, 150) : color(255, 100, 100));
    text(defeated.includes(bossKey) ? "Defeated" : "Undefeated", x, y + h / 2 - 12);

    pop();
}

function drawBossCards() {
    const cardWidth = 160;
    const cardHeight = 200;
    const paddingX = 30;
    const paddingY = 30;

    const totalTop = 4;
    const totalBottom = 4;

    const galleryTopY = height - 360; 
    const galleryCenterX = width / 2;

    const bosses = [
        { name: "The Rainbow Crystalline Golagon", key: "golagon", defeated: false },
        { name: "The Flaregon", key: "flaregon", defeated: false },
        { name: "The Tsunoctagon", key: "tsunoctagon",defeated: false },
        { name: "The Heartagon", key: "heartagon",defeated: false },
        { name: "The Delozier", key: "delozier",defeated: false },
        { name: "The Perfect Cell", key: "perfect",defeated: false },
        { name: "The Rotangle", key: "rotangle",defeated: false },
        { name: "The Abyssagon",key: "abyssagon", defeated: false },
        
        

    ];

    rectMode(CENTER);
    textAlign(CENTER, CENTER);
    imageMode(CENTER);
    textSize(14);
    strokeWeight(2);

    // Top row
    const topRowWidth = totalTop * cardWidth + (totalTop - 1) * paddingX;
    const topStartX = galleryCenterX - topRowWidth / 2;

    for (let i = 0; i < totalTop; i++) {
        const boss = bosses[i];
        const x = topStartX + i * (cardWidth + paddingX);
        const y = galleryTopY;

        drawBossCard(x, y, cardWidth, cardHeight, boss);
    }

    // Bottom row
    const bottomRowWidth = totalBottom * cardWidth + (totalBottom - 1) * paddingX;
    const bottomStartX = galleryCenterX - bottomRowWidth / 2;
    const bottomY = galleryTopY + cardHeight + paddingY;

    for (let i = 0; i < totalBottom; i++) {
        const boss = bosses[i + totalTop];
        const x = bottomStartX + i * (cardWidth + paddingX);
        drawBossCard(x, bottomY, cardWidth, cardHeight, boss);
    }
}



function drawStats() {
    background(60);
    playModeMenu();

    // --- Overall backdrop ---
    push();
    fill(0, 180);
    noStroke();
    rectMode(CORNER);
    rect(0, 0, width, height);
    pop();

    // --- Title ---
    push();
    fill(255);
    textAlign(CENTER, TOP);
    textSize(48);
    text("Player Stats", width / 2, 20);
    pop();

    // --- Session Stats ---
    push();
    textSize(32);
    textAlign(LEFT, TOP);
    fill(200);
    text("Last Game", width / 4, 100);
    const lastGameX = width / 4;

    if (!Stats) Stats = new StatTracker();

    textSize(24);
    fill(255);
    let y = 140;
    const lineHeight = 30;
    const correct = Stats.lifetime.get("correctClicks");
    const incorrect = Stats.lifetime.get("incorrectClicks");

    text("Final Round: " + Stats.session.get("round"), lastGameX, y); y += lineHeight;
    text("Correct Clicks: " + Stats.session.get("correctClicks"), lastGameX, y); y += lineHeight;
    text("Incorrect Clicks: " + Stats.session.get("incorrectClicks"), lastGameX, y); y += lineHeight;
    text("Highest Combo: " + Stats.session.get("highestCombo"), lastGameX, y); y += lineHeight;
    text("Time Alive: " + nf(Stats.session.get("timeAlive"), 1, 2) + "s", lastGameX, y); y += lineHeight;
    text("Average Find Time: " + nf(Stats.session.get("averageFindTime") / 1000, 1, 2) + "s", lastGameX, y); y += lineHeight;
    text("Difficulty: " + Stats.session.get("difficulty"), lastGameX, y);
    pop();

    // --- Lifetime Stats ---
    push();
    textSize(32);
    fill(200);
    textAlign(LEFT, TOP);
    text("Lifetime Stats", width / 2, 100);

    textSize(24);
    fill(255);
    y = 140;
    const lifetimeX = width / 2;
    text("Total Games Played: " + Stats.lifetime.get("totalGames"), lifetimeX, y); y += lineHeight;
    text(
        "Total Correct Clicks: " + correct + " (" + (correct / (correct + incorrect) * 100).toFixed(2) + "%)",
        lifetimeX, y
    ); y += lineHeight;
    text("Total Incorrect Clicks: " + Stats.lifetime.get("incorrectClicks"), lifetimeX, y); y += lineHeight;
    text("Total Alive Time: " + nf(Stats.lifetime.get("totalPlayTime"), 1, 2) + "s", lifetimeX, y); y += lineHeight;
    text("Best Round: " + Stats.lifetime.get("bestRound"), lifetimeX, y); y += lineHeight;
    text("Highest Combo: " + Stats.lifetime.get("highestCombo"), lifetimeX, y); y += lineHeight;
    text("Average Find Time: " + nf(Stats.lifetime.get("averageFindTime"), 1, 2) + "s", lifetimeX, y); y += lineHeight;
    pop();

    // Cards
    push();
    drawBossCards();
    pop();

    // back
    push();
    drawButton(backButton);
    pop();
}


function keyPressed() {
  if (key === 'a') triggerBoatLines(15000);
  if (key === 'b') triggerBlackHoleEvent(3000);
  if (key === 'w') triggerWarning(5000);
  if (key === 'z') triggerZombieEvent(5000);
  if (key === 'c') triggerPartyEvent(8000);
  if (key === 'm') triggerMimicEvent(8000, 20);
  if (key === 'n') triggerN1FormationEvent();
  if (key === 'e') triggerEZFormationEvent();
  if (key === 'l') triggerLOLFormationEvent();
  if (key === 't') delozierMode = true;
  if (key === ',') round=9;

  if (keyCode === ENTER && consoleInput.elt === document.activeElement) {
    const cmd = consoleInput.value().trim();
    consoleInput.value('');
    handleConsoleCommand(cmd);
  }

  if (keyCode === SHIFT) {
    if(slowMoEnabled){
    slowMo = true;
    }
  }

  if (gameState === "game" && (key === 'f' || key === 'F')) {
  const col = [80, 200, 255];
  FoundEffect.onCorrectShapeChosen(mouseX, mouseY, col, () => {
    noStroke(); 
    fill(col);
    ellipse(0, 0, 90, 90);  // simple pulse so we can see it
  });
  return; // optional: stop further key handling for this press
}
  
  if (gameState === "game" && key === 'p') {
    gameState = "pause";
    triggerCurtains();
    pauseStartMillis = millis();
  } else if (gameState === "pause" && key === 'p') {
    gameState = "game";
    triggerCurtains();
    totalPausedTime += millis() - pauseStartMillis;
  }
  else if (gameState === "menu" && key === 'd'){
    gameState = "builder";
  }
}

function keyReleased() {
  if (keyCode === SHIFT) {
    slowMo = false;
  }
}

function drawOverMenu() {
  // darken everything below the UI bar
  fill(0, 200); 
  noStroke();
  rect(0, UILayer.height, windowWidth, windowHeight - UILayer.height);

  // redraw UI bar so it’s visible on top
  image(UILayer, 0, 0);

  drawBackButton();
}

/////////////////////////////
// color scheme 
/////////////////////////////
function setColorScheme(scheme) {
  currentPaletteMode = scheme;
  console.log("Color scheme set to:", scheme);

  if (gameState === "modes") {
    clearInteractors();
    spawnMenuShapes(); // your new function
  }

}

////////////////////////////////////
//songs
////////////////////////////////////

let isHardBGMPlaying = false;

function playHardBGM() {
  // If already playing, do nothing
  if (isHardBGMPlaying) return;

  if (window.AudioManager && typeof AudioManager.play === 'function') {
    AudioManager.play('bgmHard', { vol: 0.35, loop: true });
    isHardBGMPlaying = true;
  } 
  else if (typeof bgmHard !== 'undefined' && bgmHard && typeof bgmHard.play === 'function') {
    // Only play if not already playing
    if (bgmHard.paused || bgmHard.currentTime === 0) {
      bgmHard.loop = true;
      bgmHard.volume = 0.35;
      bgmHard.play();
      isHardBGMPlaying = true;
    }
  }
}

function stopHardBGM(){
  if (window.AudioManager && typeof AudioManager.play === 'function') {
          AudioManager.stop('bgmHard');
          isHardBGMPlaying=false;
  } else if (typeof bgmHard !== 'undefined' && bgmHard && typeof bgmHard.play === 'function') {
    bgmHard.stop('bgmHard');
    isHardBGMPlaying=false;
  }
}

function playBossBGM(){
  if (window.AudioManager && typeof AudioManager.play === 'function') {
    AudioManager.play('bgmBoss', { vol: 0.35, loop:true }); // Play "bgmBoss" from the Audio Manager:
  } else if (typeof bgmBoss !== 'undefined' && bgmBoss && typeof bgmBoss.play === 'function') {
    bgmBoss.play(); // Fallback to basic logic if sound wasn't loaded correctly with the Audio Manager:
  }
}

function stopBossBGM(){
  if (window.AudioManager && typeof AudioManager.play === 'function') {
          AudioManager.stop('bgmBoss');
  } else if (typeof bgmBoss !== 'undefined' && bgmBoss && typeof bgmBoss.play === 'function') {
    bgmBoss.stop('bgmBoss');
  }
}

function playMenuBGM(){
  if (window.AudioManager && typeof AudioManager.play === 'function') {
    AudioManager.play('mainMenu', { vol: 0.35, loop:true }); // Play "mainMenu" from the Audio Manager:
  } else if (typeof mainMenu !== 'undefined' && mainMenu && typeof mainMenu.play === 'function') {
    mainMenu.play(); // Fallback to basic logic if sound wasn't loaded correctly with the Audio Manager:
  }
}

function stopMenuBGM(){
  if (window.AudioManager && typeof AudioManager.play === 'function') {
          AudioManager.stop('mainMenu');
  } else if (typeof mainMenu !== 'undefined' && mainMenu && typeof mainMenu.play === 'function') {
    mainMenu.stop('mainMenu');
  }
}

function playBonusBGM(){
  if (window.AudioManager && typeof AudioManager.play === 'function') {
    AudioManager.play('bonusBGM', { vol: 0.35, loop:true }); // Play "bonusBGM" from the Audio Manager:
  } else if (typeof bonusBGM !== 'undefined' && bonusBGM && typeof bonusBGM.play === 'function') {
    bonusBGM.play(); // Fallback to basic logic if sound wasn't loaded correctly with the Audio Manager:
  }
}

function stopBonusBGM(){
  if (window.AudioManager && typeof AudioManager.play === 'function') {
          AudioManager.stop('bonusBGM');
  } else if (typeof bonusBGM !== 'undefined' && bonusBGM && typeof bonusBGM.play === 'function') {
    bonusBGM.stop('bonusBGM');
  }
}

////////////////////////////////////
//sound effects
////////////////////////////////////

function playBossHit(){
  if (window.AudioManager && typeof AudioManager.play === 'function') {
    AudioManager.play('bossHit', { vol: 1, loop:false }); // Play "bossHit" from the Audio Manager:
  } else if (typeof bossHit !== 'undefined' && bossHit && typeof bossHit.play === 'function') {
    bossHit.play(); // Fallback to basic logic if sound wasn't loaded correctly with the Audio Manager:
  }
}

function playBossKill(){
  if (window.AudioManager && typeof AudioManager.play === 'function') {
    AudioManager.play('bossKill', { vol: 0.5, loop:false }); // Play "bossKill" from the Audio Manager:
  } else if (typeof bossKill !== 'undefined' && bossKill && typeof bossKill.play === 'function') {
    bossKill.play(); // Fallback to basic logic if sound wasn't loaded correctly with the Audio Manager:
  }
}

function playMenuSFX(){
  if (window.AudioManager && typeof AudioManager.play === 'function') {
    AudioManager.play('sfxMenu', { vol: 1.0 }); // Play "sfxMenu" from the Audio Manager:
  } else if (typeof sfxMenu !== 'undefined' && sfxMenu && typeof sfxMenu.play === 'function') {
    sfxMenu.play(); // Fallback to basic logic if sound wasn't loaded correctly with the Audio Manager:
  }
}



// passive renderer for menu (no clicks, no game logic)
function playModeMenu() {
  background(50);

  // occasionally add a shape if under cap
  if (frameCount % 60 === 0 && interactors.length < MENU_SHAPE_CAP) {
    spawnMenuShape(); // new helper
  }

  for (const it of interactors) {
    it.update();
    it.render();
  }
}

// background shapes for menu
function spawnMenuShapes() {
  //clearInteractors();
  for (let i = 0; i < 40; i++) {
    const r = random(20, 40);
    const x = random(r, width - r);
    const y = random(r, height - r);
    mods = [];
    if (random() < 0.50) {
      mods.push(new FigureSkateModifier({
        director: formationDirector,
        joinChance: 0.001,
        strength: 0.20,
        types: ['circle','orbit','figure8','line','sinWave','triangle','orbitTriangle','square','orbitSquare'],
        minGapFrames: 180,
      }));
    }
    const opts = {
      movement: { enabled: true, lerpStrength: 0.1, velocityLimit: 2, switchRate: 60 },
      modifiers: mods,
      deleteOnClick: false,
      outline: true,
      randomColor: true,
      stroke: { enabled: true, weight: 9, color: [255,255,255] },
    };
    const choice = random(['circle', 'rect', 'tri']);
    if (choice === 'circle') {
      interactors.push(new ClickCircle(x, y, r, randomColor(), opts));
    } else if (choice === 'rect') {
      interactors.push(new ClickRect(x, y, r*1.5, r*1.5, randomColor(), 8, opts));
    } else {
      interactors.push(new ClickTri(x, y, r*2, randomColor(), opts));
    }
  }
}


// back button in the corner// honestly just for me to switch back, can be removed
function drawBackButton() {
  fill(255, 80, 80); // red button
  rect(20, 20, 120, 40, 8);
  fill(255);
  textSize(18);
  textAlign(CENTER, CENTER);
  text("BACK", 80, 40);
}

// helper
function handleInteractorClick() {
  for (let i = interactors.length - 1; i >= 0; i--) {
    const it = interactors[i];
    if (it.enabled && it.contains(mouseX, mouseY)) {
      it.onClick();
      return; // trigger only one per click
    }
  }
}

function updateDifficultyVisuals(selected) {
  // Reset all to base images
  easyButton.img = easyButton0;
  mediumButton.img = mediumButton0;
  hardButton.img = hardButton0;

  // Set the selected one to its “active” image
  if (selected === "easy") easyButton.img = easyButton1;
  if (selected === "medium") mediumButton.img = mediumButton1;
  if (selected === "hard") hardButton.img = hardButton1;
}


//mouse input
function mousePressed() {
  if (gameState === "menu") {
    if (mouseInside(startButton)) {
      triggerCurtains();
      startGame();
    } else if (mouseInside(modesButton)) {
      gameState = "modes";
    } else if (mouseInside(statsButton)) {
      gameState = "stats";
    }

  } else if (gameState === "game") {
    // top-left pause button
    if (mouseInside(pauseButton)) {
      playMenuSFX();
      gameState = "pause";
      pauseStartMillis = millis();
    } else {
      handleInteractorClick();
    }

  } else if (gameState === "pause") {
    // Resume button
    if (mouseInside(resumeButton)) {
      playMenuSFX();
      gameState = "game";
      totalPausedTime += millis() - pauseStartMillis;

    // Menu button
    } else if (mouseInside(backToMenuButton)) {
      playMenuSFX();
      stopHardBGM();
      playMenuBGM();
      clearBosses();
      clearInteractors();
      gameState = "menu";
      //gameEvents.Fire("gameOver", false);
    }

  } else if (gameState === "modes") {
    // Difficulty buttons
    if (mouseInside(easyButton)) {
      playMenuSFX();
      difficulty = "easy";
      updateDifficultyVisuals("easy");
    } else if (mouseInside(mediumButton)) {
      playMenuSFX();
      difficulty = "medium";
      updateDifficultyVisuals("medium");
    } else if (mouseInside(hardButton)) {
      playMenuSFX();
      difficulty = "hard";
      updateDifficultyVisuals("hard");
    }

    //colorscheme buttons
  if (mouseInside(defaultColorBtn)) {
    playMenuSFX();
    setColorScheme("default");
  } else if (mouseInside(protanopiaBtn)) {
    playMenuSFX();
    setColorScheme("protanopia");
  } else if (mouseInside(deuteranopiaBtn)) {
    playMenuSFX();
    setColorScheme("deuteranopia");
  } else if (mouseInside(tritanopiaBtn)) {
    playMenuSFX();
    setColorScheme("tritanopia");
  }

    // Start button now actually begins the game
    if (mouseInside(startGameButton)) {
      playMenuSFX();
      triggerCurtains();
      startGame();
    }

    // Back button to main menu (if you want, optional)
    if (mouseInside({ x: 20, y: 20, w: 120, h: 40 })) {
      playMenuSFX();
      gameState = "menu";
    }

  } else if (gameState === "over") {
    if (mouseInside(againButton)) {
      stopHardBGM();
      stopBossBGM();
      startGame();
    } else if (mouseInside(backToMenuButton)) {
      playMenuSFX();
      gameState = "menu";
      gameEvents.Fire("gameOver", false);
      //bug fix for pop up
      if (finalRoundPopup && typeof finalRoundPopup.close === "function") {
        finalRoundPopup.close();
      }
      finalRoundPopupShown = false;
      shownGameOverScreen = false;
      gameOver = false;

      playMenuBGM();
      gameState = "menu";
    }
  } else if (gameState === "builder") {
    if (mouseInside(backButton)) {
      consoleInput.hide();
      gameState = "menu";
      return;
    }
    handleBuilderClick();
  } else if (gameState === "stats") {
    if (mouseInside(backButton)) {
      gameState = "menu";
    }
  }
}

function mouseReleased() {
  if (gameState === "builder") {
    gameEvents.Fire("dragEnd")
  }
}


// helper, checks if mouse is inside a rectangle button
function mouseInside(btn) {
  if (!btn) return false;
  if(mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h){
    playMenuSFX();
    return true;
  }
  else {return false;}
}

function setupHelper() {
  startButton = {
    x: width / 2 - startBtnImg1.width * startButtonScale / 2,
    y: height / 2 - startBtnImg1.height * startButtonScale / 2 - 15,
    img: startBtnImg1,
    hoverImg: startBtnImg2,
    w: startBtnImg1.width * startButtonScale,
    h: startBtnImg1.height * startButtonScale
  };

  modesButton = {
    x: width / 2 - optionsBtnImg1.width * optionsButtonScale / 2,
    y: height / 2 + 40,
    img: optionsBtnImg1,
    hoverImg: optionsBtnImg2,
    w: optionsBtnImg1.width * optionsButtonScale,
    h: optionsBtnImg1.height * optionsButtonScale
  };

  statsButton = { 
    x: width / 2 - optionsBtnImg1.width * optionsButtonScale / 2, 
    y: height/2 + 180, 
    img: statsButton0, 
    hoverImg: statsButton1, 
    w: builderButton0.width * optionsButtonScale, 
    h: builderButton0.height * optionsButtonScale, 

  };

  backButton = { x: 30, y: 10, w: 200, h: 60, label: "BACK" };

  const buttonScale = 1.8; // adjust as needed

  pauseButton = {
    x: 20,
    y: height*0.011299435,
    w: pauseButton0.width * buttonScale,
    h: pauseButton0.height * buttonScale,
    img: pauseButton0,
    hoverImg: pauseButton1
  };
  
  resumeButton = {
    x: width/2 - resumeButton0.width*buttonScale/2,
    y: height/2,
    w: resumeButton0.width * buttonScale,
    h: resumeButton0.height * buttonScale,
    img: resumeButton0,
    hoverImg: resumeButton1
  };
  
  backToMenuButton = {
    x: 20, // small margin from left
    y: 20, // small margin from top
    w: menuButton0.width * buttonScale,
    h: menuButton0.height * buttonScale,
    img: menuButton0,
    hoverImg: menuButton1
  };
  
  easyButton = {
    x: width/2 - easyButton0.width*buttonScale,
    y: height/2-height/10,
    w: easyButton0.width*buttonScale*2,
    h: easyButton0.height*buttonScale*2,
    img: easyButton0,
    hoverImg: easyButton1
  };
  
  mediumButton = {
    x: width/2 - mediumButton0.width*buttonScale,
    y: height/2 + height/18,
    w: mediumButton0.width*buttonScale*2,
    h: mediumButton0.height*buttonScale*2,
    img: mediumButton0,
    hoverImg: mediumButton1
  };
  
  hardButton = {
    x: width/2 - hardButton0.width*buttonScale,
    y: height/2 + (height*0.2118644068),
    w: hardButton0.width*buttonScale*2,
    h: hardButton0.height*buttonScale*2,
    img: hardButton0,
    hoverImg: hardButton1
  };

  // Add start button for modes menu (reuse main start image)
   startGameButton = {
    x: width / 2 - startBtnImg1.width * startButtonScale / 2,
    y: height / 2 + (height * 0.4), // below difficulty buttons
    w: startBtnImg1.width * startButtonScale,
    h: startBtnImg1.height * startButtonScale,
    img: startBtnImg1,
    hoverImg: startBtnImg2
  };
  
  // button set up for color scheme  
  const btnWidth = 150;
  const btnHeight = 50;
  const baseX = (width / 4 + width / 2)-btnWidth/2;
  const baseY = height / 2 - 100;

  defaultColorBtn = {
    x: baseX,
    y: baseY + 50,
    w: btnWidth,
    h: btnHeight,
    label: "Default"
  };
  protanopiaBtn = {
    x: baseX,
    y: baseY + 50 + 60,
    w: btnWidth,
    h: btnHeight,
    label: "Protanopia"
  };
  deuteranopiaBtn = {
    x: baseX,
    y: baseY + 50 + 120,
    w: btnWidth,
    h: btnHeight,
    label: "Deuteranopia"
  };
  tritanopiaBtn = {
    x: baseX,
    y: baseY + 50 + 180,
    w: btnWidth,
    h: btnHeight,
    label: "Tritanopia"
  };

  //gameplay ui business
  UILayer = createGraphics(windowWidth, windowHeight * 0.1);
  
  //flashlight business
  fx = width / 2;
  fy = height / 2;
  rebuildLayer();
}

function setup() {
  console.log("Loading123...");
  setupBuilder();
  createCanvas(windowWidth, windowHeight);

  director = new Director(events, gameEvents);

  userStartAudio().then(() => {
    playMenuBGM();
  });

  fileInput = createFileInput(handleInputFile);
  fileInput.hide();

  console.log("Version 7.0");//change this each master commit to see when changes happen
  
  setupHelper();

  // spawn drifting shapes for menu
  spawnMenuShapes();
}

//makes the shapes
function playMode() {
  background(50);
  
  for (const it of interactors) {
    it.update();  // runs movement + modifiers
    it.render();  // draws the object
  }
  for (const obj of combinedObjectList) {
    obj.update()
  }
  for (const boss of activeBosses) {
    console.log("Drawing:", boss.name, boss.alive);
    boss.drawUI();
  }
  events.update();
}

let isBonusRound = false;
//add boss fights and round events here
function nextRound(){
  triggerCurtains();

  setTimeout(() => {
    if(!relaxMode){
      clearInteractors();
      if (round%10==0){//boss fight every 10 rounds
        flashlightEnabled = false;
        wantedObj = null;
        stopHardBGM();
        playBossBGM();
        //spawnBossInteractors();
        SpawnBoss(round);
      }
      else if(!isBonusRound){
        flashlightEnabled = true;
        stopBonusBGM();
        playHardBGM();
        stopBossBGM();
        spawnInteractors();
      }
    }
    else{
      clearInteractors();
      flashlightEnabled = true;
      stopBonusBGM();
      playHardBGM();
      stopBossBGM();
      spawnInteractors();
    }
  }, 750);
}

function bonusRound(){
  triggerCurtains();
  clearInteractors();

  setTimeout(() => {
  playBonusBGM();
  stopBossBGM();
  spawnBonusInteractors();
  
  }, 750);
}

function startGame() {
  setupGameEvents();
  Timer = StartTime;        // reset round length
  startMillis = millis();   // bookmark the start time ONCE
  totalPausedTime = 0;
  TimeOver = false;
  gameOverTriggered = false;
  shownGameOverScreen = false;
  blackout = true;
  gameOver = false;
  gameState = "game";
  round =1;
  combo = 0;
  flashlightEnabled = true;

  Stats = new StatTracker();

  stopBossBGM();
  playHardBGM();

  clearBosses();
  clearInteractors();

  triggerCurtains();
  setTimeout(() => {
    blackout = false;
  }, 1000);
  // Reset lamp positions to default at the start of the game:
  if (typeof initLamps === 'function') initLamps();
  spawnInteractors();
  playMode();

  gameEvents.Fire("setDifficulty", difficulty);
}

//draw loop
function draw() {
  background(30); // dark gray background for contrast
  if (gameState === "menu") {
    stopBonusBGM();
    stopBossBGM();
    stopHardBGM();
    drawMenu();
  } else if (gameState === "game") {
    stopMenuBGM();
    drawGame();
  } else if (gameState === "modes") {
    drawModes();
  } else if (gameState === "over") {
    drawOverMenu();
  } else if (gameState === "pause") {
    drawGame();        // shows the frozen game
    drawPauseMenu();   // overlay pause menu
    } else if (gameState === "builder") {
    drawBuilder();
  } else if (gameState === "stats") {
    drawStats();
  }

  if(gameState != "modes" && checkboxLight){
      checkboxLight.remove(); // completely deletes it from the DOM
      checkboxLight = null;   // clear reference
  }

  if(gameState != "modes" && checkboxSlow){
      checkboxSlow.remove(); // completely deletes it from the DOM
      checkboxSlow = null;   // clear reference
  }

  if(gameState != "modes" && checkboxLamps){
    checkboxLamps.remove(); // completely deletes it from the DOM
    checkboxLamps = null;   // clear reference
  }
  if(gameState != "modes" && checkboxLightning){
      checkboxLightning.remove(); // completely deletes it from the DOM
      checkboxLightning = null;   // clear reference
  }
  if(gameState != "modes" && checkboxRelax){
      checkboxRelax.remove(); // completely deletes it from the DOM
      checkboxRelax = null;   // clear reference
  }

  updateScoreIndicators();
}

// GAME (placeholder)
function drawGame() {
  fill(0);
  if (window.FoundEffect) FoundEffect.applyCameraShakeIfActive();


  // compute time left based on the single startMillis
  // added totalPaused time so that it only counts time spent NOT pause
  if (gameState !== "pause" && !isBonusRound && !relaxMode) {
  let elapsed = int((millis() - startMillis - totalPausedTime) / 1000);
  times = Timer - elapsed;
  }


  // clamp
  if (times <= 0) {

    // Hopefully this won't block the main thread since we won't have that much round objects.
    // We will have to refactor this to have async/Promise if we notice a block in the future.
    topRoundsBeforeUpdate = localstorageRoundManager.getTopRounds();

    times = 0;

    if (!TimeOver) {
      TimeOver = true;
      localstorageRoundManager.storeRound();
      // Sequence:
      // Fire gameOver. Handled in events.js, "gameOver" event plays a finisher
      // FinisherSequence class fires "showGameOverScreen" event (also in events.js)
      // sets gameState to "over", gameOver to true, re-enables the flashlight, renders the finalRoundPopup
      gameEvents.Fire("gameOver", true); // 'true' or 'false' determines whether to show a finisher sequence
    }

    // gameOver = true; <- Moved this to 
    // gameState = "over";
  }

  if (director && gameState === "game") {
    director.update();
  }

  // play mode only while not gameOver
  if (!gameOver && gameState !== "pause") {
    playMode();
  }

  // darkness/flashlight stuff
  const mx = isFinite(mouseX) ? mouseX : width / 2;
  const my = isFinite(mouseY) ? mouseY : height / 2;
  fx = lerp(fx, mx, 0.2);
  fy = lerp(fy, my, 0.2);

  const dx = fx - coverW / 2;
  const dy = fy - coverH / 2;
  //image(darkness, dx, dy);
  // Choose between the flashlight or the three-lamps overlay
  if (typeof threeLampsEnabled !== 'undefined' && threeLampsEnabled && typeof drawLampsOverlay === 'function') {
    drawLampsOverlay();
  } else {
    if (flashlightEnabled) drawFlashlightOverlay();
  }

  events.renderFront();

  //drawing the top UI bar
  UILayer.clear();
  UILayer.background(255,255,255);
  UILayer.textSize(24);
  UILayer.textAlign(RIGHT, CENTER);
  UILayer.fill('black');
  UILayer.textFont(pixelFont);

  let blinkAlpha = 255;

    // Check if time is in the last 10 seconds
  if (times < 10 && times > 0) {
    // Blink every half a second
    let blinkSpeed = 500; // milliseconds
    blinkAlpha = (millis() % (blinkSpeed * 2) < blinkSpeed) ? 255 : 50; 
  }

  // Apply blinking color
  UILayer.fill(0, 0, 0, blinkAlpha);
  
  UILayer.text("Round: " + round + " Combo: "+ combo + " Time: " + times, UILayer.width - 20, UILayer.height /2);
  image(UILayer, 0,0);
  if (wantedObj) wantedObj.render();

  // back button
  //drawBackButton();
  drawButton(pauseButton);
  // overlay LAST so it renders above darkness/UI
if (window.FoundEffect) FoundEffect.renderFoundEffectOverlay();

}

function updateScoreIndicators() {

  // handle stars
  for (let i = stars.length - 1; i >= 0; i--) {
    stars[i].update();
    stars[i].show();
    if (stars[i].isDead()) {
      stars.splice(i, 1);
    }
  }

  // handle circle bursts
  for (let i = circleBursts.length - 1; i >= 0; i--) {
    circleBursts[i].update();
    circleBursts[i].show();
    if (circleBursts[i].isDead()) {
      circleBursts.splice(i, 1);
    }
  }

  for (let i = bossKills.length - 1; i >= 0; i--) {
    bossKills[i].update();
    bossKills[i].show();
    if (bossKills[i].isDead()) {
      bossKills.splice(i, 1);
    }
  }

  for (let i = bonusStars.length - 1; i >= 0; i--) {
    bonusStars[i].update();
    bonusStars[i].show();
    if (bonusStars[i].isDead()) {
      bonusStars.splice(i, 1);
    }
  }
}

function drawPauseMenu() {
  fill(0, 180);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(48);
  text("Paused", width / 2, height / 2 - 100);

  // center backToMenuButton dynamically
  const buttonScale = 1.8;
  backToMenuButton.w = menuButton0.width * buttonScale;
  backToMenuButton.h = menuButton0.height * buttonScale;
  backToMenuButton.x = width / 2 - backToMenuButton.w / 2;
  backToMenuButton.y = height / 2 + 80;

  drawButton(resumeButton);
  drawButton(backToMenuButton);
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  setupHelper();

  if (gameState === "modes") {
    drawModes();
  }
}





