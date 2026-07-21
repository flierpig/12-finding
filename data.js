// 【寻宝人基础数据】
const baseCharData = {
    soso5: { id:'soso5', icon:'🕺', name:'soso5网格', badge: 'badge-soso', badgeTxt: 'soso联动', hp:135, maxHp:135, atk:13, speed:12, crit:0, lifesteal:0, dodge:0, desc:'【天赋】每3回合并发随机舞蹈(闪避/暴击/回血/SOSO5)，SOSO5概率5%，其他三个平分剩余概率。', ultDesc:'【终结】无使用条件，每两回合可用一次。血高于敌造成差值伤害，低于敌则回复差值血量并触发SOSO5！' },
    zhouge: { id:'zhouge', icon:'🍔', name:'快餐侠洲歌', badge: 'badge-ff', badgeTxt: '快餐联动', hp:180, maxHp:180, atk:10, speed:8, crit:0, lifesteal:0, dodge:0, desc:'【天赋】每回合随机扣自己或对方5%血，扣自己概率30%。若被自己扣死则保留1血并造成自身生命上限伤害。', ultDesc:'【终结】被天赋扣血后可触发：恢复所有血量，后续只扣对方的血！' },
    doudouji: { id:'doudouji', icon:'🐔', name:'抖抖鸡', hp:105, maxHp:105, atk:12, speed:14, crit:0, lifesteal:0, dodge:8, desc:'【天赋】一直发抖，每回合额外进行一次闪避判定。每次闪避成功攻击+1。', ultDesc:'【终结】通过成功额外闪避触发：本次战斗闪避率+20%，之后每闪避失败一次再+5%！' },
    erbo: { id:'erbo', icon:'🌊', name:'尔波', hp:140, maxHp:140, atk:11, speed:11, crit:5, lifesteal:0, dodge:0, desc:'【天赋】无波纹时，受三次伤害可收集随机波纹。六种波纹：连续攻击/吸血/灼烧/反伤/加攻/降敌攻。', ultDesc:'【终结】暴击后解锁，无次数限制。使用时消耗当前波纹并释放其效果！' }
};

// 【敌方图鉴】
const mobTemplates = [
    { id:'m1', icon: '👾', name: '摸鱼小兵', hp: 60, maxHp: 60, atk: 7, speed: 5, desc:'基础属性平庸，练手专用' },
    { id:'m2', icon: '🛹', name: '俊板', hp: 80, maxHp: 80, atk: 12, speed: 10, desc:'攻速较快，容易抢先手' },
    { id:'m3', icon: '🗿', name: '谭巴', hp: 130, maxHp: 130, atk: 5, speed: 3, desc:'超高血量，攻击低下，消耗型' },
    { id:'m4', icon: '🪧', name: '冯板', hp: 70, maxHp: 70, atk: 16, speed: 14, desc:'极高爆发力，脆皮刺客' },
    { id:'m5', icon: '🦇', name: '吸血键盘侠', hp: 45, maxHp: 45, atk: 9, speed: 12, desc:'血少攻高，附带吸血' },
    { id:'m6', icon: '🐢', name: '划水老龟', hp: 95, maxHp: 95, atk: 5, speed: 2, desc:'纯沙包，防御极高' },
    { id:'m7', icon: '🐝', name: '催更狂魔', hp: 35, maxHp: 35, atk: 15, speed: 15, desc:'攻速和伤害极快，但非常脆' },
    { id:'m8', icon: '🐺', name: '内卷野狼', hp: 75, maxHp: 75, atk: 11, speed: 18, desc:'属性均衡且难缠的高速野狼' }
];

