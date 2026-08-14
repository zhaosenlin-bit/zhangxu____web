/**
 * Texture Preload List - full set for desktop, smaller core set for low-end/mobile entry
 */

// Entrance scene textures
export const ENTRANCE_TEXTURES = [
    // Core
    '/cartoon/textures/paper-texture.webp',
    // Doors
    '/cartoon/textures/doors/frame_sketch.webp',
    '/cartoon/textures/doors/door_left_sketch.webp',
    '/cartoon/textures/doors/door_right_sketch.webp',
    '/cartoon/textures/doors/handle_left_sketch.webp',
    '/cartoon/textures/doors/handle_right_sketch.webp',
    '/cartoon/textures/doors/door_back_left_sketch.webp',
    '/cartoon/textures/doors/pien.webp',
    // Environment
    '/cartoon/textures/entrance/wall_bricks_2.webp',
    '/cartoon/textures/entrance/stone-path.webp',
    '/cartoon/textures/entrance/floor_paper.webp',
    '/cartoon/textures/entrance/belka.webp',
    '/cartoon/textures/entrance/sign_senlin.webp',
    // Characters/Objects
    '/cartoon/textures/entrance/cat_front_body.webp',
    '/cartoon/textures/entrance/window_sketch.webp',
    '/cartoon/media/tech-sketches/window-avatar-handdrawn-cutout.png',
    '/cartoon/textures/entrance/tree_sketch.webp',
    '/cartoon/textures/entrance/mouse_hanging.webp',
    '/cartoon/textures/entrance/pot_with_duck.webp',
    '/cartoon/textures/entrance/bug_sketch.webp',
    '/cartoon/textures/entrance/speech_bubble.webp',
    '/cartoon/media/handdrawn-tech/entrance-ai-chip-doodle.png',
    '/cartoon/media/handdrawn-tech/entrance-terminal-doodle.png',
    '/cartoon/media/handdrawn-tech/entrance-neural-doodle.png',
    '/cartoon/media/handdrawn-tech/entrance-python-doodle.png',
    '/cartoon/media/handdrawn-tech/entrance-code-badge-doodle.png',
    '/cartoon/media/handdrawn-tech/entrance-avatar-badge-doodle.png',
    // Images
    '/cartoon/images/ink-splash.webp',
];

// Corridor core textures (used during the initial load on mobile/WeChat)
export const CORRIDOR_CORE_TEXTURES = [
    // Walls/Floor/Ceiling
    '/cartoon/textures/corridor/wall_texture.webp',
    '/cartoon/textures/corridor/kawalekpodlogi.webp',
    '/cartoon/textures/corridor/texturadoprogow.webp',
    '/cartoon/textures/corridor/texturadrewnadonozekbiurka.webp',
    '/cartoon/textures/corridor/ceiling_texture.webp',
    // Double doors (end of corridor)
    '/cartoon/textures/corridor/doors/frame_sketch.webp',
    '/cartoon/textures/corridor/doors/doorrleft.webp',
    '/cartoon/textures/corridor/doors/dorright.webp',
    '/cartoon/textures/corridor/doors/handle_left_sketch.webp',
    '/cartoon/textures/corridor/doors/handle_right_sketch.webp',
    '/cartoon/textures/corridor/doors/pien.webp',
    // Single side doors
    '/cartoon/textures/corridor/doors/ramkasingledoors.webp',
    '/cartoon/textures/corridor/doors/klamkadodrzwi.webp',
    '/cartoon/textures/corridor/doors/backsingledoors.webp',
    '/cartoon/textures/corridor/doors/drzwiprojekty.webp',
    '/cartoon/textures/corridor/doors/drzwisocial.webp',
    '/cartoon/textures/corridor/doors/drzwiabout.webp',
    '/cartoon/textures/corridor/doors/drzwikontakt.webp',
    '/cartoon/textures/corridor/doors/drzwipractice.webp',
    '/cartoon/textures/corridor/doors/drzwimoments.webp',
    '/cartoon/textures/corridor/doors/drzwiprojekty_painted.webp',
    '/cartoon/textures/corridor/doors/drzwisocial_painted.webp',
    '/cartoon/textures/corridor/doors/drzwiabout_painted.webp',
    '/cartoon/textures/corridor/doors/drzwikontakt_painted.webp',
    '/cartoon/textures/corridor/doors/drzwipractice_painted.webp',
    '/cartoon/textures/corridor/doors/drzwimoments_painted.webp',
    // Signs
    '/cartoon/textures/corridor/pustatabliczka.webp',
    // DoorSection extras
    '/cartoon/textures/corridor/strzalka.webp',
    '/cartoon/textures/corridor/doors/door_back.webp',
    '/cartoon/textures/corridor/doors/klamkadodrzwi_painted.webp',
];

