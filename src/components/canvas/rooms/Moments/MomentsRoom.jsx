import { useRef, useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture, PositionalAudio } from '@react-three/drei';
import * as THREE from 'three';
import { useScene } from '../../../../context/SceneContext';
import { useAudio } from '../../../../context/AudioManager';
import { useAchievements } from '../../../../context/AchievementsContext';

// ============================================
// 掠影 · 照片墙
// 圆柱显示器塔风格:23 张真实照片围成一圈,
// 拖动旋转,点击打开灯箱;背景播放教室全景视频。
// ============================================

export const AUDIO_SETTINGS = {
    volume: 1.2,
    distance: 2,
    rolloff: 1.2
};

import { moments } from '../../../../config/userContent.js';

const PHOTOS = moments;

const MomentsRoom = ({ showRoom, onReady, isExiting, isWarmup }) => {
    const groupRef = useRef();
    const ringRef = useRef();
    const { size } = useThree();
    const { openOverlay } = useScene();
    const { globalVolume, isMuted } = useAudio();
    const { showTutorial } = useAchievements();
    const effectiveVolume = isMuted ? 0 : AUDIO_SETTINGS.volume * globalVolume;

    const isMobile = size.width < 768;

    // Ready signal
    const hasSignaledReady = useRef(false);
    const frameCount = useRef(0);
    const FRAMES_TO_WAIT = 12;

    // Show the browse hint shortly after the room becomes interactive
    useEffect(() => {
        if (showRoom && !isWarmup && !isExiting) {
            const t = setTimeout(() => showTutorial('moments_browse'), 1500);
            return () => clearTimeout(t);
        }
    }, [showRoom, isWarmup, isExiting, showTutorial]);

    // Rotation state
    const angle = useRef(0);
    const targetAngle = useRef(0);
    const velocity = useRef(0);
    const dragging = useRef(false);
    const lastX = useRef(0);
    const dragDist = useRef(0);
    const hasInteracted = useRef(false);

    // Video background is rendered in child component wrapped in Suspense (see VideoBackground)

    // Arrange photos in a ring (two staggered rows)
    const ringItems = useMemo(() => {
        const radius = isMobile ? 4.5 : 5;
        const perRow = Math.ceil(PHOTOS.length / 2);
        return PHOTOS.map((photo, i) => {
            const row = i % 2;
            const rowIndex = Math.floor(i / 2);
            const a = (rowIndex / perRow) * Math.PI * 2 + (row === 0 ? 0 : (Math.PI * 2) / perRow / 2);
            const x = Math.cos(a) * radius;
            const z = Math.sin(a) * radius;
            const y = row === 0 ? 1.4 : -1.6;
            // Face the center: plane normal (+Z) rotated by rotY should point to origin
            const rotY = Math.atan2(-Math.cos(a), -Math.sin(a));
            return { ...photo, x, y, z, rotY };
        });
    }, [isMobile]);

    // Interaction: drag to rotate
    const onPointerDown = useCallback((e) => {
        dragging.current = true;
        lastX.current = e.clientX ?? 0;
        dragDist.current = 0;
        velocity.current = 0;
    }, []);

    const onPointerMove = useCallback((e) => {
        if (!dragging.current) return;
        const x = e.clientX ?? 0;
        const dx = x - lastX.current;
        lastX.current = x;
        dragDist.current += Math.abs(dx);
        targetAngle.current += dx * 0.008;
        velocity.current = dx * 0.008;
        hasInteracted.current = true;
    }, []);

    const onPointerUp = useCallback(() => {
        dragging.current = false;
    }, []);

    useEffect(() => {
        window.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);
        return () => {
            window.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
        };
    }, [onPointerDown, onPointerMove, onPointerUp]);

    // Frame loop: inertia + smooth rotation
    useFrame((state, delta) => {
        if (!hasSignaledReady.current) {
            frameCount.current++;
            if (frameCount.current >= FRAMES_TO_WAIT) {
                hasSignaledReady.current = true;
                onReady?.();
            }
        }

        if (!dragging.current) {
            targetAngle.current += velocity.current;
            velocity.current *= 0.96;
            if (Math.abs(velocity.current) < 0.0001) velocity.current = 0;
        }

        // Gentle auto-sway before first interaction
        if (!hasInteracted.current) {
            targetAngle.current = Math.sin(state.clock.elapsedTime * 0.05) * 0.6;
        }

        const lerp = 1 - Math.pow(0.001, delta);
        angle.current = THREE.MathUtils.lerp(angle.current, targetAngle.current, lerp);
        if (ringRef.current) {
            ringRef.current.rotation.y = angle.current;
        }
    });

    const handlePhotoClick = (photo, e) => {
        e.stopPropagation();
        if (dragDist.current > 8) return; // It was a drag, not a click
        openOverlay({
            layout: 'photo',
            title: photo.title,
            description: photo.desc,
            image: photo.src,
        });
    };

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {/* Video background wrapped in its own Suspense - failure or slow load won't block the photo ring */}
            <Suspense fallback={null}>
                <VideoBackground isMobile={isMobile} />
            </Suspense>

            {/* Backdrop wall (paper) */}
            <mesh position={[0, 0, -8]}>
                <planeGeometry args={[80, 40]} />
                <meshBasicMaterial color="#f2ead8" side={THREE.DoubleSide} />
            </mesh>

            {/* Title (compact so it does not fill the viewport) */}
            <Text
                position={[0, isMobile ? 2.7 : 4.0, 0]}
                fontSize={isMobile ? 0.6 : 0.85}
                color="#1a1a1a"
                anchorX="center"
                anchorY="middle"
                font="/cartoon/fonts/ZCOOLKuaiLe-Regular.ttf"
            >
                掠影 · 照片墙
            </Text>
            <Text
                position={[0, isMobile ? 2.0 : 3.45, 0]}
                fontSize={isMobile ? 0.2 : 0.22}
                color="#777777"
                anchorX="center"
                anchorY="middle"
                font="/cartoon/fonts/ZCOOLKuaiLe-Regular.ttf"
            >
                拖动旋转 · 点击查看照片
            </Text>

            {/* Photo ring */}
            <group ref={ringRef}>
                {ringItems.map((photo) => (
                    <PhotoFrame
                        key={photo.id}
                        photo={photo}
                        onPhotoClick={handlePhotoClick}
                    />
                ))}
            </group>

            {/* Floor */}
            <mesh position={[0, -4.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[isMobile ? 16 : 24, 48]} />
                <meshBasicMaterial color="#e9dcc0" />
            </mesh>

            {/* Ambient audio */}
            {!isWarmup && (
                <PositionalAudio
                    url="/cartoon/sounds/szummonitorow.mp3"
                    distanceModel="exponential"
                    refDistance={AUDIO_SETTINGS.distance}
                    rolloffFactor={AUDIO_SETTINGS.rolloff}
                    loop
                    autoplay
                    volume={effectiveVolume}
                />
            )}
        </group>
    );
};

