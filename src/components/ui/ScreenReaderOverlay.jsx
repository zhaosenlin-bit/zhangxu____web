import { useScene } from '../../context/SceneContext';
import '../../styles/ScreenReaderOverlay.scss';

/**
 * ScreenReaderOverlay — 无障碍(可访问性)层
 *
 * 隐藏的 HTML 层,为屏幕阅读器提供 3D 场景的等效内容:
 * 包含与 3D 交互元素(门、房间)对应的按钮与链接。
 * 视觉上通过 .sr-only 隐藏,但可被辅助技术完整访问。
 */

const ROOM_LABELS = {
    about: '关于我',
    practice: '教学方向',
    gallery: '作品应用',
    studio: '创作现场',
    moments: '掠影照片',
    contact: '联系我',
};

const ROOM_DESCRIPTIONS = {
    about: '我的个人介绍、教学经历、数据里程碑与技能清单。',
    practice: 'Python、C++、Web、AI 与机器人等教学方向与课程路线。',
    gallery: '我的真实作品与应用,点击卡片可访问在线链接。',
    studio: '视频与作品:个人站搭建、互动知识课堂、色彩英语、AI 演示与课堂实录。',
    moments: '六年教学现场的照片墙,点击可查看大图。',
    contact: '联系方式：电话、B 站与 QQ。',
};

const ScreenReaderOverlay = () => {
    const { hasEntered, isInRoom, currentRoom, teleportTo, requestExit } = useScene();

    return (
        <div className="sr-overlay" role="complementary" aria-label="3D 作品集无障碍导航">
            {/* 跳过导航 */}
            <a href="#sr-main-nav" className="sr-only sr-focusable">
                跳到无障碍导航
            </a>

            <nav id="sr-main-nav" className="sr-only" aria-label="作品集房间导航">
                <h1>张旭 · 个人站</h1>
                <h2>房间导航</h2>

                {!hasEntered && (
                    <p>欢迎来到张旭的 3D 交互个人站。点击或按回车进入走廊。</p>
                )}

                {hasEntered && !isInRoom && (
                    <>
                        <p>你现在位于走廊,请选择一个房间进入:</p>
                        <ul>
                            {Object.keys(ROOM_LABELS).map((id) => (
                                <li key={id}>
                                    <button onClick={() => teleportTo(id)} type="button">
                                        {ROOM_LABELS[id]} — {ROOM_DESCRIPTIONS[id]}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </>
                )}

                {hasEntered && isInRoom && (
                    <>
                        <p>你当前在「{ROOM_LABELS[currentRoom] || currentRoom}」房间。</p>
                        <button onClick={requestExit} type="button">
                            返回走廊
                        </button>

                        {ROOM_DESCRIPTIONS[currentRoom] && (
                            <div aria-label={`${ROOM_LABELS[currentRoom] || currentRoom}房间内容`}>
                                <h3>{ROOM_LABELS[currentRoom] || currentRoom}</h3>
                                <p>{ROOM_DESCRIPTIONS[currentRoom]}</p>
                            </div>
                        )}

                        {/* 快速跳转到其他房间 */}
                        <h3>快速导航</h3>
                        <ul>
                            {Object.keys(ROOM_LABELS)
                                .filter((id) => id !== currentRoom)
                                .map((id) => (
                                    <li key={id}>
                                        <button onClick={() => teleportTo(id)} type="button">
                                            前往{ROOM_LABELS[id]}
                                        </button>
                                    </li>
                                ))}
                        </ul>
                    </>
                )}
            </nav>

            {/* 状态变化实时播报 */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {isInRoom ? `已进入${ROOM_LABELS[currentRoom] || currentRoom}房间` : '已返回走廊'}
            </div>
        </div>
    );
};

export default ScreenReaderOverlay;