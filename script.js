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
  const GAME_OVER_DELAY_MS = 3000;
  const MONSTER_ACTION_DISPLAY_SPEED_BASE = 1500;
  const MONSTER_ACTION_DISPLAY_SPEED_DEPTH_FACTOR = 0;
  const ACTION_IMAGE_BLANK_DELAY_MS = 100;
  const RPS_FINAL_LINGER_MS = 200;const BORDER_COLORS = ['#FF6347','#32CD32','#1E90FF','#FFD700','#DA70D6'];
  const MAX_SEQUENCE_LENGTH = 8;
  const ROOMS_PER_LEVEL = 5;

  // Flavor text pools for key encounter states
  const DOOR_FLAVOR_LINES = [
    "A mysterious door awaits...",
    "A heavy door blocks your path.",
    "Another dungeon door looms before you."
  ];

  const STAIRS_FLAVOR_LINES = [
    "A stairway descends to the next level...",
    "You spot stairs leading deeper into the dungeon...",
    "A worn stone staircase twists down into darkness..."
  ];

  const TREASURE_FOUND_LINES = [
    "You find a {name} worth {gold} gold.",
    "You loot a {name} holding {gold} gold.",
    "You discover a {name} containing {gold} gold."
  ];



  // Compute a suitable on-screen duration for a message based on its text length.
  // Strips HTML tags like <br> so markup doesn't affect timing.
  function readableDelayFor(messageText, opts = {}){
    const defaults = { base: 2000, perChar: 45, min: 3000, max: 8000 };
    const cfg = Object.assign({}, defaults, opts || {});
    const plain = (messageText || '').replace(/<[^>]*>/g, '');
    const len = plain.length;
    const raw = cfg.base + len * cfg.perChar;
    return Math.max(cfg.min, Math.min(cfg.max, raw));
  }


  // boss is the 5th room (4 encounters before the boss)
  const BOSS_INTRO_DELAY_MS = 3000; // keep boss intro text visible before actions
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
// === BEGIN: Explicit Level Configuration (Boss + Monsters) ===
const CLASS_MAP = { w:'warrior', r:'rogue', m:'mage' };

const BOSS_INTRO_LINES_BY_NAME = {
  "Minotaur": [
    "The {name} snorts and lowers its horns, ready to charge.",
    "The {name} paws at the ground, eager to trample you.",
    "The {name} stamps the ground, each impact shaking the stone."
  ],
  "Orc Huntress": [
    "The {name} nocks an arrow, eyes gleaming with the thrill of the hunt.",
    "You hear a low chuckle as the {name} draws a bead on you."
  ],
  "Fire Salamander": [
    "The {name} slithers from a pool of lava, embers dancing around it.",
    "Heat rolls off the {name} as flames lick along its scales."
  ],
  "Vampire Countess": [
    "The {name} glides from the shadows, fangs bared in a cold smile.",
    "Candlelight dies as the {name} steps forward, hunger in her eyes."
  ],
  "Beholder": [
    "The {name} floats into view, its many eyes fixing on you at once.",
    "The {name} drifts closer, every eye watching your every move.",
    "A dozen eyes of the {name} flare with strange, alien light."
  ],
  "Hydra": [
    "The {name} rears up, multiple heads hissing in unison.",
    "Each severed head of the {name} seems to regrow as you watch."
  ],
  "Lich King": [
    "The {name} rises, robes billowing with unseen power.",
    "Cold light burns in the eyes of the {name} as it raises its staff."
  ],
  "Demon Overlord": [
    "The {name} strides from a rift of fire, claws scraping the stone.",
    "Chains rattle as the {name} emerges, surrounded by burning sigils."
  ],
  "Green Dragon": [
    "The {name} coils around shattered stone, venomous breath seeping out.",
    "Wings unfurl as the {name} lifts its head and snarls."
  ],
  "Abyssal Horror": [
    "The {name} oozes from the darkness, shapes within it twisting.",
    "Whispers echo in your mind as the {name} takes form."
  ]
};

