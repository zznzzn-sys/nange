// 游戏状态管理
class GameState {
    constructor() {
        this.currentScene = 0;
        this.currentDialogue = 0;
        this.autoMode = false;
        this.textSpeed = 5;
        this.autoSpeed = 3;
        this.bgmVolume = 50;
        this.sfxVolume = 50;
        this.choices = [];
        this.variables = {};
        this.unlockedCGs = [];
        this.unlockedScenes = [];
        this.saveSlots = Array(8).fill(null);
    }
}

// 游戏数据
const gameData = {
    // 角色数据
    characters: {
        sakura: {
            name: '樱井 雪',
            role: '文学少女',
            description: '温柔善良的文学部成员，喜欢读书和写诗',
            color: '#ff6b6b',
            affection: 0,
            maxAffection: 100
        },
        yuki: {
            name: '雪村 凛',
            role: '学生会长',
            description: '认真负责的学生会长，成绩优秀但有些傲娇',
            color: '#667eea',
            affection: 0,
            maxAffection: 100
        },
        akari: {
            name: '明里 光',
            role: '运动少女',
            description: '活泼开朗的田径部成员，充满正能量',
            color: '#4facfe',
            affection: 0,
            maxAffection: 100
        },
        hana: {
            name: '花音 奏',
            role: '音乐天才',
            description: '音乐部的钢琴天才，性格内向但才华横溢',
            color: '#f093fb',
            affection: 0,
            maxAffection: 100
        },
        kaito: {
            name: '海斗 翔',
            role: '篮球部长',
            description: '阳光帅气的篮球部部长，校园人气王',
            color: '#4ECDC4',
            affection: 0,
            maxAffection: 100
        },
        rin: {
            name: '凛 千夏',
            role: '美术天才',
            description: '神秘的美术部天才，有着独特的艺术眼光',
            color: '#A78BFA',
            affection: 0,
            maxAffection: 100
        },
        haruka: {
            name: '遥 优月',
            role: '科学部长',
            description: '冷静理性的科学部部长，喜欢研究和实验',
            color: '#F472B6',
            affection: 0,
            maxAffection: 100
        }
    },
    
    // 场景数据
    scenes: [
        {
            id: 'prologue',
            title: '序章：转学的第一天',
            background: 'school-gate',
            characters: ['sakura'],
            dialogues: [
                { speaker: 'narration', text: '春天的阳光洒在樱花飞舞的校园里...' },
                { speaker: 'player', text: '（这就是我的新学校吗？真是漂亮啊...）' },
                { speaker: 'sakura', text: '欢迎来到樱华学园！你是新来的转学生吗？' },
                { speaker: 'player', text: '啊，是的！我叫...' },
                { speaker: 'sakura', text: '我是樱井雪，文学部的。让我带你参观校园吧！' }
            ]
        },
        {
            id: 'classroom_intro',
            title: '教室的自我介绍',
            background: 'classroom',
            characters: ['sakura', 'yuki'],
            dialogues: [
                { speaker: 'yuki', text: '你就是新来的转学生？我是学生会长雪村凛。' },
                { speaker: 'player', text: '请多指教，雪村同学。' },
                { speaker: 'yuki', text: '哼，希望你不要给班级添麻烦。' },
                { speaker: 'sakura', text: '凛酱，不要这么严肃嘛~' }
            ]
        },
        {
            id: 'library_first',
            title: '图书馆的宁静时光',
            background: 'library',
            characters: ['sakura'],
            dialogues: [
                { speaker: 'sakura', text: '这里是我最喜欢的地方，安静又舒适。' },
                { speaker: 'player', text: '樱井同学经常来这里看书吗？' },
                { speaker: 'sakura', text: '嗯！特别是下雨天，听着雨声读书特别有感觉。' },
                { speaker: 'sakura', text: '其实...我小时候身体不太好，不能像其他孩子一样在外面玩。' },
                { speaker: 'sakura', text: '是书籍给了我一个广阔的世界，让我能够自由地想象和探索。' }
            ],
            choices: [
                { text: '我也很喜欢读书', character: 'sakura', value: 10 },
                { text: '我更喜欢户外活动', character: 'sakura', value: -5 }
            ]
        },
        {
            id: 'sakura_writing',
            title: '樱井雪的创作梦想',
            background: 'library',
            characters: ['sakura'],
            dialogues: [
                { speaker: 'sakura', text: '其实...我正在写一部小说。' },
                { speaker: 'player', text: '真的吗？是什么类型的小说？' },
                { speaker: 'sakura', text: '是关于一个转学生的故事，她来到新的学校，遇到了各种各样的人...' },
                { speaker: 'sakura', text: '（脸红）可能有点借鉴了我们的经历呢。' }
            ],
            choices: [
                { text: '我很想读一读', character: 'sakura', value: 15 },
                { text: '当作家很不容易吧', character: 'sakura', value: 12 },
                { text: '转学生题材很常见', character: 'sakura', value: -8 }
            ]
        },
        {
            id: 'sports_meet',
            title: '体育祭的热血',
            background: 'sports-field',
            characters: ['akari', 'kaito'],
            dialogues: [
                { speaker: 'akari', text: '加油！我们班一定要拿第一！' },
                { speaker: 'kaito', text: '明里，别太激动，比赛还没开始呢。' },
                { speaker: 'player', text: '这位是...？' },
                { speaker: 'akari', text: '啊，这是篮球部的海斗翔学长！' },
                { speaker: 'akari', text: '我从小就喜欢运动，因为运动能让人忘记烦恼！' }
            ],
            choices: [
                { text: '参加田径比赛', character: 'akari', value: 10 },
                { text: '参加篮球比赛', character: 'kaito', value: 10 },
                { text: '当啦啦队加油', character: 'akari', value: 5, character2: 'kaito', value2: 5 }
            ]
        },
        {
            id: 'akari_energy',
            title: '明里光的活力源泉',
            background: 'track-field',
            characters: ['akari'],
            dialogues: [
                { speaker: 'akari', text: '你知道吗？我小时候其实很内向。' },
                { speaker: 'player', text: '真的吗？完全看不出来！' },
                { speaker: 'akari', text: '是运动改变了我！跑步的时候，感觉整个世界都是我的！' },
                { speaker: 'akari', text: '我希望把这份活力传递给更多人！' }
            ],
            choices: [
                { text: '你的活力很有感染力', character: 'akari', value: 15 },
                { text: '运动确实能改变人', character: 'akari', value: 12 },
                { text: '有时候也需要安静', character: 'akari', value: 8 }
            ]
        },
        {
            id: 'music_room_discovery',
            title: '音乐室的旋律',
            background: 'music-room',
            characters: ['hana'],
            dialogues: [
                { speaker: 'hana', text: '（弹奏着优美的钢琴曲）' },
                { speaker: 'player', text: '花音同学的琴声真美...' },
                { speaker: 'hana', text: '啊！对不起，我没注意到有人...' },
                { speaker: 'hana', text: '这首曲子...是我母亲教我的。' },
                { speaker: 'hana', text: '她曾经是钢琴老师，但现在...已经不在了。' }
            ],
            choices: [
                { text: '称赞她的演奏', character: 'hana', value: 15 },
                { text: '询问曲子的名字', character: 'hana', value: 10 },
                { text: '默默离开', character: 'hana', value: -5 }
            ]
        },
        {
            id: 'hana_memory',
            title: '花音奏的回忆',
            background: 'music-room',
            characters: ['hana'],
            dialogues: [
                { speaker: 'hana', text: '母亲说，音乐是连接心灵的桥梁。' },
                { speaker: 'player', text: '你一定很思念她吧...' },
                { speaker: 'hana', text: '嗯...每次弹琴的时候，都感觉她就在身边。' },
                { speaker: 'hana', text: '我想用音乐把她的爱传递下去。' }
            ],
            choices: [
                { text: '你的音乐很美', character: 'hana', value: 18 },
                { text: '她一定为你骄傲', character: 'hana', value: 15 },
                { text: '不要太沉浸在悲伤中', character: 'hana', value: 8 }
            ]
        },
        {
            id: 'rooftop_secret',
            title: '天台的心事',
            background: 'rooftop',
            characters: ['yuki'],
            dialogues: [
                { speaker: 'yuki', text: '这里的风景真好...' },
                { speaker: 'player', text: '雪村同学也有这样的一面啊。' },
                { speaker: 'yuki', text: '不要误会！我只是来检查天台的安全而已！' },
                { speaker: 'yuki', text: '...其实，我父亲是这所学校的理事长。' },
                { speaker: 'yuki', text: '我必须比别人更努力，才能证明自己不是靠关系。' }
            ],
            choices: [
                { text: '继续聊天', character: 'yuki', value: 12 },
                { text: '询问学生会工作', character: 'yuki', value: 8 },
                { text: '开玩笑说她脸红', character: 'yuki', value: 15 }
            ]
        },
        {
            id: 'yuki_family',
            title: '雪村凛的家庭压力',
            background: 'student-council',
            characters: ['yuki'],
            dialogues: [
                { speaker: 'yuki', text: '有时候真的很累...要同时兼顾学习和学生会工作。' },
                { speaker: 'player', text: '为什么不找别人分担一些工作呢？' },
                { speaker: 'yuki', text: '父亲说，作为理事长的女儿，我必须以身作则。' },
                { speaker: 'yuki', text: '有时候真羡慕普通的学生生活...' }
            ],
            choices: [
                { text: '你已经做得很好了', character: 'yuki', value: 15 },
                { text: '要学会适当放松', character: 'yuki', value: 12 },
                { text: '这是你的责任', character: 'yuki', value: -5 }
            ]
        },
        {
            id: 'art_club',
            title: '美术部的邂逅',
            background: 'art-room',
            characters: ['rin'],
            dialogues: [
                { speaker: 'rin', text: '（专注地画着油画）' },
                { speaker: 'player', text: '这幅画...好美。' },
                { speaker: 'rin', text: '你懂画？' },
                { speaker: 'player', text: '只是觉得很有意境...' },
                { speaker: 'rin', text: '画画是我表达情感的方式。有时候语言说不出的，画笔可以。' }
            ],
            choices: [
                { text: '请教绘画技巧', character: 'rin', value: 12 },
                { text: '称赞她的作品', character: 'rin', value: 15 },
                { text: '询问画中的意义', character: 'rin', value: 10 }
            ]
        },
        {
            id: 'rin_artistic',
            title: '凛千夏的艺术追求',
            background: 'art-room',
            characters: ['rin'],
            dialogues: [
                { speaker: 'rin', text: '我爷爷是传统日本画家，从小我就跟着他学画。' },
                { speaker: 'player', text: '所以你的画风很有传统韵味。' },
                { speaker: 'rin', text: '嗯，但我也想融入现代元素，创造属于这个时代的艺术。' },
                { speaker: 'rin', text: '艺术不应该被传统束缚，而应该不断创新。' }
            ],
            choices: [
                { text: '你的想法很有深度', character: 'rin', value: 15 },
                { text: '传统与现代结合很棒', character: 'rin', value: 12 },
                { text: '还是传统风格更好', character: 'rin', value: 8 }
            ]
        },
        {
            id: 'science_lab',
            title: '实验室的探索',
            background: 'science-lab',
            characters: ['haruka'],
            dialogues: [
                { speaker: 'haruka', text: '这个实验还差最后一步...' },
                { speaker: 'player', text: '打扰了，遥同学在做什么实验？' },
                { speaker: 'haruka', text: '观察化学反应。有兴趣的话可以一起。' },
                { speaker: 'haruka', text: '科学就像解谜，每个发现都让人兴奋。' }
            ],
            choices: [
                { text: '一起做实验', character: 'haruka', value: 15 },
                { text: '询问科学原理', character: 'haruka', value: 12 },
                { text: '觉得太复杂离开', character: 'haruka', value: -8 }
            ]
        },
        {
            id: 'haruka_science',
            title: '遥优月的科学梦想',
            background: 'science-lab',
            characters: ['haruka'],
            dialogues: [
                { speaker: 'haruka', text: '我父母都是科学家，从小就在实验室长大。' },
                { speaker: 'player', text: '所以你对科学这么熟悉。' },
                { speaker: 'haruka', text: '但我不想只是继承他们的事业。' },
                { speaker: 'haruka', text: '我想用科学解决实际问题，比如环境保护和医疗健康。' }
            ],
            choices: [
                { text: '你的理想很伟大', character: 'haruka', value: 15 },
                { text: '科学确实能改变世界', character: 'haruka', value: 12 },
                { text: '先完成学业再说', character: 'haruka', value: 8 }
            ]
        },
        {
            id: 'cafe_gathering',
            title: '放学后的咖啡馆',
            background: 'cafe',
            characters: ['sakura', 'akari', 'hana'],
            dialogues: [
                { speaker: 'akari', text: '今天真是累死了！我要吃三块蛋糕！' },
                { speaker: 'sakura', text: '明里同学还是这么有精神呢~' },
                { speaker: 'hana', text: '这里的提拉米苏很好吃...' }
            ],
            choices: [
                { text: '和樱井讨论文学', character: 'sakura', value: 10 },
                { text: '和明里聊运动', character: 'akari', value: 10 },
                { text: '和花音聊音乐', character: 'hana', value: 10 }
            ]
        },
        {
            id: 'basketball_practice',
            title: '篮球部的训练',
            background: 'gym',
            characters: ['kaito'],
            dialogues: [
                { speaker: 'kaito', text: '今天的训练就到这里，大家辛苦了！' },
                { speaker: 'player', text: '海斗学长打篮球的样子真帅。' },
                { speaker: 'kaito', text: '要一起来打吗？我教你。' },
                { speaker: 'kaito', text: '篮球对我来说不只是运动，更是责任。' }
            ],
            choices: [
                { text: '接受邀请学习篮球', character: 'kaito', value: 15 },
                { text: '询问比赛经验', character: 'kaito', value: 12 },
                { text: '婉拒邀请', character: 'kaito', value: -5 }
            ]
        },
        {
            id: 'kaito_leadership',
            title: '海斗翔的领导之道',
            background: 'gym',
            characters: ['kaito'],
            dialogues: [
                { speaker: 'kaito', text: '作为队长，我必须对每个队员负责。' },
                { speaker: 'player', text: '当队长很辛苦吧？' },
                { speaker: 'kaito', text: '辛苦，但值得。看到队员们成长，比赢得比赛更让我开心。' },
                { speaker: 'kaito', text: '我希望毕业后能成为体育老师，继续指导年轻人。' }
            ],
            choices: [
                { text: '你是个好队长', character: 'kaito', value: 15 },
                { text: '当老师很适合你', character: 'kaito', value: 12 },
                { text: '不考虑职业篮球吗', character: 'kaito', value: 10 }
            ]
        },
        {
            id: 'cultural_festival',
            title: '文化祭的准备',
            background: 'school-hall',
            characters: ['yuki', 'rin', 'haruka'],
            dialogues: [
                { speaker: 'yuki', text: '文化祭还有一周，各部门准备得如何？' },
                { speaker: 'rin', text: '美术部的展览已经准备好了。' },
                { speaker: 'haruka', text: '科学部的实验展示也完成了。' }
            ],
            choices: [
                { text: '帮助学生会', character: 'yuki', value: 10 },
                { text: '参观美术部', character: 'rin', value: 10 },
                { text: '体验科学展示', character: 'haruka', value: 10 }
            ]
        },
        {
            id: 'confession_scene',
            title: '毕业前的告白',
            background: 'cherry-blossom',
            characters: [],
            dialogues: [
                { speaker: 'narration', text: '樱花盛开的季节，毕业的日子临近了...' }
            ],
            choices: [
                { text: '向樱井雪告白', character: 'sakura', value: 999, ending: 'sakura_ending' },
                { text: '向雪村凛告白', character: 'yuki', value: 999, ending: 'yuki_ending' },
                { text: '向明里光告白', character: 'akari', value: 999, ending: 'akari_ending' },
                { text: '向花音奏告白', character: 'hana', value: 999, ending: 'hana_ending' },
                { text: '向海斗翔告白', character: 'kaito', value: 999, ending: 'kaito_ending' },
                { text: '向凛千夏告白', character: 'rin', value: 999, ending: 'rin_ending' },
                { text: '向遥优月告白', character: 'haruka', value: 999, ending: 'haruka_ending' },
                { text: '保持朋友关系', ending: 'friends_ending' }
            ]
        }
    ],
};