// 【冰原专属怪物】
const snowMobs = {
    // 小怪
    ice_block: { id:'ice_block', icon: '🧊', name: '冰镇', hp: 55, maxHp: 55, atk: 8, speed: 6, desc:'一块被冻住的怪物，攻击会释放寒气减速敌人', special: 'slow' },
    cold_jun:  { id:'cold_jun', icon: '❄️', name: '冷俊', hp: 70, maxHp: 70, atk: 10, speed: 8, desc:'周身环绕冰霜的战士，攻击有几率冻结敌人一回合', special: 'freeze' },
    frost_wolf: { id:'frost_wolf', icon: '🐺', name: '霜狼', hp: 60, maxHp: 60, atk: 9, speed: 12, desc:'雪地中的狼群猎手，速度快且会群体攻击', special: 'pack' },
    ice_imp: { id:'ice_imp', icon: '👿', name: '冰魔', hp: 45, maxHp: 45, atk: 13, speed: 10, desc:'矮小但凶猛的冰系魔物，攻击有几率让敌人虚弱', special: 'weaken' },
    // 精英
    river_mushroom: { id:'river_mushroom', icon:'🍄', name:'河里菇', hp: 200, maxHp: 200, atk: 16, speed: 5, desc:'冰河边诞生的巨型蘑菇，拥有冰冻领域，每回合概率冻结', special: 'freeze_aura', isElite: true },
    zhen_erwa: { id:'zhen_erwa', icon:'👶', name:'镇二娃', hp: 170, maxHp: 170, atk: 20, speed: 10, desc:'被冰冻封印的孩童怨灵，减速光环永久降低敌人速度', special: 'slow_aura', isElite: true },
    snow_titan: { id:'snow_titan', icon:'👹', name:'雪巨人', hp: 280, maxHp: 280, atk: 15, speed: 3, desc:'由积雪凝聚而成的巨人，每3回合会发动范围雪崩', special: 'avalanche', isElite: true },
    // 特殊
    gugugaga: { id:'gugugaga', icon:'🐦', name:'咕咕嘎嘎', hp: 90, maxHp: 90, atk: 12, speed: 16, desc:'一只奇怪的鸟形生物，5回合后会逃跑，如果没死亡会偷走一件非特殊道具', special: 'thief_escape', isElite: false }
};

// 【海岸专属怪物】
const coastMobs = {
    // 小怪
    crab:      { id:'crab', icon: '🦀', name: '岩蟹', hp: 65, maxHp: 65, atk: 9, speed: 7, desc:'藏在礁石下的硬壳蟹，攻击有几率附加流血效果', special: 'bleed' },
    seagull:   { id:'seagull', icon: '🕊️', name: '啸鸥', hp: 50, maxHp: 50, atk: 11, speed: 14, desc:'成群盘旋的海鸥，速度极快但身板脆弱', special: 'swift' },
    sea_serpent: { id:'sea_serpent', icon: '🐉', name: '海蛇', hp: 55, maxHp: 55, atk: 10, speed: 11, desc:'剧毒的海蛇，攻击有几率让敌人中毒', special: 'poison' },
    sand_worm: { id:'sand_worm', icon: '🐛', name: '沙虫', hp: 75, maxHp: 75, atk: 7, speed: 5, desc:'潜伏在沙中的巨型蠕虫，防御高且会钻地躲避', special: 'burrow' },
    // 精英
    jellyfish: { id:'jellyfish', icon: '🪼', name: '幽光水母', hp: 190, maxHp: 190, atk: 15, speed: 6, desc:'深海漂来的发光水母，带有麻痹毒素', special: 'paralyze', isElite: true },
    tide_bringer: { id:'tide_bringer', icon: '🌊', name: '唤潮者', hp: 220, maxHp: 220, atk: 18, speed: 4, desc:'古老的海底祭司，能召唤潮汐冲击打断敌人行动', special: 'tide_stun', isElite: true },
    ship_ghost: { id:'ship_ghost', icon: '👻', name: '幽灵船', hp: 250, maxHp: 250, atk: 16, speed: 6, desc:'被诅咒的沉船幽灵，每回合恢复少量生命并降低敌人命中', special: 'haunt', isElite: true }
};

// 【丛林专属怪物】
const jungleMobs = {
    // 小怪
    snake:     { id:'snake', icon: '🐍', name: '毒牙蛇', hp: 60, maxHp: 60, atk: 10, speed: 9, desc:'隐藏在落叶中的毒蛇，攻击附加持续中毒', special: 'poison' },
    monkey:    { id:'monkey', icon: '🐒', name: '泼猴', hp: 75, maxHp: 75, atk: 8, speed: 13, desc:'喜欢丢石头的猴子，攻击有几率窃取玩家金币', special: 'steal_gold' },
    frog: { id:'frog', icon: '🐸', name: '毒蛙', hp: 50, maxHp: 50, atk: 12, speed: 7, desc:'色彩鲜艳的毒蛙，攻击有几率让敌人中毒', special: 'poison' },
    mantis: { id:'mantis', icon: '🦗', name: '螳螂', hp: 65, maxHp: 65, atk: 11, speed: 10, desc:'巨型螳螂，攻击有几率破甲降低敌人防御', special: 'armor_break' },
    // 精英
    venom_spider: { id:'venom_spider', icon: '🕷️', name: '瘴蛛女王', hp: 180, maxHp: 180, atk: 17, speed: 7, desc:'巨大的毒蜘蛛，织网降低敌人速度并持续中毒', special: 'web_poison', isElite: true },
    ancient_golem: { id:'ancient_golem', icon: '🪨', name: '藤甲古傀', hp: 260, maxHp: 260, atk: 14, speed: 3, desc:'被藤蔓缠绕的石像守卫，每回合恢复少量生命', special: 'regen', isElite: true },
    jungle_tiger: { id:'jungle_tiger', icon: '🐅', name: '丛林虎王', hp: 210, maxHp: 210, atk: 22, speed: 15, desc:'丛林中的顶级猎手，攻击有几率暴击且速度极快', special: 'feral', isElite: true }
};

