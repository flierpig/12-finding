// --- 全局状态变量 ---
let player = null, enemy = null;
let gold = 0;
let bossPool = [];
let turn = 1, battleTimer = null;
let speedMode = 1; 
let duckJunEncountered = false;
let duckJunDefeatedThisRound = false;
let pDodges = 0, pHitsTaken = 0, pCrits = 0, ePoisonTicks = 0;
let ultUsedThisFloor = false; // 保留：每场战斗/每个节点可放一次终结技
let battleActive = false;

// 大地图事件进度
let currentNodeId = 'start';
let defeatedBosses = [];
let visitedNodes = [];
let currentNode = null; // 当前节点缓存

// 联动特殊变量
let ownedItems = []; 
let sosoDanceInterval = 3; let hasSosoUltItem = false; let zhougeSelfDmgStreak = 0; let zhougeUltActive = false; 
let fastFood15Active = false; let hasFushunItem = false; let fushunBattles = 0; let fushunPermanent = false; let fushunLastImmuneTurn = -99;

// --- 镇镇之力系统变量 ---
let currentZhenZhen = '';
let zhenZhenUnlocked = false;
let zhenZhenUsedThisFloor = false;
let badRngCount = 0;
let luckZhenZhenActive = false, critZhenZhenActive = false, immortalZhenZhenActive = false, overloadZhenZhenActive = false;
let overloadAtkBonus = 0, overloadHpBonus = 0;

// --- 冰原网格地图变量 ---
let snowGrid = null;
let snowGridPos = { r: 0, c: 0 };
let snowGridInEvent = false;
let currentSnowEvent = null; // 当前触发的事件缓存

const show = (id) => document.getElementById(id).classList.remove('hidden');
const hide = (id) => document.getElementById(id).classList.add('hidden');

// --- 初始化与图鉴构建 ---
window.onload = () => {
    const grid = document.getElementById('char-grid');
    for(let key in baseCharData) {
        let c = baseCharData[key];
        let card = document.createElement('div');
        card.className = 'char-card';
        let badgeHtml = c.badge ? `<div class="collab-badge ${c.badge}">${c.badgeTxt}</div>` : '';
        card.innerHTML = `${badgeHtml}<div class="char-icon">${c.icon}</div><div class="char-name">${c.name}</div><div class="char-desc">${c.desc}</div><div class="char-ult">${c.ultDesc}</div>`;
        card.onclick = () => initGame(key);
        grid.appendChild(card);
    }
    buildPokedex();
};

function buildPokedex() {
    let charDiv = document.getElementById('dex-chars');
    for(let k in baseCharData) {
        let c = baseCharData[k];
        charDiv.innerHTML += `<div class="char-card" style="cursor:default; text-align:left;">
            <div style="font-size:24px;">${c.icon} <span class="char-name">${c.name}</span></div>
            <div class="char-desc" style="margin-top:10px;"><b>初始:</b> HP ${c.maxHp} | ATK ${c.atk} | 速度 ${c.speed}</div>
            <div class="char-desc">${c.desc}</div><div class="char-ult">${c.ultDesc}</div>
        </div>`;
    }
    let mobDiv = document.getElementById('dex-mobs');
    mobTemplates.forEach(m => {
        mobDiv.innerHTML += `<div class="char-card" style="cursor:default; text-align:left;">
            <div style="font-size:24px;">${m.icon} <span class="char-name">${m.name}</span></div>
            <div class="char-desc" style="margin-top:10px;"><b>基础模板:</b> HP ${m.maxHp} | ATK ${m.atk}</div><div class="char-desc">${m.desc}</div>
        </div>`;
    });
    
    let itemDiv = document.getElementById('dex-items');
    
    // 加入镇镇之力系统说明
    for(let k in zhenZhenData) {
        let z = zhenZhenData[k];
        itemDiv.innerHTML += `<div class="char-card" style="cursor:default; text-align:left; border-color:var(--zhen);">
            <div style="font-size:20px;">${z.icon} <span class="char-name" style="color:var(--zhen)">[镇镇之力] ${z.name}</span></div>
            <div class="char-desc" style="margin-top:5px; white-space: pre-wrap;">${z.desc}</div>
        </div>`;
    }

    let allItems = [...rewardPool, ...shopPool, ...specialItems];
    let addedNames = new Set();
    allItems.forEach(i => {
        if(!addedNames.has(i.name)) {
            addedNames.add(i.name);
            let badge = i.isUnique ? '<span style="color:#38bdf8;font-size:10px;font-weight:bold;">[唯一] </span>' : '';
            itemDiv.innerHTML += `<div class="char-card" style="cursor:default; text-align:left;">
                <div style="font-size:20px;">${i.icon} <span class="char-name">${badge}${i.name}</span></div><div class="char-desc" style="margin-top:5px;">${i.desc}</div>
            </div>`;
        }
    });
}

function openPokedex() { show('modal-pokedex'); }
function closePokedex() { hide('modal-pokedex'); }
function switchDexTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    document.querySelectorAll('.pokedex-list').forEach(div => div.classList.add('hidden'));
    show(tabId);
}
function openInventory() { 
    show('modal-inventory'); let c = document.getElementById('inv-container'); c.innerHTML = '';
    if(ownedItems.length === 0) { c.innerHTML = '<p style="color:#94a3b8; grid-column: 1/-1;">背包空空如也...</p>'; return; }
    ownedItems.forEach(item => { c.innerHTML += `<div class="inv-item"><div style="font-size:24px;">${item.icon}</div><h4>${item.name}</h4><p>${item.desc}</p></div>`; });
}
function closeInventory() { hide('modal-inventory'); }

// --- 世界地图展示 ---
function openWorldMap() {
    show('world-map-panel');
    let container = document.getElementById('world-map-viz');
    container.innerHTML = '';
    for(let regionKey in regionMeta) {
        let r = regionMeta[regionKey];
        let regionDiv = document.createElement('div');
        regionDiv.style.cssText = `background:rgba(0,0,0,0.4); border:1px solid ${r.color}; border-radius:12px; padding:15px; min-width:180px;`;
        let html = `<h3 style="color:${r.color}; margin-top:0;">${r.icon} ${r.name}</h3><div style="display:flex; flex-direction:column; gap:8px;">`;
        r.nodes.forEach(nodeId => {
            let n = worldMap[nodeId];
            let isCurrent = (nodeId === currentNodeId);
            let isVisited = visitedNodes.includes(nodeId);
            let isDefeatedBoss = (n.type === 'boss' && defeatedBosses.includes(nodeId));
            let statusIcon = isCurrent ? '📍' : (isDefeatedBoss ? '✅' : (isVisited ? '👁️' : '❔'));
            html += `<div style="font-size:13px; padding:4px 8px; border-radius:6px; background:${isCurrent ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.05)'}; border:${isCurrent ? '1px solid var(--text-main)' : '1px solid transparent'};">${statusIcon} ${n.icon} ${n.name}</div>`;
        });
        html += '</div></div>';
        regionDiv.innerHTML = html;
        container.appendChild(regionDiv);
    }
}
function closeWorldMap() { hide('world-map-panel'); }

