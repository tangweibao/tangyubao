const assetRoot = "唐尉保作品集2_files";

const pad = (value) => String(value).padStart(2, "0");

const jdSlides = Array.from({ length: 37 }, (_, index) => {
  const number = index + 1;
  const extension = [22, 33].includes(number) ? "jpg" : "png";
  return {
    src: `${assetRoot}/图片${number}.${extension}`,
    thumb: `assets/slide-thumbs/jd-${pad(number)}.jpg`,
    alt: `京东数坊案例第 ${number} 页`
  };
});

const kingsoftPages = [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 43];
const kingsoftSlides = kingsoftPages.map((number, index) => ({
  src: `${assetRoot}/C端${number}.${number === 39 ? "jpg" : "png"}`,
  thumb: `assets/slide-thumbs/kingsoft-${pad(index + 1)}.jpg`,
  alt: `金山词霸案例第 ${index + 1} 页`
}));

/* ---------------------------------------------------------------------------
   Composite slides: one PPT background image with media boxes laid on top.
   Every box is positioned in percentages of the frame, so the page scales as
   a single unit and the boxes never drift between viewports.
   `demoOverlays` is a placeholder until the real pages land via the local
   placement editor (.qa/media/compose.html).
--------------------------------------------------------------------------- */
const isComposite = (slide) => Boolean(slide && slide.type === "composite");
const slideSource = (slide) => (isComposite(slide) ? slide.background : slide?.src);
// High-res originals stay untouched; the viewer loads the smallest WebP that
// still covers the frame at the current device pixel ratio. The original is
// the fallback for large/retina/fullscreen displays.
const slideVariants = (src) => {
  const base = src.replace(/\.[^.]+$/, "");
  return [960, 1280, 1920, 2560].map((width) => ({
    width,
    src: `${base}.w${width}.webp`
  }));
};

const pickSlideSource = (slide) => {
  const base = slideSource(slide);
  const variants = slide?.variants;
  if (!base || !variants?.length) return base;
  const frame = document.querySelector(".artwork-frame");
  const cssWidth = frame?.clientWidth || Math.min(window.innerWidth * 0.82, 1920);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const target = Math.ceil((cssWidth * dpr) / 16) * 16;
  for (const variant of variants) {
    if (variant.width >= target) return variant.src;
  }
  return base;
};

// Legacy JD / Kingsoft pages also get responsive variants.
jdSlides.forEach((slide) => { slide.variants = slideVariants(slide.src); });
kingsoftSlides.forEach((slide) => { slide.variants = slideVariants(slide.src); });

const warmedImageSources = new Set();
function warmSlideImage(slide) {
  const src = pickSlideSource(slide);
  if (!src || warmedImageSources.has(src)) return;
  warmedImageSources.add(src);
  const image = new Image();
  image.decoding = "async";
  image.src = src;
}

function whenImageDecoded(image, callback) {
  if (!image) { callback(); return; }
  if (typeof image.decode === "function") {
    image.decode().then(callback, callback);
  } else {
    callback();
  }
}

// When the viewport, DPR or fullscreen state changes, upgrade/downgrade the
// current image to the variant that matches the new displayed size.
let resolutionRefreshToken = 0;
function refreshArtworkResolution() {
  if (state.screen !== "viewer" || !elements.viewerScreen || elements.viewerScreen.hidden) return;
  if (elements.artwork.classList.contains("is-loading")) return;
  const project = currentProject();
  const slide = project?.slides?.[state.slideIndex];
  if (!slide || isComposite(slide) || !slide.variants?.length) return;
  const wanted = pickSlideSource(slide);
  const current = elements.artwork.getAttribute("src") || "";
  if (!wanted || wanted === current) return;
  const token = ++resolutionRefreshToken;
  const preload = new Image();
  preload.decoding = "async";
  preload.onload = () => {
    whenImageDecoded(preload, () => {
      if (token !== resolutionRefreshToken || state.screen !== "viewer") return;
      const active = currentProject()?.slides?.[state.slideIndex];
      if (active !== slide || pickSlideSource(active) !== wanted) return;
      if (elements.artwork.getAttribute("src") === wanted) return;
      elements.artwork.src = wanted;
    });
  };
  preload.src = wanted;
}
const slideThumb = (slide) => slide?.thumb || slideSource(slide);
const slideVideoCount = (slide) =>
  isComposite(slide) ? (slide.overlays || []).filter((overlay) => overlay.kind === "video").length : 0;
const slideHasVideo = (slide) => slideVideoCount(slide) > 0;

/* 真实 PPT 页：亲声伴读 · iOS 端 AI 开发实践（第 6 页）。
   背景图已按空框位置量好（x/y/w/h 为相对整页的百分比），
   视频源先用 demo 片段占位——真实视频转码后只替换 src / poster 两行即可。 */
const readingSlide = {
  type: "composite",
  background: "assets/demo/ai-reading-01.png",
  variants: slideVariants("assets/demo/ai-reading-01.png"),
  thumb: "assets/slide-thumbs/ai-reading-01.jpg",
  alt: "亲声伴读：iOS 端 AI 开发实践（PPT 背景图 + 演示视频）",
  overlays: [
    {
      kind: "video",
      id: "reading-demo",
      label: "亲声伴读 · iOS AI 实践演示",
      src: "assets/video/demo-1080p.mp4",
      poster: "assets/video/demo-poster.jpg",
      box: { x: 41.02, y: 33.01, w: 52.45, h: 54.35 },
      fit: "cover",
      radius: 1,
      muted: false,
      loop: false,
      controls: "native"
    }
  ]
};

/* ByteDance works imported from 2026 作品材料 (4 folders):
   original-resolution PNG slides + responsive WebP variants + 320×180 rail thumbs. */
const bytedanceWorks = "assets/works/bytedance";
const buildWorksSlides = (folder, count, thumbPrefix, label) =>
  Array.from({ length: count }, (_, index) => {
    const number = pad(index + 1);
    const src = `${bytedanceWorks}/${folder}/${number}.png`;
    return {
      src,
      variants: slideVariants(src),
      thumb: `assets/slide-thumbs/${thumbPrefix}-${number}.jpg`,
      alt: `${label}第 ${index + 1} 页`
    };
  });

const bytedancePlatformSlides = buildWorksSlides("platform", 35, "byte-platform", "抖音创作服务平台案例");
const bytedanceAiCoverSlides = buildWorksSlides("ai-cover", 9, "byte-ai-cover", "抖音 AI 封面案例");
// 抖音其他项目：新增一张首图（00），随后接原第 3 页与原第 1、2、4 页。
// 其中原第 1 页（37.jpg）是视频页：背景图 + 左侧手机框内嵌内容演示。
const bytedanceOtherOrder = [0, 3, 1, 2, 4];
const otherVideoBackground = `${bytedanceWorks}/other/01.jpg`;
const bytedanceOtherSlides = bytedanceOtherOrder.map((fileNumber, index) => {
  if (fileNumber === 1) {
    return {
      type: "composite",
      background: otherVideoBackground,
      variants: slideVariants(otherVideoBackground),
      thumb: "assets/slide-thumbs/byte-other-01.jpg",
      alt: "抖音其他项目案例第 3 页（含视频演示）",
      overlays: [
        {
          kind: "video",
          id: "other-37-demo",
          label: "抖音其他项目 · 功能演示",
          src: "assets/video/other-37-demo.mp4",
          poster: "assets/video/other-37-demo-poster.jpg",
          box: { x: 8.57, y: 25.29, w: 20.71, h: 67.09 },
          fit: "cover",
          radius: 1.8,
          muted: false,
          loop: false,
          controls: "native"
        }
      ]
    };
  }
  const src = `${bytedanceWorks}/other/${pad(fileNumber)}.png`;
  return {
    src,
    variants: slideVariants(src),
    thumb: `assets/slide-thumbs/byte-other-${pad(fileNumber)}.jpg`,
    alt: `抖音其他项目案例第 ${index + 1} 页`
  };
});

// 抖音AI封面第 6 页（20240539）：左侧一个大手机框，嵌入产品端体验链路录屏。
const aiCover39Background = `${bytedanceWorks}/ai-cover/06.jpg`;
bytedanceAiCoverSlides[5] = {
  type: "composite",
  background: aiCover39Background,
  variants: slideVariants(aiCover39Background),
  thumb: "assets/slide-thumbs/byte-ai-cover-06.jpg",
  alt: "抖音 AI 封面案例第 6 页（含视频演示）",
  overlays: [
    {
      kind: "video",
      id: "ai-cover-39-demo",
      label: "AI 封面 · 产品端体验链路",
      src: "assets/video/ai-cover-39-demo.mp4",
      poster: "assets/video/ai-cover-39-demo-poster.jpg",
      box: { x: 8.63, y: 30.69, w: 18.87, h: 70 },
      fit: "cover",
      radius: 1.3,
      muted: false,
      loop: false,
      controls: "native"
    }
  ]
};

