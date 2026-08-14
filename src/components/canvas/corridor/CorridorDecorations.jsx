import { useMemo, useState, useRef, useEffect } from 'react';
import { useTexture, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import '../shaders/RevealMaterial';
import { isTouchDevice } from '../../../utils/deviceDetect';
/**
 * CorridorDecorations - Dekoracje korytarza.
 * 
 * Proste p鑹俛skie plane'y z teksturami - styl rysunkowy 2D w 鑹iecie 3D.
 * 
 * Korytarz (per segment, 80 units):
 *   Drzwi: relZ -14 (left), -26 (right), -38 (left), -50 (right), -62 (left), -70 (right)
 *   corridorWidth: ~3.5 per side
 *   corridorHeight: 3.5
 *   Bezpieczne strefy dekoracji: -5 do -15, -20 do -30, -34 do -46, -50 do -60, -64 do -75
 */

// Globalne zmienne dla useFrame, aby unikn鑶啺 alokacji pami鑷媍i w ka鍋禿ej klatce i zapobiec 鑹inkom (GC stalls)
const CABIN_SKETCH_URL = '/cartoon/fonts/CabinSketch-Regular.ttf';

const PictureContent = ({ imagePath, imagePaintedPath, width, height, isPainted }) => {
    const texture = useTexture(imagePath);
    // Render nothing if no painted path, but we still call the hook unconditionally to respect hook rules
    const paintedTexture = useTexture(imagePaintedPath || imagePath);

    // Cover-mode: 调整 texture.repeat/offset 使图片填满 plane（不拉伸）
    useEffect(() => {
        if (!texture?.image || !width || !height) return;
        const texAspect = texture.image.width / texture.image.height;
        const planeAspect = width / height;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        if (texAspect > planeAspect) {
            const sy = planeAspect / texAspect;
            texture.repeat.set(1, sy);
            texture.offset.set(0, (1 - sy) / 2);
        } else {
            const sx = texAspect / planeAspect;
            texture.repeat.set(sx, 1);
            texture.offset.set((1 - sx) / 2, 0);
        }
        texture.needsUpdate = true;
        if (paintedTexture && paintedTexture.image) {
            paintedTexture.wrapS = THREE.ClampToEdgeWrapping;
            paintedTexture.wrapT = THREE.ClampToEdgeWrapping;
            const ta = paintedTexture.image.width / paintedTexture.image.height;
            if (ta > planeAspect) {
                const sy = planeAspect / ta;
                paintedTexture.repeat.set(1, sy);
                paintedTexture.offset.set(0, (1 - sy) / 2);
            } else {
                const sx = ta / planeAspect;
                paintedTexture.repeat.set(sx, 1);
                paintedTexture.offset.set((1 - sx) / 2, 0);
            }
            paintedTexture.needsUpdate = true;
        }
    }, [texture, paintedTexture, width, height]);

    const materialRef = useRef();

    useEffect(() => {
        if (!materialRef.current || !imagePaintedPath) return;

        if (isPainted) {
            gsap.to(materialRef.current, {
                uProgress: 1.0,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: true
            });
        } else {
            gsap.to(materialRef.current, {
                uProgress: 0.0,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true
            });
        }
    }, [isPainted, imagePaintedPath]);

    return (
        <group position={[0, 0, 0.01]}> {/* Lekko przed ramk鑶?*/}
            {imagePaintedPath && (
                <mesh position={[0, 0, -0.001]}>
                    <planeGeometry args={[width, height]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={paintedTexture}
                        transparent={true}
                        alphaTest={0.5}
                        side={THREE.DoubleSide}
                        roughness={0.9}
                    />
                </mesh>
            )}
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[width, height]} />
                {imagePaintedPath ? (
                    <revealMaterial color="#e0e0e0"
                        ref={materialRef}
                        map={texture}
                        transparent={true}
                        alphaTest={0.1}
                        side={THREE.DoubleSide}
                        roughness={0.9}
                        uProgress={0.0}
                    />
                ) : (
                    <meshBasicMaterial color="#e0e0e0"
                        map={texture}
                        transparent={true}
                        alphaTest={0.1} // KLUCZOWE: Naprawia przezroczysto鑹ｈ啺 (wycina t鑹俹)
                        side={THREE.DoubleSide}
                        roughness={0.5}
                    />
                )}
            </mesh>
        </group>
    );
};

const InspectableFrame = ({ frame, wallX, frameTexture, framePaintedTexture, CABIN_SKETCH_URL }) => {
    const { viewport } = useThree();
    const groupRef = useRef();
    const frameMaterialRef = useRef();
    const framePaintedRef = useRef();
    const hideDelayRef = useRef();

    // Zapisujemy oryginaln鑶?pozycj鑷?i rotacj鑷?na 鑹ianie
    const originalPos = useMemo(() => new THREE.Vector3(
        frame.side === 'left'
            ? -wallX + (frame.offsetFromWall ?? 0.04)
            : wallX - (frame.offsetFromWall ?? 0.04),
        frame.y,
        frame.z
    ), [frame, wallX]);

    const originalRot = useMemo(() => new THREE.Euler(
        0, frame.side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0
    ), [frame.side]);

    const [isHovered, setIsHovered] = useState(false);

    // Sprawdzamy czy to urz鑶甦zenie dotykowe (telefon/tablet) by ca鑹俴owicie wy鑹傝啴czy鑶?efekt hover i podnie鑹ｈ啺 wydajno鑹ｈ啺
    const isTouch = useMemo(() => isTouchDevice(), []);
    // Zostawiamy te鍋?stary mechanizm 鍋秂by od鑹傝啴czy鑶?na ekstremalnie w鑶畇kich ekranach w og璐竘e inspected
    const isMobile = viewport.width < 5 || viewport.aspect < 0.8 || isTouch;

    // Kiedy komponent znika, na wszelki wypadek wy鑹傝啴czamy override
    useEffect(() => {
        if (isHovered && !isMobile) document.body.style.cursor = 'pointer';
        else document.body.style.cursor = 'auto';
    }, [isHovered, isMobile]);

    useEffect(() => {
        if (!frameMaterialRef.current) return;

        const shouldBePainted = isHovered;

        if (shouldBePainted) {
            if (hideDelayRef.current) hideDelayRef.current.kill();
            if (framePaintedRef.current) framePaintedRef.current.visible = true;

            gsap.to(frameMaterialRef.current, {
                opacity: 0,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: true
            });
        } else {
            gsap.to(frameMaterialRef.current, {
                opacity: 1,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true
            });

            hideDelayRef.current = gsap.delayedCall(0.55, () => {
                if (framePaintedRef.current) framePaintedRef.current.visible = false;
            });
        }

        return () => {
            if (hideDelayRef.current) hideDelayRef.current.kill();
        };
    }, [isHovered]);

    return (
        <group
            ref={groupRef}
            position={originalPos}
            rotation={originalRot}
        >
            {/* INVISIBLE HITBOX to catch pointer events smoothly and prevent raycaster from jumping between meshes */}
            <mesh
                position={[0, 0, 0.05]}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!isMobile) setIsHovered(true);
                }}
                onPointerEnter={(e) => {
                    e.stopPropagation();
                    if (!isMobile) setIsHovered(true);
                }}
                onPointerLeave={(e) => {
                    e.stopPropagation();
                    setIsHovered(false);
                }}
            >
                <planeGeometry args={[frame.width * 1.08, frame.height * 1.08]} />
                <meshBasicMaterial color="#e0e0e0" transparent opacity={0} depthWrite={false} depthTest={false} />
            </mesh>

            {/* RAMKA PAINTED (behind sketch) */}
            {!isTouch && (
                <mesh ref={framePaintedRef} position={[0, 0, -0.001]} scale={[0.98, 0.98, 1]} visible={false}>
                    <planeGeometry args={[frame.width, frame.height]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={framePaintedTexture}
                        transparent={true}
                        alphaTest={0.5}
                        side={THREE.DoubleSide}
                        roughness={0.9}
                    />
                </mesh>
            )}

            {/* RAMKA SKETCH OVERLAY (front, always visible at rest) */}
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[frame.width, frame.height]} />
                <meshBasicMaterial
                    ref={frameMaterialRef}
                    map={frameTexture}
                    transparent={true}
                    alphaTest={0.1}
                    side={THREE.DoubleSide}
                    roughness={0.9}
                    opacity={1}
                />
            </mesh>

            {/* OBRAZEK WEWN鑶璗RZ */}
            {frame.image && (
                <PictureContent
                    imagePath={frame.image}
                    imagePaintedPath={!isTouch ? frame.imagePainted : null}
                    width={frame.imageWidth || frame.width * 0.7}
                    height={frame.imageHeight || frame.height * 0.7}
                    isPainted={isHovered}
                />
            )}

            {/* PODPIS */}
            {frame.signature && (
                <Text
                    position={[
                        frame.signatureX !== undefined ? frame.signatureX : (frame.width / 2 - 0.1),
                        frame.signatureY !== undefined ? frame.signatureY : (-frame.height / 2 + 0.15),
                        0.06
                    ]}
                    fontSize={frame.signatureSize || 0.12}
                    font={CABIN_SKETCH_URL}
                    color={frame.signatureColor || "#333333"}
                    anchorX="center"
                    anchorY="middle"
                    renderOrder={24}
                >
                    {frame.signature}
                </Text>
            )}
        </group>
    );
};

