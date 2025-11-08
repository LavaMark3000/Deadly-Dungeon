document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const startScreen = document.getElementById('start-screen');
  const characterSelectScreen = document.getElementById('character-select-screen');
  const gameScreen = document.getElementById('game-screen');
  const gameOverScreen = document.getElementById('game-over-screen');
  const playerNameInput = document.getElementById('player-name-input');
  const submitNameButton = document.getElementById('submit-name-button');
  const openDoorButton = document.getElementById('open-door-button');
  const proceedDeeperButton = document.getElementById('proceed-deeper-button');
  const exitDungeonButton = document.getElementById('exit-dungeon-button');
  const playAgainButton = document.getElementById('play-again-button');
  const rpsChoicesDiv = document.getElementById('rps-choices');
  const rpsButtons = document.querySelectorAll('.rps-button');
  const actionButtons = document.getElementById('action-buttons');
  const encounterGraphic = document.getElementById('encounter-graphic');
  const encounterMessage = document.getElementById('encounter-message');
  const gameOverGraphic = document.getElementById('game-over-graphic');
  const playerCharacterImageEl = document.getElementById('player-character-image');
  const newsletterEmailInput = document.getElementById('newsletter-email-input');
  const newsletterSubmitButton = document.getElementById('newsletter-submit-button');
  const challengeIncomingMessageEl = document.getElementById('challenge-incoming-message');
  const challengeFriendSection = document.getElementById('challenge-friend-section');
  const challengeFinalScoreDisplayEl = document.getElementById('challenge-final-score-display');
  const copyLinkFeedbackMessageEl = document.getElementById('copy-link-feedback-message');
  const copyChallengeLinkButton = document.getElementById('copy-challenge-link-button');
  const goToQuestionsButton = document.getElementById('go-to-questions-button');
  const levelBanner = document.getElementById('level-banner');
  const keyHelp = document.getElementById('key-help');
  const findOutMoreButton = document.getElementById('find-out-more-button');

  // Audio
  const sfx = {
    click: document.getElementById('sfx-click'),
    door: document.getElementById('sfx-door'),
    stairs: document.getElementById('sfx-stairs'),
    treasure: document.getElementById('sfx-treasure'),
    trapAppear: document.getElementById('sfx-trap-appear'),
    trapTrigger: document.getElementById('sfx-trap-trigger'),
    trapDisarm: document.getElementById('sfx-trap-disarm'),
    monsterAppear: document.getElementById('sfx-monster-appear'),
    monsterRoar: document.getElementById('sfx-monster-roar'),
    playerHit: document.getElementById('sfx-player-hit'),
    playerWinRPS: document.getElementById('sfx-player-win-rps'),
    drawRPS: document.getElementById('sfx-draw-rps'),
    heal: document.getElementById('sfx-heal'),
    gameover: document.getElementById('sfx-gameover'),
    select: document.getElementById('sfx-select'),
    celebrate: document.getElementById('sfx-celebrate')
  };
  const musicDungeon = document.getElementById('music-dungeon');
  const musicBoss = document.getElementById('music-boss');
  // === Obfuscated Challenge Code (client-side deterrent) ===

  // === Post-encoding letter-mapping (digits -> letters) ===
  // Replace numeric digits in the compact code with letters to make codes look alphabetic.
  const DIGIT_TO_LETTER = { '0':'K','1':'L','2':'M','3':'N','4':'O','5':'P','6':'Q','7':'R','8':'S','9':'T' };
  const LETTER_TO_DIGIT = Object.fromEntries(Object.entries(DIGIT_TO_LETTER).map(([k,v])=>[v,k]));

  function encodeDigitsToLetters(s){
    if (!s) return s;
    return String(s).split('').map(ch => DIGIT_TO_LETTER[ch] || ch).join('');
  }
  function decodeLettersToDigits(s){
    if (!s) return s;
    return String(s).split('').map(ch => LETTER_TO_DIGIT[ch] || ch).join('');
  }

  // This uses a modular linear transform with a per-name mask so the 'code' in the URL
  // looks opaque. It's reversible in JS using modular inverse. This is only a deterrent.
  const OB_MOD = 1000000007n; // prime modulus
  const OB_MULT = 1299827n;   // multiplier (must be coprime with OB_MOD)
  const OB_ADD = 764321n;     // additive offset

  // Compute modular inverse of OB_MULT (Fermat since OB_MOD is prime)
  function modPow(base, exp, mod){
    base = base % mod;
    let result = 1n;
    while(exp > 0n){
      if (exp & 1n) result = (result * base) % mod;
      base = (base * base) % mod;
      exp >>= 1n;
    }
    return result;
  }
  const OB_MULT_INV = modPow(OB_MULT, OB_MOD - 2n, OB_MOD);

  const OB_PEPPER = 0x5a3c7f1d; // small numeric pepper (visible in bundle)

  function nameSum(name){
    if (!name) return 0n;
    let s = 0n;
    for (let i = 0; i < name.length; i++) s += BigInt(name.charCodeAt(i));
    return s;
  }

  // Encode score and name into a short base36 code
  function encodeScoreToCode(score, name){
    const s = BigInt(Math.max(0, Math.floor(Number(score)||0)));
    const nsum = nameSum(String(name || ''));
    const seed = ( (s * OB_MULT) + OB_ADD + nsum ) % OB_MOD; // linear transform
    const mask = (nsum * 12345n + BigInt(OB_PEPPER)) % OB_MOD; // name-derived mask
    const ob = seed ^ mask; // XOR (BigInt)
    return encodeDigitsToLetters(ob.toString(36)); // compact base36 string
  }

  // Decode code back to score using the name
  function decodeCodeToScore(code, name){
    try {
      if (!code) return null;
      // first map letters back to digits
      const normalized = decodeLettersToDigits(String(code));
      const ob = BigInt(parseInt(String(normalized), 36)); // parse base36 into Number then BigInt (safe for our ranges)
      const nsum = nameSum(String(name || ''));
      const mask = (nsum * 12345n + BigInt(OB_PEPPER)) % OB_MOD;
      const seed = ob ^ mask;
      // invert linear transform: score = (seed - OB_ADD - nsum) * OB_MULT_INV mod OB_MOD
      let val = (seed - OB_ADD - nsum) % OB_MOD;
      if (val < 0n) val += OB_MOD;
      const s = (val * OB_MULT_INV) % OB_MOD;
      return Number(s); // final score as Number
    } catch (e) {
      return null;
    }
  }

  // === Challenge Link Integrity (Option B: client-side checksum) ===
  // NOTE: This is a deterrent only. The pepper is bundled and can be discovered.
  const CHALLENGE_PEPPER = 'dd_v1_pepper_F7b2xK1Q';
  function base64urlFromBytes(bytes){
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    let b64 = btoa(bin);
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/,'');
  }
  async function sha256Base64Url(str){
    const data = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return base64urlFromBytes(new Uint8Array(hash));
  }
  async function signChallenge(score, fromName){
    const payload = `${'${'}score}${'|'}${'${'}fromName}${'|'}${'${'}CHALLENGE_PEPPER}${''}`;
    return await sha256Base64Url(payload);
  }

  // High score localStorage
  const HIGH_SCORE_KEY = 'dd_high_score';
  function loadHighScore(){
    try { return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10) || 0; } catch(e){ return 0; }
  }
  function saveHighScore(score){
    try { localStorage.setItem(HIGH_SCORE_KEY, String(score)); } catch(e){ /* ignore */ }
  }
  function updateHighScoreDisplays(){
    const hs = loadHighScore();
    const startHS = document.getElementById('high-score-start');
    if (startHS){ startHS.textContent = `Best Score: ${hs}`; }
    const statHS = document.getElementById('stat-highscore');
    if (statHS){ statHS.textContent = `${hs}`; }
  }


  // Constants
  const DOOR_OPEN_REVEAL_DELAY_MS = 1200;
  const SCENE_TRANSITION_DELAY_MS = 300;
  const GAME_OVER_DELAY_MS = 1500;
  const MONSTER_ACTION_DISPLAY_SPEED_BASE = 1500;
  const MONSTER_ACTION_DISPLAY_SPEED_DEPTH_FACTOR = 0;
  const ACTION_IMAGE_BLANK_DELAY_MS = 100;
  const RPS_FINAL_LINGER_MS = 200;const BORDER_COLORS = ['#FF6347','#32CD32','#1E90FF','#FFD700','#DA70D6'];
  const MAX_SEQUENCE_LENGTH = 8;
  const ROOMS_PER_LEVEL = 5;
  // boss is the 5th room (4 encounters before the boss)
  const BOSS_INTRO_DELAY_MS = 2500; // keep boss intro text visible before actions
  const BOSS_REWARD_MULTIPLIER = 3; // bosses drop more treasure

  // Data
  const CLASS_RPS_LABELS = {
    warrior:{ monster:{ rock:"Axe Cleave", paper:"Shield Bash", scissors:"Sword Lunge" }, trap:{ rock:"Brute Force", paper:"Cautious Step", scissors:"Wedge & Pry" }},
    rogue:{ monster:{ rock:"Shadow Strike", paper:"Evasive Dodge", scissors:"Swift Stab" }, trap:{ rock:"Careful Probe", paper:"Disarm Tools", scissors:"Nimble Fingers" }},
    mage:{ monster:{ rock:"Fireball", paper:"Force Shield", scissors:"Lightning Bolt" }, trap:{ rock:"Detect Rune", paper:"Dispel Magic", scissors:"Telekinetic Nudge" }}
  };
  const CLASS_RPS_IMAGES = {
    warrior:{ rock:"images/rps_actions/warrior_rock.png", paper:"images/rps_actions/warrior_paper.png", scissors:"images/rps_actions/warrior_scissors.png" },
    rogue:{   rock:"images/rps_actions/rogue_rock.png",   paper:"images/rps_actions/rogue_paper.png",   scissors:"images/rps_actions/rogue_scissors.png" },
    mage:{    rock:"images/rps_actions/mage_rock.png",    paper:"images/rps_actions/mage_paper.png",    scissors:"images/rps_actions/mage_scissors.png" }
  };
  const CHARACTER_CLASSES = {
  warrior:{
    id:"warrior", name:"Warrior", imagePath:"images/classes/warrior.png", emojiIcon:"🛡️",
    description:"Mighty! High health. Ability — Iron Hide: takes 25% less damage from monsters.",
    startingHealth:120,
    abilityTitle:"Iron Hide"
  },
  rogue:{
    id:"rogue", name:"Rogue", imagePath:"images/classes/rogue.png", emojiIcon:"🗡️",
    description:"Cunning and quick. Ability — Opportunist: earns +25% extra gold from defeated monsters.",
    startingHealth:100,
    abilityTitle:"Opportunist"
  },
  mage:{
    id:"mage", name:"Mage", imagePath:"images/classes/mage.png", emojiIcon:"🔮",
    description:"Wise and enduring. Ability — Arcane Renewal: fully heals after defeating a boss.",
    startingHealth:80,
    abilityTitle:"Arcane Renewal"
  }
};
  const MONSTER_TYPES = [
    { name:"Goblin", imagePath:"images/monsters/goblin.png", baseDamageMin:3,  baseDamageMax:7,  depthDamageFactor:1,   monsterClass:'rogue'   },
    { name:"Skeleton", imagePath:"images/monsters/skeleton.png", baseDamageMin:4,  baseDamageMax:8,  depthDamageFactor:1,   monsterClass:'warrior' },
    { name:"Slime", imagePath:"images/monsters/slime.png", baseDamageMin:2,  baseDamageMax:6,  depthDamageFactor:1,   monsterClass:'mage'    },
    { name:"Giant Spider", imagePath:"images/monsters/giant_spider.png", baseDamageMin:5, baseDamageMax:9, depthDamageFactor:1.2, monsterClass:'rogue' },
    { name:"Cave Bat", imagePath:"images/monsters/cave_bat.png", baseDamageMin:2, baseDamageMax:5, depthDamageFactor:0.8, monsterClass:'rogue' },
    { name:"Zombie", imagePath:"images/monsters/zombie.png", baseDamageMin:6, baseDamageMax:10, depthDamageFactor:1.2, monsterClass:'warrior' },
    { name:"Restless Ghost", imagePath:"images/monsters/restless_ghost.png", baseDamageMin:4, baseDamageMax:7, depthDamageFactor:1, monsterClass:'mage' },
    { name:"Impish Demon", imagePath:"images/monsters/impish_demon.png", baseDamageMin:7, baseDamageMax:12, depthDamageFactor:1.5, monsterClass:'mage' },
    { name:"Young Dragon", imagePath:"images/monsters/young_dragon.png", baseDamageMin:10, baseDamageMax:15, depthDamageFactor:2, monsterClass:'warrior' },
    { name:"Dire Wolf", imagePath:"images/monsters/dire_wolf.png", baseDamageMin:5, baseDamageMax:9, depthDamageFactor:1.1, monsterClass:'warrior' },
  { name:"Manticore", imagePath:"images/monsters/manticore.png", baseDamageMin:8,  baseDamageMax:13, depthDamageFactor:1.4, monsterClass:"rogue",  flavor:"Its barbed tail rattles as it circles." },
  { name:"Chimera", imagePath:"images/monsters/chimera.png", baseDamageMin:9,  baseDamageMax:14, depthDamageFactor:1.8, monsterClass:"warrior", flavor:"Three heads, one intent: your demise." },
  { name:"Cyclops", imagePath:"images/monsters/cyclops.png", baseDamageMin:7,  baseDamageMax:12, depthDamageFactor:1.5, monsterClass:"warrior", flavor:"It bellows and charges, single eye blazing." },
  { name:"Fishman", imagePath:"images/monsters/fishman.png", baseDamageMin:3,  baseDamageMax:7,  depthDamageFactor:1.0, monsterClass:"rogue",  flavor:"Wet footprints slosh closer from the dark." },
  { name:"Golem", imagePath:"images/monsters/golem.png", baseDamageMin:6,  baseDamageMax:11, depthDamageFactor:1.6, monsterClass:"warrior", flavor:"Stone grinds as it lumbers forward." },
  { name:"Lizard", imagePath:"images/monsters/lizard.png", baseDamageMin:2,  baseDamageMax:6,  depthDamageFactor:0.9, monsterClass:"rogue",  flavor:"It darts side to side with a hiss." },
  { name:"Lizardman", imagePath:"images/monsters/lizardman.png", baseDamageMin:4,  baseDamageMax:8,  depthDamageFactor:1.1, monsterClass:"warrior", flavor:"A spear-wielding raider flicks its tongue." },
  { name:"Troll", imagePath:"images/monsters/troll.png", baseDamageMin:5, baseDamageMax:9, depthDamageFactor:1.2, monsterClass:"warrior", flavor:"A foul roar echoes through the corridor." },
  { name:"Wraith", imagePath:"images/monsters/wraith.png", baseDamageMin:4, baseDamageMax:10, depthDamageFactor:1.3, monsterClass:"mage", flavor:"The air turns thin and icy as it drifts closer." },
  { name:"Minotaur", imagePath:"images/monsters/minotaur.png", baseDamageMin:10, baseDamageMax:16, depthDamageFactor:1.9, monsterClass:"warrior", flavor:"The ground shakes with each thunderous hoofbeat." },
  { name:"Ogre", imagePath:"images/monsters/ogre.png", baseDamageMin:8, baseDamageMax:13, depthDamageFactor:1.5, monsterClass:"warrior", flavor:"It hefts a massive club with terrifying ease." },
  { name:"Orc", imagePath:"images/monsters/orc.png", baseDamageMin:5, baseDamageMax:10, depthDamageFactor:1.2, monsterClass:"rogue", flavor:"It snarls and beats its chest, eager for a fight." },
  { name:"Snake", imagePath:"images/monsters/snake.png", baseDamageMin:2, baseDamageMax:5, depthDamageFactor:0.8, monsterClass:"rogue", flavor:"It coils and strikes with lightning speed." }

  ];

