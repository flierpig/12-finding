// 【事件与大地图节点数据】
// 节点类型：start/event/combat/shop/boss
// 本文件仅暴露数据，渲染与跳转逻辑在 game.js 中处理

const worldMap = {
    // ==================== 起始事件 ====================
    start: {
        id: 'start',
        name: '起始之地',
        type: 'event',
        icon: '🌅',
        desc: '你已经来到了这片大地，你需要做的只是寻宝，关于一切都不需要在意了。',
        options: [
            { text: '睁开眼睛发现身处大陆', result: { type: 'random', targets: ['snow_start', 'coast_start', 'jungle_start'] } },
            { text: '转过身感到一片寒意', result: { type: 'goto', target: 'snow_start' } },
            { text: '抬起头发现植被茂密', result: { type: 'goto', target: 'jungle_start' } }
        ]
    },

    // ==================== 雪地地图 ====================
    snow_start: {
        id: 'snow_start',
        name: '雪地入口',
        type: 'event',
        icon: '❄️',
        desc: '寒风裹挟着碎雪扑面而来，远处有模糊的脚印延伸向白茫茫的深处。',
        options: [
            { text: '沿着脚印前进', result: { type: 'goto', target: 'snow_1' } },
            { text: '向着炊烟方向走', result: { type: 'goto', target: 'snow_shop' } }
        ]
    },
    snow_1: {
        id: 'snow_1',
        name: '冰封峡谷',
        type: 'combat',
        icon: '☃️',
        desc: '冰层下传来不祥的震动，一只雪原怪物从裂隙中爬出！',
        mobBias: 'snow', // 偏好生成雪地风格怪物（后续可扩展）
        next: 'snow_2',
        reward: true
    },
    snow_shop: {
        id: 'snow_shop',
        name: '雪原补给站',
        type: 'shop',
        icon: '🏕️',
        desc: '旅行商人支起了帐篷，锅里煮着热汤。要补充些什么吗？',
        next: 'snow_2'
    },
    snow_2: {
        id: 'snow_2',
        name: '霜风高地',
        type: 'event',
        icon: '🌨️',
        desc: '高地的风雪中矗立着三座路标，分别指向不同的方向。',
        options: [
            { text: '继续深入雪地', result: { type: 'goto', target: 'snow_boss' } },
            { text: '向东穿越海峡', result: { type: 'goto', target: 'coast_2' } },
            { text: '向南进入针叶林', result: { type: 'goto', target: 'jungle_1' } }
        ]
    },
    snow_boss: {
        id: 'snow_boss',
        name: '雪顶巨像',
        type: 'boss',
        icon: '🧊',
        desc: '暴风雪的中心，一尊由寒冰与骸骨堆砌的巨像缓缓站起。',
        bossId: 'snow_golem', // 后续可配置专属Boss模板
        nextOptions: [ // 击败后可选择前往其他地图
            { text: '下山前往海岸', result: { type: 'goto', target: 'coast_start' } },
            { text: '穿越雪林前往丛林', result: { type: 'goto', target: 'jungle_start' } },
            { text: '返回世界起点', result: { type: 'goto', target: 'start' } }
        ]
    },

    // ==================== 海岸地图 ====================
    coast_start: {
        id: 'coast_start',
        name: '海岸沙滩',
        type: 'event',
        icon: '🏖️',
        desc: '腥咸的海风拍打着你的脸颊，沙滩上散落着破碎的贝壳与船板。',
        options: [
            { text: '沿着海岸线走', result: { type: 'goto', target: 'coast_1' } },
            { text: '检查搁浅的船只', result: { type: 'goto', target: 'coast_shop' } }
        ]
    },
    coast_1: {
        id: 'coast_1',
        name: '礁石滩',
        type: 'combat',
        icon: '🦀',
        desc: '潮水退去，隐藏在礁石后的生物向你看过来。',
        mobBias: 'coast',
        next: 'coast_2',
        reward: true
    },
    coast_shop: {
        id: 'coast_shop',
        name: '渔人码头',
        type: 'shop',
        icon: '⚓',
        desc: '老渔夫正在修补渔网，他愿意用寻来的宝物与你交易。',
        next: 'coast_2'
    },
    coast_2: {
        id: 'coast_2',
        name: '海崖哨塔',
        type: 'event',
        icon: '🌊',
        desc: '破败的哨塔上挂着一盏忽明忽暗的灯，塔下有三条路。',
        options: [
            { text: '潜入海底洞穴', result: { type: 'goto', target: 'coast_boss' } },
            { text: '向北攀登雪山', result: { type: 'goto', target: 'snow_1' } },
            { text: '向内陆行进', result: { type: 'goto', target: 'jungle_2' } }
        ]
    },
    coast_boss: {
        id: 'coast_boss',
        name: '深渊海妖',
        type: 'boss',
        icon: '🐙',
        desc: '海水骤然变黑，巨大的触手从漩涡中伸出。',
        bossId: 'sea_kraken',
        nextOptions: [
            { text: '前往雪地', result: { type: 'goto', target: 'snow_start' } },
            { text: '前往丛林', result: { type: 'goto', target: 'jungle_start' } },
            { text: '返回世界起点', result: { type: 'goto', target: 'start' } }
        ]
    },

    // ==================== 丛林地图 ====================
    jungle_start: {
        id: 'jungle_start',
        name: '丛林边缘',
        type: 'event',
        icon: '🌿',
        desc: '湿热的气流夹杂着腐叶味，藤蔓像触手一样垂落在小径两侧。',
        options: [
            { text: '踩着小径前进', result: { type: 'goto', target: 'jungle_1' } },
            { text: '寻找土著营地', result: { type: 'goto', target: 'jungle_shop' } }
        ]
    },
    jungle_1: {
        id: 'jungle_1',
        name: '毒瘴沼泽',
        type: 'combat',
        icon: '🐍',
        desc: '脚下的淤泥冒出气泡，毒虫从腐木中涌出！',
        mobBias: 'jungle',
        next: 'jungle_2',
        reward: true
    },
    jungle_shop: {
        id: 'jungle_shop',
        name: '草药商人',
        type: 'shop',
        icon: '🍃',
        desc: '一位蒙面商人正在研磨草药，她的货架上摆满奇异的瓶罐。',
        next: 'jungle_2'
    },
    jungle_2: {
        id: 'jungle_2',
        name: '古树祭坛',
        type: 'event',
        icon: '🌳',
        desc: '一棵参天古树的树干上刻满了符号，树下有三条隐蔽的小道。',
        options: [
            { text: '进入树洞深处', result: { type: 'goto', target: 'jungle_boss' } },
            { text: '向西返回雪地', result: { type: 'goto', target: 'snow_2' } },
            { text: '向东抵达海岸', result: { type: 'goto', target: 'coast_1' } }
        ]
    },
    jungle_boss: {
        id: 'jungle_boss',
        name: '丛林主宰',
        type: 'boss',
        icon: '🦁',
        desc: '古树的根系开始蠕动，一头被藤蔓缠绕的巨兽从地下钻出。',
        bossId: 'jungle_beast',
        nextOptions: [
            { text: '前往雪地', result: { type: 'goto', target: 'snow_start' } },
            { text: '前往海岸', result: { type: 'goto', target: 'coast_start' } },
            { text: '返回世界起点', result: { type: 'goto', target: 'start' } }
        ]
    }
};