// Corridor scene textures
export const CORRIDOR_TEXTURES = [
    ...CORRIDOR_CORE_TEXTURES,
    // Decorations
    '/cartoon/textures/corridor/decorations/while_true_loop.webp',
    '/cartoon/textures/corridor/decorations/coffee_debug.webp',
    '/cartoon/textures/corridor/decorations/idea_process.webp',
    '/cartoon/textures/corridor/decorations/paper_ball.webp',
    '/cartoon/textures/corridor/decorations/paper_airplane.webp',
    '/cartoon/textures/corridor/decorations/pencil.webp',
    '/cartoon/textures/corridor/decorations/coffee_cup.webp',
    // CorridorDecorations - frames, furniture, lamps
    '/cartoon/textures/corridor/ramkanazdjecieduza.webp',
    '/cartoon/textures/corridor/ramkanazdjecieduza_painted.webp',
    '/cartoon/textures/corridor/ramkanazdjeciemala.webp',
    '/cartoon/media/handdrawn-tech/frame-personal-site.png',
    '/cartoon/media/handdrawn-tech/frame-ai-garden.png',
    '/cartoon/media/handdrawn-tech/frame-code-castle.png',
    '/cartoon/media/handdrawn-tech/frame-debug-notes.png',
    '/cartoon/media/handdrawn-tech/frame-python-path.png',
    '/cartoon/media/handdrawn-tech/frame-neural-constellation.png',
    '/cartoon/media/handdrawn-tech/frame-robot-tutor.png',
    '/cartoon/media/handdrawn-tech/frame-data-cloud.png',
    '/cartoon/media/handdrawn-tech/frame-keyboard-music.png',
    '/cartoon/media/handdrawn-tech/frame-model-trainer.png',
    '/cartoon/textures/corridor/drzewkowdoniczce.webp',
    '/cartoon/textures/corridor/kratkawentylacyjna.webp',
    '/cartoon/textures/corridor/kwiatekwdoniczce.webp',
    '/cartoon/textures/corridor/kratanalampy.webp',
    '/cartoon/textures/corridor/bokilampy.webp',
    '/cartoon/textures/corridor/gorastolika.webp',
    '/cartoon/textures/corridor/szafkaprzod.webp',
    '/cartoon/textures/corridor/szafkaprzodgora.webp',
    '/cartoon/textures/corridor/rysuneknaobraz1.webp',
    '/cartoon/textures/corridor/rysuneknaobrazek3.webp',
];

// Standard HTML Image assets (preloaded via new Image() in App.jsx)
export const IMAGE_ASSETS = [
    '/cartoon/images/ink-splash.webp',
    '/cartoon/images/map.webp',
    '/cartoon/images/map_about_painted.webp',
    '/cartoon/images/map_contact_painted.webp',
    '/cartoon/images/map_gallery_painted.webp',
    '/cartoon/images/map_studio_painted.webp',
    '/cartoon/images/pin.webp',
    '/cartoon/images/pin-slot.webp',
];

// Additional textures from App.jsx and avatar animations
export const UI_TEXTURES = [
    '/cartoon/textures/corridor/avatar_anim/1.webp',
    '/cartoon/textures/corridor/avatar_anim/2.webp',
    '/cartoon/textures/corridor/avatar_anim/3.webp',
    '/cartoon/textures/corridor/avatar_anim/4.webp',
    '/cartoon/textures/corridor/avatar_anim/5.webp',
    '/cartoon/textures/corridor/avatar_anim/6.webp',
    '/cartoon/textures/corridor/avatar_anim/7.webp',
    '/cartoon/textures/corridor/avatar_anim/8.webp',
    '/cartoon/textures/corridor/avatar_anim/9.webp',
];

// ============================================
// ROOM TEXTURES - Preloaded for instant room entry
// ============================================

// Gallery Room textures (loaded via useTexture / drei)
// These are organized to handle conditional painted vs standard versions
export const GALLERY_TEXTURES_BASE = [
    '/cartoon/textures/gallery/floor.webp',
    '/cartoon/textures/gallery/railing.webp',
    '/cartoon/textures/gallery/domki.webp',
    '/cartoon/textures/gallery/miastotlo.webp',
    '/cartoon/textures/gallery/bird_gray.webp',
    '/cartoon/textures/gallery/klamerka.webp',
    '/cartoon/textures/gallery/openliveproject.webp',
];