const BOSS_DEFEAT_LINES_BY_NAME = {
  "Minotaur": [
    "With a final roar, the {name} crashes to the dungeon floor.",
    "The {name} finally falls, shaking the chamber as it hits the stone.",
    "The {name}'s horns gouge stone as it falls, defeated at last."
  ],
  "Orc Huntress": [
    "The {name} drops her bow, vanishing into the dust of the dungeon.",
    "An arrow clatters away as the {name} falls to one knee, then to the ground."
  ],
  "Fire Salamander": [
    "The flames around the {name} sputter out as it collapses.",
    "Steam rises as the {name} hisses one last time and lies still."
  ],
  "Vampire Countess": [
    "The {name} dissolves into mist, leaving only silence behind.",
    "Shadow peels away from the {name} as her form crumbles to ash."
  ],
  "Beholder": [
    "The eyes of the {name} dim one by one before it crashes to the floor.",
    "A final beam sputters from the {name} before its central eye goes dark."
  ],
  "Hydra": [
    "One by one, the heads of the {name} fall limp.",
    "The {name} thrashes wildly before finally lying still."
  ],
  "Lich King": [
    "The {name}'s staff shatters as its armor collapses into a heap.",
    "A ghostly wail escapes the {name} as its magic finally fails."
  ],
  "Demon Overlord": [
    "The {name} staggers back into the shadows, flames guttering out.",
    "Chains fall slack as the {name} lets out a furious, fading roar."
  ],
  "Green Dragon": [
    "The {name} lets out a final, rattling hiss before falling still.",
    "Wings collapse around the {name} as it crashes to the stone."
  ],
  "Abyssal Horror": [
    "The shape of the {name} unravels, melting back into the darkness.",
    "The {name} loses its form entirely, fading into the shadows.",
    "Whispers fall silent as the {name} collapses into nothing."
  ]
};

function pickRandomLine(lines){
  if (!lines || !lines.length) return "";
  return lines[Math.floor(Math.random() * lines.length)];
}


function getFlavorClassId(){
  try {
    if (playerClass && playerClass.id){
      if (playerClass.id === 'warrior' || playerClass.id === 'rogue' || playerClass.id === 'mage'){
        return playerClass.id;
      }
    }
  } catch (_e) {}
  return 'default';
}

const MONSTER_INTRO_LINES_BY_CLASS = {
  warrior: [
    "You raise your shield as the {name} closes in.",
    "Steel rings as you prepare to meet the {name} head-on.",
    "You step forward to meet the {name} without fear."
  ],
  rogue: [
    "You slip into the shadows, studying the {name}'s movements.",
    "Daggers ready, you circle the {name} for an opening.",
    "You stalk the {name}, waiting for the perfect moment."
  ],
  mage: [
    "Arcane energy hums at your fingertips as the {name} appears.",
    "You begin to weave a spell as the {name} lurches into view.",
    "You whisper an incantation as the {name} approaches."
  ],
  default: [
    "You steady yourself as the {name} appears from the darkness.",
    "You ready yourself to face the {name}.",
    "You take a steady breath and confront the {name}."
  ]
};

const TRAP_INTRO_LINES_BY_CLASS = {
  warrior: [
    "You slow your pace, scanning the floor for hidden dangers.",
    "Instinct tells you something is wrong with this section of corridor.",
    "Your gut warns you that this stretch of corridor is dangerous."
  ],
  rogue: [
    "Your eyes catch the slightest disturbance—this place is trapped.",
    "A faint glint and a loose stone tell you a trap lies ahead.",
    "A scuffed flagstone and fine wire hint at a trap."
  ],
  mage: [
    "You feel a prickling in the air—there is magic or mechanism at work here.",
    "Your senses tingle as you detect the subtle pattern of a trap.",
    "Your magic picks up the faint signature of a trap."
  ],
  default: [
    "You notice something odd ahead—a trap waits for the careless.",
    "You tread carefully; there is definitely a trap here.",
    "You slow your steps, knowing a trap waits ahead."
  ]
};

