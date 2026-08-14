import { useEffect, useRef } from 'react';
import { useScene } from '../context/SceneContext';

/**
 * useDocumentMeta — 虚拟路由 + 动态 meta
 * 页面部署于 https://senlin-c1n.pages.dev/cartoon/ 子路径。
 */

const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://senlin.codebn.cn';
const BASE = '/cartoon';

const ROOM_META = {
    null: {
        path: BASE + '/',
        title: '张旭 · 个人站',
        description: '我是张旭，一个做过世界机器人大赛二等奖的六年级程序员，正在建个人站与知识库。'
    },
    about: {
        path: BASE + '/about',
        title: '关于我 · 张旭 ZHANGXU',
        description: '张旭 · 六年级 · AI 应用开发者 · 机器人选手。2025 WRC 北京赛区二等奖；多个 AI 项目；个人知识库在建。'
    },
    practice: {
        path: BASE + '/practice',
        title: '学习方向 · 张旭',
        description: 'Vibe Coding + AI 应用开发 + 黑客松准备；机器人 WRC 备赛；编程 / AI / 硬件 / 比赛 / 表达 5 维成长。'
    },
    gallery: {
        path: BASE + '/gallery',
        title: '作品集 · 张旭',
        description: '探索宇宙（AI 编程 / Web 3D / 游戏）· 世界机器人大赛项目 · 个人站搭建记录。'
    },
    studio: {
        path: BASE + '/studio',
        title: '创作现场 · 张旭',
        description: '黑板课堂记录 · Vibe Coding 实战 · 个人知识库 daily 精选。'
    },
    moments: {
        path: BASE + '/moments',
        title: '掠影 · 张旭',
        description: '日常学习、机器人训练、作品与比赛瞬间的照片集。'
    },
    contact: {
        path: BASE + '/contact',
        title: '联系张旭 · 电话 / B站 / QQ',
        description: '联系方式见个人站 contact 房间，或扫码加我好友。'
    },
};

// Map URL paths back to room IDs for deep linking
const PATH_TO_ROOM = {
    // Full path keys
    [BASE]: null,
    [BASE + '/']: null,
    [BASE + '/about']: 'about',
    [BASE + '/about/']: 'about',
    [BASE + '/practice']: 'practice',
    [BASE + '/practice/']: 'practice',
    [BASE + '/gallery']: 'gallery',
    [BASE + '/gallery/']: 'gallery',
    [BASE + '/studio']: 'studio',
    [BASE + '/studio/']: 'studio',
    [BASE + '/moments']: 'moments',
    [BASE + '/moments/']: 'moments',
    [BASE + '/contact']: 'contact',
    [BASE + '/contact/']: 'contact',
};

/**
 * Returns the room ID that the initial URL points to (for deep linking).
 * Call this once at app startup to determine if we need to auto-teleport.
 */
export function getInitialRoomFromUrl() {
    if (typeof window === 'undefined') return null;
    let path = window.location.pathname.replace(/\/+$/, '') || '\/';
    // Try direct lookup (full path with base)
    if (PATH_TO_ROOM[path] !== undefined) return PATH_TO_ROOM[path];
    // Try stripping base prefix
    if (path.startsWith(BASE)) {
        const stripped = path.slice(BASE.length) || '\/';
        if (PATH_TO_ROOM[stripped] !== undefined) return PATH_TO_ROOM[stripped];
    }
    return null;
}

export function useDocumentMeta() {
    const { currentRoom, teleportTo, hasEntered } = useScene();
    const isHandlingPopState = useRef(false);
    const lastPushedRoom = useRef(undefined); // Track what we last pushed to avoid duplicates

    // Update document meta and URL when room changes
    useEffect(() => {
        const roomKey = currentRoom === null ? 'null' : currentRoom;
        const meta = ROOM_META[roomKey] || ROOM_META['null'];

        // Update the page title
        document.title = meta.title;

        // Update meta description
        const descTag = document.querySelector('meta[name="description"]');
        if (descTag) {
            descTag.setAttribute('content', meta.description);
        }

        // Update OG meta tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', meta.title);

        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute('content', meta.description);

        const ogUrl = document.querySelector('meta[property="og:url"]');
        if (ogUrl) ogUrl.setAttribute('content', SITE_URL + meta.path);

        // Update canonical link to ensure virtual routes are correctly indexable as separate pages
        const canonicalTag = document.querySelector('link[rel="canonical"]');
        if (canonicalTag) {
            canonicalTag.setAttribute('href', SITE_URL + meta.path);
        }

        // Push to browser history (only if not handling a popstate event and room actually changed)
        if (!isHandlingPopState.current && lastPushedRoom.current !== currentRoom) {
            // Use replaceState for the very first load, pushState for subsequent navigations
            if (lastPushedRoom.current === undefined) {
                // First load: only replace URL if current URL doesn't already point to a valid deep link
                const currentPath = window.location.pathname;
                const isAlreadyDeepLink = currentPath !== BASE && currentPath !== BASE + '/' && currentPath !== '/';
                if (isAlreadyDeepLink) {
                    // URL already points to a deep link (e.g. /cartoon/about/) - mark room accordingly but don't change URL yet
                    lastPushedRoom.current = currentRoom;
                    return;
                }
                window.history.replaceState({ room: currentRoom }, '', meta.path);
            } else {
                window.history.pushState({ room: currentRoom }, '', meta.path);
            }
            lastPushedRoom.current = currentRoom;
        }

        isHandlingPopState.current = false;
    }, [currentRoom]);

    // Handle browser back/forward buttons
    useEffect(() => {
        const handlePopState = (event) => {
            isHandlingPopState.current = true;
            const targetRoom = event.state?.room ?? null;
            lastPushedRoom.current = targetRoom;

            if (targetRoom === null) {
                // Going back to corridor — update meta immediately
                const meta = ROOM_META['null'];
                document.title = meta.title;
            } else if (hasEntered) {
                // Teleport to the target room
                teleportTo(targetRoom);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [teleportTo, hasEntered]);
}