// 抖音AI封面第 7 页：三个手机框分别嵌入修改底图 / 添加主题 / 自定义文字
// 三段录屏，点击播放，保持原背景图不动。
const aiCoverVideoBackground = `${bytedanceWorks}/ai-cover/07.jpg`;
const aiCoverVideoBoxes = [
  { x: 29.7, y: 33.12, w: 17.8, h: 70, radius: 1.3, label: "修改底图", src: "assets/video/ai-cover-step-1.mp4", poster: "assets/video/ai-cover-step-1-poster.jpg" },
  { x: 52.14, y: 33.12, w: 17.8, h: 70, radius: 1.3, label: "添加主题", src: "assets/video/ai-cover-step-2.mp4", poster: "assets/video/ai-cover-step-2-poster.jpg" },
  { x: 74.64, y: 33.12, w: 17.74, h: 70, radius: 1.3, label: "自定义文字", src: "assets/video/ai-cover-step-3.mp4", poster: "assets/video/ai-cover-step-3-poster.jpg" }
];
bytedanceAiCoverSlides[6] = {
  type: "composite",
  background: aiCoverVideoBackground,
  variants: slideVariants(aiCoverVideoBackground),
  thumb: "assets/slide-thumbs/byte-ai-cover-07.jpg",
  alt: "抖音 AI 封面案例第 7 页（含视频演示）",
  overlays: aiCoverVideoBoxes.map((item, index) => ({
    kind: "video",
    id: `ai-cover-step-${index + 1}`,
    label: `AI 封面 · ${item.label}`,
    src: item.src,
    poster: item.poster,
    box: { x: item.x, y: item.y, w: item.w, h: item.h },
    fit: "cover",
    radius: item.radius,
    muted: false,
    loop: false,
    controls: "native"
  }))
};
const bytedanceAiPracticeSlides = [
  ...buildWorksSlides("ai-practice", 5, "byte-ai-practice", "个人 AI 转型实践"),
  readingSlide
];

const experiences = {
  douyin: {
    id: "douyin",
    period: "2022~NOW",
    company: "字节跳动",
    mark: "b",
    logo: "assets/marks/bytedance.webp",
    accent: "#3c8cff",
    markBg: "#11151b",
    role: "平台产品设计师",
    meta: "创作平台设计负责人",
    caption: "项目主导与管理",
    projectNames: ["抖音创作服务平台", "抖音AI封面", "抖音其他项目", "个人AI转型实践"],
    projects: [
      {
        id: "douyin-platform",
        name: "抖音创作服务平台",
        type: "PLATFORM · WEB",
        description: "创作者与机构的一站式服务平台",
        cover: "assets/thumbs/douyin-platform.jpg",
        slides: bytedancePlatformSlides
      },
      {
        id: "douyin-ai-cover",
        name: "抖音AI封面",
        type: "AI · COVER DESIGN",
        description: "AI 封面生成与创作体验设计",
        cover: "assets/thumbs/douyin-ai-cover.jpg",
        slides: bytedanceAiCoverSlides
      },
      {
        id: "douyin-other",
        name: "抖音其他项目",
        type: "PRODUCT MATRIX",
        description: "多产品线的界面与体验设计",
        cover: "assets/thumbs/douyin-other.jpg",
        slides: bytedanceOtherSlides
      },
      {
        id: "douyin-ai-practice",
        name: "个人AI转型实践",
        type: "AI · PERSONAL PRACTICE",
        description: "AI 工具与个人工作流实践",
        cover: "assets/thumbs/douyin-ai-practice.jpg",
        slides: bytedanceAiPracticeSlides
      }
    ]
  },
  jd: {
    id: "jd",
    period: "2020~2022",
    company: "京东零售",
    mark: "JD",
    logo: "assets/marks/jd.webp",
    accent: "#ed2630",
    markBg: "#ed2630",
    role: "资深体验设计师",
    meta: "数坊项目设计负责人",
    caption: "项目主导与管理",
    projectNames: ["京东数坊平台 · 营销数据"],
    projects: [
      {
        id: "jd-shufang",
        name: "京东数坊平台 · 营销数据",
        type: "DATA PRODUCT · B2B",
        description: "融合营销数据产品与复杂信息体验",
        cover: "assets/thumbs/jd.jpg",
        slides: jdSlides
      }
    ]
  },
  kingsoft: {
    id: "kingsoft",
    period: "2016~2020",
    company: "金山办公",
    mark: "W",
    logo: "assets/marks/kingsoft.webp",
    accent: "#ff5a52",
    markBg: "linear-gradient(145deg, #ff784e, #f33d5d)",
    role: "高级 UI 设计师",
    meta: "设计执行角色",
    caption: "项目主导",
    projectNames: ["金山词霸"],
    projects: [
      {
        id: "kingsoft-powerword",
        name: "金山词霸",
        type: "MOBILE · CONSUMER",
        description: "学习、效率与增长场景的移动产品体验",
        cover: "assets/thumbs/mobile.jpg",
        slides: kingsoftSlides
      }
    ]
  }
};

const state = {
  screen: "home",
  experienceId: null,
  projectId: null,
  slideIndex: 0,
  viewerOrigin: "home"
};

const elements = {
  screens: [...document.querySelectorAll("[data-screen]")],
  timeline: document.querySelector("[data-timeline]"),
  projectGrid: document.querySelector("[data-project-grid]"),
  projectsMark: document.querySelector("[data-projects-mark]"),
  projectsPeriod: document.querySelector("[data-projects-period]"),
  projectsCompany: document.querySelector("[data-projects-company]"),
  projectsRole: document.querySelector("[data-projects-role]"),
  projectsMeta: document.querySelector("[data-projects-meta]"),
  viewerCompany: document.querySelector("[data-viewer-company]"),
  viewerTitle: document.querySelector("[data-viewer-title]"),
  currentCount: document.querySelector("[data-current-count]"),
  totalCount: document.querySelector("[data-total-count]"),
  artwork: document.querySelector("[data-main-artwork]"),
  artworkGhost: document.querySelector("[data-artwork-ghost]"),
  slideCanvas: document.querySelector("[data-slide-canvas]"),
  loader: document.querySelector("[data-image-loader]"),
  thumbnailRail: document.querySelector("[data-thumbnail-rail]"),
  artworkFrame: document.querySelector("[data-artwork-frame]"),
  viewerScreen: document.querySelector('[data-screen="viewer"]'),
  fullscreenToggle: document.querySelector("[data-fullscreen-toggle]"),
  fullscreenCurrent: document.querySelector("[data-fullscreen-current]"),
  fullscreenTotal: document.querySelector("[data-fullscreen-total]"),
  viewerStage: document.querySelector("[data-viewer-stage]"),
  homeScreen: document.querySelector('[data-screen="home"]'),
  otherProjectsRail: document.querySelector("[data-other-projects-rail]"),
  otherProjects: document.querySelector("[data-other-projects]"),
  streamShell: document.querySelector("[data-stream-shell]"),
  streamProgress: document.querySelector("[data-stream-progress]"),
  viewerBackLabel: document.querySelector("[data-viewer-back-label]")
};

const currentExperience = () => experiences[state.experienceId];

function isViewerFullscreen() {
  return document.fullscreenElement === elements.viewerScreen || elements.viewerScreen.classList.contains("is-pseudo-fullscreen");
}

let fullscreenIdleTimer = 0;
let fullscreenExitAt = 0;
let fullscreenMorph = null;

function wakeFullscreenUI() {
  if (!isViewerFullscreen()) return;
  elements.viewerScreen.classList.remove("is-ui-idle");
  window.clearTimeout(fullscreenIdleTimer);
  fullscreenIdleTimer = window.setTimeout(() => {
    if (isViewerFullscreen()) elements.viewerScreen.classList.add("is-ui-idle");
  }, 2400);
}

function resetFullscreenUI() {
  window.clearTimeout(fullscreenIdleTimer);
  elements.viewerScreen.classList.remove("is-ui-idle");
}

function beginFullscreenMorph() {
  if (fullscreenMorph) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const frame = elements.artworkFrame.getBoundingClientRect();
  const source = elements.artwork.currentSrc || elements.artwork.src;
  if (!source || !frame.width) return;
  const overlay = document.createElement("div");
  overlay.className = "viewer-entry";
  overlay.setAttribute("aria-hidden", "true");
  const image = document.createElement("img");
  image.className = "viewer-entry-page";
  image.alt = "";
  image.src = source;
  image.style.objectFit = "contain";
  image.style.opacity = "1";
  overlay.append(image);
  overlay.style.left = `${frame.left}px`;
  overlay.style.top = `${frame.top}px`;
  overlay.style.width = `${frame.width}px`;
  overlay.style.height = `${frame.height}px`;
  overlay.style.borderRadius = "0px";
  // the overlay must live inside the fullscreen element, otherwise the
  // browser only paints the fullscreen subtree
  elements.viewerScreen.appendChild(overlay);
  elements.viewerScreen.classList.add("is-scene-entering");
  fullscreenMorph = { overlay, from: frame };
}

