import GalleryRoom from '../Gallery/GalleryRoom';

/**
 * 教学方向 · Practice
 * 复用衣架卡片翻转机制，展示 5 个教学方向
 * 教学现场 / Python / C++ / AI / 机器人
 */

import { practiceTracks } from '../../../../config/userContent.js';

const PRACTICE_PROJECTS = practiceTracks;

const PracticeRoom = (props) => {
    return <GalleryRoom {...props} projects={PRACTICE_PROJECTS} tutorialId='practice_browse' />;
};

export default PracticeRoom;
