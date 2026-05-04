import Phaser from 'phaser';

let player = {
    gold: 300,
    strength: 10,
    hp: 90,
    maxHp: 90,
    ap: 100,
    maxAp: 100,
    level: 1,
    floor: 1,
    className: 'warrior',
    weapon: null,
    armor: null,
    weaponBonus: 0,
    armorBonus: 0
};

let currentEnemy = null;
let waitingForAction = true;
let log = [];
let gameScene = null;

// Магазин предметов
const shopItems = {
    weapon: { name: "🍺 Пивная дубина", cost: 120, bonus: { strength: 5 }, owned: false },
    armor: { name: "🛡️ Кожаная броня", cost: 100, bonus: { hp: 20 }, owned: false }
};

function addLog(msg) {
    log.unshift(msg);
    if (log.length > 6) log.pop();
    if (gameScene) gameScene.logText.setText(log.join('\n'));
}

function updateUI() {
    if (!gameScene) return;
    let totalStrength = player.strength + player.weaponBonus;
    let totalHp = player.maxHp + player.armorBonus;
    gameScene.playerStats.setText([
        `🍺 ${Math.floor(player.gold)}   ⚔️ ${totalStrength}`,
        `❤️ ${player.hp}/${totalHp}   💙 ${player.ap}/${player.maxAp}`,
        `📈 lvl ${player.level}   🏔️ этаж ${player.floor}`
    ]);
    if (currentEnemy) {
        let percent = (currentEnemy.hp / currentEnemy.maxHp) * 100;
        gameScene.hpBar.width = 200 * (percent / 100);
        if (gameScene.hpBar.width < 0) gameScene.hpBar.width = 0;
        gameScene.enemyText.setText(`${currentEnemy.name}\n❤️ ${Math.floor(currentEnemy.hp)}/${currentEnemy.maxHp}`);
    }
    let apPercent = (player.ap / player.maxAp) * 100;
    gameScene.apBar.width = 200 * (apPercent / 100);
}

function victory() {
    player.gold += currentEnemy.gold;
    player.ap = Math.min(player.maxAp, player.ap + 20);
    addLog(`🏆 ПОБЕДА! +${currentEnemy.gold}🍺   +20 AP`);
    player.floor++;
    startBattle();
    updateUI();
    saveGame();
}

function startBattle() {
    let enemies = [
        { name: "🍺 Пиво", hp: 55, damage: 8, gold: 30, exp: 25 },
        { name: "🛢️ Бочка", hp: 80, damage: 10, gold: 45, exp: 40 },
        { name: "💪 Вышибала", hp: 110, damage: 13, gold: 65, exp: 60 }
    ];
    let idx = Math.floor(Math.random() * enemies.length);
    let e = enemies[idx];
    let isBoss = (player.floor % 5 === 0);
    if (isBoss) {
        currentEnemy = { name: "👑 БОСС", hp: 180, maxHp: 180, damage: 18, gold: 150, exp: 100 };
    } else {
        currentEnemy = { name: e.name, hp: e.hp, maxHp: e.hp, damage: e.damage, gold: e.gold, exp: e.exp };
    }
    waitingForAction = true;
    addLog(`Противник: ${currentEnemy.name}`);
    updateUI();
}

function attack() {
    if (!waitingForAction) { addLog(`Дождись хода!`); return; }
    if (player.ap < 15) { addLog(`❌ Нет AP (нужно 15)`); return; }
    player.ap -= 15;
    let totalStrength = player.strength + player.weaponBonus;
    let dmg = totalStrength + Math.floor(Math.random() * 8);
    let msg = `⚔️ Удар! ${dmg} урона`;
    if (player.className === 'warrior' && Math.random() < 0.3) { dmg = Math.floor(dmg * 1.6); msg = `💢 КРИТ ВОИНА! ${dmg} урона`; }
    if (player.className === 'rogue') { dmg = Math.floor(dmg * 1.2 + Math.random() * 8); msg = `🗡️ Удар вора! ${dmg} урона`; }
    currentEnemy.hp -= dmg;
    addLog(msg);
    if (currentEnemy.hp <= 0) { victory(); return; }
    waitingForAction = false;
    updateUI();
    setTimeout(enemyTurn, 800);
}