// === Level-based monster spawn configuration ===
const ANY_LEVEL_MONSTERS = ["Cave Bat","Giant Spider","Dire Wolf","Slime"];
const LEVEL_POOLS = {
  1: ["Goblin","Orc","Troll","Ogre"],
  2: ["Zombie","Restless Ghost","Skeleton","Wraith"],
  3: ["Chimera","Cyclops","Manticore"],
  4: ["Zombie","Restless Ghost","Skeleton","Wraith"],
  5: ["Lizard","Lizardman","Fishman"],
  6: ["Golem","Impish Demon"],
  7: ["Zombie","Restless Ghost","Skeleton","Wraith"],
  8: ["Snake","Young Dragon"],
};
function getMonstersForLevel(level){
  try{
    const names = new Set([...(LEVEL_POOLS[level] || []), ...ANY_LEVEL_MONSTERS]);
    return MONSTER_TYPES.filter(m => names.has(m.name));
  }catch(e){
    return MONSTER_TYPES.filter(m => ANY_LEVEL_MONSTERS.includes(m.name));
  }
}

  const TRAP_TYPES = [
    { name:"Spike Pit",  imagePath:"images/traps/spike_pit.png", baseDamageMin:8,  baseDamageMax:12, depthDamageFactor:1.5, monsterClass:'warrior' },
    { name:"Arrow Slit", imagePath:"images/traps/arrow_slit.png", baseDamageMin:6,  baseDamageMax:10, depthDamageFactor:1.2, monsterClass:'warrior' },
    { name:"Rock Fall",  imagePath:"images/traps/rock_fall.png",  baseDamageMin:10, baseDamageMax:15, depthDamageFactor:1.8, monsterClass:'warrior' }
  ];
  const TREASURE_TYPES = [
    { name:"Pile of Gold", imagePath:"images/treasures/gold_pile.png", valueMin:10, valueMax:30, depthValueFactor:5 },
    { name:"Sparkling Gem", imagePath:"images/treasures/gem.png", valueMin:25, valueMax:50, depthValueFactor:8 },
    { name:"Loot Chest", imagePath:"images/treasures/loot_chest.png", valueMin:50, valueMax:100, depthValueFactor:12 },
    { name:"Ancient Scroll", imagePath:"images/treasures/ancient_scroll.png", valueMin:15, valueMax:40, depthValueFactor:6 },
    { name:"Valuable Potion", imagePath:"images/treasures/valuable_potion.png", valueMin:20, valueMax:45, depthValueFactor:7 }
  ];
  const STATIC_IMAGES = {
    door:"images/ui/door.png",
    stairs:"images/ui/stairs.png",
    gameOverPerished:"images/ui/game_over_perished.png",
    gameOverEscaped:"images/ui/game_over_escaped.png"
  };

  // State
  let playerName = "Adventurer";
  let playerClass = null;
  let playerHealth = 0;
  let playerMaxHealth = 0;
  let currentTreasure = 0;
  let dungeonLevel = 1; // explicit dungeon level tracker
  let currentDepth = 0; // shown as Rooms
  let lastDisplayedLevel = 1;
  let stairsAvailable = false;
    dungeonLevel = 1;

  // Track the most recent final score for share links
  let lastFinalScore = 0;

  const currentRpsContext = {
    active:false, type:null, opponentData:null, opponentClass:null, opponentBaseDamage:0,
    opponentActionSequence:[], playerCurrentSequenceStep:0, opponentSequenceDisplayInterval:null, opponentSequenceDisplayIndex:0,
    bossRequiredStreak:3, bossCurrentStreak:0
  };
  const RPS_CHOICES = ['rock','paper','scissors'];

  // --- Bottom Dock visibility helpers (avoid layout jumps) ---
  function showRpsChoices(){
    if (rpsChoicesDiv){ rpsChoicesDiv.classList.add('is-visible'); rpsChoicesDiv.classList.remove('is-hidden'); }
    if (actionButtons){ actionButtons.classList.add('is-hidden'); actionButtons.classList.remove('is-visible'); }
  }
  function showActionButtons(){
    if (actionButtons){ actionButtons.classList.add('is-visible'); actionButtons.classList.remove('is-hidden'); }
    if (rpsChoicesDiv){ rpsChoicesDiv.classList.add('is-hidden'); rpsChoicesDiv.classList.remove('is-visible'); }
  }
  function hideBoth(){
    if (rpsChoicesDiv){ rpsChoicesDiv.classList.add('is-hidden'); rpsChoicesDiv.classList.remove('is-visible'); }
    if (actionButtons){ actionButtons.classList.add('is-hidden'); actionButtons.classList.remove('is-visible'); }
    markRpsReady(false);
  }

  // Add or remove a subtle glow to indicate inputs are ready
  function markRpsReady(on){
    try{ rpsButtons.forEach(btn => btn.classList.toggle('rps-ready', !!on)); }catch(_e){}
  }


  // Helpers
  function playSound(s){ if (s && s.play){ s.currentTime = 0; const p = s.play(); if (p) p.catch(()=>{}); } }
  function stopMusic(m){ if (m && !m.paused){ m.pause(); m.currentTime = 0; } }