const MONSTER_VICTORY_LINES_BY_CLASS = {
  warrior: [
    "You cut the {name} down in a decisive strike and recover {gold} gold from its corpse.",
    "With a powerful blow you fell the {name}, claiming {gold} gold from its remains.",
    "You drive through the {name}\'s guard and claim {gold} gold from its corpse."
  ],
  rogue: [
    "You outmaneuver the {name}, striking from the shadows and looting {gold} gold.",
    "The {name} never sees the final strike coming; you lighten it of {gold} gold.",
    "One precise strike ends the {name}; you pocket {gold} gold."
  ],
  mage: [
    "Your spell unravels the {name}, leaving behind {gold} gold among the ash.",
    "Arcane force smashes the {name} apart; you gather {gold} gold from the battlefield.",
    "Your magic tears the {name} down; you collect {gold} gold."
  ],
  default: [
    "You defeat the {name} and recover {gold} gold.",
    "The {name} falls, leaving behind {gold} gold for you to collect.",
    "The {name} collapses, and you recover {gold} gold from the scene."
  ]
};

const TRAP_VICTORY_LINES_BY_CLASS = {
  warrior: [
    "You brace yourself and carefully disable the {name}, salvaging {gold} gold from its parts.",
    "With patience and muscle, you render the {name} harmless and pocket {gold} gold.",
    "You strain against the {name} until it is safe, then claim {gold} gold."
  ],
  rogue: [
    "Nimble hands dance across the {name}, disarming it and claiming {gold} gold in hidden compartments.",
    "You deftly disarm the {name}, smiling as you uncover {gold} gold tucked away inside.",
    "You flick your tools through the {name} and reveal {gold} gold."
  ],
  mage: [
    "You disrupt the workings of the {name} with a precise gesture, recovering {gold} gold from its mechanism.",
    "A focused spell unravels the {name}, and you extract {gold} gold from what remains.",
    "Your spell collapses the {name}; you draw out {gold} gold."
  ],
  default: [
    "You carefully disarm the {name} and recover {gold} gold from its mechanism.",
    "With care and focus, you disable the {name}, earning {gold} gold for your trouble.",
    "You take your time with the {name}, and it rewards you with {gold} gold."
  ]
};

const BOSS_INTRO_CLASS_LINES = {
  warrior: [
    "You plant your feet and raise your weapon, ready to stand your ground.",
    "You steel yourself, every muscle tensed for the coming clash."
  ],
  rogue: [
    "You fade toward the edges of the chamber, seeking shadows and openings.",
    "You loosen your stance, ready to dart in and out of danger."
  ],
  mage: [
    "You draw a deep breath as arcane power surges, ready to answer this challenge.",
    "You whisper a spell under your breath, warding yourself as you prepare to strike."
  ],
  default: [
    "You prepare yourself for a desperate battle.",
    "You focus your mind and steady your breathing for the fight ahead."
  ]
};

const BOSS_VICTORY_CLASS_LINES = {
  warrior: [
    "You stand firm amidst the settling dust, weapon still at the ready.",
    "Breathing hard, you lower your weapon, victorious but wary of what lies ahead."
  ],
  rogue: [
    "You slip your weapons away, already scanning for the next opportunity.",
    "You melt back into the gloom, another trophy added to your silent legend."
  ],
  mage: [
    "You let the last sparks of magic fade from your hands, mind already turning to the next challenge.",
    "You steady your breathing as the lingering glow of your spellwork fades."
  ],
  default: [
    "You take a moment to catch your breath and take stock.",
    "You stand victorious, but the dungeon still presses in around you."
  ]
};

function buildMonsterIntroText(opponentName){
  const cls = getFlavorClassId();
  const lines = MONSTER_INTRO_LINES_BY_CLASS[cls] || MONSTER_INTRO_LINES_BY_CLASS.default;
  return pickRandomLine(lines).replace("{name}", opponentName);
}

function buildTrapIntroText(opponentName){
  const cls = getFlavorClassId();
  const lines = TRAP_INTRO_LINES_BY_CLASS[cls] || TRAP_INTRO_LINES_BY_CLASS.default;
  return pickRandomLine(lines).replace("{name}", opponentName);
}