export const GALLERY_TEXTURES_VERSIONED = [
    // Project cards
    'monetuneprzod',
    'timberkittyprzod',
    'youngmultiprzod',
    'bioprzod',
    // Card back
    'tylkartki',
    'przyciskdotylukartki',
    // Tech stack logos
    'csslogo',
    'elementorlogo',
    'firebaselogo',
    'htmllogo',
    'jslogo',
    'netlifylogo',
    'phplogo',
    'reactlogo',
    'tailwindlogo',
    'wordpresslogo',
];

export const GALLERY_TEXTURES = [
    ...GALLERY_TEXTURES_BASE,
    ...GALLERY_TEXTURES_VERSIONED.flatMap(name => [
        `/cartoon/textures/gallery/${name}.webp`,
        name === 'csslogo' ? `/cartoon/textures/gallery/css3logo_painted.webp` : `/cartoon/textures/gallery/${name}_painted.webp`
    ]),
    // Real app screenshots (张旭作品应用)
    '/cartoon/media/apps/python-adventure.jpg',
    '/cartoon/media/apps/class-system.jpg',
    '/cartoon/media/apps/ai-classroom.jpg',
    '/cartoon/media/apps/code-research.jpg',
    '/cartoon/media/apps/typing.jpg',
    '/cartoon/media/apps/sim-lab.jpg',
    '/cartoon/media/apps/model-trainer.jpg',
];

// Contact Room textures (loaded via useTexture / drei)
export const CONTACT_TEXTURES = [
    '/cartoon/textures/contact/faletopdown.webp',
    '/cartoon/textures/contact/molo.webp',
    '/cartoon/textures/contact/latarnia.webp',
    '/cartoon/textures/contact/statek.webp',
    '/cartoon/textures/contact/paper_form.webp',
    '/cartoon/textures/contact/send_button.webp',
    '/cartoon/textures/contact/beczka.webp',
    '/cartoon/textures/contact/beczka_painted.webp',
];

// About Room textures (loaded via useLoader(TextureLoader))
export const ABOUT_TEXTURES = [
    // Avatar
    '/cartoon/textures/about/awatarnachmurce.webp',
    '/cartoon/media/photo-hero.jpg',
    // Awards
    '/cartoon/textures/about/SOTY.webp',
    '/cartoon/textures/about/SOTY_painted.webp',
    '/cartoon/textures/about/SOTD.webp',
    '/cartoon/textures/about/SOTD_painted.webp',
    '/cartoon/textures/about/SOTM.webp',
    '/cartoon/textures/about/SOTM_painted.webp',
    '/cartoon/textures/about/button.webp',
    '/cartoon/textures/about/button_painted.webp',
    // Award images (for overlay)
    '/cartoon/textures/about/SOTDAYYOUNGMULTICSSWINNER.webp',
    '/cartoon/textures/about/SOTDAYYOUNGMULTIGSAP.webp',
    '/cartoon/textures/about/SOTDAYYOUNGMULTIORPETRON.webp',
    '/cartoon/textures/about/SOTDAYYOUNGMULTIDESIGNNOMINESS.webp',
    // Journey islands (real course photos)
    '/cartoon/textures/about/uowyspa.webp',
    '/cartoon/textures/about/freelancewyspa.webp',
    '/cartoon/media/scenes/python-path.webp',
    '/cartoon/media/scenes/cpp-noi-path.webp',
    // Skill balloons - large
    '/cartoon/textures/about/reactduzybalon.webp',
    '/cartoon/textures/about/reactduzybalon_painted.webp',
    '/cartoon/textures/about/threejsduzybalon.webp',
    '/cartoon/textures/about/threejsduzybalon_painted.webp',
    '/cartoon/textures/about/GSAPduzybalon.webp',
    '/cartoon/textures/about/GSAPduzybalon_painted.webp',
    // Skill balloons - medium
    '/cartoon/textures/about/JSSREDNIBALON.webp',
    '/cartoon/textures/about/JSSREDNIBALON_painted.webp',
    '/cartoon/textures/about/csssrednibalon.webp',
    '/cartoon/textures/about/csssrednibalon_painted.webp',
    '/cartoon/textures/about/nextjssrednibalon.webp',
    '/cartoon/textures/about/nextjssrednibalon_painted.webp',
    // Skill balloons - small
    '/cartoon/textures/about/htmlmalybalon.webp',
    '/cartoon/textures/about/htmlmalybalon_painted.webp',
    '/cartoon/textures/about/gitmalybalon.webp',
    '/cartoon/textures/about/gitmalybalon_painted.webp',
    '/cartoon/textures/about/figmamalybalon.webp',
    '/cartoon/textures/about/figmamalybalon_painted.webp',
    '/cartoon/textures/about/firebasemalybalon.webp',
    '/cartoon/textures/about/firebasemalybalon_painted.webp',
    // Clouds
    '/cartoon/textures/clouds/1131c3eb-dfae-423f-924b-ff39d8ccd6dc.webp',
    '/cartoon/textures/clouds/254b8ec8-d6f7-4275-956f-7bab65b2ce2d.webp',
    '/cartoon/textures/clouds/2cc88dd1-483c-466d-b07e-f8308c61ccbe.webp',
    '/cartoon/textures/clouds/5606fcc0-3252-447d-a58a-7bcbac73229a.webp',
    '/cartoon/textures/clouds/7882dc72-3d01-41fb-ac0e-d07b0184ebc1.webp',
    '/cartoon/textures/clouds/9b2ca72f-7bd0-473b-ba6e-dd9e0eb79d35.webp',
    '/cartoon/textures/clouds/c83293c6-d90c-4a32-8d9d-5ac9af7e2296.webp',
    '/cartoon/textures/clouds/f6e358bc-d27c-41dd-95f4-6787a835c41e.webp',
];