// Smoothly fade an <audio> element, then pause and reset.
function fadeOutAudio(audio, durationMs){
  try{
    if (!audio) return;
    const startVol = (typeof audio.volume === 'number') ? audio.volume : 1.0;
    const steps = 12;
    const stepTime = Math.max(20, Math.floor((durationMs||800)/steps));
    let i = 0;
    const id = setInterval(() => {
      i++;
      const ratio = Math.max(0, 1 - i/steps);
      try{ audio.volume = startVol * ratio; }catch(_e){}
      if (i>=steps){
        clearInterval(id);
        try{ audio.pause(); }catch(_e){}
        try{ audio.currentTime = 0; }catch(_e){}
        try{ audio.volume = startVol; }catch(_e){}
      }
    }, stepTime);
  }catch(_e){}
}

  function getDungeonLevel(){ return dungeonLevel; }
  function isBossRoom(){ return currentDepth > 0 && (currentDepth % ROOMS_PER_LEVEL === 0); }
  function getSymbolCountForLevel(level){ return Math.min(level, MAX_SEQUENCE_LENGTH); }

  function populateCharacterClasses(){
    const container = document.getElementById('class-options-container');
    container.innerHTML = '';
    Object.values(CHARACTER_CLASSES).forEach(cls => {
      const div = document.createElement('div');
      div.className = 'class-option';
      div.dataset.classId = cls.id;
      div.innerHTML = `<img src="${cls.imagePath}" alt="${cls.name}" class="class-image"><div class="class-name">${cls.name}</div>`;
      div.addEventListener('click', () => { playSound(sfx.select); selectCharacterClass(cls, div); });
      container.appendChild(div);
    });
    document.getElementById('enter-dungeon-button').style.display = 'none';
  }
  function selectCharacterClass(cls, node){
    playerClass = cls;
    document.querySelectorAll('.class-option').forEach(n => n.classList.remove('selected'));
    node.classList.add('selected');
    document.getElementById('class-description').innerHTML = `${cls.name} selected! ${cls.description}`;
    document.getElementById('enter-dungeon-button').style.display = 'inline-block';
    updateRpsPreview();
  }


  function updateRpsPreview(){
    const container = document.getElementById('rps-preview');
    if (!container) return;

    const classTextEl = document.getElementById('rps-class-text');
    if (!playerClass || !CLASS_RPS_IMAGES[playerClass.id]){
      container.style.display = 'none';
      if (classTextEl) classTextEl.textContent = '';
      return;
    }

    // Add the descriptive sentence
    if (classTextEl) {
      classTextEl.textContent = `The ${playerClass.name} uses these items to represent Rock, Paper, and Scissors.`;
    }

    const imgs = CLASS_RPS_IMAGES[playerClass.id];
    const labels = CLASS_RPS_LABELS[playerClass.id]?.monster || {rock:'Rock',paper:'Paper',scissors:'Scissors'};

    const rockImg = document.getElementById('rps-prev-rock');
    const paperImg = document.getElementById('rps-prev-paper');
    const scissorsImg = document.getElementById('rps-prev-scissors');
    if (rockImg){ rockImg.src = imgs.rock; rockImg.alt = `${playerClass.name} Rock — ${labels.rock||'Rock'}`; }
    if (paperImg){ paperImg.src = imgs.paper; paperImg.alt = `${playerClass.name} Paper — ${labels.paper||'Paper'}`; }
    if (scissorsImg){ scissorsImg.src = imgs.scissors; scissorsImg.alt = `${playerClass.name} Scissors — ${labels.scissors||'Scissors'}`; }

    container.style.display = 'block';
  }
  function updateLevelBanner(){
    const lvl = getDungeonLevel();
    levelBanner.textContent = `Dungeon Level ${lvl}`;
    lastDisplayedLevel = lvl;
    try{ document.getElementById('stat-level').textContent = `${lvl}`; }catch(_e){}
  }

  function initializeGameAndStart(){
  // Ensure fresh run starts at Level 1
  dungeonLevel = 1;
  lastDisplayedLevel = 1;
  stairsAvailable = false;

    if (!playerClass){ document.getElementById('class-description').textContent = "Please select a class first!"; return; }
    playerHealth = playerClass.startingHealth;
    playerMaxHealth = playerClass.startingHealth;
    currentTreasure = 0;
    currentDepth = 0;
    stairsAvailable = false;
    currentRpsContext.active = false;
    // No reset for total-wins mode
    updatePlayerStats();
    updateLevelBanner();
    presentNewDoor();
    try{ if (musicBoss) stopMusic(musicBoss); }catch(_e){}
    if (musicDungeon) { musicDungeon.volume = 0.3; playSound(musicDungeon); }
    switchScreen(gameScreen);
    showActionButtons();
  }

  function presentNewDoor(){
    try{document.getElementById('encounter-graphic').classList.remove('defeated');}catch(_e){}

    encounterGraphic.innerHTML = `<img src="${stairsAvailable ? STATIC_IMAGES.stairs : STATIC_IMAGES.door}" alt="${stairsAvailable ? 'Stairs' : 'Mysterious Door'}" class="encounter-image">`;
    encounterMessage.textContent = stairsAvailable ? "A stairway descends to the next level..." : "A mysterious door awaits...";
    openDoorButton.textContent = stairsAvailable ? "Take Stairs" : "Open Door";
    openDoorButton.style.display = 'inline-block';
    proceedDeeperButton.style.display = 'none';
    exitDungeonButton.style.display = 'inline-block';
    hideBoth();
    keyHelp.style.display = 'none';
    showActionButtons();
    currentRpsContext.active = false;
    if (currentRpsContext.opponentSequenceDisplayInterval){
      clearInterval(currentRpsContext.opponentSequenceDisplayInterval);
      currentRpsContext.opponentSequenceDisplayInterval = null;
    }
    updatePlayerStats();
    if (!stairsAvailable){ updateLevelBanner(); } // stairs preview handled after boss
  }

  function updatePlayerStats(){
    updateHighScoreDisplays(); // refresh HS in header
    document.getElementById('stat-name').textContent = `${playerName}`;
    document.getElementById('stat-class').textContent = playerClass ? playerClass.name : '';
    document.getElementById('stat-health').textContent = `${playerHealth}`;
    document.getElementById('stat-treasure').textContent = `${currentTreasure}`;
    document.getElementById('stat-depth').textContent = `${currentDepth}`;
    if (playerClass && playerClass.imagePath){
      playerCharacterImageEl.src = playerClass.imagePath;
      playerCharacterImageEl.alt = playerClass.name;
      playerCharacterImageEl.style.display = 'block';
    } else {
      playerCharacterImageEl.style.display = 'none';
    }
  }

  function switchScreen(newScreen){
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    setTimeout(() => {
      newScreen.classList.add('active');
      if (newScreen.id === 'game-screen'){
        updatePlayerStats(); updateLevelBanner();
      } else {
        if (playerCharacterImageEl) playerCharacterImageEl.style.display = 'none';
        if (musicDungeon && (newScreen.id === 'start-screen' || newScreen.id === 'character-select-screen' || newScreen.id === 'game-over-screen')) stopMusic(musicDungeon);
    try{ if (musicBoss) stopMusic(musicBoss); }catch(_e){}
        if (musicBoss && (newScreen.id === 'start-screen' || newScreen.id === 'character-select-screen' || newScreen.id === 'game-over-screen')) stopMusic(musicBoss);
      }
    }, SCENE_TRANSITION_DELAY_MS);
  }

  function handleOpenDoor(){
    playSound(sfx.click);
    if (stairsAvailable){
  // Take stairs: pause for 2.4s before moving to the next level start
  playSound(sfx.stairs);
  // brief UI lock + message
  openDoorButton.disabled = true;
  proceedDeeperButton.style.display = 'none';
  exitDungeonButton.style.display = 'none';
  encounterMessage.textContent = "You descend the stairs...";

  setTimeout(() => {
    stairsAvailable = false;
    dungeonLevel += 1;
    presentNewDoor();
    updateLevelBanner();
    openDoorButton.disabled = false;
  }, 2400);

  return;
}
    playSound(sfx.door);
    currentDepth++; // entering a room
    openDoorButton.style.display = 'none';
    proceedDeeperButton.style.display = 'none';
    exitDungeonButton.style.display = 'none';
    hideBoth();

    setTimeout(() => {
      if (isBossRoom()){
        startCombatSequence('boss');
        return;
      }
      const roll = Math.random();
      if (roll < 0.40){
        startCombatSequence('monster');
      } else if (roll < 0.70){
        startCombatSequence('trap');
      } else {
        resolveNewTreasure();
        finalizeCombatSequence(true, {autoProceed:true});
      }
    }, DOOR_OPEN_REVEAL_DELAY_MS);
  }

  function resolveNewTreasure(){
    playSound(sfx.treasure);
    const t = TREASURE_TYPES[Math.floor(Math.random()*TREASURE_TYPES.length)];
    const baseValue = Math.floor(Math.random()*(t.valueMax - t.valueMin + 1)) + t.valueMin;
    const depthBonus = currentDepth * (t.depthValueFactor || 5);
    const found = baseValue + depthBonus;
    currentTreasure += found;
    encounterGraphic.innerHTML = `<img src="${t.imagePath}" alt="${t.name}" class="encounter-image">`;
    encounterMessage.textContent = `You found a ${t.name} worth ${found} gold!`;
    updatePlayerStats();
  }

  function startCombatSequence(type, existingOpponentData=null){
    try{document.getElementById('encounter-graphic').classList.remove('defeated');}catch(_e){}

    currentRpsContext.active = true;
    currentRpsContext.type = type;
    let opp;

    if (existingOpponentData){
      opp = existingOpponentData;
    } else {
      if (type === 'boss'){
        /*__BOSS_MUSIC_START__*/
        // Reset boss streak so every boss (incl. Boss 2+) requires 3 defeats
        currentRpsContext.bossCurrentStreak = 0;
        currentRpsContext.bossRequiredStreak = 3;

        try{ if (musicDungeon) stopMusic(musicDungeon);
    try{ if (musicBoss) stopMusic(musicBoss); }catch(_e){} }catch(_e){}
        try{ if (musicBoss){ musicBoss.volume = 0.35; const _p = musicBoss.play(); if (_p) _p.catch(()=>{}); } }catch(_e){}
        /*__BOSS_MUSIC_START_END__*/
        const level = getDungeonLevel();
        currentRpsContext.opponentClass = ['warrior','rogue','mage'][(level - 1) % 3];
        opp = {
          name:`Boss of Level ${level}`,
          imagePath:`images/monsters/boss${level}.png`,
          baseDamageMin: 10 + level * 2,
          baseDamageMax: 15 + level * 3,
          depthDamageFactor: 2.0
        };
        encounterGraphic.innerHTML = `<img src="${opp.imagePath}" alt="${opp.name}" class="encounter-image">`;
        encounterMessage.textContent = `${opp.name} appears! Defeat it ${currentRpsContext.bossRequiredStreak} times!`;
      } else if (type === 'monster'){
        playSound(sfx.monsterAppear);
        const lvl = getDungeonLevel() || 1;
        const pool = getMonstersForLevel(lvl);
        const pick = (pool && pool.length ? pool : MONSTER_TYPES.filter(m => ANY_LEVEL_MONSTERS.includes(m.name)));
        opp = pick[Math.floor(Math.random()*pick.length)];
        currentRpsContext.opponentClass = opp.monsterClass;
        encounterGraphic.innerHTML = `<img src="${opp.imagePath}" alt="${opp.name}" class="encounter-image">`;
      } else {
        playSound(sfx.trapAppear);
        opp = TRAP_TYPES[Math.floor(Math.random()*TRAP_TYPES.length)];
        currentRpsContext.opponentClass = 'warrior';
        encounterGraphic.innerHTML = `<img src="${opp.imagePath}" alt="${opp.name}" class="encounter-image">`;
      }
    }

    currentRpsContext.opponentData = opp;
    const baseDmg = Math.floor(Math.random()*(opp.baseDamageMax - opp.baseDamageMin + 1)) + opp.baseDamageMin;
    currentRpsContext.opponentBaseDamage = baseDmg + Math.floor(currentDepth * (opp.depthDamageFactor || 1));

    // Sequence length: EXACT equal to dungeon level (capped)
    const level = getDungeonLevel();
    const seqLen = Math.min(level, MAX_SEQUENCE_LENGTH);
    currentRpsContext.opponentActionSequence = Array.from({length: seqLen}, () => ['rock','paper','scissors'][Math.floor(Math.random()*3)]);
    currentRpsContext.playerCurrentSequenceStep = 0;
    currentRpsContext.opponentSequenceDisplayIndex = 0;

    const rpsLabels = CLASS_RPS_LABELS[playerClass.id][type === 'trap' ? 'trap' : 'monster'];
    rpsButtons.forEach(btn => {
      const c = btn.dataset.choice;
      const alt = rpsLabels[c] || c;
      const img = btn.querySelector('img.rps-action-image');
      img.src = `${{rock:CLASS_RPS_IMAGES[playerClass.id].rock, paper:CLASS_RPS_IMAGES[playerClass.id].paper, scissors:CLASS_RPS_IMAGES[playerClass.id].scissors}[c]}`;
      img.alt = alt;
      btn.disabled = true;
    });
    showRpsChoices();
    keyHelp.style.display = 'inline-flex';

    if (type !== 'boss'){
      encounterMessage.textContent = `The ${opp.name} appears! It's preparing its moves...`;
      displayOpponentAction();
    } else {
      // DELAYED BOSS INTRO
      setTimeout(() => { if (currentRpsContext.active) displayOpponentAction(); }, BOSS_INTRO_DELAY_MS);
    }
  }

  function displayOpponentAction(){
    if (currentRpsContext.opponentSequenceDisplayInterval){
      clearInterval(currentRpsContext.opponentSequenceDisplayInterval);
    }
    const timePerCycle = Math.max(500 + ACTION_IMAGE_BLANK_DELAY_MS, MONSTER_ACTION_DISPLAY_SPEED_BASE + ACTION_IMAGE_BLANK_DELAY_MS);

    currentRpsContext.opponentSequenceDisplayInterval = setInterval(() => {
      if (!currentRpsContext.active){
        clearInterval(currentRpsContext.opponentSequenceDisplayInterval);
        return;
      }
      encounterGraphic.innerHTML = '';
      if (currentRpsContext.opponentSequenceDisplayIndex < currentRpsContext.opponentActionSequence.length){
        setTimeout(() => {
          if (!currentRpsContext.active) return;
          const action = currentRpsContext.opponentActionSequence[currentRpsContext.opponentSequenceDisplayIndex];
          const border = BORDER_COLORS[currentRpsContext.opponentSequenceDisplayIndex % BORDER_COLORS.length];
          const cls = currentRpsContext.opponentClass || 'warrior';
          encounterGraphic.innerHTML = `<img src="${CLASS_RPS_IMAGES[cls][action]}" alt="Opponent Action" class="encounter-image encounter-action" style="border:3px solid ${border}; box-sizing:border-box; border-radius:10px;">`;
          encounterMessage.textContent = `Opponent's Move ${currentRpsContext.opponentSequenceDisplayIndex + 1} / ${currentRpsContext.opponentActionSequence.length}`;
          currentRpsContext.opponentSequenceDisplayIndex++;
        }, ACTION_IMAGE_BLANK_DELAY_MS);
      } else {
        clearInterval(currentRpsContext.opponentSequenceDisplayInterval);
    currentRpsContext.opponentSequenceDisplayInterval = null;
    setTimeout(() => {
      if (!currentRpsContext.active) return;
      encounterGraphic.innerHTML = `<img src="${currentRpsContext.opponentData.imagePath}" alt="${currentRpsContext.opponentData.name}" class="encounter-image">`;
      encounterMessage.innerHTML = `Your turn! Counter their sequence (${currentRpsContext.playerCurrentSequenceStep + 1}/${currentRpsContext.opponentActionSequence.length}).`;
      rpsButtons.forEach(btn => btn.disabled = false);
          markRpsReady(true);
    }, ACTION_IMAGE_BLANK_DELAY_MS + RPS_FINAL_LINGER_MS);
      }
    }, timePerCycle);
  }

  function handleRPSChoice(playerChoice){
    markRpsReady(false);
    if (!currentRpsContext.active || currentRpsContext.playerCurrentSequenceStep >= currentRpsContext.opponentActionSequence.length) return;
    playSound(sfx.click);
    rpsButtons.forEach(b => b.disabled = true);

    const oppAction = currentRpsContext.opponentActionSequence[currentRpsContext.playerCurrentSequenceStep];
    let outcome = 'loss';
    if (playerChoice === oppAction) outcome = 'draw';
    else if (
      (playerChoice === 'rock' && oppAction === 'scissors') ||
      (playerChoice === 'paper' && oppAction === 'rock') ||
      (playerChoice === 'scissors' && oppAction === 'paper')
    ) outcome = 'win';

    if (currentRpsContext.type === 'monster'){
      if (outcome === 'win'){
        playSound(sfx.playerWinRPS);
        currentRpsContext.playerCurrentSequenceStep++;
        if (currentRpsContext.playerCurrentSequenceStep === currentRpsContext.opponentActionSequence.length){
          const t = gainMonsterTreasure();
          encounterMessage.innerHTML = `VICTORY! You perfectly countered the ${currentRpsContext.opponentData.name}! Found ${t} gold.`;
try{
        const encWrap = document.getElementById('encounter-graphic');
        if (encWrap){ encWrap.classList.remove('defeated'); encWrap.classList.add('defeated'); }
      }catch(_e){}

          finalizeCombatSequence(true, {autoProceed:true});
        } else {
          encounterMessage.innerHTML = `SUCCESSFUL COUNTER! Next move (${currentRpsContext.playerCurrentSequenceStep + 1}/${currentRpsContext.opponentActionSequence.length}).`;
          rpsButtons.forEach(btn => btn.disabled = false);
          markRpsReady(true);
        }
      } else {
        playSound(sfx.monsterRoar); playSound(sfx.playerHit);
        takeDamage(currentRpsContext.opponentBaseDamage);
        encounterMessage.innerHTML = `FAIL! You take ${currentRpsContext.opponentBaseDamage} damage.`;
        if (playerHealth <= 0) finalizeCombatSequence(false); else { setTimeout(() => restartCurrentCombat(), 1600); }
      }
    } else if (currentRpsContext.type === 'trap'){
      if (outcome === 'win'){
        currentRpsContext.playerCurrentSequenceStep++;
        if (currentRpsContext.playerCurrentSequenceStep === currentRpsContext.opponentActionSequence.length){
          playSound(sfx.trapDisarm);
          const baseGold = Math.floor((Math.random()*(15 + currentDepth*3) + (10 + currentDepth)) * 0.5);
          currentTreasure += baseGold; playSound(sfx.treasure);
          let msg = `CLEVER! You disarmed the ${currentRpsContext.opponentData.name} and recover ${baseGold} gold.`;
          if (playerClass && playerClass.id === 'rogue'){
            const rogueGold = Math.floor(Math.random()*(10 + currentDepth*2)) + (10 + currentDepth*2);
            currentTreasure += rogueGold; playSound(sfx.treasure);
            msg += ` As a Rogue, you pocket an extra ${rogueGold} gold!`;
          }
          encounterMessage.innerHTML = msg; updatePlayerStats();
          finalizeCombatSequence(true, {autoProceed:true});
        } else {
          encounterMessage.innerHTML = `Careful... Next step to disarm (${currentRpsContext.playerCurrentSequenceStep + 1}/${currentRpsContext.opponentActionSequence.length}).`;
          rpsButtons.forEach(btn => btn.disabled = false);
          markRpsReady(true);
        }
      } else {
        playSound(sfx.trapTrigger);
        playSound(sfx.playerHit);
        takeDamage(currentRpsContext.opponentBaseDamage);
        encounterMessage.innerHTML = `OOPS! The ${currentRpsContext.opponentData.name} triggers! You take ${currentRpsContext.opponentBaseDamage} damage.`;
        if (playerHealth <= 0){ finalizeCombatSequence(false); } else { finalizeCombatSequence(true, {autoProceed:true}); }
      }
    } else if (currentRpsContext.type === 'boss'){
      if (outcome === 'win'){
        currentRpsContext.playerCurrentSequenceStep++;
        if (currentRpsContext.playerCurrentSequenceStep === currentRpsContext.opponentActionSequence.length){
          currentRpsContext.bossCurrentStreak = (currentRpsContext.bossCurrentStreak || 0) + 1;
          if (currentRpsContext.bossCurrentStreak >= currentRpsContext.bossRequiredStreak){
            playSound(sfx.playerWinRPS);
            const bossTreasure = gainMonsterTreasure(BOSS_REWARD_MULTIPLIER);
            playSound(sfx.treasure);
            encounterMessage.innerHTML = `COLOSSAL VICTORY! You defeated the ${currentRpsContext.opponentData.name} and found ${bossTreasure} gold! (Boss reward ×${BOSS_REWARD_MULTIPLIER})`;
            
            // Mage passive: full heal after boss victory
            if (playerClass && playerClass.id === 'mage') {
              playerHealth = playerMaxHealth;
              updatePlayerStats();
              try { encounterMessage.innerHTML += " Your magic restores your full health!"; } catch (_e) {}
            }
            // No reset for total-wins mode
            // After boss: show stairs state
            try{
              const encWrap = document.getElementById('encounter-graphic');
              if (encWrap) encWrap.classList.remove('defeated');
                encWrap.classList.add('defeated');
            }catch(_e){}
            setTimeout(() => {
              try{
              const encWrap = document.getElementById('encounter-graphic');
              if (encWrap){
                encWrap.classList.remove('defeated'); // ensure no red cross
                encWrap.classList.add('defeated'); // show gold cross
              }
            }catch(_e){}
            setTimeout(() => {
              try{
                const encWrap = document.getElementById('encounter-graphic');
                if (encWrap){
                  encWrap.classList.remove('boss-defeated','defeated'); // clear overlays
                }
              }catch(_e){}
              stairsAvailable = true;
              finalizeCombatSequence(true, {showStairs:true});
            }, 2000);
            }, 1000);
          } else {
            playSound(sfx.playerWinRPS);
            encounterMessage.innerHTML = `You stagger the ${currentRpsContext.opponentData.name}! Defeats: ${currentRpsContext.bossCurrentStreak}/${currentRpsContext.bossRequiredStreak}. Prepare for the next assault...`;
            setTimeout(() => {
              const level = getDungeonLevel();
              const seqLen = Math.min(level, MAX_SEQUENCE_LENGTH);
              currentRpsContext.opponentActionSequence = Array.from({length: seqLen}, () => ['rock','paper','scissors'][Math.floor(Math.random()*3)]);
              currentRpsContext.playerCurrentSequenceStep = 0;
              restartCurrentCombat();
            }, 1200);
          }
        } else {
          encounterMessage.innerHTML = `Good hit! Next move (${currentRpsContext.playerCurrentSequenceStep + 1}/${currentRpsContext.opponentActionSequence.length}).`;
          rpsButtons.forEach(btn => btn.disabled = false);
          markRpsReady(true);
        }
      } else {
        playSound(sfx.monsterRoar); playSound(sfx.playerHit);
        // No reset for total-wins mode
        takeDamage(currentRpsContext.opponentBaseDamage);
        encounterMessage.innerHTML = `FAIL! The ${currentRpsContext.opponentData.name} punishes you. Wins so far: ${currentRpsContext.bossCurrentStreak}/${currentRpsContext.bossRequiredStreak}.`;
        if (playerHealth <= 0){ finalizeCombatSequence(false); } else { setTimeout(() => restartCurrentCombat(), 1600); }
      }
    }
  }

  function restartCurrentCombat(){
    if (!currentRpsContext.opponentData){ presentNewDoor(); return; }
    startCombatSequence(currentRpsContext.type, currentRpsContext.opponentData);
  }

  function gainMonsterTreasure(multiplier=1){
    const base = Math.floor(Math.random()*(15 + currentDepth*3)) + (10 + currentDepth);
    let val = Math.floor(base * (multiplier || 1));
  // Rogue passive: +25% gold from monsters
  try { if (playerClass && playerClass.id === 'rogue' && currentRpsContext && currentRpsContext.type === 'monster') { val = Math.floor(val * 1.25); } } catch (_e) {}
    currentTreasure += val; updatePlayerStats(); return val;
  }
  function takeDamage(amount){
  // Warrior passive: 25% less damage from monsters
  try { if (playerClass && playerClass.id === 'warrior' && currentRpsContext && currentRpsContext.type === 'monster') { amount = Math.floor(amount * 0.75); } } catch (_e) {}

    playerHealth -= amount;
    if (playerHealth < 0) playerHealth = 0;
  // Flash effect on fail
  // Lunge effect on fail (monster image jumps forward)
  try {
    const img = document.querySelector('#encounter-graphic .encounter-image');
    if (img) {
      img.classList.remove('lunge-fail'); // restart animation if mid-flight
      void img.offsetWidth; // reflow
      img.classList.add('lunge-fail');
      setTimeout(() => img.classList.remove('lunge-fail'), 250);
    }
  } catch(_e) {}

  try {
    const enc = document.getElementById('encounter-graphic');
    if (enc) {
      enc.classList.add('flash-fail');
      setTimeout(() => enc.classList.remove('flash-fail'), 200);
    }
  } catch(_e) {}

    updatePlayerStats();
  }

  function finalizeCombatSequence(isSafeOutcome, opts={}){
  const _opts = opts || {};

    if (currentRpsContext.opponentSequenceDisplayInterval){
      clearInterval(currentRpsContext.opponentSequenceDisplayInterval);
      currentRpsContext.opponentSequenceDisplayInterval = null;
    }
    currentRpsContext.active = false;
    hideBoth();
    keyHelp.style.display = 'none';

    if (_opts.autoProceed){
      hideBoth();
      hideBoth();
      openDoorButton.style.display = 'none';
      proceedDeeperButton.style.display = 'none';
      exitDungeonButton.style.display = 'none';
      setTimeout(() => { presentNewDoor(); }, 2000);
      return;
    }

    if (playerHealth <= 0){ endGame(false); return; }

    if (isSafeOutcome){
      showActionButtons();
      showActionButtons();
      if (opts.showStairs){
      /*__BOSS_MUSIC_END_ON_STAIRS__*/
      try{ if (musicBoss) fadeOutAudio(musicBoss, 1000); }catch(_e){}
      try{ setTimeout(() => { if (musicDungeon){ musicDungeon.volume = 0.3; const _p = musicDungeon.play(); if (_p) _p.catch(()=>{}); } }, 1000); }catch(_e){}
      /*__BOSS_MUSIC_END_ON_STAIRS_END__*/
        proceedDeeperButton.style.display = 'none';
        exitDungeonButton.style.display = 'inline-block';
        openDoorButton.textContent = "Take Stairs";
        encounterGraphic.innerHTML = `<img src="${STATIC_IMAGES.stairs}" alt="Stairs to next level" class="encounter-image">`;
        encounterMessage.textContent = "A stairway descends to the next level...";
        openDoorButton.style.display = 'inline-block';
      } else {
        proceedDeeperButton.style.display = 'inline-block';
        openDoorButton.style.display = 'none';
        exitDungeonButton.style.display = 'inline-block';
      }
    }
  }

  function handleProceedDeeper(){ playSound(sfx.click); if (playerHealth <= 0){ endGame(false); return; } presentNewDoor(); }
  function handleExitDungeon(){
    playSound(sfx.click);
    endGame(true);
  }

  function endGame(isSafeExit){
    if (currentRpsContext.opponentSequenceDisplayInterval){
      clearInterval(currentRpsContext.opponentSequenceDisplayInterval);
      currentRpsContext.opponentSequenceDisplayInterval = null;
    }
    currentRpsContext.active = false;
    stopMusic(musicDungeon);
    try{ if (musicBoss) stopMusic(musicBoss); }catch(_e){}
    let finalScore = 0;
    const titleEl = document.getElementById('game-over-title');
    const finalHighScoreEl = document.getElementById('final-high-score');
    const finalHighScoreBadgeEl = document.getElementById('final-high-score-badge');
    const msgEl = document.getElementById('final-score-message');

    if (isSafeExit){
      finalScore = currentTreasure;
      titleEl.textContent = "You Beat the Dungeon!";
      msgEl.innerHTML = `You bravely exited <strong>Dungeon Level ${dungeonLevel}</strong> after ${currentDepth} rooms with ${currentTreasure} gold!<br>Your final score is ${finalScore}.`;
      gameOverGraphic.innerHTML = `<img src="${STATIC_IMAGES.gameOverEscaped}" alt="Escaped Safely!" class="game-over-image">`;
    } else {
      finalScore = 0;
      const goldLost = currentTreasure;
      titleEl.textContent = "You Have Perished!";
      msgEl.innerHTML = `Your adventure in the Deadly Dungeon ended in defeat after ${currentDepth} rooms.<br>You lost ${goldLost} gold.<br>Your final score is ${finalScore}.`;
      gameOverGraphic.innerHTML = `<img src="${STATIC_IMAGES.gameOverPerished}" alt="Player Perished" class="game-over-image">`;
    }

    challengeFinalScoreDisplayEl.textContent = finalScore;
    // High score handling
    const prevHS = loadHighScore();
    if (finalHighScoreEl){ finalHighScoreEl.textContent = `Best Score: ${Math.max(prevHS, finalScore)}`; }
    if (finalScore > prevHS){ saveHighScore(finalScore); if (finalHighScoreBadgeEl){ finalHighScoreBadgeEl.style.display = 'block'; } }
    updateHighScoreDisplays();
    lastFinalScore = finalScore;
    challengeFriendSection.style.display = 'block';
    copyLinkFeedbackMessageEl.style.display = 'none';

    hideBoth();
    hideBoth();
    openDoorButton.style.display = 'none';
    proceedDeeperButton.style.display = 'none';
    if (playerCharacterImageEl) playerCharacterImageEl.style.display = 'none';

    setTimeout(() => {
      if (isSafeExit) { playSound(sfx.celebrate); } else { playSound(sfx.gameover); }
      switchScreen(gameOverScreen);
    }, GAME_OVER_DELAY_MS);
  }

  // Events