function skill() {
    if (!waitingForAction) { addLog(`Дождись хода!`); return; }
    if (player.ap < 30) { addLog(`❌ Нужно 30 AP`); return; }
    player.ap -= 30;
    let totalStrength = player.strength + player.weaponBonus;
    let dmg = totalStrength + Math.floor(Math.random() * 20) + 15;
    let msg = `✨ ОСОБЫЙ УДАР! ${dmg} урона`;
    if (player.className === 'mage') msg = `🧙 МАГ: Огненный шар — ${dmg} урона!`;
    if (player.className === 'warrior') msg = `⚔️ ВОИН: Сокрушитель — ${dmg} урона!`;
    if (player.className === 'rogue') msg = `🗡️ ВОР: Танец клинков — ${dmg} урона!`;
    currentEnemy.hp -= dmg;
    addLog(msg);
    if (currentEnemy.hp <= 0) { victory(); return; }
    waitingForAction = false;
    updateUI();
    setTimeout(enemyTurn, 600);
}

function enemyTurn() {
    if (currentEnemy.hp <= 0) return;
    let dmg = currentEnemy.damage;
    player.hp -= dmg;
    addLog(`😖 ${currentEnemy.name} атакует! -${dmg} HP`);
    if (player.hp <= 0) {
        addLog(`💀 Поражение! -30 золота`);
        player.gold = Math.max(0, player.gold - 30);
        player.hp = player.maxHp + player.armorBonus;
        player.ap = player.maxAp;
        startBattle();
    }
    waitingForAction = true;
    updateUI();
    saveGame();
}

function openShop() {
    let msg = `🛒 МАГАЗИН\n💰 Золото: ${player.gold}\n`;
    if (!shopItems.weapon.owned) msg += `\n${shopItems.weapon.name} +${shopItems.weapon.bonus.strength}⚔️ — ${shopItems.weapon.cost}🍺 (нажми W)`;
    if (!shopItems.armor.owned) msg += `\n${shopItems.armor.name} +${shopItems.armor.bonus.hp}❤️ — ${shopItems.armor.cost}🍺 (нажми A)`;
    msg += `\n\nЗакрыть магазин — ESC`;
    addLog(msg);
    gameScene.shopActive = true;
}

function buyItem(type) {
    if (type === 'weapon' && !shopItems.weapon.owned && player.gold >= shopItems.weapon.cost) {
        player.gold -= shopItems.weapon.cost;
        player.weaponBonus = shopItems.weapon.bonus.strength;
        shopItems.weapon.owned = true;
        addLog(`✅ Куплена ${shopItems.weapon.name}! +${shopItems.weapon.bonus.strength} силы`);
    } else if (type === 'armor' && !shopItems.armor.owned && player.gold >= shopItems.armor.cost) {
        player.gold -= shopItems.armor.cost;
        player.armorBonus = shopItems.armor.bonus.hp;
        player.hp += shopItems.armor.bonus.hp;
        shopItems.armor.owned = true;
        addLog(`✅ Куплена ${shopItems.armor.name}! +${shopItems.armor.bonus.hp} HP`);
    } else {
        addLog(`❌ Не хватает золота или уже куплено`);
    }
    updateUI();
    saveGame();
}

function saveGame() {
    let save = {
        gold: player.gold, strength: player.strength, hp: player.hp, maxHp: player.maxHp,
        ap: player.ap, maxAp: player.maxAp, level: player.level, floor: player.floor,
        className: player.className, weaponBonus: player.weaponBonus, armorBonus: player.armorBonus,
        weaponOwned: shopItems.weapon.owned, armorOwned: shopItems.armor.owned
    };
    localStorage.setItem('beerSave', JSON.stringify(save));
}

function loadGame() {
    let save = localStorage.getItem('beerSave');
    if (save) {
        try {
            let data = JSON.parse(save);
            for (let k in data) player[k] = data[k];
            shopItems.weapon.owned = data.weaponOwned || false;
            shopItems.armor.owned = data.armorOwned || false;
        } catch(e) {}
    }
    startBattle();
    updateUI();
}

function setClass(className) {
    player.className = className;
    saveGame();
    addLog(`🎭 Класс изменён на ${className === 'mage' ? 'МАГ' : className === 'warrior' ? 'ВОИН' : 'ВОР'}`);
}