function buildBossIntroText(opponentName){
  const baseLines = BOSS_INTRO_LINES_BY_NAME[opponentName];
  let base;
  if (!baseLines || !baseLines.length){
    base = `A powerful foe approaches: ${opponentName}!`;
  } else {
    base = pickRandomLine(baseLines).replace("{name}", opponentName);
  }
  // Shorter boss intro: keep a single strong line for mobile
  return base;
}


function buildMonsterVictoryText(opponentName, gold){
  const cls = getFlavorClassId();
  const lines = MONSTER_VICTORY_LINES_BY_CLASS[cls] || MONSTER_VICTORY_LINES_BY_CLASS.default;
  return pickRandomLine(lines).replace("{name}", opponentName).replace("{gold}", gold);
}

function buildTrapVictoryText(opponentName, gold){
  const cls = getFlavorClassId();
  const lines = TRAP_VICTORY_LINES_BY_CLASS[cls] || TRAP_VICTORY_LINES_BY_CLASS.default;
  return pickRandomLine(lines).replace("{name}", opponentName).replace("{gold}", gold);
}

function buildBossVictoryText(opponentName, gold, multiplier){
  const specific = BOSS_DEFEAT_LINES_BY_NAME[opponentName];
  let flavor;
  if (specific && specific.length){
    flavor = pickRandomLine(specific).replace("{name}", opponentName);
  } else {
    flavor = `You bring down ${opponentName} in a hard-fought battle.`;
  }
  // Shorter victory line for bosses on mobile
  return `${flavor} You gain ${gold} gold (×${multiplier} boss reward).`;
}
// Each level: boss {name, cls}, monsters: [{name, image, cls}]
const LEVEL_CONFIG = {
  1: {
    boss: { name: "Minotaur", cls: "w" },
    monsters: [
      { name: "Cave Bat", image: "cave_bat.png", cls: "w" },
      { name: "Dire Wolf", image: "dire_wolf.png", cls: "w" },
      { name: "Giant Spider", image: "giant_spider.png", cls: "r" },
    ]
  },
  2: {
    boss: { name: "Orc Huntress", cls: "r" },
    monsters: [
      { name: "Goblin", image: "goblin.png", cls: "r" },
      { name: "Goblin Shamen", image: "goblin_shamen.png", cls: "m" },
      { name: "Orc", image: "orc.png", cls: "w" },
    ]
  },
  3: {
    boss: { name: "Fire Salamander", cls: "w" },
    monsters: [
      { name: "Slime", image: "slime.png", cls: "w" },
      { name: "Silent Fang", image: "silent_fang.png", cls: "r" },
      { name: "Mimic", image: "mimic.png", cls: "w" },
    ]
  },
  4: {
    boss: { name: "Vampire Countess", cls: "m" },
    monsters: [
      { name: "Ghoul", image: "ghoul.png", cls: "r" },
      { name: "Zombie", image: "zombie.png", cls: "w" },
      { name: "Were Wolf", image: "were_wolf.png", cls: "w" },
    ]
  },
  5: {
    boss: { name: "Beholder", cls: "m" },
    monsters: [
      { name: "Cyclops", image: "cyclops.png", cls: "w" },
      { name: "Golem", image: "golem.png", cls: "w" },
      { name: "Troll", image: "troll.png", cls: "r" },
    ]
  },
  6: {
    boss: { name: "Hydra", cls: "w" },
    monsters: [
      { name: "Giant Lizard", image: "giant_lizard.png", cls: "w" },
      { name: "Manticore", image: "manticore.png", cls: "r" },
      { name: "Serpent Assassin", image: "serpent_assassin.png", cls: "r" },
    ]
  },
  7: {
    boss: { name: "Lich King", cls: "m" },
    monsters: [
      { name: "Death Knight", image: "death_knight.png", cls: "w" },
      { name: "Skeleton", image: "skeleton.png", cls: "w" },
      { name: "Restless Ghost", image: "restless_ghost.png", cls: "m" },
    ]
  },
  8: {
    boss: { name: "Demon Overlord", cls: "r" },
    monsters: [
      { name: "Hell Hound", image: "hell_hound.png", cls: "w" },
      { name: "Impish Demon", image: "impish_demon.png", cls: "r" },
      { name: "Wraith", image: "wraith.png", cls: "m" },
    ]
  },
  9: {
    boss: { name: "Green Dragon", cls: "w" },
    monsters: [
      { name: "Lizard Warrior", image: "lizard_warrior.png", cls: "w" },
      { name: "Young Dragon", image: "young_dragon.png", cls: "w" },
      { name: "Rune Drake", image: "rune_drake.png", cls: "m" },
    ]
  },
  10: {
    boss: { name: "Abyssal Horror", cls: "r" },
    monsters: [
      { name: "Void Sentinal", image: "void_sentinal.png", cls: "w" },
      { name: "Mind Leech", image: "mind_leech.png", cls: "r" },
      { name: "Mind Flayer", image: "mind_flayer.png", cls: "m" },
    ]
  }
}

