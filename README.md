# 张旭 · 个人站

克隆自 senlin_web-3D 的 3D 走廊版个人站，已把内容替换为张旭本人（你）的数据。

> 📖 完整部署教程见 [部署说明书.md](部署说明书.md)

## 内容集中位置

所有可替换的文字/媒体路径都集中在 src/config/userContent.js，改这一份就能影响整个站点：

| 字段 | 用途 |
| --- | --- |
| siteMeta            | 站点标题、徽章、一句话宣言（slogan） |
| boutMilestones     | 关于页：4 个里程碑（intro / awards / journey / skills）|
| boutIntro / boutTimeline | 关于页正文段 + 时间线 |
| capabilities        | 能力雷达 5 维（label/score/hint）|
| practiceTracks      | 教学方向 4 个主题（用项目卡片复用）|
| galleryProjects     | 作品集 3 个项目（封面图 + 标题 + 简介 + 链接）|
| studioContent       | 创作现场 1 段视频（黑板视频 + 缩略图）|
| moments             | 掠影瞬间 7 张照片（来自 D:\zhangxu-know\projects\my-web\img）|
| contactInfo         | 联系人信息（GitHub / 微信 / 邮箱 / 电话 / B站 / 抖音）|

## 媒体资源

已从 D:\zhangxu-know\projects\my-web\img 复制到 public/media/：

- public/media/moments/zx-1.jpg ~ zx-7.jpg  —— 7 张微信/相册照片
- public/media/thumbs/zx-hero.jpg         —— 缩略图/封面图
- public/media/videos/zx-blackboard.mp4   —— 黑板视频（29 MB）

## 待补充（TODO）

下面这些字段在 src/config/userContent.js 或 ContactRoom.jsx 中仍是占位符：

- 微信二维码图片（替换 public/media/qr/wechat.jpg）
- 邮箱地址（默认 TODO@example.com）
- 手机号（默认 	el:TODO）
- GitHub 用户名（默认 https://github.com/TODO）
- 抖音 ID（默认 https://www.douyin.com/user/TODO）
- B站 UID（默认 https://space.bilibili.com/TODO）

## 本地开发

`ash
npm.cmd install      # 首次
npm.cmd run dev      # http://localhost:5173/cartoon/
npm.cmd run build    # 构建到 dist/
`

## 部署

构建产物在 dist/，可直接上传到 Cloudflare Pages / Vercel / Netlify。

## 词域探险（网页版游戏）

背单词 Roguelike 网页版已随本站一起发布：

- 入口：`/cartoon/vocab/`（线上即 https://senlin-c1n.pages.dev/cartoon/vocab/）
- 源码位于 `public/vocab/`（纯 HTML + Canvas + JS，无框架，构建时随站点一起复制到 dist）
- 玩法：拾取中文词块 → 发射射击身上带英文单词的怪物 → 怪物被击中会进入「暴怒」状态
- 游戏源码项目：https://github.com/zhaosenlin12-creator/vocab-roguelike