function createClassButtons(scene) {
    let bg = scene.add.rectangle(550/2, 480, 500, 70, 0x000000, 0.7).setOrigin(0.5);
    let btnW = scene.add.rectangle(200, 480, 100, 40, 0xb57c34).setInteractive();
    let btnM = scene.add.rectangle(350, 480, 100, 40, 0xb57c34).setInteractive();
    let btnR = scene.add.rectangle(500, 480, 100, 40, 0xb57c34).setInteractive();
    scene.add.text(200, 480, 'ВОИН', { fontSize: '16px', fill: '#2c1f0c' }).setOrigin(0.5);
    scene.add.text(350, 480, 'МАГ', { fontSize: '16px', fill: '#2c1f0c' }).setOrigin(0.5);
    scene.add.text(500, 480, 'ВОР', { fontSize: '16px', fill: '#2c1f0c' }).setOrigin(0.5);
    btnW.on('pointerdown', () => setClass('warrior'));
    btnM.on('pointerdown', () => setClass('mage'));
    btnR.on('pointerdown', () => setClass('rogue'));
}

const config = {
    type: Phaser.AUTO,
    width: 700,
    height: 700,
    backgroundColor: '#221c0e',
    scene: { preload, create, update }
};

function preload() { }
function create() {
    gameScene = this;
    this.playerStats = this.add.text(20, 20, '', { fontSize: '14px', fill: '#ffeaad', fontFamily: 'monospace' });
    this.enemyText = this.add.text(350, 160, '', { fontSize: '20px', fill: '#fff0cf', align: 'center', fontFamily: 'bold' }).setOrigin(0.5);
    let hpBg = this.add.rectangle(350, 250, 200, 12, 0x895e32).setOrigin(0.5);
    this.hpBar = this.add.rectangle(350, 250, 200, 10, 0xe34d2b).setOrigin(0.5);
    let apBg = this.add.rectangle(350, 275, 200, 10, 0x6b4c2c).setOrigin(0.5);
    this.apBar = this.add.rectangle(350, 275, 200, 8, 0x4dabf7).setOrigin(0.5);
    this.logText = this.add.text(20, 320, '', { fontSize: '12px', fill: '#ffeecc', fontFamily: 'monospace' });
    
    let attackZone = this.add.rectangle(140, 620, 160, 50, 0xe7a13a, 0.9).setInteractive();
    let skillZone = this.add.rectangle(320, 620, 160, 50, 0xb57c34, 0.9).setInteractive();
    let restZone = this.add.rectangle(500, 620, 160, 50, 0x8b5a2b, 0.9).setInteractive();
    let shopZone = this.add.rectangle(80, 620, 100, 40, 0x4d7c3b, 0.9).setInteractive();
    this.add.text(140, 620, '⚔️ АТАКА', { fontSize: '16px', fill: '#2c1f0c', fontFamily: 'bold' }).setOrigin(0.5);
    this.add.text(320, 620, '✨ ОСОБЫЙ УДАР', { fontSize: '14px', fill: '#2c1f0c', fontFamily: 'bold' }).setOrigin(0.5);
    this.add.text(500, 620, '😴 ОТДЫХ (+20 AP)', { fontSize: '14px', fill: '#2c1f0c', fontFamily: 'bold' }).setOrigin(0.5);
    this.add.text(80, 620, '🛒 МАГАЗИН', { fontSize: '12px', fill: '#fff', fontFamily: 'bold' }).setOrigin(0.5);
    
    attackZone.on('pointerdown', attack);
    skillZone.on('pointerdown', skill);
    restZone.on('pointerdown', () => {
        if (waitingForAction) {
            player.ap = Math.min(player.maxAp, player.ap + 20);
            addLog(`😴 Отдых! +20 AP`);
            waitingForAction = false;
            updateUI();
            setTimeout(enemyTurn, 600);
        } else addLog(`Сейчас нельзя отдыхать`);
    });
    shopZone.on('pointerdown', openShop);
    
    createClassButtons(this);
    
    loadGame();
    updateUI();
}
function update() {
    if (gameScene && gameScene.shopActive) {
        this.input.keyboard.once('keydown-W', () => buyItem('weapon'));
        this.input.keyboard.once('keydown-A', () => buyItem('armor'));
        this.input.keyboard.once('keydown-ESC', () => { gameScene.shopActive = false; addLog(`Магазин закрыт`); });
    }
}

const game = new Phaser.Game(config);