if (findOutMoreButton){
  findOutMoreButton.addEventListener('click', () => {
    window.open('https://www.questmentoring.com', '_blank');
  }
);
}
  

if (copyChallengeLinkButton){
  copyChallengeLinkButton.addEventListener('click', async () => {
    try{
      const score = lastFinalScore || 0;
      const fromName = playerName || 'A friend';
      const code = encodeScoreToCode(score, fromName);

      let url = new URL(window.location.href);
      url.pathname = url.pathname.replace(/[^\/]*$/, 'index.html');
      url.search = '';
      // Use code (obfuscated) and include from so recipient sees sender's name.
      url.search = '?' + encodeURIComponent(code) + '&from=' + encodeURIComponent(fromName);
url.searchParams.set('from', fromName);

      await navigator.clipboard.writeText(url.toString());
      if (copyLinkFeedbackMessageEl){
        copyLinkFeedbackMessageEl.textContent = "Challenge link copied! Share it with a friend.";
        copyLinkFeedbackMessageEl.style.display = 'block';
      }
    } catch(e){
      if (copyLinkFeedbackMessageEl){
        copyLinkFeedbackMessageEl.textContent = "Couldn't copy automatically. Try again.";
        copyLinkFeedbackMessageEl.style.display = 'block';
      }
    }
  });
}



  if (goToQuestionsButton){ goToQuestionsButton.addEventListener('click', () => { window.location.href = 'questions.html'; }); }

  submitNameButton.addEventListener('click', () => {
    playSound(sfx.click);
    const name = playerNameInput.value.trim();
    const txt = name || "Brave Adventurer";
    playerName = txt;
    document.getElementById('char-select-player-name').textContent = txt;
    populateCharacterClasses();
    document.getElementById('class-description').textContent = "Select a class to see its description.";
    const rpsPrev = document.getElementById('rps-preview'); if (rpsPrev) rpsPrev.style.display = 'none';
    playerClass = null;
    if (playerCharacterImageEl) playerCharacterImageEl.style.display = 'none';
    if (challengeIncomingMessageEl) challengeIncomingMessageEl.style.display = 'none';
    switchScreen(characterSelectScreen);
  });
  document.getElementById('enter-dungeon-button').addEventListener('click', () => { playSound(sfx.click); initializeGameAndStart(); });
  openDoorButton.addEventListener('click', handleOpenDoor);
  proceedDeeperButton.addEventListener('click', handleProceedDeeper);
  exitDungeonButton.addEventListener('click', handleExitDungeon);
  playAgainButton.addEventListener('click', () => {
    // Reset level state for a brand-new run
    dungeonLevel = 1;
    lastDisplayedLevel = 1;

    playSound(sfx.click);
    playerClass = null;
    document.getElementById('player-name-input').value = playerName;
    document.getElementById('char-select-player-name').textContent = playerName;
    populateCharacterClasses();
    document.getElementById('class-description').textContent = "Select a class to see its description.";
    const rpsPrev = document.getElementById('rps-preview'); if (rpsPrev) rpsPrev.style.display = 'none';
    currentRpsContext.active = false;
    // No reset for total-wins mode
    stairsAvailable = false;
    switchScreen(characterSelectScreen);
  });
  rpsButtons.forEach(btn => btn.addEventListener('click', () => handleRPSChoice(btn.dataset.choice)));

  // Keyboard shortcuts R / P / S
  document.addEventListener('keydown', (e) => {
    if (gameScreen.classList.contains('active') && rpsChoicesDiv.style.display !== 'none'){
      const key = e.key.toLowerCase();
      const map = { 'r':'rock', 'p':'paper', 's':'scissors' };
      if (map[key]){
        const btn = Array.from(rpsButtons).find(b => b.dataset.choice === map[key]);
        if (btn && !btn.disabled) handleRPSChoice(map[key]);
      }
    }
  });

  // Start
  if (playerCharacterImageEl) playerCharacterImageEl.style.display = 'none';
  
  // --- How to Play screen controls ---
  const howToPlayBtn = document.getElementById('how-to-play-button');
  const backToStartBtn = document.getElementById('back-to-start-button');
  if (howToPlayBtn){ howToPlayBtn.addEventListener('click', () => { playSound(sfx.click); switchScreen(document.getElementById('how-to-play-screen')); }); }
  if (backToStartBtn){ backToStartBtn.addEventListener('click', () => { playSound(sfx.click); switchScreen(document.getElementById('start-screen')); }); }