function finishFullscreenMorph() {
  const morph = fullscreenMorph;
  if (!morph) {
    elements.viewerScreen.classList.remove("is-scene-entering");
    return;
  }
  fullscreenMorph = null;
  sizeArtworkFrame();
  const { overlay, from } = morph;
  if (!overlay.isConnected) {
    elements.viewerScreen.classList.remove("is-scene-entering");
    return;
  }
  const to = elements.artworkFrame.getBoundingClientRect();
  const animation = overlay.animate([
    { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` },
    { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px` }
  ], { duration: 460, easing: "cubic-bezier(.22, 1, .36, 1)", fill: "forwards" });
  animation.onfinish = () => {
    overlay.remove();
    elements.viewerScreen.classList.remove("is-scene-entering");
  };
}

function syncFullscreenUI() {
  const active = isViewerFullscreen();
  elements.viewerScreen.classList.toggle("is-fullscreen", active);
  elements.fullscreenToggle.setAttribute("aria-pressed", String(active));
  const label = active ? "退出全屏" : "全屏浏览";
  elements.fullscreenToggle.setAttribute("aria-label", label);
  elements.fullscreenToggle.setAttribute("title", label);
  const labelNode = elements.fullscreenToggle.querySelector("[data-fullscreen-label]");
  if (labelNode) labelNode.textContent = label;
  if (active) wakeFullscreenUI();
  else resetFullscreenUI();
  window.requestAnimationFrame(() => {
    sizeArtworkFrame();
    updateRailMask();
  });
  window.setTimeout(refreshArtworkResolution, 80);
}

function clearFullscreenMorph() {
  if (!fullscreenMorph) return;
  fullscreenMorph.overlay.remove();
  fullscreenMorph = null;
  elements.viewerScreen.classList.remove("is-scene-entering");
}

function exitPseudoFullscreen() {
  elements.viewerScreen.classList.remove("is-pseudo-fullscreen");
  fullscreenExitAt = performance.now();
  syncFullscreenUI();
}

function toggleViewerFullscreen() {
  if (state.screen !== "viewer") return;
  beginFullscreenMorph();
  if (isViewerFullscreen()) {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {
        exitPseudoFullscreen();
        window.requestAnimationFrame(finishFullscreenMorph);
      });
    } else {
      exitPseudoFullscreen();
      window.requestAnimationFrame(finishFullscreenMorph);
    }
    return;
  }
  const request = elements.viewerScreen.requestFullscreen;
  if (typeof request === "function") {
    request.call(elements.viewerScreen).catch(() => {
      elements.viewerScreen.classList.add("is-pseudo-fullscreen");
      syncFullscreenUI();
      window.requestAnimationFrame(finishFullscreenMorph);
    });
  } else {
    elements.viewerScreen.classList.add("is-pseudo-fullscreen");
    syncFullscreenUI();
    window.requestAnimationFrame(finishFullscreenMorph);
  }
}

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) {
    elements.viewerScreen.classList.remove("is-pseudo-fullscreen");
    fullscreenExitAt = performance.now();
  }
  syncFullscreenUI();
  if (fullscreenMorph) window.requestAnimationFrame(() => window.requestAnimationFrame(finishFullscreenMorph));
});

document.addEventListener("pointermove", wakeFullscreenUI, { passive: true });
document.addEventListener("touchstart", wakeFullscreenUI, { passive: true });
document.addEventListener("keydown", wakeFullscreenUI);

function updateRailMask() {
  const rail = elements.thumbnailRail;
  if (!rail.offsetHeight) return;
  // Portrait screens use a horizontal strip at the bottom of the viewer;
  // wide screens keep the vertical rail on the right.
  const horizontal = getComputedStyle(rail).flexDirection === "row";
  const max = horizontal ? rail.scrollWidth - rail.clientWidth : rail.scrollHeight - rail.clientHeight;
  const position = horizontal ? rail.scrollLeft : rail.scrollTop;
  rail.classList.toggle("is-no-scroll", max <= 2);
  rail.classList.toggle("is-at-top", max > 2 && position <= 2);
  rail.classList.toggle("is-at-bottom", max > 2 && position >= max - 2);
  // Fewer than 10 pages: if they all fit, center them vertically in the rail
  // instead of leaving the empty space at the bottom (wide screens only).
  const count = rail.querySelectorAll(".thumbnail").length;
  rail.classList.toggle("is-short-list", count > 0 && count < 10 && max <= 2);
}

elements.thumbnailRail.addEventListener("scroll", updateRailMask, { passive: true });

/* The artwork frame hugs the artwork instead of the whole stage, so the
   image never letterboxes inside its own container and the click transition
   can hand off to an identical rectangle. */
function otherProjectsReserve() {
  const panel = elements.otherProjects;
  const screen = elements.viewerScreen;
  if (!panel || !screen || !screen.classList.contains("is-last-slide") || isViewerFullscreen()) return 0;
  return panel.offsetHeight + 14;
}

/* the last page panel slides over the stage bottom: reserve its height so the
   artwork + fullscreen button sit above it instead of under the project cards */
function syncPanelReserve() {
  const screen = elements.viewerScreen;
  const reserve = otherProjectsReserve();
  screen.style.setProperty("--panel-reserve", `${reserve}px`);
  return reserve;
}

function sizeArtworkFrame() {
  const stage = elements.viewerStage;
  const frame = elements.artworkFrame;
  if (!stage || !frame) return;
  const style = window.getComputedStyle(stage);
  const padTop = parseFloat(style.paddingTop);
  const padBottom = parseFloat(style.paddingBottom);
  const availableWidth = stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const toolbar = elements.fullscreenToggle?.closest(".artwork-toolbar");
  const toolbarHeight = toolbar ? toolbar.offsetHeight + 16 : 0;
  const reserve = syncPanelReserve();
  const availableHeight = stage.clientHeight - padTop - padBottom - toolbarHeight - reserve;
  if (availableWidth <= 0 || availableHeight <= 0) return;
  const artwork = elements.artwork;
  const ratio = artwork.naturalWidth && artwork.naturalHeight ? artwork.naturalWidth / artwork.naturalHeight : 16 / 9;
  let width = availableWidth;
  let height = width / ratio;
  if (height > availableHeight) {
    height = availableHeight;
    width = height * ratio;
  }
  frame.style.width = `${Math.round(width)}px`;
  frame.style.height = `${Math.round(height)}px`;
  // 1% of the frame width: media-box radii/shadows are stored as percentages
  // so they scale with the page instead of looking oversized on small screens
  if (elements.slideCanvas) elements.slideCanvas.style.setProperty("--frame-unit", `${width / 100}px`);
  // the "other projects" panel overlays the stage bottom: nudge the whole
  // stack (artwork + fullscreen button) up so it ends above the panel
  const stackHeight = height + toolbarHeight;
  const contentHeight = stage.clientHeight - padTop - padBottom;
  const stackBottom = padTop + (contentHeight + stackHeight) / 2;
  const overlap = Math.max(0, stackBottom - (stage.clientHeight - reserve));
  elements.viewerScreen.style.setProperty("--stack-shift", `${Math.round(overlap)}px`);
}

let panelAdjustTimer = 0;

function setLastSlide(active) {
  const screen = elements.viewerScreen;
  const wasLast = screen.classList.contains("is-last-slide");
  if (wasLast === active) {
    sizeArtworkFrame();
    return;
  }
  if (!screen.classList.contains("is-scene-entering")) {
    // the panel slides in/out over 550ms; resize + shift the artwork with it
    screen.classList.add("is-panel-adjusting");
    window.clearTimeout(panelAdjustTimer);
    panelAdjustTimer = window.setTimeout(() => screen.classList.remove("is-panel-adjusting"), 620);
  }
  screen.classList.toggle("is-last-slide", active);
  sizeArtworkFrame();
}

const contactToggle = document.querySelector("[data-contact-toggle]");
const contactCard = document.querySelector("[data-contact-card]");

function contactFocusable() {
  return [...contactCard.querySelectorAll("a, button")].filter((element) => element.offsetParent !== null);
}

function setContactCard(open, restoreFocus = false) {
  if (!contactToggle || !contactCard) return;
  const isOpen = contactCard.classList.contains("is-open");
  if (open === isOpen) return;
  contactCard.classList.toggle("is-open", open);
  contactToggle.setAttribute("aria-expanded", String(open));
  if (open) {
    // the card fades in from visibility:hidden, so focus has to wait for the
    // next task or the browser refuses it
    window.setTimeout(() => contactFocusable()[0]?.focus({ preventScroll: true }), 0);
  } else if (restoreFocus) {
    contactToggle.focus({ preventScroll: true });
  }
}

contactToggle.addEventListener("click", () => {
  setContactCard(!contactCard.classList.contains("is-open"));
});

contactCard.addEventListener("click", (event) => {
  if (event.target.closest("[data-contact-close]")) setContactCard(false, true);
});

contactCard.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  const focusable = contactFocusable();
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  }
});

document.addEventListener("click", (event) => {
  if (!contactCard.classList.contains("is-open")) return;
  if (contactCard.contains(event.target) || contactToggle.contains(event.target)) return;
  setContactCard(false);
});
const currentProject = () => currentExperience()?.projects.find((project) => project.id === state.projectId);