// Video background child - isolated so its suspense does not block photo ring or other content.
// We use a plain HTMLVideoElement to guarantee we can pause + null the source when the room unmounts,
// otherwise the previous behavior left the video playing in the background after closing the overlay.
const VideoBackground = ({ isMobile }) => {
    const videoRef = useRef(null);
    const [ready, setReady] = useState(false);
    const [tex, setTex] = useState(null);

    useEffect(() => {
        const el = document.createElement('video');
        el.src = '/cartoon/media/videos/wechat-03.mp4';
        el.muted = true;
        el.loop = true;
        el.playsInline = true;
        el.autoplay = true;
        el.preload = 'auto';
        el.style.display = 'none';
        el.crossOrigin = 'anonymous';
        document.body.appendChild(el);
        videoRef.current = el;

        const onPlay = () => {
            const t = new THREE.VideoTexture(el);
            t.colorSpace = THREE.SRGBColorSpace;
            t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
            setTex(t);
            setReady(true);
        };
        el.addEventListener('playing', onPlay);
        el.play().catch(() => {});

        return () => {
            el.removeEventListener('playing', onPlay);
            try { el.pause(); } catch (e) { /* ignore */ }
            el.removeAttribute('src');
            el.load();
            if (el.parentNode) el.parentNode.removeChild(el);
            if (tex) {
                try { tex.dispose(); } catch (e) { /* ignore */ }
            }
            videoRef.current = null;
        };
    }, []);

    if (!ready || !tex) return null;

    return (
        <mesh position={[0, 1.5, -26]} frustumCulled={false}>
            <planeGeometry args={[isMobile ? 36 : 60, isMobile ? 21 : 34]} />
            <meshBasicMaterial color="#e0e0e0" map={tex} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
    );
};

// Polaroid frame whose size follows the photo's aspect ratio
const PhotoFrame = ({ photo, onPhotoClick }) => {
    const texture = useTexture(photo.src);
    const { gl } = useThree();
    useEffect(() => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, gl?.capabilities?.getMaxAnisotropy?.() ?? 1);
        texture.needsUpdate = true;
    }, [texture, gl]);

    const dims = useMemo(() => {
        const img = texture.image;
        let aspect = 4 / 3;
        if (img && img.width && img.height) aspect = img.width / img.height;
        aspect = Math.min(Math.max(aspect, 0.62), 1.85); // clamp extreme portrait/landscape
        const w = 0.9;
        const h = w / aspect;
        return { w, h };
    }, [texture]);

    return (
        <group
            position={[photo.x, photo.y, photo.z]}
            rotation={[0, photo.rotY, 0]}
            onClick={(e) => onPhotoClick(photo, e)}
            onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
                document.body.style.cursor = 'auto';
            }}
        >
            {/* Polaroid-style paper frame, tighter margins so the photo dominates */}
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[dims.w + 0.18, dims.h + 0.22]} />
                <meshBasicMaterial color="#fffaf2" side={THREE.DoubleSide} />
            </mesh>
            {/* Inner inked border for a hand-drawn feel */}
            <mesh position={[0, 0, 0.005]}>
                <planeGeometry args={[dims.w + 0.10, dims.h + 0.14]} />
                <meshBasicMaterial color="#e9dfcc" transparent opacity={0.55} side={THREE.DoubleSide} />
            </mesh>
            {/* Photo */}
            <mesh position={[0, 0.02, 0.02]}>
                <planeGeometry args={[dims.w, dims.h]} />
                <meshBasicMaterial color="#e0e0e0" map={texture} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
};

export default MomentsRoom;