// 地图元信息（用于大地图展示）
const regionMeta = {
    snow: { name: '永冻雪地', icon: '❄️', color: '#38bdf8', nodes: ['snow_start','snow_1','snow_shop','snow_2','snow_boss'] },
    coast: { name: '风暴海岸', icon: '🌊', color: '#22d3ee', nodes: ['coast_start','coast_1','coast_shop','coast_2','coast_boss'] },
    jungle: { name: '瘴气丛林', icon: '🌿', color: '#4ade80', nodes: ['jungle_start','jungle_1','jungle_shop','jungle_2','jungle_boss'] }
};

// Boss 列表（用于通关判定）
const bossNodes = ['snow_boss', 'coast_boss', 'jungle_boss'];

// ==================== 冰原事件池 ====================
// 用于网格地图中随机填充每个格子的事件
// 选项结果类型：combat(战斗) / move(回网格) / heal(回血) / gold(金币) / shop(商店) / nothing(无事)

const snowEvents = [
    {
        id: 'se_river_mushroom',
        name: '冰河边的蘑菇',
        icon: '🍄',
        desc: '河里面生出了一个特殊蘑菇——河里菇，他看起来似乎不想理你。',
        type: 'event',
        options: [
            { text: '打扰他', result: { type: 'combat', mobId: 'river_mushroom' } },
            { text: '悄悄离开', result: { type: 'move' } },
            { text: '给他帮助', result: { type: 'move' } }
        ]
    },
    {
        id: 'se_ice_block_ambush',
        name: '寒气突袭',
        icon: '🧊',
        desc: '脚下的冰层突然裂开，一团寒气凝聚成了怪物——冰镇！',
        type: 'event',
        options: [
            { text: '拔剑迎战', result: { type: 'combat', mobId: 'ice_block' } },
            { text: '尝试绕路', result: { type: 'move' } }
        ]
    },
    {
        id: 'se_cold_jun_wander',
        name: '风雪中的人影',
        icon: '❄️',
        desc: '暴风雪中隐约看到一个身影在游荡，走近才发现是冷俊。他似乎没有发现你。',
        type: 'event',
        options: [
            { text: '偷袭他', result: { type: 'combat', mobId: 'cold_jun' } },
            { text: '悄悄绕开', result: { type: 'move' } },
            { text: '大喊打招呼', result: { type: 'combat', mobId: 'cold_jun' } }
        ]
    },
    {
        id: 'se_zhen_erwa_cry',
        name: '冰层下的哭声',
        icon: '👶',
        desc: '冰层深处传来隐约的哭声，一个被冰封的孩童怨灵——镇二娃，正缓缓睁开眼睛。',
        type: 'event',
        options: [
            { text: '打碎冰层', result: { type: 'combat', mobId: 'zhen_erwa' } },
            { text: '赶紧离开', result: { type: 'move' } },
            { text: '念诵超度经文', result: { type: 'move' } }
        ]
    },
    {
        id: 'se_frozen_chest',
        name: '冰封的宝箱',
        icon: '🎁',
        desc: '雪堆里半埋着一个被坚冰封住的宝箱，隐约能看到里面透出金光。',
        type: 'event',
        options: [
            { text: '砸开冰层', result: { type: 'gold', amount: 25 } },
            { text: '用体温融化', result: { type: 'heal', amount: -20, text: '冻伤了，损失20生命' } },
            { text: '无视它', result: { type: 'move' } }
        ]
    },
    {
        id: 'se_hot_spring',
        name: '地热温泉',
        icon: '♨️',
        desc: '一片冒着热气的温泉池出现在雪地中，水温刚好，让人忍不住想跳进去。',
        type: 'event',
        options: [
            { text: '泡个温泉', result: { type: 'heal', amount: 0.4, text: '恢复了40%生命' } },
            { text: '收集温泉水', result: { type: 'move' } },
            { text: '警惕地离开', result: { type: 'move' } }
        ]
    },
    {
        id: 'se_snow_trap',
        name: '雪陷陷阱',
        icon: '⚠️',
        desc: '你一脚踩空，半个身子陷进了松软的雪坑中，费了很大力气才爬出来。',
        type: 'event',
        options: [
            { text: '爬出来继续前进', result: { type: 'heal', amount: -15, text: '体力消耗，损失15生命' } }
        ]
    },
    {
        id: 'se_lost_child',
        name: '迷路的旅人',
        icon: '🧑‍🦯',
        desc: '一个裹着厚棉袄的旅人缩在岩石后面瑟瑟发抖，他说自己和队伍走散了。',
        type: 'event',
        options: [
            { text: '分给他食物', result: { type: 'heal', amount: -10, text: '你分享了储备，损失10生命' } },
            { text: '给他指路', result: { type: 'gold', amount: 15 } },
            { text: '冷漠离开', result: { type: 'move' } }
        ]
    },
    {
        id: 'se_ice_crystal',
        name: '冰晶矿石',
        icon: '💎',
        desc: '岩壁上嵌着一块闪烁着蓝光的冰晶矿石，看起来价值不菲。',
        type: 'event',
        options: [
            { text: '凿下来带走', result: { type: 'gold', amount: 35 } },
            { text: '吸收冰晶能量', result: { type: 'heal', amount: 0.2, text: '吸收了冰晶之力，恢复20%生命' } },
            { text: '不感兴趣', result: { type: 'move' } }
        ]
    },
    {
        id: 'se_snow_fox',
        name: '雪狐引路',
        icon: '🦊',
        desc: '一只通体雪白的狐狸出现在前方，它看了你一眼，向某个方向跑去，又回头看你。',
        type: 'event',
        options: [
            { text: '跟上它', result: { type: 'gold', amount: 20 } },
            { text: '它可能是陷阱', result: { type: 'move' } },
            { text: '尝试抚摸它', result: { type: 'heal', amount: 0.15, text: '雪狐蹭了蹭你，你感到温暖，恢复15%生命' } }
        ]
    },
    {
        id: 'se_blizzard',
        name: '暴风雪来袭',
        icon: '🌨️',
        desc: '狂风裹挟着暴雪突然袭来，视线瞬间被白色吞噬，连方向都难以辨认。',
        type: 'event',
        options: [
            { text: '顶着风雪前进', result: { type: 'heal', amount: -25, text: '风雪割伤了皮肤，损失25生命' } },
            { text: '找个掩体躲避', result: { type: 'move' } }
        ]
    },
    {
        id: 'se_ice_bridge',
        name: '冰桥断裂',
        icon: '🌉',
        desc: '你走在一条天然的冰桥上，脚下传来不祥的碎裂声，桥身开始摇晃。',
        type: 'event',
        options: [
            { text: '全力冲刺过去', result: { type: 'move' } },
            { text: '小心翼翼地走', result: { type: 'heal', amount: -10, text: '冰桥断裂，你勉强抓住边缘爬上来，损失10生命' } },
            { text: '退回去找别的路', result: { type: 'move' } }
        ]
    },
    {
        id: 'se_snow_shop',
        name: '雪原行商',
        icon: '🏕️',
        desc: '一位裹着兽皮的行商在雪地中支起了小摊，货架上摆着各种稀奇古怪的物品。',
        type: 'shop',
        options: [
            { text: '看看有什么好东西', result: { type: 'shop' } },
            { text: '不买，继续赶路', result: { type: 'move' } }
        ]
    },
    {
        id: 'se_combat_random',
        name: '雪地遭遇',
        icon: '☃️',
        desc: '前方的雪堆突然动了一下，一个怪物从中钻出，挡住了去路！',
        type: 'combat_random',
        options: [
            { text: '迎战', result: { type: 'combat_random' } }
        ]
    }
];