// 【特殊道具配置】
const specialItems = [
    { id:'duck_art', name:'鸭俊板板', isUnique:true, type:'unique', icon:'🦆', desc:'唯一神器：全属性飙升！攻击+30, 生命+100, 吸血+15%, 暴击+10%' },
    { id:'ff_15', name:'快餐15分钟', isUnique:true, type:'unique', isFf:true, icon:'🍔', desc:'[快餐侠专属极低掉落] 唯一道具：获取后每回合双方造成伤害强制变为 0 到对方生命上限的随机值！' },
    { id:'s7_ticket', name:'20元门票', isUnique:true, type:'unique', isSoso:true, cost: 20, icon:'🎫', desc:'[soso5专属商店概率刷出] 唯一道具：触发跳舞的被动由3回合减少为2回合一次。', exec: () => { sosoDanceInterval = 2; } },
    { id:'torch', name:'火把', isUnique:true, type:'unique', icon:'🔥', desc:'[冰原事件专属] 唯一道具：攻击有概率对敌人造成灼烧效果。冰原祭坛专用。', exec: () => {} },
    { id:'altar', name:'祭坛', isUnique:true, type:'unique', icon:'⛩️', desc:'局外道具：每击杀一个怪物进度+1，击杀精英怪进度+2，击杀Boss进度+4。进度每有4点则获取一个随机道具。' },
    { id:'mushroom_power', name:'菇菇之力', isUnique:true, type:'unique', icon:'🍄', desc:'[冰河边的蘑菇专属] 唯一道具：闪避+5%，成功闪避可以提升自己的速度。', exec: () => { player.dodge = Math.min(50, player.dodge + 5); } },
    { id:'ice_body', name:'寒气之体', isUnique:true, type:'unique', icon:'❄️', desc:'[冰原极低掉落] 唯一道具：免疫冻结。' }
];

// 【战斗掉落池】
const rewardPool = [
    { id:'r1', isUnique:true, type:'atk', icon:'🗡️', name:'力量涌动', desc:'唯一道具: 属性强化: 攻击力+5', exec: () => player.atk+=5 },
    { id:'r2', isUnique:true, type:'maxHp', icon:'🛡️', name:'体质强化', desc:'唯一道具: 属性强化: 最大生命+25', exec: () => { player.maxHp+=25; player.hp+=25;} },
    { id:'r3', isUnique:true, type:'heal', icon:'❤️', name:'紧急包扎', desc:'唯一道具: 补给: 恢复50%生命', exec: () => player.hp = Math.min(player.maxHp, player.hp + player.maxHp*0.5) },
    { id:'r4', isUnique:true, type:'crit', icon:'💥', name:'弱点识破', desc:'唯一道具: 属性强化: 暴击率+4%', exec: () => player.crit=Math.min(70, player.crit+4) },
    { id:'r5', isUnique:true, type:'dodge', icon:'💨', name:'身轻如燕', desc:'唯一道具: 属性强化: 闪避率+2%', exec: () => player.dodge=Math.min(50, player.dodge+2) },
    { id:'r6', isUnique:true, type:'life', icon:'🦇', name:'嗜血狂热', desc:'唯一道具: 属性强化: 吸血+6%', exec: () => player.lifesteal+=6 },
    { id:'r_altar', isUnique:true, type:'unique', icon:'⛩️', name:'祭坛', desc:'局外道具：每击杀一个怪物进度+1，击杀精英怪进度+2，击杀Boss进度+4。进度每有4点则获取一个随机道具。', exec: () => {} },
    { id:'r7', isUnique:true, type:'speed', icon:'⚡', name:'疾风步', desc:'唯一道具: 属性强化: 速度+3', exec: () => player.speed+=3 },
    { id:'r8', isUnique:true, type:'heal', icon:'🍎', name:'生命果实', desc:'唯一道具: 补给: 恢复30生命', exec: () => player.hp = Math.min(player.maxHp, player.hp + 30) },
    { id:'r9', isUnique:true, type:'gold', icon:'💰', name:'金币袋', desc:'唯一道具: 获得30金币', exec: () => gold += 30 },
    { id:'r10', isUnique:true, type:'shield', icon:'🛡️', name:'护盾符文', desc:'唯一道具: 下次受到的伤害降低50%', exec: () => player.damageReduction = 0.5 }
];

