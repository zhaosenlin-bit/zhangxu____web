// 张旭 · 个人站 · 集中内容配置
// 所有可替换的文字、媒体路径都集中在这里，改这一份就能影响整个站点。

export const siteMeta = {
  title: '张旭 · 个人站',
  brandShort: '张旭',
  badge: '2026 暑假建站中',
  slogan: '我是张旭，一个做过世界机器人大赛二等奖的六年级程序员。',
};

export const aboutMilestones = [
  { id: 'intro', position: [0, 0, -15], type: 'intro', title: '张旭 ZHANGXU', subtitle: '六年级 · AI 应用开发者 · 机器人选手' },
  { id: 'awards', position: [0, 0, -55], type: 'awards', title: '数字足迹', subtitle: '2025 WRC 北京赛区二等奖 · 多个 AI 项目 · 个人知识库' },
  { id: 'journey', position: [0, 0, -95], type: 'journey', title: '成长时间线', subtitle: '编程 → 机器人 → AI 实践 → 建个人站' },
  { id: 'skills', position: [0, 0, -135], type: 'skills', title: '能力清单', subtitle: '编程 / AI / 硬件 / 比赛 / 表达' },
];

export const aboutIntro = '我叫张旭，快上六年级。我喜欢编程，参加过世界机器人大赛拿了北京赛区二等奖，也做过几个 AI 项目，接下来想继续做应用和参加比赛。';

export const aboutTimeline = [
  { year: '2024 之前', event: '接触编程和机器人' },
  { year: '2024-2025', event: '多次 AI 编程项目（探索宇宙等）' },
  { year: '2025', event: '世界机器人大赛 · 北京赛区二等奖' },
  { year: '2026 暑假', event: '建好个人知识库 · 学会 Vibe Coding 基础' },
];

// 0.33 = 初级(刚学)，0.50 = 初级→中级，0.66 = 中级，1.0 = 熟练
export const capabilities = [
  { label: '编程', score: 0.66, hint: 'Next.js / TS / Three.js / Python' },
  { label: 'AI', score: 0.50, hint: 'Prompt / Vibe Coding / AI 工具' },
  { label: '硬件', score: 0.50, hint: 'Arduino / 传感器 / 搭建' },
  { label: '比赛', score: 0.66, hint: '赛前 / 现场 / 答辩 / 协作' },
  { label: '表达', score: 0.50, hint: '文档化 / 口头 / 协作' },
];

export const practiceTracks = [
  {
    id: 'daily',
    title: '日常学习',
    label: 'Practice',
    description: 'Vibe Coding + AI 应用开发 + 黑客松准备，每日记录见个人知识库 daily/。',
    front: '/cartoon/media/moments/zx-1.jpg',
    painted: '/cartoon/media/moments/zx-1.jpg',
    url: '#',
    techStack: [],
  },
  {
    id: 'coding',
    title: '编程 · 项目实战',
    label: 'Python / TS / Three.js',
    description: '从一行代码到一份作品。Python 入门像是一座一座小岛，每座岛上都有任务、有同伴、有可带走的作品。',
    front: '/cartoon/media/moments/zx-7.jpg',
    painted: '/cartoon/media/moments/zx-7.jpg',
    url: '#',
    techStack: [],
  },
  {
    id: 'robot',
    title: '机器人 · 比赛路线',
    label: 'WRC / NOI / CSP',
    description: '从一台机器到一场比赛。拼装、调试、上台。孩子学到的远不止是机器。',
    front: '/cartoon/media/moments/zx-5.jpg',
    painted: '/cartoon/media/moments/zx-5.jpg',
    url: '#',
    techStack: [],
  },
  {
    id: 'ai',
    title: '人工智能 · 应用',
    label: 'Prompt / Tools',
    description: '让 AI 走下神坛，变成工具箱里的一个工具。AI 走进项目里、与生活对话、现场展示与试验。',
    front: '/cartoon/media/moments/zx-6.jpg',
    painted: '/cartoon/media/moments/zx-6.jpg',
    url: '#',
    techStack: [],
  },
];

export const galleryProjects = [
  {
    title: '探索宇宙',
    subtitle: 'AI 编程 / Web 3D / 游戏',
    description: 'AI 编程 / Web 3D / 游戏 —— 我的第一个完整上线的个人项目。',
    front: '/cartoon/media/moments/zx-7.jpg',
    painted: '/cartoon/media/moments/zx-7.jpg',
    url: 'https://zhangxu-web.pages.dev',
    techStack: [],
  },
  {
    title: '世界机器人大赛',
    subtitle: '机器人比赛',
    description: '机器人比赛项目 · 二等奖 · 2025 年北京赛区。',
    front: '/cartoon/media/moments/zx-5.jpg',
    painted: '/cartoon/media/moments/zx-5.jpg',
    url: '#',
    techStack: [],
  },
  {
    title: '个人站',
    subtitle: '本网站的搭建记录',
    description: '本网站的搭建记录 · Vite + React + Three.js · 进行中 2026。',
    front: '/cartoon/media/moments/zx-hero.jpg',
    painted: '/cartoon/media/moments/zx-hero.jpg',
    url: '#',
    techStack: [],
  },
];

export const studioContent = [
  {
    id: 'video-blackboard',
    platform: 'video',
    title: '黑板 · 课堂记录',
    description: '课堂黑板上的实时记录 · 2026 暑假。',
    frontTexture: '/cartoon/media/thumbs/zx-hero.jpg',
    paintedFrontTexture: '/cartoon/media/thumbs/zx-hero.jpg',
    thumbnail: '/cartoon/media/thumbs/zx-hero.jpg',
    poster: '/cartoon/media/posters/zx-blackboard.jpg',
    videoSrc: '/cartoon/media/videos/zx-blackboard.mp4',
    url: '',
    date: '2026-08',
    views: '本机',
    duration: '00:42',
  },
];

export const moments = [
  { id: 'g1', src: '/cartoon/media/moments/zx-1.jpg', title: '课堂瞬间 1', desc: '日常学习与尝试。' },
  { id: 'g2', src: '/cartoon/media/moments/zx-2.jpg', title: '课堂瞬间 2', desc: '日常学习与尝试。' },
  { id: 'g3', src: '/cartoon/media/moments/zx-3.jpg', title: '课堂瞬间 3', desc: '日常学习与尝试。' },
  { id: 'g4', src: '/cartoon/media/moments/zx-4.jpg', title: '课堂瞬间 4', desc: '日常学习与尝试。' },
  { id: 'g5', src: '/cartoon/media/moments/zx-5.jpg', title: '机器人训练', desc: 'WRC 备赛日常。' },
  { id: 'g6', src: '/cartoon/media/moments/zx-6.jpg', title: '作品与记录', desc: '做出来的、留下来的。' },
  { id: 'g7', src: '/cartoon/media/moments/zx-7.jpg', title: '探索宇宙', desc: '第一个完整上线的项目。' },
];

// 联系方式：只保留 电话 与 B站（哔哩哔哩）
export const contactInfo = {
  phone:   { title: '电话 · 加我联系', qr: '/cartoon/media/qr/phone-card.svg', hint: '手机号：13872498847（右上角点击复制）' },
  bilibili:   { username: '坐着鼠鼠环游世界', url: 'https://space.bilibili.com/3632311960603229' },
  qq:         { username: '1658353108', url: 'https://wpa.qq.com/msgrd?v=3&uin=1658353108&site=qq&menu=yes' },
};