// ==================== 冰原Boss事件：菇菇祭祀祭坛 ====================
const snowBossEvent = {
    id: 'se_snow_boss',
    name: '冰原祭坛',
    icon: '⛩️',
    desc: '你终于来到了冰原深处，这里赫然有一个祭坛，铺满冰原。空气中弥漫着诡异的寒气，仿佛有什么东西正在祭坛下苏醒。',
    type: 'boss',
    options: [
        { text: '一把火烧了它！', result: { type: 'boss_combat', mode: 'torch' } },
        { text: '虔诚祈祷', result: { type: 'boss_combat', mode: 'normal' } },
        { text: '直面恐惧', result: { type: 'boss_combat', mode: 'dread' } }
    ]
};

// 火把道具检查：动态控制"一把火烧了它"选项是否可用
function getSnowBossOptions() {
    let hasTorch = ownedItems.some(it => it.id === 'torch') || ownedItems.some(it => it.id === 'r_torch') || ownedItems.some(it => it.id === 's_torch');
    return [
        { text: '一把火烧了它！', result: { type: 'boss_combat', mode: 'torch' }, disabled: !hasTorch },
        { text: '虔诚祈祷', result: { type: 'boss_combat', mode: 'normal' } },
        { text: '直面恐惧', result: { type: 'boss_combat', mode: 'dread' } }
    ];
}