// --- 游戏主循环逻辑 ---
function initGame(playerKey) {
    player = JSON.parse(JSON.stringify(baseCharData[playerKey]));
    gold = 10; ultUsedThisFloor = false; duckJunEncountered = false;
    
    // 抖抖鸡奥义相关初始化
    player.ultActive = false;
    player.ultDodgeBonus = 0;
    player.frozenTurns = 0;

    // 初始化镇镇之力
    let zzPool = ['luck', 'crit', 'immortal', 'overload', 'random'];
    currentZhenZhen = zzPool[Math.floor(Math.random() * zzPool.length)];
    zhenZhenUnlocked = false; zhenZhenUsedThisFloor = false; badRngCount = 0;
    
    ownedItems = []; sosoDanceInterval = 3; hasSosoUltItem = false; zhougeSelfDmgStreak = 0; zhougeUltActive = false; 
    fastFood15Active = false; hasFushunItem = false; fushunBattles = 0; fushunPermanent = false; fushunLastImmuneTurn = -99;
    overloadAtkBonus = 0; overloadHpBonus = 0;

    // 网格地图重置
    snowGrid = null; snowGridPos = { r: 0, c: 0 }; snowGridInEvent = false; currentSnowEvent = null;

    // 旧Boss池保留，用于非最终Boss的守关者生成
    bossPool = Object.keys(baseCharData).filter(k => k !== playerKey);
    bossPool.sort(() => Math.random() - 0.5);

    // 大地图进度初始化
    currentNodeId = 'start';
    defeatedBosses = [];
    visitedNodes = ['start'];
    
    hide('selection-screen'); show('top-bar');
    let mainTitle = document.getElementById('main-title'); let subTitle = document.getElementById('sub-title');
    if(mainTitle) mainTitle.classList.add('hidden'); if(subTitle) subTitle.classList.add('hidden');

    updateTopBar(); enterNode('start');
}

function updateTopBar() {
    let locName = currentNode ? currentNode.name : (snowGrid ? '永冻雪地' : '未知之地');
    document.getElementById('ui-location').innerText = locName;
    document.getElementById('ui-bosses').innerText = `${defeatedBosses.length}/3`;
    document.getElementById('ui-hp').innerText = `${Math.floor(player.hp)}/${player.maxHp}`;
    document.getElementById('ui-atk').innerText = player.atk;
    document.getElementById('ui-spd').innerText = player.speed;
    document.getElementById('ui-gold').innerText = gold;
    document.getElementById('ui-crit').innerText = player.crit;
    document.getElementById('ui-life').innerText = player.lifesteal;
    document.getElementById('ui-dodge').innerText = player.dodge;
}

function enterNode(nodeId) {
    let node = worldMap[nodeId];
    if(!node) { console.error('未知节点:', nodeId); return; }
    currentNodeId = nodeId;
    currentNode = node;
    if(!visitedNodes.includes(nodeId)) visitedNodes.push(nodeId);

    // 每个新节点重置一次性能力
    ultUsedThisFloor = false; zhenZhenUsedThisFloor = false;

    // 冰原地图：进入网格模式
    if(nodeId === 'snow_start') {
        enterSnowMap();
        return;
    }

    hide('battle-screen'); hide('reward-screen'); hide('shop-screen'); hide('world-map-panel'); hide('grid-map-screen');
    show('event-screen');
    document.getElementById('event-combat-btn').classList.add('hidden');

    document.getElementById('event-icon').innerText = node.icon || '📍';
    document.getElementById('event-title').innerText = node.name;
    document.getElementById('event-desc').innerText = node.desc;

    let optionsDiv = document.getElementById('event-options');
    optionsDiv.innerHTML = '';

    // 终结技状态提示
    let ultStatus = document.createElement('p');
    ultStatus.className = 'ult-status-text';
    ultStatus.innerText = ultUsedThisFloor ? "⚠️ 终结技本节点已耗尽" : "✨ 终结技：准备就绪";
    ultStatus.style.marginBottom = '15px';
    optionsDiv.appendChild(ultStatus);

    if(node.type === 'event' || node.type === 'start') {
        node.options.forEach(opt => {
            let btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.innerHTML = `<h3>${opt.text}</h3>`;
            btn.onclick = () => resolveEventOption(opt.result);
            optionsDiv.appendChild(btn);
        });
    } else if(node.type === 'combat') {
        prepareEnemyForNode(node);
        let btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerHTML = `<h3>⚔️ 迎战</h3><p>进入战斗</p>`;
        btn.onclick = () => startCombat();
        optionsDiv.appendChild(btn);
    } else if(node.type === 'shop') {
        let btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerHTML = `<h3>🛒 打开商店</h3>`;
        btn.onclick = () => openShopFromNode(node);
        optionsDiv.appendChild(btn);
    } else if(node.type === 'boss') {
        prepareBossForNode(node);
        let btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerHTML = `<h3>🔥 挑战Boss</h3><p>危险的战斗！</p>`;
        btn.onclick = () => startCombat();
        optionsDiv.appendChild(btn);
    }

    updateTopBar();
}

function resolveEventOption(result) {
    if(result.type === 'goto') {
        enterNode(result.target);
    } else if(result.type === 'random') {
        let target = result.targets[Math.floor(Math.random() * result.targets.length)];
        enterNode(target);
    }
}

// ==================== 冰原网格地图系统 ====================

function enterSnowMap() {
    // 生成随机网格
    snowGrid = generateSnowGrid();
    snowGridPos = { r: 0, c: 0 };
    snowGridInEvent = false;
    currentSnowEvent = null;

    hide('event-screen'); hide('battle-screen'); hide('reward-screen'); hide('shop-screen');
    show('grid-map-screen');

    document.getElementById('grid-map-title').innerText = '❄️ 永冻雪地';
    updateTopBar();
    renderGrid();
    updateGridButtons();
}

function getCurrentNode() {
    if(!snowGrid) return null;
    return snowGrid.nodeMap[`${snowGridPos.r},${snowGridPos.c}`];
}