const CorridorDecorations = ({
    segmentLength,
    zOffset,
    doorPositions = [],
    corridorWidth = 4,
    corridorHeight = 3.5,
    zClip = 100000
}) => {

    const wallX = corridorWidth / 2;
    const floorY = -corridorHeight / 2;
    const ceilingY = corridorHeight / 2;

    // =============================================
    // TEKSTURY DEKORACJI
    // =============================================
    const frameTexture = useTexture('/cartoon/textures/corridor/ramkanazdjecieduza.webp');
    const framePaintedTexture = useTexture('/cartoon/textures/corridor/ramkanazdjecieduza_painted.webp');
    const standingFrameTexture = useTexture('/cartoon/textures/corridor/ramkanazdjeciemala.webp');
    const treeTexture = useTexture('/cartoon/textures/corridor/drzewkowdoniczce.webp');
    const grateTexture = useTexture('/cartoon/textures/corridor/kratkawentylacyjna.webp');
    const flowerTexture = useTexture('/cartoon/textures/corridor/kwiatekwdoniczce.webp');

    // --- Ceiling Lights (punkty 鑹iat鑹俛) ---
    // Tekstury lamp
    const lampGrilleTexture = useTexture('/cartoon/textures/corridor/kratanalampy.webp');
    // lampGrilleTexture.wrapS = lampGrilleTexture.wrapT = THREE.RepeatWrapping; 
    // lampGrilleTexture.repeat.set(1, 1);

    const lampSideTexture = useTexture('/cartoon/textures/corridor/bokilampy.webp');
    lampSideTexture.wrapS = lampSideTexture.wrapT = THREE.RepeatWrapping;
    // Dopasowanie UV dla d鑹倁giego boku
    lampSideTexture.repeat.set(1, 1);

    const lights = useMemo(() => {
        const items = [];
        // ===== REGULACJA 鑹IATE鑹?=====
        const LIGHT_SPACING = 15;      // Odst鑷媝 mi鑷媎zy lampami
        const LIGHT_START_OFFSET = -5;  // Start z zapasem od pocz鑶畉ku (bo tam s鑶?drzwi poprzedniego segmentu)

        const startZ = zOffset + LIGHT_START_OFFSET;
        const endZ = zOffset - segmentLength + 10; // Zapas od ko鑹卌a (SegmentDoors jest na -75)

        for (let z = startZ; z > endZ; z -= LIGHT_SPACING) {
            items.push({ z });
        }
        return items;
    }, [segmentLength, zOffset]);

    // =============================================
    // RAMKI NA ZDJ鑷塁IA (PICTURE FRAMES)
    // =============================================
    // P鑹俛skie plane'y na 鑹ianach z tekstur鑶?ramki.
    // Wewn鑶畉rz ramki mo鍋秐a p璐歌棔niej doda鑶?plakaty/zdj鑷媍ia.
    //
    // USTAWIENIA DO R鑷塁ZNEJ REGULACJI:
    // - z: pozycja Z (gdzie na osi korytarza), obliczana jako zOffset - warto鑹ｈ啺
    // - side: 'left' lub 'right'
    // - width/height: rozmiar ramki
    // - y: pozycja Y (wysoko鑹ｈ啺 na 鑹ianie, 0 = 鑹odek)
    const frameInnerWidth = 1.86;
    const frameInnerHeight = 1.08;
    const frames = useMemo(() => [
        {
            z: zOffset - 7,
            side: 'right',
            width: 2.5,
            height: 2.5 / 1.785,
            y: 0.3,
            id: 'frame-personal-site',
            image: '/cartoon/media/handdrawn-tech/frame-personal-site.png',
            imageWidth: frameInnerWidth,
            imageHeight: frameInnerHeight,
            offsetFromWall: 0.1
        },
        {
            z: zOffset - 18,
            side: 'left',
            width: 2.5,
            height: 2.5 / 1.785,
            y: 0.28,
            id: 'frame-ai-garden',
            image: '/cartoon/media/handdrawn-tech/frame-ai-garden.png',
            imageWidth: frameInnerWidth,
            imageHeight: frameInnerHeight,
            offsetFromWall: 0.1
        },
        {
            z: zOffset - 21,
            side: 'right',
            width: 2.5,
            height: 2.5 / 1.785,
            y: 0.26,
            id: 'frame-code-castle',
            image: '/cartoon/media/handdrawn-tech/frame-code-castle.png',
            imageWidth: frameInnerWidth,
            imageHeight: frameInnerHeight,
            offsetFromWall: 0.1
        },
        {
            z: zOffset - 31,
            side: 'left',
            width: 2.5,
            height: 2.5 / 1.785,
            y: 0.34,
            id: 'frame-debug-notes',
            image: '/cartoon/media/handdrawn-tech/frame-debug-notes.png',
            imageWidth: frameInnerWidth,
            imageHeight: frameInnerHeight,
            signature: '张旭 · 个人站',
            signatureX: 0,
            signatureY: -0.4,
            signatureSize: 0.001,
            signatureColor: '#1a1a1a',
            offsetFromWall: 0.1
        },
        {
            z: zOffset - 43,
            side: 'right',
            width: 2.5,
            height: 2.5 / 1.785,
            y: 0.3,
            id: 'frame-python-path',
            image: '/cartoon/media/handdrawn-tech/frame-python-path.png',
            imageWidth: frameInnerWidth,
            imageHeight: frameInnerHeight,
            offsetFromWall: 0.1
        },
        {
            z: zOffset - 45,
            side: 'left',
            width: 2.5,
            height: 2.5 / 1.785,
            y: 0.25,
            id: 'frame-neural-constellation',
            image: '/cartoon/media/handdrawn-tech/frame-neural-constellation.png',
            imageWidth: frameInnerWidth,
            imageHeight: frameInnerHeight,
            offsetFromWall: 0.1
        },
        {
            z: zOffset - 57,
            side: 'left',
            width: 2.5,
            height: 2.5 / 1.785,
            y: 0.35,
            id: 'frame-robot-tutor',
            image: '/cartoon/media/handdrawn-tech/frame-robot-tutor.png',
            imageWidth: frameInnerWidth,
            imageHeight: frameInnerHeight,
            offsetFromWall: 0.1
        },
        {
            z: zOffset - 57,
            side: 'right',
            width: 2.5,
            height: 2.5 / 1.785,
            y: 0.3,
            id: 'frame-data-cloud',
            image: '/cartoon/media/handdrawn-tech/frame-data-cloud.png',
            imageWidth: frameInnerWidth,
            imageHeight: frameInnerHeight,
            offsetFromWall: 0.1
        },
        {
            z: zOffset - 63,
            side: 'right',
            width: 2.5,
            height: 2.5 / 1.785,
            y: 0.36,
            id: 'frame-keyboard-music',
            image: '/cartoon/media/handdrawn-tech/frame-keyboard-music.png',
            imageWidth: frameInnerWidth,
            imageHeight: frameInnerHeight,
            offsetFromWall: 0.1
        },
        {
            z: zOffset - 67,
            side: 'left',
            width: 2.5,
            height: 2.5 / 1.785,
            y: 0.3,
            id: 'frame-model-trainer',
            image: '/cartoon/media/handdrawn-tech/frame-model-trainer.png',
            imageWidth: frameInnerWidth,
            imageHeight: frameInnerHeight,
            offsetFromWall: 0.1
        },
    ], [zOffset]);

    // Keep every frame on a straight wall run. The corridor has angled
    // four-unit door approaches, so a frame that lands inside one is moved
    // to the nearest readable section before it is mounted.
    const mountedFrames = useMemo(() => {
        const doorHalfSpan = 2;
        const clearance = 2.6;

        return frames.map((frame) => {
            const localZ = frame.z - zOffset;
            const sameSideDoors = doorPositions
                .filter((door) => door.side === frame.side)
                .map((door) => door.relativeZ)
                .sort((a, b) => b - a);

            let mountedLocalZ = localZ;
            for (const doorZ of sameSideDoors) {
                const doorStart = doorZ + doorHalfSpan;
                const doorEnd = doorZ - doorHalfSpan;
                if (mountedLocalZ <= doorStart && mountedLocalZ >= doorEnd) {
                    mountedLocalZ = mountedLocalZ >= doorZ
                        ? doorStart + clearance
                        : doorEnd - clearance;
                    break;
                }
            }

            return {
                ...frame,
                z: zOffset + mountedLocalZ
            };
        });
    }, [doorPositions, frames, zOffset]);

    // =============================================
    // STOLIK (TABLE)
    // =============================================
    const woodTexture = useTexture('/cartoon/textures/corridor/texturadrewnadonozekbiurka.webp');
    const tableTopTexture = useTexture('/cartoon/textures/corridor/gorastolika.webp');

    // Tekstury szafki
    const cabinetFrontTexture = useTexture('/cartoon/textures/corridor/szafkaprzod.webp');
    const cabinetRestTexture = useTexture('/cartoon/textures/corridor/szafkaprzodgora.webp');

    // Klonujemy tekstur鑷?dla n璐竒, 鍋秂by j鑶?obr璐竎i鑶?(bo user m璐竪i 鍋秂 jest poziomo a ma by鑶?pionowo)
    const legTexture = useMemo(() => {
        const tex = woodTexture.clone();
        tex.rotation = Math.PI / 2;
        tex.center.set(0.5, 0.5);
        return tex;
    }, [woodTexture]);

    // Konfiguracja stolika
    // Obr璐竎ony 90鎺?i przyci鑶甮ni鑷媡y do lewej 鑹iany
    const tableConfig = useMemo(() => ({
        z: zOffset - 35,          // Pozycja Z (strefa mi鑷媎zy Studio a About)
        width: 2.0,               // Szeroko鑹ｈ啺 blatu (po obrocie: wzd鑹倁鍋?鑹iany)
        depth: 0.8,               // G鑹傝噵boko鑹ｈ啺 blatu (po obrocie: od 鑹iany w korytarz)
        height: 1.0,              // Wysoko鑹ｈ啺 ca鑹俴owita
        legRadius: 0.08,          // Grubo鑹ｈ啺 n璐竒
        topThickness: 0.08,       // Grubo鑹ｈ啺 blatu
        x: -wallX + 0.42,         // Przy lewej 鑹ianie (depth/2 + ma鑹倅 gap)
    }), [zOffset, wallX]);

    return (
        <group>
            {/* === LAMPY SUFITOWE === */}
            {lights.filter(light => light.z <= zClip).map((light, i) => {
                // Konfiguracja tekstur wewn鑶畉rz p鑷媡li (lub poza, ale upewnijmy si鑷?co do wrappingu)
                lampGrilleTexture.wrapS = lampGrilleTexture.wrapT = THREE.ClampToEdgeWrapping;
                lampSideTexture.wrapS = lampSideTexture.wrapT = THREE.ClampToEdgeWrapping; // Boki te鍋?clamp, 鍋秂by nie by鑹俹 pask璐竪

                return (
                    <group key={`light-${i}`} position={[0, ceilingY, light.z]}>
                        {/* Obudowa lampy - pod鑹倁鍋秐y prostok鑶畉 3D */}
                        {/* G鑹佽劔WNA BRY鑹丄 */}
                        <mesh position={[0, -0.03, 0]}>
                            <boxGeometry args={[2.0, 0.06, 0.5]} />

                            {/* Short sides (Right/Left) */}
                            <meshBasicMaterial attach="material-0" color="#e8e8e8" roughness={0.6} />
                            <meshBasicMaterial attach="material-1" color="#e8e8e8" roughness={0.6} />

                            {/* Top (Hidden) */}
                            <meshBasicMaterial attach="material-2" color="#d0d0d0" roughness={0.8} />

                            {/* Bottom - Grille Texture 
                                U鍋秠wamy przezroczysto鑹i, 鍋秂by ods鑹俹ni鑶?wewn鑷媡rzne 鑹iat鑹俹.
                                Sama krata jest ciemna/metaliczna.
                            */}
                            <meshBasicMaterial
                                attach="material-3"
                                map={lampGrilleTexture}
                                transparent={true}
                                alphaTest={0.1}
                                side={THREE.DoubleSide}
                                color="#e0e0e0"
                                roughness={0.5}
                            />

                            {/* Long sides (Front/Back) - Side Texture */}
                            <meshBasicMaterial color="#e0e0e0" attach="material-4" map={lampSideTexture} roughness={0.6} />
                            <meshBasicMaterial color="#e0e0e0" attach="material-5" map={lampSideTexture} roughness={0.6} />
                        </mesh>

                        {/* WEWN鑷塗RZNE 鑹IAT鑹丱 (LIGHT PANEL) 
                            Siedzi WY鍛旹J w obudowie, 鍋秂by kratka pod spodem by鑹俛 widoczna.
                        */}
                        <mesh
                            position={[0, -0.059, 0]}
                            rotation={[-Math.PI / 2, 0, 0]}
                        >
                            <planeGeometry args={[1.9, 0.4]} />
                            <meshBasicMaterial
                                color="#ffffff"
                                toneMapped={false}
                                side={THREE.DoubleSide}
                            />
                        </mesh>

                        {/* RZECZYWISTE 娈碦鑴獶鑹丱 鑹IAT鑹丄 (PointLight) - WYLACZONE */}
                        {/* <pointLight
                            position={[0, -1.5, 0]}
                            distance={6}
                            intensity={0.8}
                            color="#ffffff"
                            decay={2}
                        /> */}
                    </group>
                );
            })}

            {/* === STOLIK (obr璐竎ony 90鎺? przy lewej 鑹ianie) === */}
            <group position={[tableConfig.x, floorY, tableConfig.z]} rotation={[0, Math.PI / 2, 0]}>
                {/* Nogi stolika */}
                {[
                    [-tableConfig.width / 2 + 0.1, -tableConfig.depth / 2 + 0.1],
                    [tableConfig.width / 2 - 0.1, -tableConfig.depth / 2 + 0.1],
                    [-tableConfig.width / 2 + 0.1, tableConfig.depth / 2 - 0.1],
                    [tableConfig.width / 2 - 0.1, tableConfig.depth / 2 - 0.1],
                ].map((pos, i) => (
                    <mesh key={`leg-${i}`} position={[pos[0], tableConfig.height / 2, pos[1]]}>
                        <boxGeometry args={[tableConfig.legRadius * 2, tableConfig.height, tableConfig.legRadius * 2]} />
                        <meshBasicMaterial color="#e0e0e0" map={legTexture} roughness={0.8} />
                    </mesh>
                ))}

                {/* Blat stolika */}
                <mesh position={[0, tableConfig.height + tableConfig.topThickness / 2, 0]}>
                    <boxGeometry args={[tableConfig.width, tableConfig.topThickness, tableConfig.depth]} />
                    <meshBasicMaterial color="#e0e0e0" attach="material-0" map={woodTexture} /> {/* Right */}
                    <meshBasicMaterial color="#e0e0e0" attach="material-1" map={woodTexture} /> {/* Left */}
                    <meshBasicMaterial color="#e0e0e0" attach="material-2" map={tableTopTexture} roughness={0.5} /> {/* Top */}
                    <meshBasicMaterial attach="material-3" color="#e0e0e0" />   {/* Bottom */}
                    <meshBasicMaterial color="#e0e0e0" attach="material-4" map={woodTexture} /> {/* Front */}
                    <meshBasicMaterial color="#e0e0e0" attach="material-5" map={woodTexture} /> {/* Back */}
                </mesh>

                {/* KWIATEK NA STOLE */}
                <mesh
                    position={[0, tableConfig.height + tableConfig.topThickness + 0.2, 0]} // Na blacie
                    rotation={[0, -Math.PI / 4, 0]} // Lekki obr璐竧
                >
                    <planeGeometry args={[0.3, 0.3 / 0.758]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={flowerTexture}
                        transparent={true}
                        alphaTest={0.1}
                        side={THREE.DoubleSide}
                        roughness={0.8}
                    />
                </mesh>
            </group>

            {/* =============================================
                RAMKI NA ZDJ鑷塁IA NA 鑹IANACH
                =============================================
                Ka鍋禿a ramka to p鑹俛ski plane z tekstur鑶?"ramka na zdjecie.png".
                S鑶?przyczepione do 鑹ian na przemian (lewa/prawa).
                
                鍛昬by zmieni鑶?pozycj鑷?rozmiar konkretnej ramki,
                edytuj odpowiedni obiekt w tablicy 'frames' powy鍋秂j.
            */}
            {mountedFrames.map((frame) => (
                <InspectableFrame
                    key={frame.id}
                    frame={frame}
                    wallX={wallX}
                    frameTexture={frameTexture}
                    framePaintedTexture={framePaintedTexture}
                    CABIN_SKETCH_URL={CABIN_SKETCH_URL}
                />
            ))}

            {/* === SZAFKA (CABINET) === */}
            {/* Prosty box jako placeholder, naprzeciwko drzwi About (Left -48) -> wi鑷媍 szafka na Right -51 */}
            <mesh
                position={[wallX - 0.26, floorY + 0.5, zOffset - 51]}
            // X: wallX - (depth/2) - ma鑹倅 margin
            // Y: floorY + (height/2)
            // Z: zOffset - 51 (blisko drzwi About)
            >
                {/* Wymiary: X=0.5 (g鑹傝噵boko鑹ｈ啺 od 鑹iany), Y=1.0 (wysoko鑹ｈ啺), Z=0.8 (szeroko鑹ｈ啺 wzd鑹倁鍋?鑹iany) */}
                <boxGeometry args={[0.5, 1.0, 1.0 * 0.8]} />
                {/* 
                    Materials for BoxGeometry:
                    0: Right (+x) - Wall side
                    1: Left (-x) - Corridor side (FRONT of cabinet) -> szafkaprzod.png
                    2: Top (+y) -> szafkaprzodgora.png
                    3: Bottom (-y) -> szafkaprzodgora.png (as requested)
                    4: Front (+z) -> szafkaprzodgora.png (side)
                    5: Back (-z) -> szafkaprzodgora.png (side)
                */}
                <meshBasicMaterial color="#e0e0e0" attach="material-0" map={cabinetRestTexture} />
                <meshBasicMaterial color="#e0e0e0" attach="material-1" map={cabinetFrontTexture} />
                <meshBasicMaterial color="#e0e0e0" attach="material-2" map={cabinetRestTexture} />
                <meshBasicMaterial color="#e0e0e0" attach="material-3" map={cabinetRestTexture} />
                <meshBasicMaterial color="#e0e0e0" attach="material-4" map={cabinetRestTexture} />
                <meshBasicMaterial color="#e0e0e0" attach="material-5" map={cabinetRestTexture} />
            </mesh>

            {/* === STOJ鑶瑿A RAMKA NA SZAFCE (STANDING FRAME) === */}
            {/* Stoi na szafce: Y = floorY + 1.0 (wysoko鑹ｈ啺 szafki) + po鑹俹wa wysoko鑹i ramki */}
            <mesh
                position={[wallX - 0.26, floorY + 1.0 + 0.2, zOffset - 51]}
                rotation={[0, -Math.PI / 2 + 0.2, 0]} // Lekki obr璐竧, 鍋秂by nie sta鑹俛 idealnie prosto
            >
                <planeGeometry args={[0.3, 0.3 / 0.777]} />
                <meshBasicMaterial color="#e0e0e0"
                    map={standingFrameTexture}
                    transparent={true}
                    alphaTest={0.1}
                    side={THREE.DoubleSide}
                    roughness={0.8}
                />
            </mesh>


            {/* === DRZEWKO W DONICZCE (POTTED TREE) === */}
            {/* Kolo drzwi Contact (Right -62). Ustawiamy na -58, ODWROTNIE (Left). */}
            <mesh
                position={[-wallX + 0.8, floorY + 1.5, zOffset - 58]} // Left side
                rotation={[0, Math.PI / 4, 0]} // Obr璐竎one w stron鑷?korytarza (z lewej)
            >
                <planeGeometry args={[1.8, 1.8 / 0.602]} />
                <meshBasicMaterial color="#e0e0e0"
                    map={treeTexture}
                    transparent={true}
                    alphaTest={0.1}
                    side={THREE.DoubleSide}
                    roughness={0.8}
                />
            </mesh>

            {/* === KRATKI WENTYLACYJNE (VENTILATION GRATES) === */}
            {/* Generujemy kratk鑷?na przeciwleg鑹俥j 鑹ianie dla ka鍋禿ego obrazu */}
            {mountedFrames.map((frame, i) => {
                const isFrameLeft = frame.side === 'left';
                const grateSide = isFrameLeft ? 'right' : 'left';

                return (
                    <mesh
                        key={`grate-${i}`}
                        position={[
                            grateSide === 'left' ? -wallX + 0.01 : wallX - 0.01,
                            ceilingY - 0.6, // Wysoko, tak jak ta pierwsza
                            frame.z // Ta sama pozycja Z co obrazu
                        ]}
                        rotation={[0, grateSide === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}
                    >
                        <planeGeometry args={[0.8, 0.8 / 1.968]} />
                        <meshBasicMaterial color="#e0e0e0"
                            map={grateTexture}
                            transparent={true}
                            alphaTest={0.1}
                            side={THREE.DoubleSide}
                            roughness={0.8}
                        />
                    </mesh>
                );
            })}

        </group >
    );
};

export default CorridorDecorations;
