// 【寻宝人基础数据】
const baseCharData = {
    soso5: { id:'soso5', icon:'🕺', name:'soso5网格', badge: 'badge-soso', badgeTxt: 'soso联动', hp:135, maxHp:135, atk:13, speed:12, crit:0, lifesteal:0, dodge:0, desc:'【天赋】每3回合并发随机舞蹈(闪避/暴击/回血/综合)。', ultDesc:'【终结】随时可放。血高于敌造成血差伤害；血低于敌恢复血差并强行起舞！' },
    zhouge: { id:'zhouge', icon:'🍔', name:'快餐侠洲歌', badge: 'badge-ff', badgeTxt: '快餐联动', hp:180, maxHp:180, atk:10, speed:8, crit:0, lifesteal:0, dodge:0, desc:'【天赋】每回合随机扣自己或对方10%血。致死自残可保留1血并反杀爆伤！', ultDesc:'【终结】连扣自血3次触发：回满血且后续只扣敌血！' },
    doudouji: { id:'doudouji', icon:'🐔', name:'抖抖鸡', hp:105, maxHp:105, atk:12, speed:14, crit:0, lifesteal:0, dodge:8, desc:'【天赋】一直发抖，每回合额外进行一次闪避判定。每次闪避成功攻击+1。', ultDesc:'【终结】通过成功额外闪避触发：本场战斗闪避率+20%，之后每闪避失败一次再+5%。' }
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
    // 精英
    river_mushroom: { id:'river_mushroom', icon: '🍄', name: '河里菇', hp: 200, maxHp: 200, atk: 16, speed: 5, desc:'冰河边诞生的巨型蘑菇，拥有冰冻领域，每回合概率冻结', special: 'freeze_aura', isElite: true },
    zhen_erwa: { id:'zhen_erwa', icon: '👶', name: '镇二娃', hp: 170, maxHp: 170, atk: 20, speed: 10, desc:'被冰冻封印的孩童怨灵，减速光环永久降低敌人速度', special: 'slow_aura', isElite: true }
};

// 【特殊道具配置】
const specialItems = [
    { id:'duck_art', name:'鸭俊板板', isUnique:true, type:'unique', icon:'🦆', desc:'唯一神器：全属性飙升！攻击+30, 生命+100, 吸血+15%, 暴击+10%' },
    { id:'ff_15', name:'快餐15分钟', isUnique:true, type:'unique', isFf:true, icon:'🍔', desc:'[快餐侠专属极低掉落] 唯一道具：获取后每回合双方造成伤害强制变为 0 到对方生命上限的随机值！' },
    { id:'s7_ticket', name:'20元门票', isUnique:true, type:'unique', isSoso:true, cost: 20, icon:'🎫', desc:'[soso5专属商店概率刷出] 唯一道具：触发跳舞的被动由3回合减少为2回合一次。', exec: () => { sosoDanceInterval = 2; } }
];

// 【战斗掉落池】
const rewardPool = [
    { id:'r1', isUnique:false, type:'atk', icon:'🗡️', name:'力量涌动', desc:'属性强化: 攻击力+5', exec: () => player.atk+=5 },
    { id:'r2', isUnique:false, type:'maxHp', icon:'🛡️', name:'体质强化', desc:'属性强化: 最大生命+25', exec: () => { player.maxHp+=25; player.hp+=25;} },
    { id:'r3', isUnique:false, type:'heal', icon:'❤️', name:'紧急包扎', desc:'补给: 恢复50%生命', exec: () => player.hp = Math.min(player.maxHp, player.hp + player.maxHp*0.5) },
    { id:'r4', isUnique:false, type:'crit', icon:'💥', name:'弱点识破', desc:'属性强化: 暴击率+4%', exec: () => player.crit=Math.min(70, player.crit+4) },
    { id:'r5', isUnique:false, type:'dodge', icon:'💨', name:'身轻如燕', desc:'属性强化: 闪避率+2%', exec: () => player.dodge=Math.min(50, player.dodge+2) },
    { id:'r6', isUnique:false, type:'life', icon:'🦇', name:'嗜血狂热', desc:'属性强化: 吸血+6%', exec: () => player.lifesteal+=6 },
    { id:'r_torch', isUnique:true, type:'unique', icon:'🔥', name:'火把', desc:'唯一道具：冰原祭坛专用，可以烧毁菇菇祭祀的冰盾来源。', exec: () => {} }
];

// 【商店道具池】
const shopPool = [
    { id:'s1', isUnique:false, cost: 30, icon:'🍗', name:'烤大腿', desc:'补给: 恢复100%生命', exec: () => player.hp = player.maxHp },
    { id:'s2', isUnique:true, type:'unique', cost: 60, icon:'⚔️', name:'陨铁剑', desc:'唯一装备: 攻击力大幅+12', exec: () => player.atk+=12 },
    { id:'s3', isUnique:true, type:'unique', cost: 50, icon:'👟', name:'疾风鞋', desc:'唯一装备: 速度+12，闪避+2%', exec: () => { player.speed+=12; player.dodge=Math.min(50, player.dodge+2); } },
    { id:'s4', isUnique:true, type:'unique', cost: 75, icon:'🩸', name:'吸血镰刀', desc:'唯一装备: 吸血+12%', exec: () => player.lifesteal+=12 },
    { id:'s5', isUnique:true, type:'unique', cost: 75, icon:'🎯', name:'精准狙击', desc:'唯一装备: 暴击率+8%', exec: () => player.crit=Math.min(70, player.crit+8) },
    { id:'s6', isUnique:true, type:'unique', cost: 55, icon:'❤️‍🔥', name:'生命护符', desc:'唯一装备: 最大生命大幅+60', exec: () => {player.maxHp+=60; player.hp+=60;} },
    { id:'s_torch', isUnique:true, type:'unique', cost: 35, icon:'🔥', name:'火把', desc:'唯一道具：冰原祭坛专用。', exec: () => {} },
    { id:'s_soso', isUnique:true, type:'unique', isSoso:true, cost: 40, icon:'💿', name:'soso5道具', desc:'唯一道具: 开启奥义附带舞蹈', exec: () => hasSosoUltItem=true },
    { id:'s_ff', isUnique:true, type:'unique', isFf:true, cost: 50, icon:'🛣️', name:'富顺街', desc:'唯一道具: 免暴击庇护', exec: () => {hasFushunItem=true; fushunBattles+=3;} }
];

// 【镇镇之力数据】
const zhenZhenData = {
    luck: { id: 'luck', icon: '🍀', name: '运气镇镇', desc: '【条件: 遭遇3次恶劣随机判定】\n本场战斗所有正负效果判定和点数判定绝对有利于你！' },
    crit: { id: 'crit', icon: '🧨', name: '炸炸镇镇', desc: '【条件: 受到一次暴击伤害】\n本场战斗暴击率极大幅提升 50%！' },
    immortal: { id: 'immortal', icon: '👼', name: '永生镇镇', desc: '【条件: 死亡后觉醒并满血复活】\n开启后，本场战斗可额外抵抗一次致死伤害并满血复活！' },
    overload: { id: 'overload', icon: '⚡', name: '超载镇镇', desc: '【条件: 获得一件唯一道具】\n本场战斗基础攻击力与生命上限直接翻倍！' },
    random: { id: 'random', icon: '🎲', name: '随机镇镇', desc: '【条件: 发生任意点数判定】\n随机触发以上其他任意一种镇镇之力！' }
};