function renderTimeline() {
  elements.timeline.innerHTML = Object.values(experiences).map((experience) => `
    <section class="experience-group" style="--accent:${experience.accent};--mark-bg:${experience.markBg}">
      <header class="group-meta">
        <span class="group-mark${experience.logo ? " has-logo" : ""}" aria-hidden="true">${experience.logo ? `<img src="${experience.logo}" alt="" loading="lazy" decoding="async">` : experience.mark}</span>
        <span class="group-identity">
          <span class="group-index">${experience.period}</span>
          <b class="group-company">${experience.company}</b>
        </span>
        <span class="group-divider" aria-hidden="true"></span>
        <span class="group-copy">
          <strong>${experience.role}</strong>
          <small>${experience.meta}</small>
        </span>
      </header>
      <div class="group-projects">
        ${experience.projects.map((project, projectIndex) => `
          <button class="stream-project${project.disabled ? " is-pending" : ""}" type="button" data-home-project="${project.id}" data-home-experience="${experience.id}" aria-label="查看 ${project.name}">
            <img src="${project.cover}" alt="" loading="lazy">
            <span class="stream-project-top"><i>${pad(projectIndex + 1)}</i><em>${project.type}</em></span>
            <span class="stream-project-info">
              <b>${project.name}</b>
              <small>${project.disabled ? "项目资料整理中" : `${project.slides.length} PAGES · EXPLORE`}</small>
            </span>
          </button>
        `).join("")}
      </div>
    </section>
  `).join("");
}

function renderProjects() {
  const experience = currentExperience();
  if (!experience) return;

  elements.projectsMark.classList.toggle("has-logo", Boolean(experience.logo));
  elements.projectsMark.innerHTML = experience.logo
    ? `<img src="${experience.logo}" alt="" decoding="async">`
    : experience.mark;
  elements.projectsMark.style.setProperty("--accent", experience.accent);
  elements.projectsMark.style.setProperty("--mark-bg", experience.markBg);
  elements.projectsPeriod.textContent = experience.period;
  elements.projectsCompany.textContent = experience.company;
  elements.projectsRole.textContent = experience.role;
  elements.projectsMeta.textContent = experience.meta;

  elements.projectGrid.innerHTML = experience.projects.map((project, index) => `
    <button class="project-card${project.disabled ? " is-disabled" : ""}" type="button" ${project.disabled ? "disabled" : `data-project="${project.id}"`}>
      <img src="${project.cover}" alt="" loading="lazy">
      <span class="project-card-number">${pad(index + 1)}</span>
      <span class="project-card-content">
        <span>${project.type}</span>
        <h3>${project.name}</h3>
        <p>${project.description}${project.slides ? ` · ${project.slides.length} PAGES` : ""}</p>
      </span>
    </button>
  `).join("");
}

function otherProjectItems() {
  const currentExperienceId = state.experienceId;
  const currentProjectId = state.projectId;
  return Object.values(experiences).flatMap((experience) =>
    experience.projects
      .filter((project) => !project.disabled && project.slides?.length)
      .map((project) => ({ experience, project }))
  ).filter(({ experience, project }) => !(experience.id === currentExperienceId && project.id === currentProjectId));
}

function renderOtherProjects() {
  const rail = elements.otherProjectsRail;
  if (!rail) return;
  const items = otherProjectItems();
  const span = Math.max(1, items.length - 1);
  rail.innerHTML = items.map(({ experience, project }, index) => {
    // one-by-one rise with a parabolic acceleration across the row
    const delay = Math.round(60 + 150 * Math.pow(index / span, 2));
    return `
    <button class="other-project" type="button" data-other-project="${project.id}" data-other-experience="${experience.id}" aria-label="查看 ${project.name}" style="--stagger: ${delay}ms">
      <img src="${project.cover}" alt="" loading="lazy">
      <b>${project.name}</b>
      <em>${experience.company} · ${experience.period}</em>
    </button>`;
  }).join("");
}

function openOtherProject(experienceId, projectId, card) {
  const experience = experiences[experienceId];
  const project = experience?.projects.find((item) => item.id === projectId);
  if (!experience || !project || project.disabled) return;
  const commit = () => {
    state.experienceId = experienceId;
    state.projectId = projectId;
    state.slideIndex = 0;
    state.viewerOrigin = "home";
    renderViewer();
    updateViewerBackLabel();
    setActiveScreen("viewer");
    sizeArtworkFrame();
    pushRoute(`#project/${experienceId}/${projectId}`);
  };
  clearViewerExit();
  if (!(card instanceof Element) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    commit();
    return;
  }
  startViewerEntry(card, project, { hideDock: false });
  commit();
  runViewerEntry();
}

function renderViewer() {
  const experience = currentExperience();
  const project = currentProject();
  if (!experience || !project?.slides) return;

  elements.viewerCompany.textContent = `${experience.company} · ${experience.period}`;
  elements.viewerTitle.textContent = project.name;
  elements.totalCount.textContent = pad(project.slides.length);
  elements.fullscreenTotal.textContent = pad(project.slides.length);
  elements.viewerScreen.classList.remove("is-last-slide", "is-panel-adjusting");
  window.clearTimeout(panelAdjustTimer);
  elements.viewerScreen.style.setProperty("--stack-shift", "0px");
  renderOtherProjects();
  elements.thumbnailRail.innerHTML = project.slides.map((slide, index) => {
    const videoCount = slideVideoCount(slide);
    const badge = videoCount ? `<i class="thumbnail-play" aria-hidden="true">▶${videoCount > 1 ? videoCount : ""}</i>` : "";
    return `
    <button class="thumbnail${index === state.slideIndex ? " is-current" : ""}" type="button" data-slide-index="${index}" role="option" aria-selected="${index === state.slideIndex}" tabindex="${index === state.slideIndex ? 0 : -1}" aria-label="查看第 ${index + 1} 页${videoCount ? "（含视频）" : ""}">
      <img src="${slideThumb(slide)}" alt="" loading="lazy">
      ${badge}
      <b>${pad(index + 1)}</b>
    </button>`;
  }).join("");
  showSlide(state.slideIndex, false);
  window.requestAnimationFrame(updateRailMask);
}

const slideMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let slideAnimToken = 0;
let slideAnimTimer = 0;

function markArtworkReady() {
  elements.artwork.classList.remove("is-loading");
  elements.loader.classList.remove("is-active");
  elements.artworkFrame.style.backgroundImage = "";
  sizeArtworkFrame();
  window.setTimeout(refreshArtworkResolution, 60);
}

function setArtworkPlaceholder(slide) {
  const thumb = slideThumb(slide);
  elements.artworkFrame.style.backgroundImage = thumb ? `url("${thumb}")` : "";
  // Inline these too: the later .artwork-frame shorthand resets them, and a
  // repeating 320×180 thumbnail looked like a wall of many images on refresh.
  elements.artworkFrame.style.backgroundSize = "cover";
  elements.artworkFrame.style.backgroundRepeat = "no-repeat";
  elements.artworkFrame.style.backgroundPosition = "center";
}

function placeArtwork(slide) {
  elements.artwork.classList.add("is-loading");
  elements.loader.classList.add("is-active");
  setArtworkPlaceholder(slide);
  const ready = () => whenImageDecoded(elements.artwork, markArtworkReady);
  elements.artwork.onload = ready;
  elements.artwork.onerror = markArtworkReady;
  elements.artwork.src = pickSlideSource(slide);
  elements.artwork.alt = slide.alt || "";
  renderOverlays(slide);
  if (elements.artwork.complete) ready();
}

/* ---- composite page media boxes -------------------------------------------
   Every box starts as a poster + play button. The <video> element is created
   on first click and its src is only attached then, so a page with three
   demos costs three small JPEGs until the visitor actually plays one. */

const mediaVideoPlaying = new Set();

function resetMediaBoxes() {
  const canvas = elements.slideCanvas;
  if (!canvas) return;
  canvas.querySelectorAll("video").forEach((video) => {
    try { video.pause(); } catch { /* ignore */ }
    video.removeAttribute("src");
    video.load();
  });
  mediaVideoPlaying.clear();
  canvas.innerHTML = "";
  canvas.hidden = true;
  canvas.style.opacity = "";
}

function pauseAllMedia() {
  elements.slideCanvas?.querySelectorAll("video").forEach((video) => {
    try { video.pause(); } catch { /* ignore */ }
  });
}