// Studio Room textures (loaded via useLoader(TextureLoader))
export const STUDIO_TEXTURES = [
    // Monitor (blog)
    '/cartoon/textures/studio/monitor_front.webp',
    '/cartoon/textures/studio/monitor_front_painted.webp',
    '/cartoon/textures/studio/monitor_back.webp',
    '/cartoon/textures/studio/monitor_back_painted.webp',
    '/cartoon/textures/studio/monitor_top.webp',
    '/cartoon/textures/studio/monitor_top_painted.webp',
    '/cartoon/textures/studio/monitor_bottom.webp',
    '/cartoon/textures/studio/monitor_bottom_painted.webp',
    '/cartoon/textures/studio/monitor_left.webp',
    '/cartoon/textures/studio/monitor_left_painted.webp',
    '/cartoon/textures/studio/monitor_right.webp',
    '/cartoon/textures/studio/monitor_right_painted.webp',
    // TV (youtube)
    '/cartoon/textures/studio/tv_front.webp',
    '/cartoon/textures/studio/tv_front_painted.webp',
    '/cartoon/textures/studio/tv_back.webp',
    '/cartoon/textures/studio/tv_back_painted.webp',
    '/cartoon/textures/studio/tv_top.webp',
    '/cartoon/textures/studio/tv_top_painted.webp',
    '/cartoon/textures/studio/tv_bottom.webp',
    '/cartoon/textures/studio/tv_bottom_painted.webp',
    '/cartoon/textures/studio/tv_side.webp',
    '/cartoon/textures/studio/tv_side_painted.webp',
    // Phone (tiktok)
    '/cartoon/textures/studio/phone_front.webp',
    '/cartoon/textures/studio/phone_front_painted.webp',
    '/cartoon/textures/studio/phone_back.webp',
    '/cartoon/textures/studio/phone_back_painted.webp',
    '/cartoon/textures/studio/phone_side.webp',
    '/cartoon/textures/studio/phone_side_painted.webp',
    // 张旭视频缩略图    '/cartoon/media/thumbs/personal-site.webp',
    '/cartoon/media/thumbs/interactive-knowledge.webp',
    '/cartoon/media/thumbs/color-english.webp',
    '/cartoon/media/thumbs/wechat-01.webp',
    '/cartoon/media/thumbs/wechat-02.webp',
    // Custom content front textures
    '/cartoon/textures/studio/monitorfront_postnafbdoublewinner.webp',
    '/cartoon/textures/studio/monitorfront_postnafbdoublewinner_painted.webp',
    '/cartoon/textures/studio/phonefront_followmeontiktok.webp',
    '/cartoon/textures/studio/phonefront_followmeontiktok_painted.webp',
    '/cartoon/textures/studio/tvfront_filmikedytowaniezdjec.webp',
    '/cartoon/textures/studio/tvfront_filmikedytowaniezdjec_painted.webp',
    '/cartoon/textures/studio/tvfront_filmikprojektdlamultiego.webp',
    '/cartoon/textures/studio/tvfront_filmikprojektdlamultiego_painted.webp',
];