const BOSS_IMAGE_MAP = {
  1: "images/monsters/boss1_minotaur.png",
  2: "images/monsters/boss2_orc_huntress.png",
  3: "images/monsters/boss3_fire_salamander.png",
  4: "images/monsters/boss4_vampire_countess.png",
  5: "images/monsters/boss5_beholder.png",
  6: "images/monsters/boss6_hydra.png",
  7: "images/monsters/boss7_lich_king.png",
  8: "images/monsters/boss8_demon_overlord.png",
  9: "images/monsters/boss9_green_dragon.png",
  10: "images/monsters/boss10_abyssal_horror.png"
};



function resetBossLevelOrder(){
  // Build a shuffled list of the configured level IDs (1..10)
  const levels = Object.keys(LEVEL_CONFIG).map(n => parseInt(n, 10)).sort((a,b) => a - b);
  for (let i = levels.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = levels[i];
    levels[i] = levels[j];
    levels[j] = tmp;
  }
  bossLevelOrder = levels;
}

function getEffectiveLevelIdForDungeonLevel(level){
  // Map the visible dungeon level (1..N) to a shuffled LEVEL_CONFIG key.
  if (!bossLevelOrder || !bossLevelOrder.length) return level;
  const idx = Math.max(0, Math.min(level - 1, bossLevelOrder.length - 1));
  return bossLevelOrder[idx];
}

// For debugging, you could log bossLevelOrder when a run starts.
// console.log('Boss order this run:', bossLevelOrder);

;

// Return a normalized monster object using MONSTER_TYPES if available (to preserve stats).
function buildMonsterFromConfig(cfgMon){
  const fullCls = CLASS_MAP[cfgMon.cls] || 'warrior';
  const mt = MONSTER_TYPES.find(m => m.name === cfgMon.name);
  if (mt){
    // Merge: prefer config image/class if provided; keep base stats from data
    return Object.assign({}, mt, {
      imagePath: `images/monsters/${cfgMon.image}`,
      monsterClass: fullCls
    });
  }
  // Fallback generic stats if monster not pre-defined
  return {
    name: cfgMon.name,
    imagePath: `images/monsters/${cfgMon.image}`,
    baseDamageMin: 4,
    baseDamageMax: 9,
    depthDamageFactor: 1.2,
    monsterClass: fullCls
  };
}

function getConfiguredMonstersForLevel(level){
  const mappedLevel = getEffectiveLevelIdForDungeonLevel(level);
  const cfg = LEVEL_CONFIG[mappedLevel];
  if (!cfg || !cfg.monsters) return [];
  return cfg.monsters.map(buildMonsterFromConfig);
}
// === END: Explicit Level Configuration (Boss + Monsters) ===