function startVideo(box, overlay, button) {
  if (box.dataset.playing === "true") return;
  // one playing demo per page: starting a second one pauses the first
  elements.slideCanvas?.querySelectorAll("video").forEach((other) => {
    if (other === box.querySelector("video")) return;
    try { other.pause(); } catch { /* ignore */ }
    const otherBox = other.closest(".media-box");
    if (otherBox) otherBox.dataset.playing = "false";
  });
  box.classList.add("is-loading");
  let video = box.querySelector("video");
  if (!video) {
    video = document.createElement("video");
    video.className = "media-video";
    video.muted = overlay.muted === true;
    video.volume = 1;
    video.loop = Boolean(overlay.loop);
    video.playsInline = true;
    video.preload = "none";
    video.controls = overlay.controls !== "off";
    video.setAttribute("playsinline", "");
    if (overlay.poster) video.poster = overlay.poster;
    video.addEventListener("playing", () => {
      box.classList.remove("is-loading");
      box.dataset.playing = "true";
      button.classList.add("is-hidden");
    });
    video.addEventListener("waiting", () => box.classList.add("is-loading"));
    video.addEventListener("ended", () => {
      box.dataset.playing = "false";
      button.classList.remove("is-hidden");
    });
    box.append(video);
  }
  if (!video.src) video.src = overlay.src;
  if (video.readyState < 2) video.load();
  const started = video.play();
  if (started?.catch) {
    started.catch(() => {
      box.classList.remove("is-loading");
      button.classList.remove("is-hidden");
    });
  }
}

function renderOverlays(slide) {
  const canvas = elements.slideCanvas;
  if (!canvas) return;
  resetMediaBoxes();
  if (!isComposite(slide)) return;
  const overlays = slide.overlays || [];
  if (!overlays.length) return;
  canvas.hidden = false;
  overlays.forEach((overlay) => {
    if (!overlay?.box) return;
    const box = document.createElement("div");
    box.className = "media-box";
    box.dataset.mediaId = overlay.id || "";
    box.style.left = `${overlay.box.x}%`;
    box.style.top = `${overlay.box.y}%`;
    box.style.width = `${overlay.box.w}%`;
    box.style.height = `${overlay.box.h}%`;
    box.style.setProperty("--media-radius", overlay.radius ?? 0);
    box.style.setProperty("--media-shadow", overlay.shadow ?? 0);
    if (overlay.z != null) box.style.zIndex = String(overlay.z);
    if (overlay.opacity != null) box.style.opacity = String(overlay.opacity);
    if (overlay.fit === "contain") box.classList.add("is-contain");
    if (overlay.kind === "image") {
      // static PNG layer (may carry transparency, e.g. a screenshot poured into
      // a device frame drawn on the PPT background); never intercepts clicks
      box.classList.add("is-image");
      const image = document.createElement("img");
      image.className = "media-image";
      image.src = overlay.src || "";
      image.alt = overlay.alt || overlay.label || "";
      image.decoding = "async";
      image.draggable = false;
      if (overlay.fit !== "cover") box.classList.add("is-contain");
      box.append(image);
      canvas.append(box);
      return;
    }
    if (overlay.kind !== "video") return;

    const poster = document.createElement("img");
    poster.className = "media-poster";
    poster.src = overlay.poster || "";
    poster.alt = "";
    poster.decoding = "async";
    poster.draggable = false;
    box.append(poster);

    const button = document.createElement("button");
    button.className = "media-play";
    button.type = "button";
    button.setAttribute("aria-label", `播放视频：${overlay.label || "页面演示"}`);
    button.innerHTML = '<span class="media-play-icon" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 6.4 18.2 12 9 17.6z"></path></svg></span>';
    button.addEventListener("click", () => startVideo(box, overlay, button));
    box.append(button);
    canvas.append(box);
  });
}


function resetArtworkLayers() {
  window.clearTimeout(slideAnimTimer);
  slideAnimToken += 1;
  const ghost = elements.artworkGhost;
  if (ghost) {
    ghost.style.transition = "none";
    ghost.style.transform = "";
    ghost.style.opacity = "";
    ghost.style.visibility = "hidden";
  }
  elements.artwork.style.transition = "none";
  elements.artwork.style.transform = "";
  elements.artwork.style.opacity = "";
  if (elements.slideCanvas) elements.slideCanvas.style.opacity = "";
  void elements.artwork.offsetWidth;
  elements.artwork.style.transition = "";
  elements.artwork.style.transform = "";
  elements.artwork.style.opacity = "";
}

/* Composite pages (background + media boxes) can't ride the translateY turn:
   sliding a decoding <video> layer stutters, so they cross-fade instead. */
function crossfadeArtwork(slide) {
  const ghost = elements.artworkGhost;
  const previousSrc = elements.artwork.currentSrc || elements.artwork.src;
  resetArtworkLayers();
  renderOverlays(slide);
  if (!ghost || !previousSrc) {
    placeArtwork(slide);
    return;
  }
  const token = slideAnimToken;
  ghost.src = previousSrc;
  ghost.alt = "";
  ghost.style.visibility = "visible";
  ghost.style.transition = "none";
  ghost.style.opacity = "1";
  elements.artwork.style.transition = "none";
  elements.artwork.style.opacity = "0";
  if (elements.slideCanvas) elements.slideCanvas.style.opacity = "0";
  elements.loader.classList.add("is-active");
  elements.artwork.onload = null;
  elements.artwork.onerror = null;
  elements.artwork.src = pickSlideSource(slide);
  elements.artwork.alt = slide.alt || "";
  const settle = () => {
    if (token !== slideAnimToken) return;
    elements.artwork.onload = null;
    elements.artwork.onerror = null;
    elements.artwork.style.transition = "opacity 320ms ease";
    ghost.style.transition = "opacity 320ms ease";
    if (elements.slideCanvas) elements.slideCanvas.style.transition = "opacity 320ms ease";
    void elements.artwork.offsetWidth;
    elements.artwork.style.opacity = "1";
    ghost.style.opacity = "0";
    if (elements.slideCanvas) elements.slideCanvas.style.opacity = "1";
    elements.loader.classList.remove("is-active");
    window.setTimeout(() => {
      if (token !== slideAnimToken) return;
      ghost.style.visibility = "hidden";
      ghost.style.transition = "none";
      ghost.style.opacity = "";
      elements.artwork.style.transition = "";
      elements.artwork.style.opacity = "";
      if (elements.slideCanvas) {
        elements.slideCanvas.style.transition = "";
        elements.slideCanvas.style.opacity = "";
      }
      markArtworkReady();
    }, 340);
  };
  const settleReady = () => whenImageDecoded(elements.artwork, settle);
  if (elements.artwork.complete && elements.artwork.naturalWidth) settleReady();
  else {
    elements.artwork.onload = settleReady;
    elements.artwork.onerror = settle;
  }
}

/* Page turn: the outgoing page slides out while the next one slides in from
   the opposite edge (the damped vertical motion used by motion-led sites). */
function moveArtwork(slide, direction) {
  const ghost = elements.artworkGhost;
  const leavingComposite = elements.slideCanvas && !elements.slideCanvas.hidden;
  if (leavingComposite || slideHasVideo(slide)) {
    crossfadeArtwork(slide);
    return;
  }
  if (!ghost || slideMotionQuery.matches) {
    resetArtworkLayers();
    placeArtwork(slide);
    return;
  }
  const previousSrc = elements.artwork.currentSrc || elements.artwork.src;
  resetArtworkLayers();
  if (!previousSrc) {
    placeArtwork(slide);
    return;
  }
  const token = slideAnimToken;
  ghost.src = previousSrc;
  ghost.alt = "";
  ghost.style.visibility = "visible";
  ghost.style.transform = "translateY(0)";
  elements.artwork.classList.remove("is-loading");
  elements.loader.classList.add("is-active");

  const incoming = new Image();
  const incomingSrc = pickSlideSource(slide);
  const start = () => {
    if (token !== slideAnimToken) return;
    elements.artwork.onload = null;
    elements.artwork.onerror = null;
    elements.artwork.src = incomingSrc;
    elements.artwork.alt = slide.alt;
    elements.artwork.style.transform = `translateY(${direction > 0 ? 100 : -100}%) scale(1.02)`;
    sizeArtworkFrame();
    // Decode the image that will actually be displayed before starting the
    // slide; otherwise the incoming layer can be blank for a frame.
    whenImageDecoded(elements.artwork, () => {
      if (token !== slideAnimToken) return;
      void elements.artwork.offsetWidth;
      const easing = "cubic-bezier(.76, 0, .24, 1)";
      const duration = 640;
      ghost.style.transition = `transform ${duration}ms ${easing}`;
      elements.artwork.style.transition = `transform ${duration}ms ${easing}`;
      window.requestAnimationFrame(() => {
        ghost.style.transform = `translateY(${direction > 0 ? -100 : 100}%) scale(.98)`;
        elements.artwork.style.transform = "translateY(0) scale(1)";
      });
      elements.loader.classList.remove("is-active");
      elements.artwork.classList.remove("is-loading");
      slideAnimTimer = window.setTimeout(() => {
        if (token !== slideAnimToken) return;
        ghost.style.visibility = "hidden";
        ghost.style.transition = "none";
        elements.artwork.style.transition = "";
        elements.artwork.style.transform = "";
        markArtworkReady();
      }, duration + 40);
    });
  };
  const startReady = () => whenImageDecoded(incoming, start);
  incoming.src = incomingSrc;
  if (incoming.complete && incoming.naturalWidth) startReady();
  else {
    incoming.onload = startReady;
    incoming.onerror = start;
  }
}