// Moments Room textures (实拍照片)
export const MOMENTS_TEXTURES = [
    // 12 gallery photos
    '/cartoon/media/gallery/wrc7.jpg',
    '/cartoon/media/gallery/python-course.jpg',
    '/cartoon/media/gallery/cpp-course.jpg',
    '/cartoon/media/gallery/robot-detail1.jpg',
    '/cartoon/media/gallery/4e7cde1d67137f31dbbaceea09b3ba97.jpg',
    '/cartoon/media/gallery/5532032ec1ecd25b5aab600c3c66653e.jpg',
    '/cartoon/media/gallery/7ea7aec2c2fc24cdff315baf30e19994.jpg',
    '/cartoon/media/gallery/bf42704d89c36b8f7175792f2c6406df.jpg',
    '/cartoon/media/gallery/03e58ed3352bb2c5b6c34475e3ef5c05.jpg',
    '/cartoon/media/gallery/11.jpg',
    '/cartoon/media/gallery/4c034334db22d80ecae7cd665b142e62.jpg',
    '/cartoon/media/gallery/ebe3db8e9e230e42fa4a3821dc906ca8.jpg',
    // 6 scenes
    '/cartoon/media/scenes/python-path.jpg',
    '/cartoon/media/scenes/cpp-noi-path.jpg',
    '/cartoon/media/scenes/ai-classroom-path.jpg',
    '/cartoon/media/scenes/robotics-path.jpg',
    '/cartoon/media/scenes/project-release-path.jpg',
    '/cartoon/media/scenes/service-loop-path.jpg',
    // 2 root photos
    '/cartoon/media/photo-hero.jpg',
    '/cartoon/media/photo-wrcc.jpg',
    // 3 posters
    '/cartoon/media/posters/personal-site.jpg',
    '/cartoon/media/posters/interactive-knowledge.jpg',
    '/cartoon/media/posters/color-english.jpg',
];

// ============================================
// COMBINED EXPORTS
// ============================================

// Textures loaded via useTexture (drei) - entrance, corridor, UI, gallery, contact
export const PRELOAD_ALL = [
    ...ENTRANCE_TEXTURES,
    ...CORRIDOR_TEXTURES,
    ...UI_TEXTURES,
    ...GALLERY_TEXTURES,
    ...CONTACT_TEXTURES,
    ...MOMENTS_TEXTURES,
    ...IMAGE_ASSETS,
];


// Textures loaded via useLoader(TextureLoader) - about, studio
export const PRELOAD_LOADER = [
    ...ABOUT_TEXTURES,
    ...STUDIO_TEXTURES,
];

/**
 * Filters the preload list based on whether the device supports hover (desktop) 
 * or is a touch-only device (mobile/tablet).
 * @param {string[]} list The list of texture paths to filter
 * @param {boolean} usePainted Whether to prioritize _painted versions
 * @returns {string[]} The filtered list
 */
export const filterTexturesByDevice = (list, usePainted) => {
    // 1. Identify all paths that have a _painted version available
    const paintedVersions = new Set(list.filter(p => p.includes('_painted.webp')));
    
    // Also include the special css3logo case
    const hasCss3Painted = list.some(p => p.includes('css3logo_painted.webp'));
    
    return list.filter(path => {
        const isPainted = path.includes('_painted.webp');
        const isCss3 = path.includes('css3logo_painted.webp');
        
        // Find the "standard" version for this path if it's a painted one
        let standardVersion = null;
        if (isPainted) {
            standardVersion = path.replace('_painted.webp', '.webp');
        } else if (isCss3) {
            standardVersion = path.replace('css3logo_painted.webp', 'csslogo.webp');
        } else {
            // Check if this standard path HAS a painted version in the list
            const pVersion = path.replace('.webp', '_painted.webp');
            const css3Version = path.replace('csslogo.webp', 'css3logo_painted.webp');
            if (list.includes(pVersion) || (path.includes('csslogo.webp') && hasCss3Painted)) {
                // Return true to keep the standard version! Both desktop and mobile need it.
                return true; 
            }
            // If it doesn't have a painted version, it's a static texture (always keep)
            return true;
        }

        // It's a painted version
        return usePainted;
    });
};