// 【商店道具池】
const shopPool = [
    { id:'s1', isUnique:true, cost: 30, icon:'🍗', name:'烤大腿', desc:'唯一道具: 补给: 恢复100%生命', exec: () => player.hp = player.maxHp },
    { id:'s2', isUnique:true, type:'unique', cost: 60, icon:'⚔️', name:'陨铁剑', desc:'唯一装备: 攻击力大幅+12', exec: () => player.atk+=12 },
    { id:'s3', isUnique:true, type:'unique', cost: 50, icon:'👟', name:'疾风鞋', desc:'唯一装备: 速度+12，闪避+2%', exec: () => { player.speed+=12; player.dodge=Math.min(50, player.dodge+2); } },
    { id:'s4', isUnique:true, type:'unique', cost: 75, icon:'🩸', name:'吸血镰刀', desc:'唯一装备: 吸血+12%', exec: () => player.lifesteal+=12 },
    { id:'s5', isUnique:true, type:'unique', cost: 75, icon:'🎯', name:'精准狙击', desc:'唯一装备: 暴击率+8%', exec: () => player.crit=Math.min(70, player.crit+8) },
    { id:'s6', isUnique:true, type:'unique', cost: 55, icon:'❤️‍🔥', name:'生命护符', desc:'唯一装备: 最大生命大幅+60', exec: () => {player.maxHp+=60; player.hp+=60;} },
    { id:'s_soso', isUnique:true, type:'unique', isSoso:true, cost: 40, icon:'💿', name:'soso5道具', desc:'唯一道具: 开启奥义附带舞蹈', exec: () => hasSosoUltItem=true },
    { id:'s_ff', isUnique:true, type:'unique', isFf:true, cost: 50, icon:'🛣️', name:'富顺街', desc:'唯一道具: 免暴击庇护', exec: () => {hasFushunItem=true; fushunBattles+=3;} },
    { id:'s_altar', isUnique:true, type:'unique', cost: 45, icon:'⛩️', name:'祭坛', desc:'局外道具：每击杀一个怪物进度+1，击杀精英怪进度+2，击杀Boss进度+4。进度每有4点则获取一个随机道具。', exec: () => {} },
    { id:'s7', isUnique:true, type:'unique', cost: 40, icon:'📿', name:'守护项链', desc:'唯一装备: 闪避率+5%', exec: () => player.dodge=Math.min(50, player.dodge+5) },
    { id:'s8', isUnique:true, type:'unique', cost: 55, icon:'🔥', name:'火焰戒指', desc:'唯一装备: 攻击有10%概率造成灼烧', exec: () => player.burnChance = 0.1 },
    { id:'s9', isUnique:true, type:'unique', cost: 35, icon:'🌊', name:'潮汐护符', desc:'唯一装备: 生命低于30%时恢复15%生命', exec: () => player.lowHpHeal = 0.15 },
    { id:'s10', isUnique:true, type:'unique', cost: 65, icon:'💀', name:'死神镰刀', desc:'唯一装备: 击杀敌人后恢复10%生命', exec: () => player.killHeal = 0.1 }
];

// 【镇镇之力数据】
const zhenZhenData = {
    luck: { id: 'luck', icon: '🍀', name: '运气镇镇', desc: '【条件: 遭遇3次恶劣随机判定】\n本场战斗所有正负效果判定和点数判定绝对有利于你！' },
    crit: { id: 'crit', icon: '🧨', name: '炸炸镇镇', desc: '【条件: 受到一次暴击伤害】\n本场战斗暴击率极大幅提升 50%！' },
    immortal: { id: 'immortal', icon: '👼', name: '永生镇镇', desc: '【条件: 死亡后觉醒并满血复活】\n开启后，本场战斗可额外抵抗一次致死伤害并满血复活！' },
    overload: { id: 'overload', icon: '⚡', name: '超载镇镇', desc: '【条件: 获得一件唯一道具】\n本场战斗基础攻击力与生命上限直接翻倍！' },
    random: { id: 'random', icon: '🎲', name: '随机镇镇', desc: '【条件: 发生任意点数判定】\n随机触发以上其他任意一种镇镇之力！' }
};