function showSlide(index, scrollThumbnail = true) {
  const project = currentProject();
  if (!project?.slides?.length) return;

  const direction = index === state.slideIndex ? 0 : (index > state.slideIndex ? 1 : -1);
  state.slideIndex = (index + project.slides.length) % project.slides.length;
  const slide = project.slides[state.slideIndex];
  elements.currentCount.textContent = pad(state.slideIndex + 1);
  elements.fullscreenCurrent.textContent = pad(state.slideIndex + 1);
  const isLastSlide = state.slideIndex === project.slides.length - 1;
  setLastSlide(isLastSlide);

  if (direction === 0) {
    resetArtworkLayers();
    placeArtwork(slide);
  } else {
    moveArtwork(slide, direction);
  }

  const thumbnails = [...elements.thumbnailRail.querySelectorAll(".thumbnail")];
  thumbnails.forEach((thumbnail, thumbnailIndex) => {
    const isCurrent = thumbnailIndex === state.slideIndex;
    thumbnail.classList.toggle("is-current", isCurrent);
    thumbnail.setAttribute("aria-selected", String(isCurrent));
    thumbnail.tabIndex = isCurrent ? 0 : -1;
  });

  const activeThumbnail = thumbnails[state.slideIndex];
  if (scrollThumbnail && activeThumbnail) activeThumbnail.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  if (document.activeElement?.closest(".thumbnail-rail") && activeThumbnail) activeThumbnail.focus({ preventScroll: true });

  [-1, 1].forEach((offset) => {
    const preloadIndex = (state.slideIndex + offset + project.slides.length) % project.slides.length;
    warmSlideImage(project.slides[preloadIndex]);
  });
  warmSlideImage(project.slides[state.slideIndex]);
}

const screenHeadings = {
  home: "#home-title",
  projects: "#projects-title",
  viewer: "#viewer-title"
};
let routeHydrated = false;

function focusScreenHeading(screenName) {
  const heading = document.querySelector(screenHeadings[screenName] || "");
  if (heading) heading.focus({ preventScroll: true });
}

function setActiveScreen(screenName) {
  const changed = state.screen !== screenName;
  if (changed) setContactCard(false);
  if (screenName !== "viewer") {
    clearViewerEntry();
    clearFullscreenMorph();
    resetMediaBoxes();
  }
  if (screenName !== "viewer" && isViewerFullscreen()) {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    elements.viewerScreen.classList.remove("is-pseudo-fullscreen");
    syncFullscreenUI();
  }
  state.screen = screenName;
  document.body.dataset.screen = screenName;
  if (changed && routeHydrated) window.requestAnimationFrame(() => focusScreenHeading(screenName));
  elements.screens.forEach((screen) => {
    const active = screen.dataset.screen === screenName;
    if (active) {
      screen.hidden = false;
      screen.scrollTop = 0;
    }
    screen.classList.toggle("is-active", active);
    if (!active) {
      // Initial deep-link render has no cross-screen transition to protect;
      // hiding immediately prevents the home card grid from painting behind
      // the viewer while its entry transition is still running.
      if (!routeHydrated) screen.hidden = true;
      else window.setTimeout(() => { if (!screen.classList.contains("is-active")) screen.hidden = true; }, 430);
    }
  });
}

function pushRoute(hash) {
  if (location.hash === hash) return;
  history.pushState(null, "", hash);
}

function updateViewerBackLabel() {
  if (!elements.viewerBackLabel) return;
  const label = state.viewerOrigin === "projects" ? "返回项目" : "返回首页";
  elements.viewerBackLabel.textContent = label;
  document.querySelector("[data-viewer-back]")?.setAttribute("aria-label", label);
}

function goHome(updateHash = true) {
  state.experienceId = null;
  state.projectId = null;
  state.slideIndex = 0;
  state.viewerOrigin = "home";
  setActiveScreen("home");
  scheduleStreamMeasure(520);
  if (updateHash) pushRoute("#home");
}

let viewerExit = null;

function clearViewerExit() {
  if (!viewerExit) return;
  viewerExit.animation?.cancel();
  viewerExit.overlay.remove();
  viewerExit.card?.classList.remove("is-returning");
  elements.homeScreen.classList.remove("is-scene-revealing");
  elements.viewerScreen.classList.remove("is-scene-shrinking", "is-dock-hidden");
  viewerExit = null;
}

/* Reverse of the card-to-viewer entrance: the artwork shrinks back into the
   home card while the page underneath swaps back to home. */
function startViewerExit() {
  if (viewerExit) return true;
  if (state.screen !== "viewer" || isViewerFullscreen()) return false;
  if (state.viewerOrigin === "projects") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const experienceId = state.experienceId;
  const projectId = state.projectId;
  if (!experienceId || !projectId) return false;
  const card = document.querySelector(`[data-home-project="${projectId}"][data-home-experience="${experienceId}"]`);
  const artwork = elements.artwork;
  const pageSource = artwork.currentSrc || artwork.src;
  if (!card || !pageSource) return false;
  if (stream.dirty && !elements.homeScreen.hidden) measureStream();
  const cardItem = stream.cards.find((item) => item.element === card);
  if (!cardItem) return false;
  const cardLeft = cardItem.center - cardItem.width / 2 - stream.current;
  const cardRight = cardItem.center + cardItem.width / 2 - stream.current;
  const visible = Math.min(cardRight, stream.viewport) - Math.max(cardLeft, 0);
  if (visible < cardItem.width * 0.5) return false;

  // release hover and pin the cover's resting look before cloning it, so the
  // clone copies the same appearance the card will have at handoff
  card.classList.add("is-returning");
  const coverImage = card.querySelector("img");
  const coverSource = coverImage?.currentSrc || coverImage?.src;
  const frame = elements.artworkFrame.getBoundingClientRect();
  clearViewerEntry();

  const overlay = document.createElement("div");
  overlay.className = "viewer-entry";
  overlay.setAttribute("aria-hidden", "true");
  const page = document.createElement("img");
  page.className = "viewer-entry-page";
  page.alt = "";
  page.src = pageSource;
  const cover = document.createElement("img");
  cover.className = "viewer-entry-cover";
  cover.alt = "";
  if (coverSource) cover.src = coverSource;
  if (coverImage) {
    const style = window.getComputedStyle(coverImage);
    cover.style.filter = style.filter;
    cover.style.transform = style.transform;
  }
  overlay.append(page, cover);
  overlay.classList.add("is-exiting");
  overlay.style.left = `${frame.left}px`;
  overlay.style.top = `${frame.top}px`;
  overlay.style.width = `${frame.width}px`;
  overlay.style.height = `${frame.height}px`;
  overlay.style.borderRadius = "0px";
  document.body.appendChild(overlay);

  elements.viewerScreen.classList.add("is-scene-shrinking", "is-dock-hidden");
  elements.homeScreen.classList.add("is-scene-revealing");
  const entry = { overlay, animation: null, card };
  viewerExit = entry;
  goHome(false);
  history.replaceState(null, "", "#home");

  window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
    if (!overlay.isConnected) return;
    // the home screen is display:none while the viewer is open, so computed
    // transforms on the card read as "none" before goHome; copy the cover's
    // real transform/filter now that home is visible, otherwise the clone's
    // cover is unzoomed and pops when the real card appears at handoff
    if (coverImage) {
      const coverStyle = window.getComputedStyle(coverImage);
      cover.style.transform = coverStyle.transform;
      cover.style.filter = coverStyle.filter;
    }
    // target the card's default (non-hover) rectangle; the .is-returning class
    // has already released any hover lift with the normal 0.7s transition, so
    // the clone lands where the card will settle (no snap on handoff)
    const computed = window.getComputedStyle(card);
    const matrix = computed.transform === "none" ? new DOMMatrix() : new DOMMatrixReadOnly(computed.transform);
    const rect = card.getBoundingClientRect();
    const target = {
      left: rect.left - (matrix.m41 || 0),
      top: rect.top - (matrix.m42 || 0),
      width: rect.width,
      height: rect.height
    };
    const radius = computed.borderRadius || "0px";
    const animation = overlay.animate([
      { left: `${frame.left}px`, top: `${frame.top}px`, width: `${frame.width}px`, height: `${frame.height}px`, borderRadius: "0px" },
      { left: `${target.left}px`, top: `${target.top}px`, width: `${target.width}px`, height: `${target.height}px`, borderRadius: radius }
    ], { duration: 660, easing: "cubic-bezier(.66, 0, .2, 1)", fill: "forwards" });
    entry.animation = animation;
    animation.onfinish = () => {
      // only after the artwork has shrunk to card size, softly dissolve it
      // back into the card cover, then hand off to the home screen
      overlay.classList.add("is-remorphing");
      window.setTimeout(() => {
        overlay.classList.add("is-fading");
        window.setTimeout(() => {
          overlay.remove();
          card.classList.remove("is-returning");
          elements.homeScreen.classList.remove("is-scene-revealing");
          elements.viewerScreen.classList.remove("is-scene-shrinking", "is-dock-hidden");
          if (viewerExit === entry) viewerExit = null;
        }, 180);
      }, 200);
    };
  }));
  return true;
}