// ==================== 冰原网格地图生成 ====================
// 生成一个不规则的网格地图，节点之间随机连接
// 不再是规则正方形，而是纵横交错的路径网络
function generateSnowGrid() {
    // 地图尺寸：8-12个节点宽，8-14个节点高，更大更开阔
    let width = 8 + Math.floor(Math.random() * 5);  // 8-12
    let height = 8 + Math.floor(Math.random() * 7); // 8-14
    let nodes = [];
    let nodeMap = {}; // key: "r,c" -> node

    // 生成基础节点（并非每个坐标都有节点，呈现不规则空洞）
    for(let r = 0; r < height; r++) {
        for(let c = 0; c < width; c++) {
            // 边缘和中心区域保留较高密度，其他区域随机生成，制造纵横交错感
            let isEdge = (r === 0 || c === 0 || r === height-1 || c === width-1);
            let density = isEdge ? 0.82 : 0.48;
            if(Math.random() < density) {
                let node = {
                    id: `${r},${c}`,
                    r: r, c: c,
                    type: 'event',
                    visited: false,
                    event: null,
                    connections: [], // 连接的邻居节点id
                    x: c, y: r
                };
                nodes.push(node);
                nodeMap[node.id] = node;
            }
        }
    }

    // 确保起点和终点存在
    let startNode = nodeMap['0,0'] || createNodeAt(0, 0, nodes, nodeMap, width, height);
    startNode.type = 'start';
    startNode.visited = true;

    let bossR = height - 1;
    let bossC = width - 1;
    let bossNode = nodeMap[`${bossR},${bossC}`] || createNodeAt(bossR, bossC, nodes, nodeMap, width, height);
    bossNode.type = 'boss';
    bossNode.event = snowBossEvent;

    // 保证起点至少有一个可直接移动的邻居（避免玩家出生即被困）
    ensureStartNeighbor(startNode, nodes, nodeMap, width, height);

    // 建立连接：每个节点尝试与上下左右的邻居连接
    let dirs = [[0,1],[0,-1],[1,0],[-1,0]];
    nodes.forEach(node => {
        dirs.forEach(d => {
            let nr = node.r + d[0], nc = node.c + d[1];
            let key = `${nr},${nc}`;
            if(nodeMap[key]) {
                // 随机决定是否连接，纵横交错且路径分叉更多
                if(Math.random() < 0.62) {
                    if(!node.connections.includes(key)) node.connections.push(key);
                    if(!nodeMap[key].connections.includes(node.id)) nodeMap[key].connections.push(node.id);
                }
            }
        });
    });

    // 确保整个图是连通的：使用BFS检查，如果存在孤立节点则强制连接
    ensureConnected(nodes, nodeMap);

    // 为事件节点分配随机事件
    let eventPool = [...snowEvents];
    nodes.forEach(node => {
        if(node.type === 'event') {
            node.event = eventPool[Math.floor(Math.random() * eventPool.length)];
        }
    });

    return {
        width: width,
        height: height,
        nodes: nodes,
        nodeMap: nodeMap,
        startNode: startNode,
        bossNode: bossNode,
        currentNodeId: startNode.id
    };
}

