/**
 * Studio Content Data — 张旭 · 创作现场
 * 视频塔内容:5 段视频 + 抖音手机入口。
 * 每段视频:frontTexture 为横版缩略图,paintedFrontTexture 同图(无手绘变体),
 * videoSrc 指向本地 mp4,url 为外部跳转链接(可为空)。 */

export const PLATFORM_CONFIG = {
    video: {
        color: '#4A90D9',
        accentColor: '#2d6cb5',
        icon: 'TV',
        label: '视频',
        shape: 'tv', // Wide CRT style
    },
    douyin: {
        color: '#00F2EA',
        accentColor: '#FF0050',
        icon: 'DY',
        label: '抖音',
        shape: 'phone', // Vertical phone
    },
};

import { studioContent } from '../../../../config/userContent.js';

const RAW_CONTENT_DATA = studioContent;

export const CONTENT_DATA = RAW_CONTENT_DATA;

// Helper to get content by platform
export const getContentByPlatform = (platform) => {
    if (platform === 'all') return CONTENT_DATA;
    return CONTENT_DATA.filter(item => item.platform === platform);
};

// Get latest content (for "On Air" indicator)
export const getLatestContent = () => {
    return CONTENT_DATA[0];
};