function leaveViewer() {
  if (startViewerExit()) return;
  if (state.viewerOrigin === "projects" && state.experienceId && state.screen === "viewer") {
    elements.viewerScreen.classList.add("is-dock-hidden");
    window.setTimeout(() => history.back(), 260);
    return;
  }
  goHome(false);
  history.replaceState(null, "", "#home");
}

function openExperience(experienceId, updateHash = true) {
  if (!experiences[experienceId]) return;
  state.experienceId = experienceId;
  state.projectId = null;
  state.slideIndex = 0;
  renderProjects();
  setActiveScreen("projects");
  if (updateHash) pushRoute(`#experience/${experienceId}`);
}

function openProject(projectId, updateHash = true) {
  const project = currentExperience()?.projects.find((item) => item.id === projectId);
  if (!project || project.disabled) return;
  clearViewerExit();
  state.viewerOrigin = state.screen === "projects" ? "projects" : "home";
  state.projectId = projectId;
  state.slideIndex = 0;
  renderViewer();
  updateViewerBackLabel();
  setActiveScreen("viewer");
  sizeArtworkFrame();
  if (!elements.viewerScreen.classList.contains("is-dock-hidden")) {
    elements.viewerScreen.classList.add("is-dock-hidden");
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      if (state.screen === "viewer") elements.viewerScreen.classList.remove("is-dock-hidden");
    }));
  }
  if (updateHash) pushRoute(`#project/${state.experienceId}/${projectId}`);
}

let viewerEntry = null;

function clearViewerEntry() {
  if (!viewerEntry) return;
  viewerEntry.animation?.cancel();
  viewerEntry.overlay.remove();
  viewerEntry.screen?.classList.remove("is-scene-entering", "is-dock-hidden");
  viewerEntry = null;
}

/* The clicked home card expands into the viewer stage: the card cover is
   cloned into a fixed overlay that flips to the artwork frame, then the
   overlay dissolves into the first page while the viewer chrome settles. */
function startViewerEntry(card, project, options = {}) {
  if (!(card instanceof Element)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  clearViewerExit();
  clearViewerEntry();
  const image = card.querySelector("img");
  const coverSource = image?.currentSrc || image?.src;
  const pageSource = project?.slides?.[0] ? pickSlideSource(project.slides[0]) : "";
  const start = card.getBoundingClientRect();
  const overlay = document.createElement("div");
  overlay.className = "viewer-entry";
  overlay.setAttribute("aria-hidden", "true");
  const cover = document.createElement("img");
  cover.className = "viewer-entry-cover";
  cover.alt = "";
  if (coverSource) cover.src = coverSource;
  const page = document.createElement("img");
  page.className = "viewer-entry-page";
  page.alt = "";
  if (pageSource) page.src = pageSource;
  overlay.append(cover, page);
  if (pageSource) {
    const fullPage = new Image();
    fullPage.src = pageSource;
    fullPage.onload = () => {
      if (overlay.isConnected) page.src = pageSource;
    };
  }
  overlay.style.left = `${start.left}px`;
  overlay.style.top = `${start.top}px`;
  overlay.style.width = `${start.width}px`;
  overlay.style.height = `${start.height}px`;
  document.body.appendChild(overlay);
  const viewerScreen = elements.screens.find((screen) => screen.dataset.screen === "viewer");
  viewerScreen?.classList.add("is-scene-entering");
  if (options.hideDock !== false) viewerScreen?.classList.add("is-dock-hidden");
  viewerEntry = { overlay, animation: null, screen: viewerScreen, pageImage: page };

  // swap the card cover for the first page early, while the layer is still
  // close to card size, so the large artwork never cross-fades at full size
  const morph = () => {
    if (overlay.isConnected) overlay.classList.add("is-morphing");
  };
  if (page.complete && page.naturalWidth) window.requestAnimationFrame(morph);
  else {
    page.addEventListener("load", () => window.requestAnimationFrame(morph), { once: true });
    page.addEventListener("error", () => window.requestAnimationFrame(morph), { once: true });
  }
}

function runViewerEntry() {
  const entry = viewerEntry;
  if (!entry) return;
  const { overlay } = entry;
  const start = overlay.style;
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
    if (!overlay.isConnected || viewerEntry !== entry) return;
    sizeArtworkFrame();
    const end = elements.artworkFrame.getBoundingClientRect();
    const animation = overlay.animate([
      { left: start.left, top: start.top, width: start.width, height: start.height, borderRadius: "20px" },
      { left: `${end.left}px`, top: `${end.top}px`, width: `${end.width}px`, height: `${end.height}px`, borderRadius: "0px" }
    ], { duration: 660, easing: "cubic-bezier(.66, 0, .2, 1)", fill: "forwards" });
    entry.animation = animation;
    animation.onfinish = () => {
      if (!overlay.isConnected) return;
      // the rail slides in with the expansion, not with the (possibly slow)
      // full-resolution artwork load
      entry.screen?.classList.remove("is-dock-hidden");
      const handoff = () => {
        overlay.remove();
        entry.screen?.classList.remove("is-scene-entering", "is-dock-hidden");
        if (viewerEntry === entry) viewerEntry = null;
      };
      const page = entry.pageImage;
      const artwork = elements.artwork;
      const handoffWhenReady = () => {
        if (page && artwork.currentSrc) page.src = artwork.currentSrc;
        window.setTimeout(handoff, 230);
      };
      if ((!page || (page.complete && page.naturalWidth)) && artwork.complete && artwork.naturalWidth) {
        handoffWhenReady();
        return;
      }
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        handoffWhenReady();
      };
      artwork.addEventListener("load", finish, { once: true });
      artwork.addEventListener("error", finish, { once: true });
      if (page) {
        page.addEventListener("load", finish, { once: true });
        page.addEventListener("error", finish, { once: true });
      }
      window.setTimeout(finish, 6000);
    };
  }));
}

function openHomeProject(experienceId, projectId, card) {
  const experience = experiences[experienceId];
  const project = experience?.projects.find((item) => item.id === projectId);
  if (!experience || !project) return;
  if (project.disabled) {
    openExperience(experienceId);
    return;
  }
  state.experienceId = experienceId;
  startViewerEntry(card, project);
  openProject(projectId);
  runViewerEntry();
}

function handleRoute() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (parts[0] === "project" && parts[1] && parts[2]) {
    const experience = experiences[parts[1]];
    const project = experience?.projects.find((item) => item.id === parts[2]);
    if (!experience || !project || project.disabled) {
      if (experience) {
        openExperience(parts[1], false);
        history.replaceState(null, "", `#experience/${parts[1]}`);
      } else {
        goHome(false);
        history.replaceState(null, "", "#home");
      }
      return;
    }
    state.experienceId = parts[1];
    openProject(parts[2], false);
  } else if (parts[0] === "experience" && parts[1] && experiences[parts[1]]) {
    openExperience(parts[1], false);
  } else {
    goHome(false);
    if (location.hash && location.hash !== "#home") history.replaceState(null, "", "#home");
  }
}

document.addEventListener("click", (event) => {
  const homeTrigger = event.target.closest('[data-route="home"]');
  const homeProjectTrigger = event.target.closest("[data-home-project]");
  const projectTrigger = event.target.closest("[data-project]");
  const thumbnailTrigger = event.target.closest("[data-slide-index]");
  const viewerBack = event.target.closest("[data-viewer-back]");
  const fullscreenTrigger = event.target.closest("[data-fullscreen-toggle]");
  const otherProjectTrigger = event.target.closest("[data-other-project]");

  if (homeTrigger) goHome();
  else if (homeProjectTrigger) openHomeProject(homeProjectTrigger.dataset.homeExperience, homeProjectTrigger.dataset.homeProject, homeProjectTrigger);
  else if (projectTrigger) openProject(projectTrigger.dataset.project);
  else if (thumbnailTrigger) showSlide(Number(thumbnailTrigger.dataset.slideIndex));
  else if (otherProjectTrigger) openOtherProject(otherProjectTrigger.dataset.otherExperience, otherProjectTrigger.dataset.otherProject, otherProjectTrigger);
  else if (fullscreenTrigger) toggleViewerFullscreen();
  else if (viewerBack) leaveViewer();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && contactCard.classList.contains("is-open")) {
    setContactCard(false, true);
    return;
  }
  if (contactCard.classList.contains("is-open")) return;
  if (state.screen === "home") {
    if (event.key === "ArrowRight" || event.key === "PageDown") nudgeStream(1);
    if (event.key === "ArrowLeft" || event.key === "PageUp") nudgeStream(-1);
    if (event.key === "Home") jumpStream(0);
    if (event.key === "End") jumpStream(1);
  }
  if (state.screen === "viewer") {
    if (event.key === "ArrowDown" || event.key === "PageDown") showSlide(state.slideIndex + 1);
    if (event.key === "ArrowUp" || event.key === "PageUp") showSlide(state.slideIndex - 1);
    if (event.key === "Escape") {
      if (isViewerFullscreen()) {
        beginFullscreenMorph();
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        else exitPseudoFullscreen();
        return;
      }
      if (performance.now() - fullscreenExitAt < 400) return;
      leaveViewer();
    }
  }
});