function renderGrid() {
    let container = document.getElementById('grid-container');
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${snowGrid.width}, 50px)`;
    container.style.gridTemplateRows = `repeat(${snowGrid.height}, 50px)`;

    for(let r = 0; r < snowGrid.height; r++) {
        for(let c = 0; c < snowGrid.width; c++) {
            let node = snowGrid.nodeMap[`${r},${c}`];
            let div = document.createElement('div');
            div.className = 'grid-cell';
            div.dataset.r = r;
            div.dataset.c = c;

            let isCurrent = (r === snowGridPos.r && c === snowGridPos.c);
            let isConnected = node && getCurrentNode() && getCurrentNode().connections.includes(node.id);

            if(!node) {
                // 空地：不可通行
                div.classList.add('empty');
                div.innerText = '';
            } else if(isCurrent) {
                div.classList.add('current');
                div.innerText = '📍';
            } else if(node.type === 'boss') {
                if(node.visited) {
                    div.classList.add('visited');
                    div.innerText = '✅';
                } else {
                    div.classList.add('boss');
                    div.innerText = '❓';
                }
            } else if(node.visited) {
                div.classList.add('visited');
                div.innerText = node.event ? node.event.icon : '•';
            } else {
                div.innerText = isConnected ? '•' : '❔';
                if(isConnected) div.classList.add('reachable');
            }

            div.onclick = () => {
                if(isCurrent) triggerGridEvent();
            };
            container.appendChild(div);
        }
    }

    document.getElementById('grid-pos-text').innerText = `${snowGridPos.r},${snowGridPos.c}`;
}

function updateGridButtons() {
    let current = getCurrentNode();
    if(!current) return;
    let hasUp = current.connections.includes(`${current.r-1},${current.c}`);
    let hasDown = current.connections.includes(`${current.r+1},${current.c}`);
    let hasLeft = current.connections.includes(`${current.r},${current.c-1}`);
    let hasRight = current.connections.includes(`${current.r},${current.c+1}`);
    document.getElementById('btn-up').disabled = !hasUp;
    document.getElementById('btn-down').disabled = !hasDown;
    document.getElementById('btn-left').disabled = !hasLeft;
    document.getElementById('btn-right').disabled = !hasRight;
}

function gridMove(direction) {
    if(snowGridInEvent) return;
    let current = getCurrentNode();
    if(!current) return;
    let targetId = null;
    if(direction === 'up') targetId = `${current.r-1},${current.c}`;
    if(direction === 'down') targetId = `${current.r+1},${current.c}`;
    if(direction === 'left') targetId = `${current.r},${current.c-1}`;
    if(direction === 'right') targetId = `${current.r},${current.c+1}`;

    if(targetId && current.connections.includes(targetId)) {
        let target = snowGrid.nodeMap[targetId];
        if(target) {
            snowGridPos = { r: target.r, c: target.c };
        }
    }

    renderGrid();
    updateGridButtons();

    // 到达新节点自动触发事件
    let cell = getCurrentNode();
    if(cell && !cell.visited) {
        triggerGridEvent();
    } else if(cell) {
        // 已访问的节点显示回顾信息
        let panel = document.getElementById('grid-event-panel');
        panel.innerHTML = '<p style="color:#64748b;">这里已经探索过了。</p>';
    }
}

function triggerGridEvent() {
    let cell = getCurrentNode();
    if(!cell) return;
    if(cell.visited && cell.type !== 'start') return;

    cell.visited = true;
    snowGridInEvent = true;

    let panel = document.getElementById('grid-event-panel');
    panel.innerHTML = '';

    if(cell.type === 'start') {
        panel.innerHTML = '<p style="color:#94a3b8;">这里是你的出发点，寒风从四面八方吹来。选择一个方向前进吧。</p>';
        snowGridInEvent = false;
        renderGrid();
        return;
    }

    if(cell.type === 'boss') {
        currentSnowEvent = snowBossEvent;
        panel.innerHTML = `<h3>${snowBossEvent.icon} ${snowBossEvent.name}</h3><p>${snowBossEvent.desc}</p>`;
        let bossOptions = getSnowBossOptions();
        bossOptions.forEach(opt => {
            let btn = document.createElement('button');
            btn.className = 'choice-btn';
            if(opt.disabled) {
                btn.classList.add('disabled');
                btn.disabled = true;
                btn.title = '需要道具：火把';
            }
            btn.innerHTML = `<h3>${opt.text}</h3>${opt.disabled ? '<p style="font-size:12px;color:#64748b;">需要火把</p>' : ''}`;
            btn.onclick = () => { if(!opt.disabled) resolveSnowEventOption(opt.result); };
            panel.appendChild(btn);
        });
        renderGrid();
        return;
    }

    // 普通事件
    let evt = cell.event;
    currentSnowEvent = evt;
    panel.innerHTML = `<h3>${evt.icon} ${evt.name}</h3><p>${evt.desc}</p>`;

    evt.options.forEach(opt => {
        let btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerHTML = `<h3>${opt.text}</h3>`;
        btn.onclick = () => resolveSnowEventOption(opt.result);
        panel.appendChild(btn);
    });

    renderGrid();
}

function resolveSnowEventOption(result) {
    let panel = document.getElementById('grid-event-panel');

    if(result.type === 'move') {
        snowGridInEvent = false;
        panel.innerHTML = '<p style="color:#94a3b8;">你选择了离开，继续探索这片冰原吧。</p>';
        renderGrid();
    }
    else if(result.type === 'combat' || result.type === 'combat_random') {
        let mobId = result.mobId;
        if(result.type === 'combat_random') {
            // 随机选择冰镇或冷俊
            let pool = ['ice_block', 'cold_jun'];
            mobId = pool[Math.floor(Math.random() * pool.length)];
        }
        prepareSnowMob(mobId);
        startCombat();
    }
    else if(result.type === 'boss_combat') {
        prepareSnowBoss(result.mode);
        startCombat();
    }
    else if(result.type === 'shop') {
        snowGridInEvent = false;
        window._shopNextNode = 'snow_start'; // 商店结束后回到网格
        generateShop();
        hide('grid-map-screen'); show('shop-screen');
    }
    else if(result.type === 'gold') {
        gold += result.amount;
        updateTopBar();
        snowGridInEvent = false;
        panel.innerHTML = `<p style="color:var(--gold);">🪙 获得了 ${result.amount} 寻宝币！</p>`;
        renderGrid();
    }
    else if(result.type === 'heal') {
        if(result.amount > 0 && result.amount < 1) {
            let heal = Math.floor(player.maxHp * result.amount);
            player.hp = Math.min(player.maxHp, player.hp + heal);
        } else if(result.amount > 0) {
            player.hp = Math.min(player.maxHp, player.hp + result.amount);
        } else {
            player.hp = Math.max(1, player.hp + result.amount);
        }
        updateTopBar();
        snowGridInEvent = false;
        panel.innerHTML = `<p>${result.text || (result.amount > 0 ? '恢复了生命值。' : '受到了伤害。')}</p>`;
        renderGrid();
    }
    else if(result.type === 'nothing') {
        snowGridInEvent = false;
        panel.innerHTML = '<p style="color:#94a3b8;">什么都没发生。</p>';
        renderGrid();
    }
}

function prepareSnowMob(mobId) {
    let scale = getDifficultyScale();
    duckJunDefeatedThisRound = false;
    let mob = snowMobs[mobId];
    if(!mob) { prepareEnemyForNode({}); return; }
    enemy = JSON.parse(JSON.stringify(mob));
    enemy.maxHp = Math.floor(enemy.maxHp * scale);
    enemy.hp = enemy.maxHp;
    enemy.atk = Math.floor(enemy.atk * scale);
    // 特殊标记用于战斗逻辑
    enemy.isSnowMob = true;
}

function prepareSnowBoss(mode) {
    let scale = getDifficultyScale();
    duckJunDefeatedThisRound = false;

    // 战斗模式：torch / normal / dread
    let isDread = (mode === 'dread');
    let isTorch = (mode === 'torch');

    enemy = {
        id: 'snow_boss_mob',
        icon: '🍄',
        name: '菇菇祭祀',
        hp: 650, maxHp: 650, atk: 28, speed: 8,
        crit: 0, lifesteal: 0, dodge: 0,
        isSnowBoss: true,
        bossMode: mode,
        // 冰盾系统
        iceShield: 3, // 开局3层，每层减伤20%
        freezeBar: 0, // 冻结条
        freezeThreshold: 3, // 累计3次后冻结一回合
        frozenTurns: 0, // 当前冻结回合数
        turnCounter: 0, // 回合计数器（用于每2回合产生冰盾）
        // 威慑模式
        dread: isDread,
        torchUsed: isTorch,
        rewardTier: isDread ? 3 : (isTorch ? 1 : 2) // 奖励等级
    };

    // 火把模式：Boss无法产生冰盾
    if(isTorch) {
        enemy.iceShield = 0;
    }

    // 威慑模式：Boss属性增强
    if(isDread) {
        enemy.maxHp = Math.floor(enemy.maxHp * 1.3);
        enemy.hp = enemy.maxHp;
        enemy.atk = Math.floor(enemy.atk * 1.3);
    }

    enemy.maxHp = Math.floor(enemy.maxHp * scale * 1.4);
    enemy.hp = enemy.maxHp;
    enemy.atk = Math.floor(enemy.atk * scale * 1.2);
}

// ==================== 网格系统结束 ====================

function getDifficultyScale() {
    return 1 + visitedNodes.length * 0.15;
}

function prepareEnemyForNode(node) {
    let scale = getDifficultyScale();
    duckJunDefeatedThisRound = false;

    // 鸭俊隐藏遭遇（探索较深后概率触发，整场冒险限一次）
    if (visitedNodes.length >= 3 && !duckJunEncountered && Math.random() < 0.10) {
        duckJunEncountered = true;
        enemy = { id: 'duck', icon: '🦆', name: '鸭俊', hp: 350, maxHp: 350, atk: 25, speed: 20, lifesteal: 15, dodge: 10, crit: 10 };
        enemy.maxHp = Math.floor(enemy.maxHp * scale * 1.3); enemy.hp = enemy.maxHp; enemy.atk = Math.floor(enemy.atk * scale);
        return;
    }

    let mobTemp = mobTemplates[Math.floor(Math.random() * mobTemplates.length)];
    enemy = JSON.parse(JSON.stringify(mobTemp)); enemy.id = 'mob';
    enemy.maxHp = Math.floor(enemy.maxHp * scale); enemy.hp = enemy.maxHp; enemy.atk = Math.floor(enemy.atk * scale);
}

function prepareBossForNode(node) {
    let scale = getDifficultyScale();
    duckJunDefeatedThisRound = false;
    // 使用 bossPool 中对应索引的角色作为守关者
    let bossKey = bossPool[Math.min(defeatedBosses.length, bossPool.length - 1)];
    let baseBoss = baseCharData[bossKey];
    enemy = JSON.parse(JSON.stringify(baseBoss));
    enemy.maxHp = Math.floor(enemy.maxHp * scale * 1.8); enemy.hp = enemy.maxHp;
    enemy.atk = Math.floor(enemy.atk * scale * 1.4);
}

// 兼容旧代码中可能存在的调用
function prepareEncounter() { enterNode(currentNodeId || 'start'); }

function toggleSpeed() { speedMode = speedMode === 1 ? 2 : 1; document.getElementById('speed-btn').innerText = speedMode === 1 ? "⏩ 1倍速" : "⚡ 2倍速"; }

function startCombat() {
    hide('event-screen'); hide('grid-map-screen'); show('battle-screen'); hide('battle-end-btn');
    document.getElementById('log-box').innerHTML = '';
    
    // 确保战斗开始时无残留buff
    endCombatCleanup();

    turn = 1; battleActive = true;
    pDodges = 0; pHitsTaken = 0; pCrits = 0; ePoisonTicks = 0;
    player.poison = 0; enemy.poison = 0; player.pigHealed = false; 
    player.activeDodgeDance = false; player.activeCritDance = false;
    player.frozenTurns = 0;
    enemy.activeDodgeDance = false; enemy.activeCritDance = false;
    if(enemy) enemy.frozenTurns = 0;
    fushunLastImmuneTurn = -99;
    
    if (hasFushunItem && fushunBattles > 0) { fushunBattles--; if (fushunBattles === 0) fushunPermanent = true; }

    updateBattleUI(); checkUltReady(); checkZhenZhenBtn();
    if(enemy.id === 'duck') log(`<span class="log-duck">🦆 【警告】隐藏强敌 鸭俊 散发着恐怖的气息！</span>`);
    else log(`<span class="log-skill">【开战】</span> 寻宝战斗开始！`);
    battleTimer = setTimeout(battleTick, speedMode === 1 ? 1200 : 600);
}

// --- 镇镇之力核心系统 ---
function unlockZhenZhen() {
    zhenZhenUnlocked = true;
    let zzInfo = zhenZhenData[currentZhenZhen];
    log(`<div style="border: 1px solid var(--zhen); padding: 5px; margin: 5px 0; border-radius: 5px; background: rgba(59, 130, 246, 0.1);">
        <span class="log-zhen">🎉 【系统提示】条件达成！</span><br>
        你的专属隐藏能力 <b>${zzInfo.icon} ${zzInfo.name}</b> 已永久觉醒！
    </div>`);
    checkZhenZhenBtn();
}

function trackBadRng() {
    if(currentZhenZhen === 'luck' && !zhenZhenUnlocked) {
        badRngCount++;
        if(badRngCount >= 3) unlockZhenZhen();
    }
}

function checkZhenZhenBtn() {
    let btn = document.getElementById('zhen-btn');
    if (!zhenZhenUnlocked) {
        btn.className = ''; btn.disabled = true; btn.innerText = "❓ 镇镇之力 (隐藏条件未达成)";
    } else if (zhenZhenUsedThisFloor) {
        btn.className = ''; btn.disabled = true; btn.innerText = `⏳ ${zhenZhenData[currentZhenZhen].name} (本层已用)`;
    } else if (battleActive) {
        btn.className = 'zhen-btn-ready'; btn.disabled = false; btn.innerText = `🌌 激活：${zhenZhenData[currentZhenZhen].name} 🌌`;
    } else {
        btn.className = ''; btn.disabled = true; btn.innerText = `🌌 ${zhenZhenData[currentZhenZhen].name} (战斗中可用)`;
    }
}

function castZhenZhen() {
    if(!zhenZhenUnlocked || zhenZhenUsedThisFloor || !battleActive) return;
    zhenZhenUsedThisFloor = true;
    
    let powerId = currentZhenZhen;
    if(powerId === 'random') {
        let others = ['luck', 'crit', 'immortal', 'overload'];
        powerId = others[Math.floor(Math.random() * others.length)];
        log(`<span class="log-zhen">🎲 【随机镇镇】发动！扭蛋摇出了：${zhenZhenData[powerId].name}！</span>`);
    } else {
        log(`<span class="log-zhen">🌌 【${zhenZhenData[powerId].name}】发动！</span>`);
    }

    if(powerId === 'luck') {
        luckZhenZhenActive = true;
        log(`<span class="log-zhen">🍀 命运编织：接下来的每一寸运气，都将站在你这边！</span>`);
    } else if(powerId === 'crit') {
        critZhenZhenActive = true;
        log(`<span class="log-zhen">🧨 炸裂充能：本场战斗暴击率直接拔高 50%！</span>`);
    } else if(powerId === 'immortal') {
        immortalZhenZhenActive = true;
        log(`<span class="log-zhen">👼 不朽庇护：死神本场战斗将拒绝收走你的灵魂一次！</span>`);
    } else if(powerId === 'overload') {
        overloadAtkBonus = player.atk;
        overloadHpBonus = player.maxHp;
        player.atk += overloadAtkBonus;
        player.maxHp += overloadHpBonus;
        player.hp += overloadHpBonus;
        overloadZhenZhenActive = true;
        log(`<span class="log-zhen">⚡ 基因超载：基础攻击与生命上限瞬间翻倍！</span>`);
    }

    checkZhenZhenBtn(); updateBattleUI(); updateTopBar();
}

function endCombatCleanup() {
    if (overloadZhenZhenActive) {
        player.atk -= overloadAtkBonus;
        player.maxHp -= overloadHpBonus;
        player.hp = Math.min(player.hp, player.maxHp);
        overloadZhenZhenActive = false;
    }
    luckZhenZhenActive = false; critZhenZhenActive = false; immortalZhenZhenActive = false;
}

// --- 战斗逻辑 ---
function triggerSosoDance(char) {
    let r = Math.random(); let danceText = ""; let effects = [];
    if(r < 0.05) { effects = ['dodge', 'crit', 'heal']; danceText = "🌟SOSO5终极综合舞🌟"; }
    else if(r < 0.366) { effects = ['dodge']; danceText = "💨闪避舞"; }
    else if(r < 0.683) { effects = ['crit']; danceText = "💥暴击舞"; }
    else { effects = ['heal']; danceText = "❤️回血舞"; }

    log(`<span class="log-collab-soso">🕺 [soso5王联动] ${char.name} 触发了 ${danceText}！</span>`);
    if(effects.includes('dodge')) char.activeDodgeDance = true;
    if(effects.includes('crit')) char.activeCritDance = true;
    if(effects.includes('heal')) { let heal = Math.floor(char.maxHp * 0.2); char.hp = Math.min(char.maxHp, char.hp + heal); }
}

function battleTick() {
    if(!battleActive) return;

    // 冻结条处理：玩家被冻结则跳过本回合
    if(player.frozenTurns > 0) {
        player.frozenTurns--;
        log(`<span class="log-boss-warning">❄️ ${player.name} 被冻结，本回合无法行动！（剩余 ${player.frozenTurns} 回合）</span>`);
    }
    // 敌人被冻结则跳过
    if(enemy.frozenTurns > 0) {
        enemy.frozenTurns--;
        log(`<span class="log-boss">❄️ ${enemy.name} 被冻结，本回合无法行动！（剩余 ${enemy.frozenTurns} 回合）</span>`);
    }

    log(`<span class="log-turn">=== 第 ${turn} 回合 ===</span>`);

    // 菇菇祭祀冰盾生成逻辑：每2回合产生一层冰盾（产生时不攻击）
    if(enemy && enemy.isSnowBoss && !enemy.torchUsed) {
        enemy.turnCounter++;
        if(enemy.turnCounter % 2 === 0) {
            enemy.iceShield = Math.min(5, enemy.iceShield + 1);
            log(`<span class="log-boss">🛡️ 菇菇祭祀正在凝聚寒气，生成一层冰盾！当前冰盾：${enemy.iceShield} 层</span>`);
            turn++; updateBattleUI(); updateTopBar(); checkUltReady();
            battleTimer = setTimeout(battleTick, speedMode === 1 ? 1200 : 600);
            return;
        }
    }

    // 抖抖鸡：每回合额外进行一次闪避判定
    if(player.id === 'doudouji') {
        let dodgeRoll = Math.random() * 100;
        let extraDodge = player.dodge + (player.ultActive ? player.ultDodgeBonus : 0);
        if(dodgeRoll < extraDodge) {
            player.atk += 1;
            pDodges++;
            log(`<span class="log-skill">🐔 [抖抖鸡] 额外闪避判定成功！攻击+1（当前攻击 ${player.atk}）</span>`);
            // 奥义触发检查
            checkDoudoujiUlt();
        } else {
            log(`<span class="log-skill">🐔 [抖抖鸡] 额外闪避判定失败...</span>`);
            if(player.ultActive) {
                player.ultDodgeBonus += 5;
                log(`<span class="log-ult">🔥 [抖抖鸡奥义] 闪避失败，额外闪避率+5%（当前+${player.ultDodgeBonus}%）</span>`);
            }
        }
    }

    let order = [];
    // 如果玩家被冻结，敌人先行动；否则按速度
    if(player.frozenTurns > 0 && enemy.frozenTurns <= 0) {
        order = [enemy, player];
    } else if(enemy.frozenTurns > 0 && player.frozenTurns <= 0) {
        order = [player, enemy];
    } else {
        order = player.speed >= enemy.speed ? [player, enemy] : [enemy, player];
    }

    if(order[0].frozenTurns <= 0 && !processAction(order[0], order[1])) return;
    if(order[1].hp > 0 && order[1].frozenTurns <= 0) { if(!processAction(order[1], order[0])) return; }

    if(player.id === 'soso5' && turn % sosoDanceInterval === 0) triggerSosoDance(player);
    if(enemy.id === 'soso5' && turn % 3 === 0) triggerSosoDance(enemy);

    turn++; updateBattleUI(); updateTopBar(); checkUltReady();
    if(player.hp > 0 && enemy.hp > 0) battleTimer = setTimeout(battleTick, speedMode === 1 ? 1200 : 600);
}

function processAction(atkChar, defChar) {
    let isPlayerAtk = (atkChar.id === player.id);

    if(atkChar.id === 'zhouge') {
        let ultActive = isPlayerAtk ? zhougeUltActive : false;
        let target = (ultActive || Math.random() < 0.5) ? defChar : atkChar;
        let dmg = Math.floor(target.maxHp * 0.1);
        log(`<span class="log-collab-ff">🍔 [快餐侠联动] 强制扣除 ${target.name} ${dmg}点生命！</span>`);
        if(target === atkChar) {
            if(isPlayerAtk) zhougeSelfDmgStreak++;
            if(target.hp <= dmg) { target.hp = 1; let nuke = target.maxHp; defChar.hp -= nuke; log(`<span class="log-ult">🚨 [快餐侠] 绝境反击！保留1血，造成上限 <span class="log-dmg">${nuke}</span> 真伤！</span>`); } 
            else { target.hp -= dmg; }
        } else { if(isPlayerAtk) zhougeSelfDmgStreak = 0; target.hp -= dmg; }
        if(checkDeath()) return false;
    }

    if(atkChar.poison > 0) { atkChar.hp -= atkChar.poison; if(!isPlayerAtk) ePoisonTicks++; log(`${atkChar.name} 毒发，扣除 <span class="log-dmg">${atkChar.poison}</span> 生命！`); if(checkDeath()) return false; }
    if(atkChar.id === 'sheep') { let heal = Math.floor(atkChar.maxHp * 0.1); atkChar.hp = Math.min(atkChar.maxHp, atkChar.hp + heal); }
    if(atkChar.id === 'pig' && atkChar.hp < atkChar.maxHp * 0.3 && !atkChar.pigHealed) { let heal = Math.floor(atkChar.maxHp * 0.5); atkChar.hp += heal; atkChar.pigHealed = true; checkUltReady(); }
    if(atkChar.id === 'final' && turn % 4 === 0) { atkChar.hp += 150; }

    let damage = atkChar.atk; let attackTimes = 1;
    if(atkChar.id === 'monkey') {
        if(luckZhenZhenActive) { damage = isPlayerAtk ? Math.floor(damage * 2.5) : 1; } 
        else { damage = Math.floor(Math.random() * (damage * 2.5)) + 1; }
    }
    if(atkChar.id === 'tiger' && Math.random() < 0.35) { damage *= 2; if(isPlayerAtk) pCrits++; }
    if(atkChar.id === 'dragon' && turn % 3 === 0) damage = Math.floor(damage * 2.5);
    if(atkChar.id === 'rooster' && turn === 1) damage *= 3;
    if(atkChar.id === 'rabbit' && Math.random() < 0.4) attackTimes = 2;
    if(atkChar.id === 'final') damage = Math.floor(damage * (1 + turn*0.08)); 
    if(atkChar.id === 'duck') damage = Math.floor(damage * (1 + turn*0.05)); 

    // 【快餐15分钟】
    if (fastFood15Active) { 
        if (luckZhenZhenActive) { damage = isPlayerAtk ? defChar.maxHp : 0; }
        else { damage = Math.floor(Math.random() * defChar.maxHp); }
        log(`<span class="log-collab-ff">🍔 [快餐15分钟] 伤害扭曲！真实伤害变异为 ${damage}！</span>`); 
    }

    // 威慑模式：我方无法暴击、无法闪避
    let isDreadBattle = (enemy && enemy.isSnowBoss && enemy.dread);

    // 暴击判定
    let isCrit = false;
    if (isDreadBattle && isPlayerAtk) {
        // 威慑下玩家无法暴击
    } else if (luckZhenZhenActive) {
        isCrit = isPlayerAtk; // 玩家必暴，敌人不暴
    } else {
        if(atkChar.activeCritDance) { isCrit = true; atkChar.activeCritDance = false; } 
        else if ((atkChar.crit || 0) > 0 && Math.random() * 100 < (atkChar.crit + (isPlayerAtk && critZhenZhenActive ? 50 : 0))) { isCrit = true; }
    }

    if(isCrit && !isPlayerAtk) {
        trackBadRng();
        if(currentZhenZhen === 'crit' && !zhenZhenUnlocked) unlockZhenZhen();
    }

    if(isCrit) {
        if (defChar.id === player.id && hasFushunItem) {
            if (fushunBattles > 0) {
                let healAmount = Math.floor(damage * 1.5); player.hp = Math.min(player.maxHp, player.hp + healAmount);
                log(`<span class="log-collab-ff">🛣️ [富顺街庇护] 吸收暴击打击，反而回血 <span class="log-heal">${healAmount}</span>！</span>`);
                isCrit = false; damage = 0; // 吸收
            } else if (fushunPermanent && (turn - fushunLastImmuneTurn >= 2)) {
                log(`<span class="log-collab-ff">🛣️ [富顺街庇护] 完美免疫了本次暴击爆发！</span>`);
                isCrit = false; fushunLastImmuneTurn = turn; 
            }
        }
        if(isCrit && damage > 0) { damage = Math.floor(damage * 1.5); log(`<span class="log-dmg">💥 暴击！</span>`); if(isPlayerAtk) pCrits++; }
    }

    // 闪避判定
    let isHit = true;
    if (isDreadBattle && defChar.id === player.id) {
        // 威慑下玩家无法闪避
    } else if (luckZhenZhenActive) {
        isHit = isPlayerAtk; // 玩家必中，敌人必失
    } else {
        if(defChar.activeDodgeDance) { isHit = false; defChar.activeDodgeDance = false; } 
        else { 
            let totalDodge = defChar.dodge || 0; 
            if(defChar.id === 'doudouji') totalDodge += 8; // 抖抖鸡基础8%额外闪避
            if(Math.random() * 100 < totalDodge) { isHit = false; if(!isPlayerAtk) pDodges++; } 
        }
    }

    if(!isHit && isPlayerAtk) { trackBadRng(); }
    
    // 随机镇镇条件触发
    if(currentZhenZhen === 'random' && !zhenZhenUnlocked) unlockZhenZhen();

    for(let i=0; i<attackTimes; i++) {
        if(isHit && damage > 0) {
            // 冰盾减伤
            if(defChar.isSnowBoss && defChar.iceShield > 0) {
                let reducePct = defChar.iceShield * 0.2;
                let reduced = Math.floor(damage * (1 - reducePct));
                log(`<span class="log-boss">🛡️ 冰盾抵挡！伤害从 ${damage} 降低至 ${reduced}（减伤 ${Math.floor(reducePct*100)}%）</span>`);
                damage = reduced;
            }

            defChar.hp -= damage; if(!isPlayerAtk) pHitsTaken++; log(`${atkChar.name} 造成 <span class="log-dmg">${damage}</span> 伤害！`);
            let lifestealPct = atkChar.lifesteal || 0; if(atkChar.id === 'final') lifestealPct += 30;
            if(lifestealPct > 0) { let heal = Math.floor(damage * lifestealPct / 100); atkChar.hp = Math.min(atkChar.maxHp, atkChar.hp + heal); }
            if(atkChar.id === 'snake') defChar.poison += Math.floor(atkChar.atk * 0.4);
            if(defChar.id === 'ox') defChar.atk += Math.floor(defChar.maxHp * 0.02);
            if(defChar.id === 'dog') { let ref = Math.floor(damage * 0.3); atkChar.hp -= ref; }

            // 冰盾层数衰减：受击少一层
            if(defChar.isSnowBoss && defChar.iceShield > 0) {
                defChar.iceShield--;
                log(`<span class="log-boss">🧊 冰盾碎裂一层！剩余：${defChar.iceShield} 层</span>`);
            }

            // 菇菇祭祀冻结条：攻击命中玩家时积累
            if(atkChar.isSnowBoss && defChar.id === player.id) {
                atkChar.freezeBar++;
                log(`<span class="log-boss-warning">❄️ 寒气入侵！冻结条 ${atkChar.freezeBar}/${atkChar.freezeThreshold}</span>`);
                if(atkChar.freezeBar >= atkChar.freezeThreshold) {
                    defChar.frozenTurns = 1;
                    atkChar.freezeBar = 0;
                    log(`<span class="log-boss-warning">❄️❄️❄️ 你被完全冻结！下一回合无法行动！</span>`);
                }
            }

            // 冰镇减速：被冰镇攻击降低速度
            if(atkChar.isSnowMob && atkChar.special === 'slow' && defChar.id === player.id) {
                if(Math.random() < 0.5) {
                    defChar.speed = Math.max(1, defChar.speed - 2);
                    log(`<span class="log-boss">🧊 [冰镇] 寒气让你行动迟缓，速度-2！</span>`);
                }
            }

            // 冷俊冻结
            if(atkChar.isSnowMob && atkChar.special === 'freeze' && defChar.id === player.id) {
                if(Math.random() < 0.35) {
                    defChar.frozenTurns = 1;
                    log(`<span class="log-boss-warning">❄️ [冷俊] 你被冻结一回合！</span>`);
                }
            }

            // 河里菇冰冻领域
            if(atkChar.isSnowMob && atkChar.special === 'freeze_aura' && defChar.id === player.id) {
                if(Math.random() < 0.4) {
                    defChar.frozenTurns = 1;
                    log(`<span class="log-boss-warning">🍄 [河里菇] 冰冻领域让你无法动弹！</span>`);
                }
            }

            // 镇二娃减速光环
            if(atkChar.isSnowMob && atkChar.special === 'slow_aura' && defChar.id === player.id) {
                defChar.speed = Math.max(1, defChar.speed - 1);
                log(`<span class="log-boss">👶 [镇二娃] 怨灵哀嚎降低你的速度！</span>`);
            }

        } else if (!isHit) { log(`${defChar.name} 闪避了攻击！💨`); }
        if(checkDeath()) return false;
    }
    return true;
}

function checkDoudoujiUlt() {
    // 抖抖鸡奥义：通过成功额外闪避触发被动加成
    if(player.id === 'doudouji' && !player.ultActive && battleActive) {
        if(pDodges >= 1) { // 任意一次额外闪避即可触发
            player.ultActive = true;
            player.ultDodgeBonus = 20;
            log(`<span class="log-ult">🔥🔥🔥 [抖抖鸡奥义] 激发！本场战斗闪避率+20%，之后每次闪避失败再+5%！</span>`);
            checkUltReady();
        }
    }
}

function checkUltReady() {
    if(!battleActive || ultUsedThisFloor) return;
    let ready = false; let c = player.id;
    if(c === 'soso5') ready = true; 
    if(c === 'zhouge' && zhougeSelfDmgStreak >= 3) ready = true;
    if(c === 'doudouji' && player.ultActive) ready = true;

    let btn = document.getElementById('ult-btn');
    if(ready) { btn.className = 'ready'; btn.disabled = false; btn.innerText = "🔥 释放终结技 🔥"; } 
    else { btn.className = ''; btn.disabled = true; btn.innerText = "终结技：条件未达成"; }
}

function castUltimate() {
    if(ultUsedThisFloor || !battleActive) return;
    ultUsedThisFloor = true;
    let btn = document.getElementById('ult-btn');
    btn.className = ''; btn.disabled = true; btn.innerText = "终结技本层已耗尽";
    log(`<span class="log-ult">🌟 ${player.name} 释放了终结技！🌟</span>`);
    let c = player.id;
    
    if(c === 'soso5') {
        if(player.hp > enemy.hp) { let diff = player.hp - enemy.hp; enemy.hp -= diff; } 
        else if(player.hp < enemy.hp) { let diff = enemy.hp - player.hp; player.hp = Math.min(player.maxHp, player.hp + diff); triggerSosoDance(player); } 
    }
    else if(c === 'zhouge') { player.hp = player.maxHp; zhougeUltActive = true; }
    else if(c === 'doudouji') { 
        // 抖抖鸡奥义释放：立即进行5次额外闪避判定，每次成功造成一次伤害
        player.ultDodgeBonus += 10;
        for(let i=0; i<5; i++) {
            let dodgeRoll = Math.random() * 100;
            let totalDodge = player.dodge + player.ultDodgeBonus;
            if(dodgeRoll < totalDodge) {
                let dmg = player.atk * 2;
                enemy.hp -= dmg;
                player.atk += 1;
                log(`<span class="log-ult">🐔 [抖抖鸡奥义] 极限闪避！造成 ${dmg} 伤害，攻击+1！</span>`);
            } else {
                player.ultDodgeBonus += 5;
                log(`<span class="log-ult">🐔 [抖抖鸡奥义] 闪避失败，额外闪避率+5%！</span>`);
            }
        }
        ultUsedThisFloor = true;
    }
    
    if(hasSosoUltItem) { log(`<span class="log-collab-soso">💿 [联动道具] 奥义附带尬舞！</span>`); triggerSosoDance(player); }
    updateBattleUI(); updateTopBar(); checkDeath();
}

function checkDeath() {
    if(player.hp <= 0) {
        if (currentZhenZhen === 'immortal' && !zhenZhenUnlocked) {
            log(`<span class="log-zhen">👼 【永生镇镇】绝境觉醒！你从死亡深渊中满血归来！</span>`);
            player.hp = player.maxHp;
            unlockZhenZhen(); updateBattleUI(); updateTopBar();
            return false;
        }
        if (immortalZhenZhenActive) {
            log(`<span class="log-zhen">👼 【永生镇镇】生效！消耗了不朽庇护，你再次满血重生！</span>`);
            player.hp = player.maxHp;
            immortalZhenZhenActive = false;
            updateBattleUI(); updateTopBar();
            return false;
        }
    }

    if(player.hp <= 0 || enemy.hp <= 0) {
        battleActive = false; clearTimeout(battleTimer);
        endCombatCleanup(); 
        updateBattleUI(); updateTopBar(); checkZhenZhenBtn();

        if(player.hp <= 0) {
            let locName = currentNode ? currentNode.name : (snowGrid ? '永冻雪地' : '未知之地');
            setTimeout(() => { hide('battle-screen'); hide('top-bar'); show('game-over-screen'); document.getElementById('end-title').innerHTML = "💀 寻宝失败 💀"; document.getElementById('end-desc').innerHTML = `你倒在了 <b>${locName}</b>。`; }, 1000);
        } else {
            log(`🏆 战斗胜利！`); show('battle-end-btn'); document.getElementById('ult-btn').disabled = true;
            if(enemy.id === 'duck') duckJunDefeatedThisRound = true;
        }
        return true;
    }
    return false;
}

function updateBattleUI() {
    player.hp = Math.max(0, Math.floor(player.hp)); enemy.hp = Math.max(0, Math.floor(enemy.hp));
    document.getElementById('p-icon').innerText = player.icon;
    document.getElementById('p-hp-bar').style.width = (player.hp / player.maxHp * 100) + '%';
    document.getElementById('p-hp-text').innerText = `${player.hp} / ${player.maxHp}`;
    document.getElementById('e-icon').innerText = enemy.icon; document.getElementById('e-name').innerText = enemy.name;
    let eHpPercent = enemy.maxHp > 0 ? (enemy.hp / enemy.maxHp * 100) : 0;
    document.getElementById('e-hp-bar').style.width = eHpPercent + '%';
    document.getElementById('e-hp-text').innerText = `${enemy.hp} / ${enemy.maxHp}`;

    // 更新战斗者属性显示
    document.getElementById('p-stats').innerHTML = `ATK:${player.atk} SPD:${player.speed} CRT:${player.crit}% LST:${player.lifesteal}% DOD:${player.dodge}%`;
    document.getElementById('e-stats').innerHTML = `ATK:${enemy.atk} SPD:${enemy.speed}`;

    // 更新回合数
    document.getElementById('turn-counter').innerText = `第 ${turn} 回合`;

    // 更新状态效果
    let pEffects = document.getElementById('p-effects');
    pEffects.innerHTML = '';
    if(player.frozenTurns > 0) pEffects.innerHTML += `<span class="status-badge freeze">冻结 ${player.frozenTurns}回合</span>`;
    if(player.activeDodgeDance) pEffects.innerHTML += `<span class="status-badge">闪避舞</span>`;
    if(player.activeCritDance) pEffects.innerHTML += `<span class="status-badge">暴击舞</span>`;
    if(player.ultActive) pEffects.innerHTML += `<span class="status-badge">奥义激发</span>`;

    let eEffects = document.getElementById('e-effects');
    eEffects.innerHTML = '';
    if(enemy.isSnowBoss && enemy.iceShield > 0) eEffects.innerHTML += `<span class="status-badge ice-shield">冰盾 ${enemy.iceShield}层</span>`;
    if(enemy.frozenTurns > 0) eEffects.innerHTML += `<span class="status-badge freeze">冻结 ${enemy.frozenTurns}回合</span>`;
    if(enemy.dread) eEffects.innerHTML += `<span class="status-badge dread">威慑</span>`;
    if(enemy.torchUsed) eEffects.innerHTML += `<span class="status-badge">火把削弱</span>`;
}

function log(msg) { let box = document.getElementById('log-box'); box.innerHTML += `<div>${msg}</div>`; box.scrollTop = box.scrollHeight; }

function handleAcquireItem(item) {
    if(item.exec) item.exec();
    if (item.isUnique) { 
        ownedItems.push(item); 
        if(currentZhenZhen === 'overload' && !zhenZhenUnlocked) unlockZhenZhen();
    }
    claimRewardDone();
}

function endCombat() {
    // 判断是否来自网格地图
    let fromGrid = (snowGrid !== null);
    let isGridBoss = (enemy && enemy.isSnowBoss);

    let dropGold = (isGridBoss || (currentNode && currentNode.type === 'boss')) ? Math.floor(Math.random()*30+60) : Math.floor(Math.random()*15 + 15);
    gold += dropGold; updateTopBar();

    // 网格地图 Boss 战斗
    if(fromGrid && isGridBoss) {
        if(!defeatedBosses.includes('snow_boss')) defeatedBosses.push('snow_boss');
        let rewardTier = enemy.rewardTier || 2;
        let bossName = enemy.name || '菇菇祭祀';
        log(`🏆 击败了 ${bossName}！`); show('battle-end-btn');
        document.getElementById('battle-end-btn').innerText = '返回冰原';
        document.getElementById('battle-end-btn').onclick = () => {
            hide('battle-screen');
            if(defeatedBosses.length >= 3) {
                hide('top-bar'); show('game-over-screen');
                document.getElementById('end-title').innerHTML = "🎉 寻宝真神 🎉";
                document.getElementById('end-desc').innerHTML = `你击败了所有Boss，找到了传说中的宝藏！`;
            } else {
                // 标记Boss格子已击败，返回网格
                snowGridInEvent = false;
                show('grid-map-screen');
                renderGrid();
                let panel = document.getElementById('grid-event-panel');
                panel.innerHTML = `<p style="color:var(--gold);">🏆 ${bossName} 已被击败！奖励等级：${'⭐'.repeat(rewardTier)}</p>`;
                // 根据奖励等级发放奖励
                giveBossReward(rewardTier);
                // 添加离开选项
                let btn = document.createElement('button');
                btn.className = 'choice-btn';
                btn.innerHTML = '<h3>🚪 离开冰原，前往世界</h3>';
                btn.onclick = () => enterNode('start');
                panel.appendChild(btn);
            }
        };
        return;
    }

    function giveBossReward(tier) {
        // tier 1: 火把模式普通奖励；tier 2: 正常奖励；tier 3: 威慑模式更好奖励
        let bonusGold = tier * 25;
        gold += bonusGold;
        // 额外属性奖励
        if(tier >= 2) {
            player.maxHp += 30;
            player.hp += 30;
        }
        if(tier >= 3) {
            player.atk += 10;
            player.crit = Math.min(70, player.crit + 5);
        }
        updateTopBar();
        let panel = document.getElementById('grid-event-panel');
        panel.innerHTML += `<p style="color:var(--gold);">🎁 额外奖励：${bonusGold} 寻宝币${tier>=2?', 最大生命+30':''}${tier>=3?', 攻击+10, 暴击+5%':''}</p>`;
    }

    // 普通世界节点 Boss
    if(currentNode && currentNode.type === 'boss') {
        if(!defeatedBosses.includes(currentNodeId)) defeatedBosses.push(currentNodeId);
        log(`🏆 击败了 ${currentNode.name}！`); show('battle-end-btn');
        document.getElementById('battle-end-btn').innerText = '继续冒险';
        document.getElementById('battle-end-btn').onclick = () => {
            hide('battle-screen');
            if(defeatedBosses.length >= 3) {
                hide('top-bar'); show('game-over-screen');
                document.getElementById('end-title').innerHTML = "🎉 寻宝真神 🎉";
                document.getElementById('end-desc').innerHTML = `你击败了所有Boss，找到了传说中的宝藏！`;
            } else {
                enterNode(currentNodeId);
            }
        };
        return;
    }

    // 普通战斗奖励
    hide('battle-screen'); show('reward-screen');
    let container = document.getElementById('reward-container'); container.innerHTML = '';

    // 固定回血选项
    let fixedBtn = document.createElement('div'); fixedBtn.className = 'choice-btn fixed-heal';
    fixedBtn.innerHTML = `<div class="collab-badge badge-unique" style="background:#10b981;">战斗补给</div><h3>🍖 恢复大餐</h3><p>固定选项：恢复 100% 生命值！</p>`;
    fixedBtn.onclick = () => { player.hp = player.maxHp; claimRewardDone(); };
    container.appendChild(fixedBtn);

    if (duckJunDefeatedThisRound) {
        document.getElementById('reward-gold-text').innerText = dropGold + " (并爆出了传说宝物！)";
        let btn = document.createElement('div'); btn.className = 'choice-btn duck-reward';
        btn.innerHTML = `<div class="collab-badge badge-unique">唯一神器</div><h3>🦆 鸭俊板板</h3><p style="color:var(--text-light)">全属性飙升！攻击+30, 生命+100, 吸血+15%, 暴击+15%</p>`;
        btn.onclick = () => { handleAcquireItem(specialItems.find(i => i.id === 'duck_art')); };
        container.appendChild(btn);
        return;
    }

    document.getElementById('reward-gold-text').innerText = dropGold;

    if (player.id === 'zhouge' && Math.random() < 0.1 && !fastFood15Active) {
        let btn = document.createElement('div'); btn.className = 'choice-btn collab-reward-ff';
        btn.innerHTML = `<div class="collab-badge badge-ff">快餐侠专属极低概率</div><h3>🍔 快餐15分钟</h3><p>唯一道具：获取后每回合双方造成伤害强制变为 0 到对方生命上限！</p>`;
        btn.onclick = () => { fastFood15Active = true; handleAcquireItem(specialItems.find(i => i.id === 'ff_15')); };
        container.appendChild(btn);
        return;
    }

    let filteredPool = rewardPool.filter(item => { if (item.isUnique && ownedItems.some(owned => owned.id === item.id)) return false; return true; });
    let shuffled = filteredPool.sort(() => 0.5 - Math.random()).slice(0, 3);
    shuffled.forEach((item) => {
        let btn = document.createElement('div'); 
        btn.className = 'choice-btn ' + (item.isSoso ? 'collab-reward-soso' : (item.isFf ? 'collab-reward-ff' : ''));
        let badge = item.isSoso ? `<div class="collab-badge badge-soso">soso联动</div>` : (item.isFf ? `<div class="collab-badge badge-ff">快餐联动</div>` : '');
        if (item.isUnique && !badge) badge = `<div class="collab-badge badge-unique">唯一道具</div>`;
        btn.innerHTML = `${badge}<h3>${item.icon} ${item.name}</h3><p>${item.desc}</p>`;
        btn.onclick = () => handleAcquireItem(item);
        container.appendChild(btn);
    });
}

function claimRewardDone() {
    updateTopBar();
    // 如果来自网格地图，返回网格
    if(snowGrid) {
        hide('reward-screen');
        show('grid-map-screen');
        snowGridInEvent = false;
        renderGrid();
        let panel = document.getElementById('grid-event-panel');
        panel.innerHTML = '<p style="color:#94a3b8;">奖励已领取，继续探索吧。</p>';
        return;
    }
    if(currentNode && currentNode.next) {
        enterNode(currentNode.next);
    } else {
        enterNode('start');
    }
}

function openShopFromNode(node) {
    window._shopNextNode = node.next || 'start';
    generateShop();
    hide('event-screen'); show('shop-screen');
}

function generateShop() {
    let currentPool = [...shopPool].filter(item => { if (item.isUnique && ownedItems.some(owned => owned.id === item.id)) return false; return true; });
    if(player.id === 'soso5' && sosoDanceInterval > 2 && Math.random() < 0.8) { currentPool.push(specialItems.find(i => i.id === 's7_ticket')); }

    let shuffled = currentPool.sort(() => 0.5 - Math.random()).slice(0, 3);
    let container = document.getElementById('shop-container'); container.innerHTML = '';
    shuffled.forEach((item) => {
        let btn = document.createElement('button');
        btn.className = 'choice-btn shop-item ' + (item.isSoso ? 'collab-reward-soso' : (item.isFf ? 'collab-reward-ff' : ''));
        let badge = item.isSoso ? `<div class="collab-badge badge-soso">soso联动</div>` : (item.isFf ? `<div class="collab-badge badge-ff">快餐联动</div>` : '');
        if (item.isUnique && !badge) badge = `<div class="collab-badge badge-unique">唯一装备</div>`;
        btn.innerHTML = `${badge}<h3>${item.icon} ${item.name} <br><span style="color:var(--gold); font-size:14px;">(🪙 ${item.cost})</span></h3><p>${item.desc}</p>`;
        btn.onclick = () => {
            if(gold < item.cost) return;
            gold -= item.cost;
            if(item.exec) item.exec();
            if(item.isUnique) { 
                ownedItems.push(item);
                if(currentZhenZhen === 'overload' && !zhenZhenUnlocked) unlockZhenZhen();
            }
            btn.disabled = true; btn.style.background = 'rgba(0,0,0,0.5)';
            btn.innerHTML += '<p style="color:var(--atk)">已售罄</p>';
            updateTopBar(); checkShopButtons();
        };
        container.appendChild(btn);
    });
    checkShopButtons();
}

function checkShopButtons() {
    let btns = document.querySelectorAll('.shop-item');
    btns.forEach(btn => {
        let costMatch = btn.innerHTML.match(/\(🪙 (\d+)\)/);
        if(costMatch && gold < parseInt(costMatch[1])) { btn.style.borderColor = '#475569'; btn.style.opacity = '0.6'; }
    });
}

function nextFloor() {
    // 网格地图商店返回
    if(snowGrid) {
        hide('shop-screen');
        show('grid-map-screen');
        snowGridInEvent = false;
        renderGrid();
        let panel = document.getElementById('grid-event-panel');
        panel.innerHTML = '<p style="color:#94a3b8;">购物完毕，继续探索吧。</p>';
        return;
    }
    // 新系统：离开商店，进入预设的下一个节点
    if(window._shopNextNode) {
        enterNode(window._shopNextNode);
        window._shopNextNode = null;
    } else {
        // 兼容旧调用/兜底
        ultUsedThisFloor = false; zhenZhenUsedThisFloor = false;
        prepareEncounter();
    }
}