// 游戏主类
class SchoolLifeGame {
    constructor() {
        this.state = new GameState();
        this.isTyping = false;
        this.autoTimer = null;
        this.currentCharacters = [];
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.showTitleScreen();
    }
    
    setupEventListeners() {
        // 标题界面按钮
        document.getElementById('start-game').addEventListener('click', () => this.startNewGame());
        document.getElementById('load-game').addEventListener('click', () => this.showSaveLoadMenu('load'));
        document.getElementById('title-gallery').addEventListener('click', () => this.showGallery());
        document.getElementById('title-settings').addEventListener('click', () => this.showSettings());
        document.getElementById('title-exit').addEventListener('click', () => this.exitGame());
        
        // 游戏控制按钮
        document.getElementById('next-btn').addEventListener('click', () => this.nextDialogue());
        document.getElementById('auto-btn').addEventListener('click', () => this.toggleAutoMode());
        document.getElementById('skip-btn').addEventListener('click', () => this.skipDialogue());
        document.getElementById('log-btn').addEventListener('click', () => this.showLog());
        document.getElementById('menu-btn').addEventListener('click', () => this.showMenu());
        
        // 菜单按钮
        document.getElementById('continue-btn').addEventListener('click', () => this.hideMenu());
        document.getElementById('save-btn').addEventListener('click', () => this.showSaveLoadMenu('save'));
        document.getElementById('load-btn').addEventListener('click', () => this.showSaveLoadMenu('load'));
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettings());
        document.getElementById('gallery-btn').addEventListener('click', () => this.showGallery());
        document.getElementById('title-btn').addEventListener('click', () => this.returnToTitle());
        