function createNodeAt(r, c, nodes, nodeMap, width, height) {
    let node = { id: `${r},${c}`, r: r, c: c, type: 'event', visited: false, event: null, connections: [], x: c, y: r };
    nodes.push(node);
    nodeMap[node.id] = node;
    return node;
}

function ensureConnected(nodes, nodeMap) {
    if(nodes.length === 0) return;
    let visited = new Set();
    let queue = [nodes[0].id];
    visited.add(nodes[0].id);
    while(queue.length > 0) {
        let cur = nodeMap[queue.shift()];
        cur.connections.forEach(nextId => {
            if(!visited.has(nextId)) {
                visited.add(nextId);
                queue.push(nextId);
            }
        });
    }

    // 如果有孤立节点，连接到最近的已访问节点
    let isolated = nodes.filter(n => !visited.has(n.id));
    isolated.forEach(node => {
        // 找到距离最近的已连接节点
        let nearest = null, minDist = Infinity;
        nodes.forEach(other => {
            if(visited.has(other.id)) {
                let dist = Math.abs(node.r - other.r) + Math.abs(node.c - other.c);
                if(dist < minDist) { minDist = dist; nearest = other; }
            }
        });
        if(nearest) {
            node.connections.push(nearest.id);
            nearest.connections.push(node.id);
            // 递归确保新连接的节点也能被访问到
            visited.add(node.id);
        }
    });
}

function ensureStartNeighbor(startNode, nodes, nodeMap, width, height) {
    let neighbors = [
        { r: startNode.r - 1, c: startNode.c },
        { r: startNode.r + 1, c: startNode.c },
        { r: startNode.r, c: startNode.c - 1 },
        { r: startNode.r, c: startNode.c + 1 }
    ].filter(p => p.r >= 0 && p.r < height && p.c >= 0 && p.c < width);

    // 优先使用已存在的邻居节点
    let existing = neighbors.filter(p => nodeMap[`${p.r},${p.c}`]).map(p => nodeMap[`${p.r},${p.c}`]);

    if(existing.length === 0) {
        // 起点周围没有任何节点，强制在右侧或下方创建一个
        let pref = neighbors[Math.floor(Math.random() * neighbors.length)];
        let newNode = createNodeAt(pref.r, pref.c, nodes, nodeMap, width, height);
        existing.push(newNode);
    }

    // 确保起点至少与这些邻居之一连通
    existing.forEach(n => {
        if(!startNode.connections.includes(n.id)) startNode.connections.push(n.id);
        if(!n.connections.includes(startNode.id)) n.connections.push(startNode.id);
    });
}