let swipeStartY = 0;
elements.artworkFrame.addEventListener("pointerdown", (event) => { swipeStartY = event.clientY; });
elements.artworkFrame.addEventListener("pointerup", (event) => {
  const distance = swipeStartY - event.clientY;
  if (Math.abs(distance) > 60) showSlide(state.slideIndex + (distance > 0 ? 1 : -1));
});

const viewerElement = elements.screens.find((screen) => screen.dataset.screen === "viewer");
let viewerWheelDelta = 0;
let viewerWheelLock = 0;
let viewerWheelTimer = 0;
viewerElement.addEventListener("wheel", (event) => {
  if (state.screen !== "viewer") return;
  if (event.ctrlKey || event.metaKey) return;
  if (event.target.closest(".thumbnail-rail") || event.target.closest(".other-projects")) return;
  event.preventDefault();
  const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaMode === 2 ? event.deltaY * window.innerHeight : event.deltaY;
  viewerWheelDelta += delta;
  window.clearTimeout(viewerWheelTimer);
  viewerWheelTimer = window.setTimeout(() => { viewerWheelDelta = 0; }, 200);
  const now = performance.now();
  if (now < viewerWheelLock || Math.abs(viewerWheelDelta) < 24) return;
  const direction = Math.sign(viewerWheelDelta);
  viewerWheelDelta = 0;
  viewerWheelLock = now + 230;
  showSlide(state.slideIndex + direction);
}, { passive: false });

window.addEventListener("popstate", handleRoute);
window.addEventListener("hashchange", handleRoute);

if (window.matchMedia("(pointer: fine)").matches) {
  window.addEventListener("pointermove", (event) => {
    const shift = ((event.clientX / window.innerWidth) - 0.5) * 14;
    document.documentElement.style.setProperty("--pointer-shift", `${shift}px`);
  });
}

/* ── Horizontal work stream ─────────────────────────────────────────────
   Wheel and drag write to a virtual offset that is damped toward its target
   on every frame (the interaction model used by motion-led portfolios),
   instead of scrolling the element natively. Native scroll has no inertia:
   the page jumps by the exact wheel delta and drag is a rigid 1:1 mapping.
   ─────────────────────────────────────────────────────────────────────── */
const stream = {
  target: 0,
  current: 0,
  max: 0,
  viewport: 1,
  cards: [],
  raf: 0,
  lastFrame: 0,
  dirty: true,
  dragging: false
};

const STREAM_LERP = 0.085;
const STREAM_DRAG_SENSITIVITY = 1.15;
const STREAM_DRAG_THRESHOLD = 5;
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const clampStream = (value) => Math.min(Math.max(value, 0), stream.max);

function measureStream() {
  const shell = elements.streamShell;
  if (!shell.offsetWidth) {
    stream.dirty = true;
    return;
  }
  const trackRect = elements.timeline.getBoundingClientRect();
  stream.viewport = shell.clientWidth || window.innerWidth || 1;
  stream.max = Math.max(0, shell.scrollWidth - shell.clientWidth);
  stream.cards = [...elements.timeline.querySelectorAll(".stream-project")].map((element) => {
    const rect = element.getBoundingClientRect();
    return { element, center: rect.left + rect.width / 2 - trackRect.left, width: rect.width };
  });
  stream.dirty = false;
}

function applyStream() {
  elements.timeline.style.transform = `translate3d(${-stream.current.toFixed(2)}px, 0, 0)`;
  const progress = stream.max > 0 ? stream.current / stream.max : 0;
  elements.streamProgress.style.transform = `scaleX(${Math.max(0.08, progress).toFixed(4)})`;
}

function streamFrame(time) {
  if (stream.dirty) measureStream();
  if (!stream.lastFrame) stream.lastFrame = time;
  const delta = Math.min(64, time - stream.lastFrame);
  stream.lastFrame = time;
  const factor = reduceMotionQuery.matches ? 1 : 1 - Math.exp(Math.log(1 - STREAM_LERP) * (delta / (1000 / 60)));
  stream.current += (stream.target - stream.current) * factor;
  if (Math.abs(stream.target - stream.current) < 0.1) stream.current = stream.target;
  applyStream();
  if (stream.current === stream.target && !stream.dragging) {
    stream.raf = 0;
    stream.lastFrame = 0;
    return;
  }
  stream.raf = requestAnimationFrame(streamFrame);
}

function runStream() {
  if (stream.raf) return;
  stream.lastFrame = 0;
  stream.raf = requestAnimationFrame(streamFrame);
}

elements.streamShell.addEventListener("wheel", (event) => {
  if (event.ctrlKey || event.metaKey || state.screen !== "home") return;
  event.preventDefault();
  if (stream.dirty) measureStream();
  const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
  let delta = horizontal ? event.deltaX : event.deltaY;
  if (event.deltaMode === 1) delta *= 16;
  else if (event.deltaMode === 2) delta *= stream.viewport;
  stream.target = clampStream(stream.target + delta);
  runStream();
}, { passive: false });

let streamDrag = null;
let suppressStreamClick = false;

elements.streamShell.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  if (stream.dirty) measureStream();
  streamDrag = { id: event.pointerId, x: event.clientX, target: stream.target, moved: false };
  stream.dragging = true;
});

window.addEventListener("pointermove", (event) => {
  if (!streamDrag || event.pointerId !== streamDrag.id) return;
  const distance = event.clientX - streamDrag.x;
  if (!streamDrag.moved && Math.abs(distance) > STREAM_DRAG_THRESHOLD) {
    streamDrag.moved = true;
    elements.streamShell.classList.add("is-dragging");
  }
  if (!streamDrag.moved || !stream.max) return;
  stream.target = clampStream(streamDrag.target - distance * STREAM_DRAG_SENSITIVITY);
  runStream();
});

function endStreamDrag(event) {
  if (!streamDrag || (event && event.pointerId !== streamDrag.id)) return;
  if (streamDrag.moved) {
    suppressStreamClick = true;
    window.setTimeout(() => { suppressStreamClick = false; }, 400);
  }
  streamDrag = null;
  stream.dragging = false;
  elements.streamShell.classList.remove("is-dragging");
  runStream();
}

window.addEventListener("pointerup", endStreamDrag);
window.addEventListener("pointercancel", endStreamDrag);

elements.streamShell.addEventListener("click", (event) => {
  if (!suppressStreamClick) return;
  suppressStreamClick = false;
  event.preventDefault();
  event.stopPropagation();
}, true);

elements.streamShell.addEventListener("dragstart", (event) => event.preventDefault());

// The stream cards use a one-off entrance animation; when the home screen is
// hidden and shown again the CSS animation would restart and make the card
// drift ~36px while the reverse transition is running. Clear it after the
// first play so returning home never replays it.
elements.timeline.addEventListener("animationend", (event) => {
  if (event.animationName === "stream-card-in" && event.target instanceof Element) {
    event.target.style.animation = "none";
  }
});

elements.timeline.addEventListener("focusin", (event) => {
  const card = event.target.closest(".stream-project");
  if (!card) return;
  if (stream.dirty) measureStream();
  const item = stream.cards.find((entry) => entry.element === card);
  if (!item) return;
  const margin = 48;
  const left = item.center - item.width / 2;
  const right = item.center + item.width / 2;
  if (left < stream.current + margin) stream.target = clampStream(left - margin);
  else if (right > stream.current + stream.viewport - margin) stream.target = clampStream(right - stream.viewport + margin);
  else return;
  runStream();
});

function nudgeStream(direction) {
  if (state.screen !== "home") return;
  if (stream.dirty) measureStream();
  stream.target = clampStream(stream.target + direction * stream.viewport * 0.45);
  runStream();
}

function jumpStream(ratio) {
  if (state.screen !== "home") return;
  if (stream.dirty) measureStream();
  stream.target = clampStream(stream.max * ratio);
  runStream();
}

function scheduleStreamMeasure(delay = 0) {
  stream.dirty = true;
  window.clearTimeout(scheduleStreamMeasure.timer);
  scheduleStreamMeasure.timer = window.setTimeout(() => {
    stream.dirty = true;
    runStream();
  }, delay);
}

window.addEventListener("resize", () => {
  scheduleStreamMeasure(120);
  updateRailMask();
  sizeArtworkFrame();
  refreshArtworkResolution();
  if (state.screen === "viewer") {
    const current = elements.thumbnailRail.querySelector(".thumbnail.is-current");
    if (current) current.scrollIntoView({ block: "center", inline: "center" });
  }
});

renderTimeline();
runStream();
handleRoute();
routeHydrated = true;
// Reveal the routed screen only after it has been hydrated; otherwise a hard
// refresh on a deep link paints the home stream (many large cards) first.
window.requestAnimationFrame(() => document.documentElement.classList.remove("is-booting"));
if (document.fonts?.ready) document.fonts.ready.then(() => scheduleStreamMeasure(60));