// If someone opened a challenge link (?code=XYZ&from=Name),
// decode the obfuscated code and display the score if plausible (deterrent only)
(async function(){
  try{
    const params = new URLSearchParams(window.location.search);
    const rawSearch = window.location.search.substring(1);
    const firstPart = rawSearch.split('&')[0] || '';
    const codeParam = firstPart ? decodeURIComponent(firstPart) : null;
    const fromParam = params.get('from');
    if (!codeParam || !fromParam || !challengeIncomingMessageEl) return;

    const scoreDecoded = decodeCodeToScore(codeParam, fromParam);
    if (scoreDecoded !== null && Number.isFinite(scoreDecoded) && scoreDecoded >= 0){
      const namePart = fromParam ? `${fromParam} has ` : "Someone has ";
      challengeIncomingMessageEl.textContent = `${namePart}challenged you to beat a score of ${scoreDecoded}`;
      challengeIncomingMessageEl.style.display = 'block';
    } else {
      challengeIncomingMessageEl.textContent = "Unverified challenge link — score hidden.";
      challengeIncomingMessageEl.style.display = 'block';
    }
  }catch(_e){ /* no-op */ }
})();
updateHighScoreDisplays(); // init
switchScreen(startScreen);


  // Player Feedback -> open Google Form in new tab
  const playerFeedbackButton = document.getElementById('player-feedback-button');
  if (playerFeedbackButton){
    playerFeedbackButton.addEventListener('click', () => {
      window.open('https://forms.gle/EZYKCi8dHKTKxwBs9', '_blank');
    });
  }
});
