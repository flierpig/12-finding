// --- 全局状态变量 ---
let player = null, enemy = null;
let gold = 0;
let bossPool = [];
let turn = 1, battleTimer = null;
let speedMode = 1; 
let duckJunEncountered = false;
let duckJunDefeatedThisRound = false;
let pDodges = 0, pHitsTaken = 0, pCrits = 0, ePoisonTicks = 0;
let ultUsesLeft = 3; // 每个地图可使用3次终结技
let sosoUltCooldown = 0; // soso5奥义冷却回合
let erboDamageCount = 0; // 尔波受伤计数
let erboCurrentRipple = null; // 尔波当前波纹
let erboUltUnlocked = false; // 尔波奥义是否解锁
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

// --- 通用区域网格地图变量 ---
let regionGrid = null;
let regionGridPos = { r: 0, c: 0 };
let regionGridInEvent = false;
let currentRegionEvent = null; // 当前触发的事件缓存
let currentRegion = ''; // 'snow'|'coast'|'jungle'

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

    // 窗口大小变化时重新渲染网格地图以适配手机/PC
    window.addEventListener('resize', () => {
        if(regionGrid) renderGrid();
    });
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
    gold = 10; ultUsesLeft = 3; duckJunEncountered = false;

    // 抖抖鸡奥义相关初始化
    player.ultActive = false;
    player.ultDodgeBonus = 0;
    player.frozenTurns = 0;

    // 尔波波纹机制初始化
    erboDamageCount = 0;
    erboCurrentRipple = null;
    erboUltUnlocked = false;
    player.woodShield = false;

    // 初始化镇镇之力
    let zzPool = ['luck', 'crit', 'immortal', 'overload', 'random'];
    currentZhenZhen = zzPool[Math.floor(Math.random() * zzPool.length)];
    zhenZhenUnlocked = false; zhenZhenUsedThisFloor = false; badRngCount = 0;
    
    ownedItems = []; sosoDanceInterval = 3; hasSosoUltItem = false; zhougeSelfDmgStreak = 0; zhougeUltActive = false; 
    fastFood15Active = false; hasFushunItem = false; fushunBattles = 0; fushunPermanent = false; fushunLastImmuneTurn = -99;
    overloadAtkBonus = 0; overloadHpBonus = 0;

    // 网格地图重置
    regionGrid = null; regionGridPos = { r: 0, c: 0 }; regionGridInEvent = false; currentRegionEvent = null;

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
    let regionNames = { snow: '永冻雪地', coast: '风暴海岸', jungle: '瘴气丛林' };
    let locName = currentNode ? currentNode.name : (regionGrid ? regionNames[currentRegion] || '未知之地' : '未知之地');
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
    zhenZhenUsedThisFloor = false;

    // 区域地图：进入网格模式（冰原/海岸/丛林）
    if(nodeId === 'snow_start' || nodeId === 'coast_start' || nodeId === 'jungle_start') {
        enterRegionMap(nodeId);
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
    if(player.id === 'erbo') {
        if(!erboUltUnlocked) ultStatus.innerText = "🌊 波纹奥义：需要暴击解锁";
        else if(erboCurrentRipple) ultStatus.innerText = `🌊 波纹奥义：${erboCurrentRipple.icon}${erboCurrentRipple.name} 就绪`;
        else ultStatus.innerText = "🌊 波纹奥义：无波纹可用（受三次伤害收集）";
    } else {
        ultStatus.innerText = ultUsesLeft <= 0 ? "⚠️ 终结技本图已耗尽" : `✨ 终结技：剩余 ${ultUsesLeft} 次`;
    }
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

// ==================== 通用区域网格地图系统 ====================

const regionMetaGrid = {
    snow_start:  { title: '❄️ 永冻雪地', eventPool: snowEvents,     bossEvent: snowBossEvent,     region: 'snow' },
    coast_start: { title: '🌊 风暴海岸', eventPool: coastEvents,    bossEvent: coastBossEvent,    region: 'coast' },
    jungle_start:{ title: '🌿 瘴气丛林', eventPool: jungleEvents,   bossEvent: jungleBossEvent,   region: 'jungle' }
};

function enterRegionMap(nodeId) {
    let meta = regionMetaGrid[nodeId];
    if(!meta) { console.error('未知区域节点:', nodeId); return; }

    currentRegion = meta.region;
    ultUsesLeft = 3;
    sosoUltCooldown = 0;
    regionGrid = generateRegionGrid(meta.eventPool, meta.bossEvent, meta.region);
    regionGridPos = { r: 0, c: 0 };
    regionGridInEvent = false;
    currentRegionEvent = null;

    hide('event-screen'); hide('battle-screen'); hide('reward-screen'); hide('shop-screen');
    show('grid-map-screen');

    document.getElementById('grid-map-title').innerText = meta.title;
    updateTopBar();
    renderGrid();
    updateGridButtons();
}

function getCurrentNode() {
    if(!regionGrid) return null;
    return regionGrid.nodeMap[`${regionGridPos.r},${regionGridPos.c}`];
}

function renderGrid() {
    let container = document.getElementById('grid-container');
    container.innerHTML = '';
    // 手机端使用更小的格子尺寸
    let isMobile = window.innerWidth <= 768;
    let cellSize = isMobile ? 40 : 50;
    container.style.gridTemplateColumns = `repeat(${regionGrid.width}, ${cellSize}px)`;
    container.style.gridTemplateRows = `repeat(${regionGrid.height}, ${cellSize}px)`;

    for(let r = 0; r < regionGrid.height; r++) {
        for(let c = 0; c < regionGrid.width; c++) {
            let node = regionGrid.nodeMap[`${r},${c}`];
            let div = document.createElement('div');
            div.className = 'grid-cell';
            div.dataset.r = r;
            div.dataset.c = c;

            let isCurrent = (r === regionGridPos.r && c === regionGridPos.c);
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

    document.getElementById('grid-pos-text').innerText = `${regionGridPos.r},${regionGridPos.c}`;
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
    if(regionGridInEvent) return;
    let current = getCurrentNode();
    if(!current) return;
    let targetId = null;
    if(direction === 'up') targetId = `${current.r-1},${current.c}`;
    if(direction === 'down') targetId = `${current.r+1},${current.c}`;
    if(direction === 'left') targetId = `${current.r},${current.c-1}`;
    if(direction === 'right') targetId = `${current.r},${current.c+1}`;

    let target = regionGrid.nodeMap[targetId];
    if(target) {
        if(!current.connections.includes(targetId)) {
            current.connections.push(targetId);
        }
        if(!target.connections.includes(current.id)) {
            target.connections.push(current.id);
        }
        regionGridPos = { r: target.r, c: target.c };
    }

    renderGrid();
    updateGridButtons();

    let cell = getCurrentNode();
    if(cell && !cell.visited) {
        triggerGridEvent();
    } else if(cell) {
        let panel = document.getElementById('grid-event-panel');
        panel.innerHTML = '<p style="color:#64748b;">这里已经探索过了。</p>';
    }
}

function triggerGridEvent() {
    let cell = getCurrentNode();
    if(!cell) return;
    if(cell.visited && cell.type !== 'start') return;

    cell.visited = true;
    regionGridInEvent = true;

    let panel = document.getElementById('grid-event-panel');
    panel.innerHTML = '';

    if(cell.type === 'start') {
        panel.innerHTML = '<p style="color:#94a3b8;">这里是你的出发点，寒风从四面八方吹来。选择一个方向前进吧。</p>';
        regionGridInEvent = false;
        renderGrid();
        return;
    }

    if(cell.type === 'boss') {
        let bossEvt = cell.event || snowBossEvent;
        currentRegionEvent = bossEvt;
        panel.innerHTML = `<h3>${bossEvt.icon} ${bossEvt.name}</h3><p>${bossEvt.desc}</p>`;
        let bossOptions = bossEvt.options;
        bossOptions.forEach(opt => {
            let btn = document.createElement('button');
            btn.className = 'choice-btn';
            // 冰原Boss特殊处理：火把道具检查
            if(currentRegion === 'snow' && opt.text === '一把火烧了它！') {
                let hasTorch = ownedItems.some(it => it.id === 'torch') || ownedItems.some(it => it.id === 'r_torch') || ownedItems.some(it => it.id === 's_torch');
                if(!hasTorch) {
                    btn.classList.add('disabled');
                    btn.disabled = true;
                    btn.title = '需要道具：火把';
                    btn.innerHTML = `<h3>${opt.text}</h3><p style="font-size:12px;color:#64748b;">需要火把</p>`;
                    btn.onclick = null;
                    panel.appendChild(btn);
                    return;
                }
            }
            btn.innerHTML = `<h3>${opt.text}</h3>`;
            btn.onclick = () => resolveSnowEventOption(opt.result);
            panel.appendChild(btn);
        });
        renderGrid();
        return;
    }

    // 普通事件
    let evt = cell.event;
    currentRegionEvent = evt;
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
        regionGridInEvent = false;
        panel.innerHTML = '<p style="color:#94a3b8;">你选择了离开，继续探索这片冰原吧。</p>';
        renderGrid();
    }
    else if(result.type === 'combat' || result.type === 'combat_random') {
        let mobId = result.mobId;
        if(result.type === 'combat_random') {
            // 根据当前区域随机选择小怪
            let pools = {
                snow: ['ice_block', 'cold_jun', 'gugugaga', 'frost_wolf', 'ice_imp'],
                coast: ['crab', 'seagull', 'sea_serpent', 'sand_worm'],
                jungle: ['snake', 'monkey', 'frog', 'mantis']
            };
            let pool = pools[currentRegion] || pools.snow;
            mobId = pool[Math.floor(Math.random() * pool.length)];
        }
        prepareRegionMob(mobId);
        startCombat();
    }
    else if(result.type === 'boss_combat') {
        prepareRegionBoss(result.mode);
        startCombat();
    }
    else if(result.type === 'shop') {
        regionGridInEvent = false;
        window._shopNextNode = null; // 网格商店结束后不进入节点，直接回网格
        window._returnToGrid = true;
        generateShop();
        hide('grid-map-screen'); show('shop-screen');
    }
    else if(result.type === 'gold') {
        gold += result.amount;
        updateTopBar();
        regionGridInEvent = false;
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
        regionGridInEvent = false;
        panel.innerHTML = `<p>${result.text || (result.amount > 0 ? '恢复了生命值。' : '受到了伤害。')}</p>`;
        renderGrid();
    }
    else if(result.type === 'custom') {
        handleCustomEvent(result.action, panel);
    }
    else if(result.type === 'nothing') {
        regionGridInEvent = false;
        panel.innerHTML = '<p style="color:#94a3b8;">什么都没发生。</p>';
        renderGrid();
    }
}

// 自定义事件处理
function handleCustomEvent(action, panel) {
    switch(action) {
        case 'mushroom_help': {
            // 给他帮助：需要拥有祭坛道具，获得菇菇之力
            let hasAltar = ownedItems.some(it => it.id === 'altar' || it.id === 'r_altar' || it.id === 's_altar');
            if(!hasAltar) {
                panel.innerHTML = '<p style="color:#94a3b8;">你没有祭坛道具，无法帮助河里菇。</p>';
                regionGridInEvent = false;
                renderGrid();
            } else {
                // 获得菇菇之力
                let item = specialItems.find(i => i.id === 'mushroom_power');
                if(item && !ownedItems.some(o => o.id === 'mushroom_power')) {
                    if(item.exec) item.exec();
                    ownedItems.push(item);
                }
                panel.innerHTML = '<p style="color:var(--heal);">🍄 河里菇感受到了祭坛的力量，赐予你菇菇之力！闪避+5%，成功闪避可提升速度。</p>';
                regionGridInEvent = false;
                updateTopBar();
                renderGrid();
            }
            break;
        }
        case 'cold_jun_greet': {
            // 大喊打招呼：50%概率直接胜利获得奖励，50%扣血
            if(Math.random() < 0.5) {
                let rewardGold = Math.floor(Math.random() * 20 + 15);
                gold += rewardGold;
                panel.innerHTML = `<p style="color:var(--gold);">🎉 冷俊被你吓了一跳，丢下${rewardGold}金币逃走了！</p>`;
                regionGridInEvent = false;
                updateTopBar();
                renderGrid();
            } else {
                player.hp = Math.max(1, player.hp - 25);
                panel.innerHTML = '<p style="color:var(--atk);">❄️ 冷俊被激怒了，朝你猛攻一击！损失25生命。</p>';
                regionGridInEvent = false;
                updateTopBar();
                renderGrid();
            }
            break;
        }
        case 'zhen_erwa_chant': {
            // 念诵超度经文：50%削弱属性，50%增强属性
            if(Math.random() < 0.5) {
                // 成功超度，削弱镇二娃属性（存入全局，下次战斗生效）
                window._zhenErwaWeakened = true;
                panel.innerHTML = '<p style="color:var(--heal);">📿 超度经文生效了！镇二娃的怨灵被安抚，它的属性已被削弱。</p>';
            } else {
                window._zhenErwaBuffed = true;
                panel.innerHTML = '<p style="color:var(--atk);">😡 经文激怒了镇二娃！它的怨灵之力更加狂暴了。</p>';
            }
            regionGridInEvent = false;
            renderGrid();
            break;
        }
        case 'frozen_chest_smash': {
            // 砸开冰层：随机金币
            let amount = Math.floor(Math.random() * 25 + 10);
            gold += amount;
            panel.innerHTML = `<p style="color:var(--gold);">🪙 砸开宝箱，获得 ${amount} 寻宝币！</p>`;
            regionGridInEvent = false;
            updateTopBar();
            renderGrid();
            break;
        }
        case 'frozen_chest_melt': {
            // 用体温融化：有概率获得寒气之体
            if(Math.random() < 0.15) {
                let item = specialItems.find(i => i.id === 'ice_body');
                if(item && !ownedItems.some(o => o.id === 'ice_body')) {
                    ownedItems.push(item);
                    panel.innerHTML = '<p style="color:var(--heal);">❄️ 你的体温与寒冰融合，获得了寒气之体！免疫冻结效果。</p>';
                } else {
                    panel.innerHTML = '<p style="color:#94a3b8;">你费尽全力融化冰层，但什么都没发生。</p>';
                }
            } else {
                player.hp = Math.max(1, player.hp - 20);
                panel.innerHTML = '<p style="color:var(--atk);">❄️ 冻伤了，损失20生命。冰层纹丝不动。</p>';
            }
            regionGridInEvent = false;
            updateTopBar();
            renderGrid();
            break;
        }
        case 'hot_spring_bath': {
            // 泡个温泉：随机百分比恢复
            let pct = (Math.random() * 0.4 + 0.2).toFixed(2); // 20%~60%
            let heal = Math.floor(player.maxHp * pct);
            player.hp = Math.min(player.maxHp, player.hp + heal);
            panel.innerHTML = `<p style="color:var(--heal);">♨️ 泡温泉恢复了 ${Math.floor(pct*100)}% 生命（${heal}点）！</p>`;
            regionGridInEvent = false;
            updateTopBar();
            renderGrid();
            break;
        }
        case 'ice_bridge_dash': {
            // 全力冲刺：有概率扣更多血
            if(Math.random() < 0.4) {
                player.hp = Math.max(1, player.hp - 25);
                panel.innerHTML = '<p style="color:var(--atk);">🌉 冰桥在你脚下断裂！你重重摔了下去，损失25生命。</p>';
            } else {
                panel.innerHTML = '<p style="color:var(--heal);">🌉 你成功冲刺过了冰桥！</p>';
            }
            regionGridInEvent = false;
            updateTopBar();
            renderGrid();
            break;
        }
        case 'ice_bridge_retreat': {
            // 退回去找别的路：无法通过此节点
            panel.innerHTML = '<p style="color:var(--atk);">🌉 你试图退回去，但来时的路已经被雪崩掩埋，无法通过此节点了。</p>';
            // 标记当前节点不可通行（设置一个标记，下次渲染时禁用）
            let cell = getCurrentNode();
            if(cell) cell.blocked = true;
            regionGridInEvent = false;
            renderGrid();
            break;
        }
        default:
            panel.innerHTML = '<p style="color:#94a3b8;">什么都没发生。</p>';
            regionGridInEvent = false;
            renderGrid();
    }
}

function prepareRegionMob(mobId) {
    let scale = getDifficultyScale();
    duckJunDefeatedThisRound = false;
    // 根据当前区域选择怪物池
    let mobPool = { snow: snowMobs, coast: coastMobs, jungle: jungleMobs };
    let pool = mobPool[currentRegion] || snowMobs;
    let mob = pool[mobId];
    if(!mob) { prepareEnemyForNode({}); return; }
    enemy = JSON.parse(JSON.stringify(mob));
    enemy.maxHp = Math.floor(enemy.maxHp * scale);
    enemy.hp = enemy.maxHp;
    enemy.atk = Math.floor(enemy.atk * scale);
    // 特殊标记用于战斗逻辑（保留 isSnowMob 兼容旧逻辑，新增 isRegionMob）
    enemy.isRegionMob = true;
    if(currentRegion === 'snow') enemy.isSnowMob = true;

    // 镇二娃超度效果
    if(mobId === 'zhen_erwa') {
        if(window._zhenErwaWeakened) {
            enemy.maxHp = Math.floor(enemy.maxHp * 0.7);
            enemy.hp = enemy.maxHp;
            enemy.atk = Math.floor(enemy.atk * 0.7);
            log(`<span class="log-heal">📿 镇二娃被超度削弱！生命和攻击降低30%。</span>`);
            window._zhenErwaWeakened = false;
        } else if(window._zhenErwaBuffed) {
            enemy.maxHp = Math.floor(enemy.maxHp * 1.3);
            enemy.hp = enemy.maxHp;
            enemy.atk = Math.floor(enemy.atk * 1.3);
            log(`<span class="log-atk">😡 镇二娃被激怒！生命和攻击提升30%。</span>`);
            window._zhenErwaBuffed = false;
        }
    }

    // 咕咕嘎嘎初始化
    if(mobId === 'gugugaga') {
        enemy.escapeTurn = 5;
        enemy.turnCount = 0;
    }
}

function prepareRegionBoss(mode) {
    let scale = getDifficultyScale();
    duckJunDefeatedThisRound = false;

    // 根据区域生成不同Boss
    if(currentRegion === 'coast') {
        prepareCoastBoss(mode, scale);
    } else if(currentRegion === 'jungle') {
        prepareJungleBoss(mode, scale);
    } else {
        prepareSnowBoss(mode, scale);
    }
}

function prepareCoastBoss(mode, scale) {
    let isStealth = (mode === 'stealth');
    let isHarpoon = (mode === 'harpoon');
    enemy = {
        id: 'coast_boss_mob', icon: '🌀', name: '深渊海妖',
        hp: 600, maxHp: 600, atk: 26, speed: 10, crit: 0, lifesteal: 0, dodge: 0,
        isCoastBoss: true, bossMode: mode,
        tentacleStun: 0,
        rewardTier: isStealth ? 3 : (isHarpoon ? 2 : 1)
    };
    enemy.maxHp = Math.floor(enemy.maxHp * scale * 1.4); enemy.hp = enemy.maxHp;
    enemy.atk = Math.floor(enemy.atk * scale * 1.2);
    if(isStealth) { enemy.maxHp = Math.floor(enemy.maxHp * 1.3); enemy.hp = enemy.maxHp; enemy.atk = Math.floor(enemy.atk * 1.3); }
    log(`<span class="log-boss">👑👑👑 [Boss战开始] ${enemy.name} 从漩涡中现身！</span>`);
    if(isStealth) log(`<span class="log-boss-warning">⚠️ 水下突袭！海妖的触手更加狂暴，但奖励更丰厚！</span>`);
    if(isHarpoon) log(`<span class="log-boss">🔱 鱼叉刺穿了海妖的触手，它的速度降低了！</span>`);
}

function prepareJungleBoss(mode, scale) {
    let isFire = (mode === 'fire');
    let isRoots = (mode === 'roots');
    enemy = {
        id: 'jungle_boss_mob', icon: '🌳', name: '丛林主宰',
        hp: 700, maxHp: 700, atk: 24, speed: 6, crit: 0, lifesteal: 0, dodge: 0,
        isJungleBoss: true, bossMode: mode,
        regeneration: 10,
        rewardTier: isRoots ? 3 : (isFire ? 2 : 1)
    };
    enemy.maxHp = Math.floor(enemy.maxHp * scale * 1.4); enemy.hp = enemy.maxHp;
    enemy.atk = Math.floor(enemy.atk * scale * 1.2);
    if(isRoots) { enemy.maxHp = Math.floor(enemy.maxHp * 1.3); enemy.hp = enemy.maxHp; enemy.atk = Math.floor(enemy.atk * 1.3); }
    log(`<span class="log-boss">👑👑👑 [Boss战开始] ${enemy.name} 从古树中苏醒！</span>`);
    if(isRoots) log(`<span class="log-boss-warning">⚠️ 你切断了它的根系！古树狂暴了，但奖励更丰厚！</span>`);
    if(isFire) log(`<span class="log-boss">🔥 火焰烧伤了古树，它的再生能力被削弱了！</span>`);
}

function prepareSnowBoss(mode, scale) {
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
        iceShield: 3,
        maxIceShield: 3,
        freezeBar: 0,
        freezeThreshold: 3,
        frozenTurns: 0,
        turnCounter: 0,
        dread: isDread,
        torchUsed: isTorch,
        rewardTier: isDread ? 3 : (isTorch ? 1 : 2)
    };

    if(isTorch) { enemy.iceShield = 0; }
    if(isDread) { enemy.maxHp = Math.floor(enemy.maxHp * 1.3); enemy.hp = enemy.maxHp; enemy.atk = Math.floor(enemy.atk * 1.3); }

    enemy.maxHp = Math.floor(enemy.maxHp * scale * 1.4);
    enemy.hp = enemy.maxHp;
    enemy.atk = Math.floor(enemy.atk * scale * 1.2);

    log(`<span class="log-boss">👑👑👑 [Boss战开始] ${enemy.name} 登场！</span>`);
    if(isDread) log(`<span class="log-boss-warning">⚠️ 威慑领域展开！本场战斗中你无法暴击、无法闪避！但胜利后的奖励将更加丰厚！</span>`);
    if(isTorch) log(`<span class="log-boss">🔥 火把的光芒压制了寒气！${enemy.name} 无法生成冰盾！</span>`);
    log(`<span class="log-boss">🛡️ 菇菇祭祀拥有 ${enemy.iceShield} 层冰盾（上限3层），每层减伤20%！每3回合生成一层冰盾！</span>`);
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
    erboDamageCount = 0;
    enemy.burn = 0; enemy.atkDebuffTurns = 0; enemy.currentAtkDebuff = 0;
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
    player.ultActive = false;
    player.ultDodgeBonus = 0;
    player.woodShield = false;
    if(enemy) {
        enemy.burn = 0;
        enemy.atkDebuffTurns = 0;
        enemy.currentAtkDebuff = 0;
    }
}

// --- 战斗逻辑 ---
function triggerSosoDance(char) {
    let r = Math.random(); let danceText = ""; let effects = [];
    let p = (1 - 0.05) / 3;
    if(r < 0.05) { effects = ['dodge', 'crit', 'heal']; danceText = "🌟SOSO5终极综合舞🌟"; }
    else if(r < 0.05 + p) { effects = ['dodge']; danceText = "💨闪避舞"; }
    else if(r < 0.05 + p * 2) { effects = ['crit']; danceText = "💥暴击舞"; }
    else { effects = ['heal']; danceText = "❤️回血舞"; }

    log(`<span class="log-collab-soso">🕺 [soso5王联动] ${char.name} 触发了 ${danceText}！</span>`);
    if(effects.includes('dodge')) char.activeDodgeDance = true;
    if(effects.includes('crit')) char.activeCritDance = true;
    if(effects.includes('heal')) { let heal = Math.floor(char.maxHp * 0.2); char.hp = Math.min(char.maxHp, char.hp + heal); }
}

function battleTick() {
    if(!battleActive) return;

    // 火波纹灼烧：敌人每回合扣血
    if(enemy && enemy.burn && enemy.burn > 0) {
        enemy.hp -= enemy.burn;
        log(`<span class="log-dmg">🔥 [火波灼烧] 敌人被灼烧，扣除 ${enemy.burn} 生命！</span>`);
    }

    // 土波纹降攻效果：敌人攻击力降低
    if(enemy && enemy.atkDebuffTurns > 0) {
        enemy.atkDebuffTurns--;
        if(enemy.atkDebuffTurns === 0) {
            log(`<span class="log-skill">🪨 土波压制效果结束，敌人攻击力恢复！</span>`);
        }
    }

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

    // 咕咕嘎嘎逃跑逻辑
    if(enemy && enemy.id === 'gugugaga') {
        enemy.turnCount++;
        if(enemy.turnCount >= enemy.escapeTurn) {
            // 逃跑并偷道具
            log(`<span class="log-boss">🐦 咕咕嘎嘎拍打着翅膀逃跑了！它趁机从你身上偷走了一件道具...</span>`);
            // 偷走一件非特殊道具
            let stealable = ownedItems.filter(it => it.id !== 'duck_art' && it.id !== 'ff_15' && it.id !== 's7_ticket');
            if(stealable.length > 0) {
                let stolen = stealable[Math.floor(Math.random() * stealable.length)];
                ownedItems = ownedItems.filter(it => it.id !== stolen.id);
                log(`<span class="log-atk">🐦 咕咕嘎嘎偷走了你的 ${stolen.name}！</span>`);
            } else {
                log(`<span class="log-skill">🐦 你身上没有可偷的道具，咕咕嘎嘎空手而归。</span>`);
            }
            enemy.hp = 0;
            updateBattleUI(); updateTopBar();
            checkDeath();
            return;
        }
    }

    // 菇菇祭祀冰盾生成逻辑：每3回合产生一层冰盾（上限3层）
    if(enemy && enemy.isSnowBoss && !enemy.torchUsed) {
        enemy.turnCounter++;
        if(enemy.turnCounter % 3 === 0 && enemy.iceShield < enemy.maxIceShield) {
            enemy.iceShield++;
            log(`<span class="log-boss">🛡️ 菇菇祭祀正在凝聚寒气，生成一层冰盾！当前冰盾：${enemy.iceShield}/${enemy.maxIceShield} 层</span>`);
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

    turn++;
    if(player.id === 'soso5' && sosoUltCooldown > 0) sosoUltCooldown--;
    updateBattleUI(); updateTopBar(); checkUltReady();
    if(player.hp > 0 && enemy.hp > 0) battleTimer = setTimeout(battleTick, speedMode === 1 ? 1200 : 600);
}

function processAction(atkChar, defChar) {
    let isPlayerAtk = (atkChar.id === player.id);

    if(atkChar.id === 'zhouge') {
        let ultActive = isPlayerAtk ? zhougeUltActive : false;
        let isSelfTarget = !ultActive && Math.random() < 0.3;
        let target = isSelfTarget ? atkChar : defChar;
        let dmg = Math.floor(target.maxHp * 0.05);
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

    let damage = atkChar.atk;
    // 土波纹降攻：敌人攻击力降低
    if(!isPlayerAtk && enemy.currentAtkDebuff) {
        damage = Math.max(1, damage - enemy.currentAtkDebuff);
    }
    let attackTimes = 1;
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

    // 尔波奥义解锁：玩家暴击后解锁
    if(isPlayerAtk && isCrit && player.id === 'erbo' && !erboUltUnlocked) {
        erboUltUnlocked = true;
        log(`<span class="log-ult">🌊 [尔波奥义] 暴击觉醒！奥义已解锁！</span>`);
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
            // 木波纹护盾：免疫伤害并反伤
            if(!isPlayerAtk && player.woodShield) {
                player.woodShield = false;
                let reflect = Math.floor(damage * 0.1);
                atkChar.hp -= reflect;
                log(`<span class="log-skill">🌿 [木波护盾] 免疫伤害！反伤 ${reflect}！</span>`);
                damage = 0;
            }

            // 冰盾减伤
            if(defChar.isSnowBoss && defChar.iceShield > 0) {
                let reducePct = defChar.iceShield * 0.2;
                let reduced = Math.floor(damage * (1 - reducePct));
                log(`<span class="log-boss">🛡️ 冰盾抵挡！伤害从 ${damage} 降低至 ${reduced}（减伤 ${Math.floor(reducePct*100)}%）</span>`);
                damage = reduced;
            }

            defChar.hp -= damage; if(!isPlayerAtk) pHitsTaken++; log(`${atkChar.name} 造成 <span class="log-dmg">${damage}</span> 伤害！`);

            // 尔波波纹收集：玩家受伤害时计数
            if(!isPlayerAtk && player.id === 'erbo' && !erboCurrentRipple) {
                erboDamageCount++;
                log(`<span class="log-skill">🌊 [尔波] 波纹能量 +1（${erboDamageCount}/3）</span>`);
                if(erboDamageCount >= 3) {
                    collectRipple();
                }
            }
            let lifestealPct = atkChar.lifesteal || 0; if(atkChar.id === 'final') lifestealPct += 30;
            if(lifestealPct > 0) { let heal = Math.floor(damage * lifestealPct / 100); atkChar.hp = Math.min(atkChar.maxHp, atkChar.hp + heal); }
            if(atkChar.id === 'snake') defChar.poison += Math.floor(atkChar.atk * 0.4);
            if(defChar.id === 'ox') defChar.atk += Math.floor(defChar.maxHp * 0.02);
            if(defChar.id === 'dog') { let ref = Math.floor(damage * 0.3); atkChar.hp -= ref; }

            // 火把灼烧效果
            if(isPlayerAtk && ownedItems.some(it => it.id === 'torch')) {
                if(Math.random() < 0.3) {
                    let burn = Math.floor(damage * 0.2);
                    defChar.hp -= burn;
                    log(`<span class="log-atk">🔥 [火把灼烧] 敌人被火焰灼烧，额外受到 ${burn} 点伤害！</span>`);
                }
            }

            // 冰盾层数衰减：受击少一层
            if(defChar.isSnowBoss && defChar.iceShield > 0) {
                defChar.iceShield--;
                log(`<span class="log-boss">🧊 冰盾碎裂一层！剩余：${defChar.iceShield} 层</span>`);
            }

            // 菇菇祭祀冻结条：攻击命中玩家时积累
            if(atkChar.isSnowBoss && defChar.id === player.id) {
                // 寒气之体免疫冻结
                if(ownedItems.some(it => it.id === 'ice_body')) {
                    log(`<span class="log-skill">❄️ [寒气之体] 寒气被你吸收，免疫冻结！</span>`);
                } else {
                    atkChar.freezeBar++;
                    log(`<span class="log-boss-warning">❄️ 寒气入侵！冻结条 ${atkChar.freezeBar}/${atkChar.freezeThreshold}</span>`);
                    if(atkChar.freezeBar >= atkChar.freezeThreshold) {
                        defChar.frozenTurns = 1;
                        atkChar.freezeBar = 0;
                        log(`<span class="log-boss-warning">❄️❄️❄️ 你被完全冻结！下一回合无法行动！</span>`);
                    }
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
                if(ownedItems.some(it => it.id === 'ice_body')) {
                    log(`<span class="log-skill">❄️ [寒气之体] 寒气被你吸收，免疫冻结！</span>`);
                } else if(Math.random() < 0.35) {
                    defChar.frozenTurns = 1;
                    log(`<span class="log-boss-warning">❄️ [冷俊] 你被冻结一回合！</span>`);
                }
            }

            // 河里菇冰冻领域
            if(atkChar.isSnowMob && atkChar.special === 'freeze_aura' && defChar.id === player.id) {
                if(ownedItems.some(it => it.id === 'ice_body')) {
                    log(`<span class="log-skill">❄️ [寒气之体] 冰冻领域对你无效！</span>`);
                } else if(Math.random() < 0.4) {
                    defChar.frozenTurns = 1;
                    log(`<span class="log-boss-warning">🍄 [河里菇] 冰冻领域让你无法动弹！</span>`);
                }
            }

            // 镇二娃减速光环
            if(atkChar.isSnowMob && atkChar.special === 'slow_aura' && defChar.id === player.id) {
                defChar.speed = Math.max(1, defChar.speed - 1);
                log(`<span class="log-boss">👶 [镇二娃] 怨灵哀嚎降低你的速度！</span>`);
            }

        } else if (!isHit) {
            log(`${defChar.name} 闪避了攻击！💨`);
            // 菇菇之力：闪避成功后提升速度
            if(isPlayerAtk && ownedItems.some(it => it.id === 'mushroom_power')) {
                player.speed += 1;
                log(`<span class="log-skill">🍄 [菇菇之力] 闪避成功，速度+1！（当前速度 ${player.speed}）</span>`);
            }
        }
        if(checkDeath()) return false;
    }
    return true;
}

// --- 尔波波纹系统 ---
const rippleTypes = [
    { id: 'erbo', name: '尔波纹', icon: '🌊', desc: '连续进行十次攻击' },
    { id: 'water', name: '水波纹', icon: '💧', desc: '吸取对方10%生命' },
    { id: 'fire', name: '火波纹', icon: '🔥', desc: '灼烧对方，每回合扣5%血量' },
    { id: 'wood', name: '木波纹', icon: '🌿', desc: '免疫下一次伤害，反伤10%' },
    { id: 'gold', name: '金波纹', icon: '✨', desc: '攻击力永久+5' },
    { id: 'earth', name: '土波纹', icon: '🪨', desc: '对方攻击力下降20%两回合' }
];

function collectRipple() {
    let ripple = rippleTypes[Math.floor(Math.random() * rippleTypes.length)];
    erboCurrentRipple = ripple;
    erboDamageCount = 0;
    log(`<span class="log-ult">🌊 [尔波] 波纹共鸣！获得 <b>${ripple.icon} ${ripple.name}</b>！效果：${ripple.desc}</span>`);
    checkUltReady();
}

function useErboRipple() {
    if(!erboCurrentRipple) return;

    let ripple = erboCurrentRipple;
    log(`<span class="log-ult">🌊 [尔波奥义] 释放 ${ripple.icon} ${ripple.name}！</span>`);

    switch(ripple.id) {
        case 'erbo':
            // 连续十次攻击
            for(let i = 0; i < 10; i++) {
                let dmg = player.atk;
                enemy.hp -= dmg;
                log(`<span class="log-dmg">🌊 波纹连击 ${i+1}/10！造成 ${dmg} 伤害！</span>`);
            }
            break;
        case 'water':
            // 吸取10%生命
            let drain = Math.floor(enemy.maxHp * 0.1);
            enemy.hp -= drain;
            player.hp = Math.min(player.maxHp, player.hp + drain);
            log(`<span class="log-heal">💧 水波吸取！造成 ${drain} 伤害，回复 ${drain} 生命！</span>`);
            break;
        case 'fire':
            // 灼烧状态：每回合扣5%血
            enemy.burn = Math.floor(enemy.maxHp * 0.05);
            log(`<span class="log-dmg">🔥 火波灼烧！对方进入灼烧状态，每回合扣 ${enemy.burn} 血！</span>`);
            break;
        case 'wood':
            // 免疫下一次伤害并反伤
            player.woodShield = true;
            log(`<span class="log-skill">🌿 木波护盾！下次伤害免疫并反伤10%！</span>`);
            break;
        case 'gold':
            // 攻击力永久+5
            player.atk += 5;
            player.maxAtkBonus = (player.maxAtkBonus || 0) + 5;
            log(`<span class="log-ult">✨ 金波加持！攻击力永久+5！（当前攻击 ${player.atk}）</span>`);
            break;
        case 'earth':
            // 对方攻击力下降20%两回合
            enemy.atkDebuffTurns = 2;
            let debuff = Math.floor(enemy.atk * 0.2);
            enemy.currentAtkDebuff = debuff;
            log(`<span class="log-skill">🪨 土波压制！对方攻击力下降20%两回合！</span>`);
            break;
    }

    erboCurrentRipple = null;
    checkUltReady();
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
    if(!battleActive) return;
    let ready = false; let c = player.id;
    let cooldown = "";
    let rippleText = erboCurrentRipple ? ` (${erboCurrentRipple.icon}${erboCurrentRipple.name})` : "";

    if(c === 'erbo') {
        // 尔波：暴击解锁，有波纹就能用，无次数限制
        if(erboUltUnlocked && erboCurrentRipple) ready = true;
    } else if(ultUsesLeft > 0) {
        if(c === 'soso5') {
            if(sosoUltCooldown <= 0) ready = true;
            else cooldown = ` (冷却 ${sosoUltCooldown} 回合)`;
        }
        if(c === 'zhouge' && zhougeSelfDmgStreak >= 1) ready = true;
        if(c === 'doudouji' && player.ultActive) ready = true;
    }

    let btn = document.getElementById('ult-btn');
    if(ready) {
        btn.className = 'ready'; btn.disabled = false;
        if(c === 'erbo') btn.innerText = `🌊 释放波纹奥义${rippleText}`;
        else btn.innerText = `🔥 释放终结技 (剩余 ${ultUsesLeft} 次) 🔥`;
    } else {
        btn.className = ''; btn.disabled = true;
        if(c === 'erbo') {
            if(!erboUltUnlocked) btn.innerText = "终结技：需要暴击解锁";
            else if(!erboCurrentRipple) btn.innerText = "终结技：无波纹可用";
            else btn.innerText = "终结技：条件未达成";
        } else {
            btn.innerText = `终结技：条件未达成${cooldown}`;
        }
    }
}

function castUltimate() {
    if(!battleActive) return;

    let c = player.id;

    // 尔波单独处理：无次数限制
    if(c === 'erbo') {
        if(!erboUltUnlocked || !erboCurrentRipple) return;
        useErboRipple();
        if(hasSosoUltItem) { log(`<span class="log-collab-soso">💿 [联动道具] 奥义附带尬舞！</span>`); triggerSosoDance(player); }
        updateBattleUI(); updateTopBar(); checkDeath();
        return;
    }

    // 其他角色：需要次数限制
    if(ultUsesLeft <= 0) return;
    if(c === 'soso5' && sosoUltCooldown > 0) return;

    ultUsesLeft--;
    let btn = document.getElementById('ult-btn');
    btn.className = ''; btn.disabled = true;

    if(ultUsesLeft > 0) btn.innerText = `终结技：剩余 ${ultUsesLeft} 次`;
    else btn.innerText = "终结技本图已耗尽";

    log(`<span class="log-ult">🌟 ${player.name} 释放了终结技！🌟</span>`);

    if(c === 'soso5') {
        sosoUltCooldown = 2;
        if(player.hp > enemy.hp) {
            let diff = player.hp - enemy.hp;
            enemy.hp -= diff;
            log(`<span class="log-ult">💥 血差伤害！造成 ${diff} 点真实伤害！</span>`);
        } else if(player.hp < enemy.hp) {
            let diff = enemy.hp - player.hp;
            player.hp = Math.min(player.maxHp, player.hp + diff);
            log(`<span class="log-heal">💚 血差回复！恢复 ${diff} 点生命！</span>`);
            triggerSosoDance(player);
        }
    }
    else if(c === 'zhouge') {
        player.hp = player.maxHp;
        zhougeUltActive = true;
        zhougeSelfDmgStreak = 0;
        log(`<span class="log-heal">💚 回血全满！天赋转为只扣敌方血量！</span>`);
    }
    else if(c === 'doudouji') {
        log(`<span class="log-ult">🐔 [抖抖鸡奥义] 极限闪避爆发！立即进行5次闪避判定！</span>`);
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
            let locName = currentNode ? currentNode.name : (regionGrid ? '永冻雪地' : '未知之地');
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
    ownedItems.push(item);
    if(item.isUnique && currentZhenZhen === 'overload' && !zhenZhenUnlocked) unlockZhenZhen();
    claimRewardDone();
}

function endCombat() {
    // 判断是否来自网格地图
    let fromGrid = (regionGrid !== null);
    let isGridBoss = (enemy && (enemy.isSnowBoss || enemy.isCoastBoss || enemy.isJungleBoss));
    let bossIdMap = { snow_boss_mob: 'snow_boss', coast_boss_mob: 'coast_boss', jungle_boss_mob: 'jungle_boss' };
    let regionNameMap = { snow: '冰原', coast: '海岸', jungle: '丛林' };

    let dropGold = (isGridBoss || (currentNode && currentNode.type === 'boss')) ? Math.floor(Math.random()*30+60) : Math.floor(Math.random()*15 + 15);
    gold += dropGold; updateTopBar();

    // 祭坛进度系统
    let hasAltar = ownedItems.some(it => it.id === 'altar' || it.id === 'r_altar' || it.id === 's_altar');
    if(hasAltar) {
        let progress = 1;
        if(enemy && enemy.isElite) progress = 2;
        if(enemy && (enemy.isSnowBoss || enemy.isCoastBoss || enemy.isJungleBoss)) progress = 4;
        window._altarProgress = (window._altarProgress || 0) + progress;
        log(`<span class="log-skill">⛩️ [祭坛] 进度 +${progress}（当前 ${window._altarProgress}）</span>`);
        while(window._altarProgress >= 4) {
            window._altarProgress -= 4;
            // 发放随机道具
            let randomItems = [...rewardPool, ...shopPool].filter(it => !ownedItems.some(o => o.id === it.id));
            if(randomItems.length > 0) {
                let item = randomItems[Math.floor(Math.random() * randomItems.length)];
                if(item.exec) item.exec();
                ownedItems.push(item);
                log(`<span class="log-ult">⛩️ [祭坛] 进度满4点！你获得了 ${item.name}！</span>`);
            }
        }
        updateTopBar();
    }

    // 网格地图 Boss 战斗
    if(fromGrid && isGridBoss) {
        let bossId = bossIdMap[enemy.id] || 'snow_boss';
        if(!defeatedBosses.includes(bossId)) defeatedBosses.push(bossId);
        let rewardTier = enemy.rewardTier || 2;
        let bossName = enemy.name || 'Boss';
        let regionName = regionNameMap[currentRegion] || '区域';
        log(`🏆 击败了 ${bossName}！`); show('battle-end-btn');
        document.getElementById('battle-end-btn').innerText = `返回${regionName}`;
        document.getElementById('battle-end-btn').onclick = () => {
            hide('battle-screen');
            if(defeatedBosses.length >= 3) {
                hide('top-bar'); show('game-over-screen');
                document.getElementById('end-title').innerHTML = "🎉 寻宝真神 🎉";
                document.getElementById('end-desc').innerHTML = `你击败了所有Boss，找到了传说中的宝藏！`;
            } else {
                // 标记Boss格子已击败，返回网格
                regionGridInEvent = false;
                show('grid-map-screen');
                renderGrid();
                let panel = document.getElementById('grid-event-panel');
                panel.innerHTML = `<p style="color:var(--gold);">🏆 ${bossName} 已被击败！奖励等级：${'⭐'.repeat(rewardTier)}</p>`;
                // 根据奖励等级发放奖励
                giveBossReward(rewardTier);
                // 添加离开选项
                let btn = document.createElement('button');
                btn.className = 'choice-btn';
                btn.innerHTML = `<h3>🚪 离开${regionName}，前往世界</h3>`;
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

    let filteredPool = rewardPool.filter(item => { if (ownedItems.some(owned => owned.id === item.id)) return false; return true; });
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
    if(regionGrid) {
        hide('reward-screen');
        show('grid-map-screen');
        regionGridInEvent = false;
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
    let currentPool = [...shopPool].filter(item => { if (ownedItems.some(owned => owned.id === item.id)) return false; return true; });
    if(player.id === 'soso5' && sosoDanceInterval > 2 && !ownedItems.some(o => o.id === 's7_ticket') && Math.random() < 0.8) { currentPool.push(specialItems.find(i => i.id === 's7_ticket')); }

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
    if(regionGrid) {
        hide('shop-screen');
        show('grid-map-screen');
        regionGridInEvent = false;
        renderGrid();
        let panel = document.getElementById('grid-event-panel');
        panel.innerHTML = '<p style="color:#94a3b8;">购物完毕，继续探索吧。</p>';
        return;
    }
    // 新系统：离开商店，进入预设的下一个节点
    if(window._returnToGrid) {
        window._returnToGrid = false;
        hide('shop-screen'); show('grid-map-screen');
        updateTopBar(); renderGrid(); updateGridButtons();
    } else if(window._shopNextNode) {
        enterNode(window._shopNextNode);
        window._shopNextNode = null;
    } else {
        // 兼容旧调用/兜底
        zhenZhenUsedThisFloor = false;
        prepareEncounter();
    }
}