// === Level-based monster spawn configuration (REPLACED by LEVEL_CONFIG) ===
function getMonstersForLevel(level){
  try{ return getConfiguredMonstersForLevel(level); }catch(e){ return []; }
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
  let bossLevelOrder = [];

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
  resetBossLevelOrder();
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
    if (musicDungeon) { musicDungeon.volume = 0.8; playSound(musicDungeon); }
    switchScreen(gameScreen);
    showActionButtons();
  }

  function presentNewDoor(){
    try{document.getElementById('encounter-graphic').classList.remove('defeated');}catch(_e){}

    encounterGraphic.innerHTML = `<img src="${stairsAvailable ? STATIC_IMAGES.stairs : STATIC_IMAGES.door}" alt="${stairsAvailable ? 'Stairs' : 'Mysterious Door'}" class="encounter-image">`;
    encounterMessage.textContent = stairsAvailable ? pickRandomLine(STAIRS_FLAVOR_LINES) : pickRandomLine(DOOR_FLAVOR_LINES);
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
    document.getElementById('stat-class').textContent = (playerClass ? ({warrior:'W',rogue:'R',mage:'M'}[playerClass.id] || '') : '');
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
  // Take stairs: pause briefly before moving to the next level start
  playSound(sfx.stairs);
  // brief UI lock + message
  openDoorButton.disabled = true;
  proceedDeeperButton.style.display = 'none';
  exitDungeonButton.style.display = 'none';
  encounterMessage.textContent = "You descend the stairs...";

  const stairsDelay = readableDelayFor(encounterMessage.textContent, { base: 1800, perChar: 40, min: 3000, max: 6000 });

  setTimeout(() => {
    stairsAvailable = false;
    dungeonLevel += 1;
    presentNewDoor();
    updateLevelBanner();
    openDoorButton.disabled = false;
  }, stairsDelay);

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
        const mappedLevel = getEffectiveLevelIdForDungeonLevel(level);
        const _bcfg = (LEVEL_CONFIG[mappedLevel] && LEVEL_CONFIG[mappedLevel].boss) || {name:`Unknown Boss`, cls:'w'};
        currentRpsContext.opponentClass = CLASS_MAP[_bcfg.cls] || 'warrior';
        opp = {
          name: _bcfg.name,
          imagePath: BOSS_IMAGE_MAP[mappedLevel] || `images/monsters/boss${mappedLevel}.png`,
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
        const pick = (pool && pool.length ? pool : []);
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

    if (type === 'monster'){
      const intro = buildMonsterIntroText(opp.name);
      encounterMessage.textContent = intro;
      const delay = readableDelayFor(intro, { base: 2000, perChar: 40, min: 3200, max: 7500 });
      setTimeout(() => { if (currentRpsContext.active) displayOpponentAction(); }, delay);
    } else if (type === 'trap'){
      const intro = buildTrapIntroText(opp.name);
      encounterMessage.textContent = intro;
      const delay = readableDelayFor(intro, { base: 2000, perChar: 40, min: 3200, max: 7500 });
      setTimeout(() => { if (currentRpsContext.active) displayOpponentAction(); }, delay);
    } else {
      // Themed boss intro with class flavor
      const intro = buildBossIntroText(opp.name);
      encounterMessage.textContent = intro;
      const delay = readableDelayFor(intro, { base: 2500, perChar: 50, min: 4000, max: 9000 });
      setTimeout(() => { if (currentRpsContext.active) displayOpponentAction(); }, delay);
    }
  }

    function formatMonsterSuccess(step, total){
    const lines = [
      `Nice counter! Next move (${step + 1}/${total}).`,
      `Good block! Next move (${step + 1}/${total}).`,
      `Well played! Next move (${step + 1}/${total}).`
    ];
    return pickRandomLine(lines);
  }

  function formatTrapSuccess(step, total){
    const lines = [
      `Trap avoided. Next step (${step + 1}/${total}).`,
      `Still safe. Next step (${step + 1}/${total}).`,
      `Careful... next step (${step + 1}/${total}).`
    ];
    return pickRandomLine(lines);
  }

  function formatBossMidSuccess(step, total){
    const lines = [
      `Good hit! Next move (${step + 1}/${total}).`,
      `You press the attack! Next move (${step + 1}/${total}).`,
      `You land a blow! Next move (${step + 1}/${total}).`
    ];
    return pickRandomLine(lines);
  }

  function formatMonsterFail(damage){
    const lines = [
      `FAIL! You take ${damage} damage.`,
      `You get hit and lose ${damage} health.`,
      `${damage} damage! That one hurts.`
    ];
    return pickRandomLine(lines);
  }

  function formatTrapFail(name, damage){
    const lines = [
      `OOPS! The ${name} triggers! You take ${damage} damage.`,
      `The ${name} goes off! You suffer ${damage} damage.`,
      `${name} triggers! You take ${damage} damage.`
    ];
    return pickRandomLine(lines);
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
          encounterMessage.innerHTML = buildMonsterVictoryText(currentRpsContext.opponentData.name, t);
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
        if (playerHealth <= 0) finalizeCombatSequence(false); else { setTimeout(() => restartCurrentCombat(), 3000); }
      }
    } else if (currentRpsContext.type === 'trap'){
      if (outcome === 'win'){
        currentRpsContext.playerCurrentSequenceStep++;
        if (currentRpsContext.playerCurrentSequenceStep === currentRpsContext.opponentActionSequence.length){
          playSound(sfx.trapDisarm);
          const baseGold = Math.floor((Math.random()*(15 + currentDepth*3) + (10 + currentDepth)) * 0.35);
          currentTreasure += baseGold; 
          playSound(sfx.treasure);
          const msg = buildTrapVictoryText(currentRpsContext.opponentData.name, baseGold);
          encounterMessage.innerHTML = msg; 
          updatePlayerStats();
          finalizeCombatSequence(true, {autoProceed:true});
        } else {
          encounterMessage.innerHTML = `Careful... Next step to go (${currentRpsContext.playerCurrentSequenceStep + 1}/${currentRpsContext.opponentActionSequence.length}).`;
          rpsButtons.forEach(btn => btn.disabled = false);
          markRpsReady(true);
        }
      } else {
        playSound(sfx.trapTrigger);
        playSound(sfx.playerHit);
        takeDamage(currentRpsContext.opponentBaseDamage);
        encounterMessage.innerHTML = formatTrapFail(currentRpsContext.opponentData.name, currentRpsContext.opponentBaseDamage);
        if (playerHealth <= 0){ 
          finalizeCombatSequence(false); 
        } else { 
          finalizeCombatSequence(true, {autoProceed:true}); 
        }
      }
    }
    else if (currentRpsContext.type === 'boss'){
      if (outcome === 'win'){
        currentRpsContext.playerCurrentSequenceStep++;
        if (currentRpsContext.playerCurrentSequenceStep === currentRpsContext.opponentActionSequence.length){
          currentRpsContext.bossCurrentStreak = (currentRpsContext.bossCurrentStreak || 0) + 1;
            function formatBossStagger(name, current, required){
    const lines = [
      `You stagger the ${name}! Defeats: ${current}/${required}. Prepare for the next assault...`,
      `The ${name} reels! Defeats: ${current}/${required}. Ready yourself for the next clash...`,
      `You drive the ${name} back! Defeats: ${current}/${required}. The battle isn’t over yet...`
    ];
    return pickRandomLine(lines);
  }

if (currentRpsContext.bossCurrentStreak >= currentRpsContext.bossRequiredStreak){
            playSound(sfx.playerWinRPS);
            const bossTreasure = gainMonsterTreasure(BOSS_REWARD_MULTIPLIER);
            playSound(sfx.treasure);
            encounterMessage.innerHTML = buildBossVictoryText(currentRpsContext.opponentData.name, bossTreasure, BOSS_REWARD_MULTIPLIER);
            
            // Mage passive: full heal after boss victory
            if (playerClass && playerClass.id === 'mage') {
              playerHealth = playerMaxHealth;
              updatePlayerStats();
              try { encounterMessage.innerHTML += " Your magic restores your full health!"; } catch (_e) {}
            }
            // No reset for total-wins mode
            // After boss: show stairs state, but keep victory text visible
            try{
              const encWrap = document.getElementById('encounter-graphic');
              if (encWrap){
                encWrap.classList.remove('defeated');
                encWrap.classList.add('defeated'); // show gold cross
              }
            }catch(_e){}

            // Compute a readable delay based on the full boss victory message
            let bossVictoryDelay = 4500;
            try{
              const victoryMsg = encounterMessage ? (encounterMessage.textContent || encounterMessage.innerHTML || '') : '';
              bossVictoryDelay = readableDelayFor(victoryMsg, {
                base: 2500,
                perChar: 40,
                min: 4000,
                max: 8000
              });
            }catch(_e){}

            setTimeout(() => {
              try{
                const encWrap = document.getElementById('encounter-graphic');
                if (encWrap){
                  encWrap.classList.remove('boss-defeated','defeated'); // clear overlays
                }
              }catch(_e){}
              /* If level 10 boss beaten, trigger escape end */
              if (getDungeonLevel() >= 10) {
                finalizeCombatSequence(true, {});
                setTimeout(() => endGame(true), 1200);
                return;
              }
              stairsAvailable = true;
              finalizeCombatSequence(true, {showStairs:true});
            }, bossVictoryDelay);
          } else {
            playSound(sfx.playerWinRPS);
            encounterMessage.innerHTML = formatBossStagger(currentRpsContext.opponentData.name, currentRpsContext.bossCurrentStreak, currentRpsContext.bossRequiredStreak);
            setTimeout(() => {
              const level = getDungeonLevel();
              const seqLen = Math.min(level, MAX_SEQUENCE_LENGTH);
              currentRpsContext.opponentActionSequence = Array.from({length: seqLen}, () => ['rock','paper','scissors'][Math.floor(Math.random()*3)]);
              currentRpsContext.playerCurrentSequenceStep = 0;
              // Fixed delay so boss stagger text is readable but doesn't hang
              restartCurrentCombat();
            }, 4200);
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
        if (playerHealth <= 0){ finalizeCombatSequence(false); } else { setTimeout(() => restartCurrentCombat(), 3000); }
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
      setTimeout(() => img.classList.remove('lunge-fail'), 3000);
    }
  } catch(_e) {}

  try {
    const enc = document.getElementById('encounter-graphic');
    if (enc) {
      enc.classList.add('flash-fail');
      setTimeout(() => enc.classList.remove('flash-fail'), 3000);
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

      const autoMsg = encounterMessage ? (encounterMessage.textContent || encounterMessage.innerHTML || '') : '';
      const autoDelay = readableDelayFor(autoMsg, { base: 2000, perChar: 35, min: 3500, max: 7000 });

      setTimeout(() => { presentNewDoor(); }, autoDelay);
      return;
    }

    if (playerHealth <= 0){ endGame(false); return; }

    if (isSafeOutcome){
      showActionButtons();
      showActionButtons();
      if (opts.showStairs){
      /*__BOSS_MUSIC_END_ON_STAIRS__*/
      try{ if (musicBoss) fadeOutAudio(musicBoss, 1000); }catch(_e){}
      try{ setTimeout(() => { if (musicDungeon){ musicDungeon.volume = 0.8; const _p = musicDungeon.play(); if (_p) _p.catch(()=>{}); } }, 3000); }catch(_e){}
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
      titleEl.textContent = "You Escaped";
      msgEl.innerHTML = `You escaped Level ${dungeonLevel} after ${currentDepth} rooms with ${currentTreasure} gold.<br>Final score: ${finalScore}.`;
      gameOverGraphic.innerHTML = `<img src="${STATIC_IMAGES.gameOverEscaped}" alt="Escaped Safely!" class="game-over-image">`;
    } else {
      finalScore = 0;
      const goldLost = currentTreasure;
      titleEl.textContent = "You Have Perished!";
      msgEl.innerHTML = `You fell after ${currentDepth} rooms on Level ${dungeonLevel}.<br>You lost ${goldLost} gold. Final score: ${finalScore}.`;
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
        const successLines = [
          "Challenge link copied! Share it with a friend.",
          "Link copied! Send it to someone brave enough.",
          "Done! Your challenge link is ready to share."
        ];
        copyLinkFeedbackMessageEl.textContent = pickRandomLine(successLines);
        copyLinkFeedbackMessageEl.style.display = 'block';
      }
    } catch(e){
      if (copyLinkFeedbackMessageEl){
        const failLines = [
          "Couldn't copy automatically. Try again.",
          "Copy failed. You may need to paste manually.",
          "That didn't copy. Try once more."
        ];
        copyLinkFeedbackMessageEl.textContent = pickRandomLine(failLines);
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
    resetBossLevelOrder();

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