        // 键盘控制
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }
    
    showTitleScreen() {
        document.getElementById('title-screen').classList.remove('hidden');
        document.getElementById('dialogue-box').classList.add('hidden');
    }
    
    startNewGame() {
        console.log('开始新游戏');
        this.state = new GameState();
        this.state.currentScene = 0;
        document.getElementById('title-screen').classList.add('hidden');
        document.getElementById('dialogue-box').classList.remove('hidden');
        console.log('加载场景 0');
        this.loadScene(0);
    }
    
    loadScene(sceneIndex) {
        console.log(`加载场景 ${sceneIndex}`);
        if (sceneIndex >= gameData.scenes.length) {
            this.showEnding();
            return;
        }
        
        const scene = gameData.scenes[sceneIndex];
        this.state.currentScene = sceneIndex;
        this.state.currentDialogue = 0;
        
        console.log(`场景标题: ${scene.title}, 背景: ${scene.background}`);
        
        // 设置背景
        document.getElementById('background').className = `background ${scene.background}`;
        
        // 清除角色
        this.clearCharacters();
        
        // 如果有指定角色，显示它们
        if (scene.characters) {
            console.log(`场景角色: ${scene.characters}`);
            scene.characters.forEach((charId, index) => {
                console.log(`显示角色 ${charId} 在位置 ${index}`);
                this.showCharacter(charId, index);
            });
        }
        
        this.showDialogue();
    }
    
    showCharacter(charId, position) {
        const charData = gameData.characters[charId];
        const container = document.getElementById('character-container');
        
        // 检查图片元素是否存在
        const imgElementId = `${charId}-img`;
        const preloadedImg = document.getElementById(imgElementId);
        
        if (!preloadedImg) {
            console.error(`图片元素 ${imgElementId} 未找到`);
            return;
        }
        
        // 创建角色立绘元素
        const charElement = document.createElement('div');
        charElement.className = 'character-image active';
        charElement.id = `character-${charId}`;
        
        // 设置角色立绘
        const imgElement = document.createElement('img');
        imgElement.src = preloadedImg.src;
        imgElement.alt = charData.name;
        imgElement.style.width = '100%';
        imgElement.style.height = '100%';
        imgElement.style.objectFit = 'cover';
        imgElement.style.borderRadius = '15px';
        
        // 添加角色名字
        const nameElement = document.createElement('div');
        nameElement.className = 'character-name';
        nameElement.textContent = charData.name;
        
        charElement.appendChild(imgElement);
        charElement.appendChild(nameElement);
        container.appendChild(charElement);
        
        this.currentCharacters.push(charId);
    }
    
    clearCharacters() {
        const container = document.getElementById('character-container');
        container.innerHTML = '';
        this.currentCharacters = [];
    }
    
    showDialogue() {
        const scene = gameData.scenes[this.state.currentScene];
        const dialogue = scene.dialogues[this.state.currentDialogue];
        
        if (!dialogue) {
            if (scene.choices && scene.choices.length > 0) {
                this.showChoices(scene.choices);
            } else {
                this.nextScene();
            }
            return;
        }
        
        // 设置说话者
        const speakerName = dialogue.speaker === 'player' ? '你' : 
                          dialogue.speaker === 'narration' ? '' : 
                          gameData.characters[dialogue.speaker]?.name || '';
        
        document.getElementById('speaker-name').textContent = speakerName;
        
        // 打字机效果显示文本
        this.typeText(dialogue.text);
    }
    
    typeText(text) {
        this.isTyping = true;
        const dialogueElement = document.getElementById('dialogue-text');
        dialogueElement.textContent = '';
        
        let i = 0;
        const speed = 100 - (this.state.textSpeed * 8); // 文本速度控制
        
        const type = () => {
            if (i < text.length) {
                dialogueElement.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else {
                this.isTyping = false;
                if (this.state.autoMode) {
                    this.startAutoTimer();
                }
            }
        };
        
        type();
    }
    
    nextDialogue() {
        if (this.isTyping) {
            // 如果正在打字，立即完成
            this.completeTyping();
            return;
        }
        
        if (this.state.autoMode) {
            this.stopAutoTimer();
        }
        
        this.state.currentDialogue++;
        this.showDialogue();
    }
    
    completeTyping() {
        const scene = gameData.scenes[this.state.currentScene];
        const dialogue = scene.dialogues[this.state.currentDialogue];
        document.getElementById('dialogue-text').textContent = dialogue.text;
        this.isTyping = false;
    }
    
    toggleAutoMode() {
        this.state.autoMode = !this.state.autoMode;
        const autoBtn = document.getElementById('auto-btn');
        autoBtn.textContent = this.state.autoMode ? '手动' : '自动';
        
        if (this.state.autoMode && !this.isTyping) {
            this.startAutoTimer();
        } else {
            this.stopAutoTimer();
        }
    }
    
    startAutoTimer() {
        const speed = 3000 - (this.state.autoSpeed * 200); // 自动播放速度控制
        this.autoTimer = setTimeout(() => {
            this.nextDialogue();
        }, speed);
    }
    
    stopAutoTimer() {
        if (this.autoTimer) {
            clearTimeout(this.autoTimer);
            this.autoTimer = null;
        }
    }
    
    skipDialogue() {
        // 跳过到下一个场景
        this.nextScene();
    }
    
    nextScene() {
        this.state.currentScene++;
        this.loadScene(this.state.currentScene);
    }
    
    showChoices(choices) {
        const choiceContainer = document.getElementById('choice-container');
        const choicesElement = document.getElementById('choices');
        choicesElement.innerHTML = '';
        
        choices.forEach(choice => {
            const button = document.createElement('button');
            button.className = 'choice-btn';
            button.textContent = choice.text;
            button.addEventListener('click', () => {
                this.makeChoice(choice);
            });
            choicesElement.appendChild(button);
        });
        
        choiceContainer.classList.remove('hidden');
    }
    
    makeChoice(choice) {
        // 处理好感度变化
        if (choice.character) {
            const character = gameData.characters[choice.character];
            if (character) {
                character.affection = Math.min(character.maxAffection, character.affection + choice.value);
            }
        }
        if (choice.character2) {
            const character2 = gameData.characters[choice.character2];
            if (character2) {
                character2.affection = Math.min(character2.maxAffection, character2.affection + choice.value2);
            }
        }
        
        // 处理结局触发
        if (choice.ending) {
            this.showEnding(choice.ending);
            return;
        }
        
        document.getElementById('choice-container').classList.add('hidden');
        this.nextScene();
    }
    
    showMenu() {
        document.getElementById('game-menu').classList.remove('hidden');
    }
    
    hideMenu() {
        document.getElementById('game-menu').classList.add('hidden');
    }
    
    showSaveLoadMenu(mode) {
        const menu = document.getElementById('save-load-menu');
        const title = document.getElementById('save-load-title');
        title.textContent = mode === 'save' ? '保存游戏' : '读取存档';
        
        // 更新存档槽位显示
        this.updateSaveSlots();
        
        menu.classList.remove('hidden');
        this.hideMenu();
    }
    
    updateSaveSlots() {
        const slots = document.querySelectorAll('.save-slot');
        slots.forEach((slot, index) => {
            const saveData = this.state.saveSlots[index];
            const preview = slot.querySelector('.slot-preview');
            const time = slot.querySelector('.slot-time');
            const scene = slot.querySelector('.slot-scene');
            
            if (saveData) {
                preview.style.background = '#4CAF50';
                time.textContent = new Date(saveData.timestamp).toLocaleString();
                scene.textContent = gameData.scenes[saveData.sceneIndex]?.title || '未知场景';
            } else {
                preview.style.background = '#ddd';
                time.textContent = '空存档';
                scene.textContent = '';
            }
        });
    }
    
    showSettings() {
        document.getElementById('settings-menu').classList.remove('hidden');
        this.hideMenu();
    }
    
    showGallery() {
        document.getElementById('gallery-menu').classList.remove('hidden');
        this.hideMenu();
    }

    showEnding(endingId) {
        this.hideAllScreens();
        document.getElementById('ending-screen').style.display = 'block';
        
        const endingTitle = document.getElementById('ending-title');
        const endingText = document.getElementById('ending-text');
        
        // 结局数据
        const endings = {
            'sakura_ending': {
                title: '樱井雪结局：文学部的约定',
                text: '你和樱井雪一起考入了同一所大学，继续着你们的文学梦想。在樱花树下，你们约定要一起写出最美的故事。'
            },
            'yuki_ending': {
                title: '雪村凛结局：学生会的未来',
                text: '雪村凛毕业后成为了优秀的公务员，而你也找到了自己的方向。你们一起为社会的未来而努力着。'
            },
            'akari_ending': {
                title: '明里光结局：运动场的阳光',
                text: '明里光成为了职业运动员，你在场边为她加油。你们的爱情就像阳光一样，永远充满活力。'
            },
            'hana_ending': {
                title: '花音奏结局：音乐的永恒',
                text: '花音奏成为了著名的钢琴家，你在音乐厅里聆听她的演奏。每一个音符都诉说着你们的故事。'
            },
            'kaito_ending': {
                title: '海斗翔结局：篮球的梦想',
                text: '海斗翔进入了职业篮球队，你成为了他最忠实的粉丝。在球场上，你们的梦想一起飞翔。'
            },
            'rin_ending': {
                title: '凛千夏结局：艺术的色彩',
                text: '凛千夏成为了知名画家，你在她的画展上看到了你们的青春。每一幅画都充满了爱的色彩。'
            },
            'haruka_ending': {
                title: '遥优月结局：科学的浪漫',
                text: '遥优月成为了杰出的科学家，你们一起探索着宇宙的奥秘。在实验室里，你们发现了爱的公式。'
            },
            'friends_ending': {
                title: '友情结局：永远的伙伴',
                text: '你们保持着珍贵的友谊，各自追寻着梦想。虽然走上了不同的道路，但友情永远连接着彼此。'
            }
        };
        
        const ending = endings[endingId] || {
            title: '未知结局',
            text: '这是一个神秘的结局...'
        };
        
        endingTitle.textContent = ending.title;
        endingText.textContent = ending.text;
        
        // 解锁该结局
        this.gameState.unlockedEndings = this.gameState.unlockedEndings || [];
        if (!this.gameState.unlockedEndings.includes(endingId)) {
            this.gameState.unlockedEndings.push(endingId);
        }
        
        this.saveGame();
    }
    
    showLog() {
        // 显示对话日志（简化实现）
        alert('对话日志功能开发中...');
    }
    
    returnToTitle() {
        if (confirm('确定要返回标题界面吗？未保存的进度将会丢失。')) {
            this.showTitleScreen();
            this.hideMenu();
        }
    }
    
    exitGame() {
        if (confirm('确定要退出游戏吗？')) {
            window.close();
        }
    }
    
    showEnding() {
        // 根据游戏变量显示不同结局
        const sakuraAffection = this.state.variables.sakura_affection || 0;
        let endingText = '';
        
        if (sakuraAffection > 10) {
            endingText = '樱井雪结局：你和樱井同学成为了亲密的朋友，经常一起在图书馆读书...';
        } else if (sakuraAffection < -5) {
            endingText = '普通结局：高中生活平静地结束了，留下了美好的回忆...';
        } else {
            endingText = '友情结局：你和所有同学都建立了深厚的友谊，毕业时大家依依不舍...';
        }
        
        document.getElementById('dialogue-text').textContent = endingText;
        document.getElementById('speaker-name').textContent = '结局';
        
        // 解锁CG
        this.unlockCG('ending');
    }
    
    unlockCG(cgId) {
        if (!this.state.unlockedCGs.includes(cgId)) {
            this.state.unlockedCGs.push(cgId);
        }
    }
    
    handleKeyPress(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.nextDialogue();
        } else if (e.key === 'Escape') {
            this.showMenu();
        }
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    const game = new SchoolLifeGame();
    // 显示标题界面，等待用户交互
    game.showTitleScreen();
});