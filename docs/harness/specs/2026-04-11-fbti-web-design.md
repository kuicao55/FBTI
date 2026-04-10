# FBTI Web Quiz — Design Specification

**Date:** 2026-04-11
**Status:** Draft

## Goal

A single-page MBTI-style web quiz that identifies the user's 4-letter food personality type (TasteType) through 16 situational questions, displays their result with an SVG avatar, and supports sharing via URL link and PNG image with QR code.

---

## Architecture

**Single HTML file** (vanilla HTML/CSS/JS, no framework, no build step).

Three-screen flow:
1. **Welcome** — Hero with FBTI Logo, title, description, CTA
2. **Quiz** — One question at a time with progress bar, auto-advances on selection
3. **Result** — SVG avatar, type code, personality name, tagline, share buttons

URL sharing: `https://fbti.app/result?type=SCNU` (user answers encoded in URL params on page load).

Share image: 900×1200 PNG generated via Canvas API, includes SVG avatar, type code, name, tagline, FBTI Logo, QR code.

---

## Design Language

**Mode:** Brand Enhancement (landing page aesthetic)

**Token Colors:**
```css
--color-bg-base:      #ECE9E0   /* warm cream, page background */
--color-bg-raised:    #F5F3EC   /* card/panel background */
--color-bg-inverted:  #141413   /* dark block (result hero) */
--color-accent:       #D97757   /* orange CTA, sole accent */
--color-text-primary:  #141413
--color-text-secondary: #6B6860
--color-border:       #D8D5CC
```

**Typography:**
```css
--font-display:  'Lora', serif          /* titles, type code */
--font-heading:  'Poppins', sans-serif  /* UI, buttons, labels */
--font-body:     'Lora', serif           /* body, questions */
--font-mono:     'JetBrains Mono'
```

Chinese font: Noto Serif SC (Google Fonts CDN) as fallback for CJK characters.

**Font Sizes:**
| Usage | Size | Weight |
|-------|------|--------|
| Hero title | 48px | 700 |
| Type code (result) | 64px | 700 |
| Personality name | 28px | 600 italic |
| Question text | 20px | 400 |
| Option text | 16px | 500 |
| Caption/secondary | 14px | 400 |
| Button | 16px | 600 |

**Background:**
```css
/* Welcome + Quiz pages */
background:
  radial-gradient(ellipse 80% 60% at 20% 10%, rgba(217,119,87,0.06) 0%, transparent 60%),
  var(--color-bg-base);

/* Result hero section */
background: var(--color-bg-inverted);
color: white;
```

**Motion (CSS only):**
```css
--duration-fast:   150ms
--duration-normal:  250ms
--duration-slow:    400ms
--ease-default:     cubic-bezier(0.16, 1, 0.3, 1)
```

Animations:
- Page entrance: all elements `translateY(24px) → 0`, `opacity: 0→1`, 400ms, stagger 80ms
- Option hover: `scale(1.02)`, 150ms
- Option selected: left border expands to 3px, 250ms
- Question transition: current exits `translateX(-40px) + opacity:0`, next enters `translateX(40px)→0`, 300ms
- Progress bar: `width` transition, 300ms
- Result avatar: `scale(0.8)→1` + `opacity:0→1`, 500ms (leads other elements by 200ms)
- Share button hover: `translateY(-2px)`, 150ms

**Layout:**
- Max content width: 640px, centered
- Option cards: full-width within content column, 12px gap
- Section spacing: 64px vertical rhythm

---

## Components

### 1. Hero / Welcome Screen
- FBTI Logo SVG centered (80×80px display)
- `<h1>`: "口味人格测试" — Lora 700 48px
- Tagline: "16道情景题，发现你的味觉人格" — Poppins 16px secondary
- CTA button: full-width rounded rectangle, orange bg, white text "开始测试"
- On scroll/load: staggered entrance animation

### 2. Progress Bar
- Thin bar at top of quiz screen (4px height, rounded)
- Track: `--color-border`; Fill: `--color-accent`
- Label: "3 / 16" — Poppins 14px, right-aligned
- Transitions smoothly on each answer

### 3. Question Card
- Question number: "Q3" — Poppins 14px secondary
- Question text: Lora 20px, max 3 lines
- 4 option buttons below, vertical stack

### 4. Option Button
- Full-width, raised card style (`--color-bg-raised`)
- Left border: 3px transparent (default), 3px `--color-accent` (selected)
- Option letter (A/B/C/D): Poppins 600, accent color
- Option text: Poppins 500, primary color
- Hover: subtle scale + shadow
- Selected: left border accent, light orange background tint
- No disable state — user must pick one to proceed

### 5. Result Hero
- Dark inverted background section
- SVG avatar: 200×200, circular clip (`border-radius: 50%`), centered
- Type code: "S C N U" — Poppins 700 64px, white, letter-spacing 8px
- Personality name: Lora 600 italic 28px, white
- Tagline: Lora 400 16px, rgba(white, 0.8), max 2 lines

### 6. Share Button Group
- Two primary CTA buttons side-by-side:
  - "复制链接" — copies `window.location.href` to clipboard, shows toast
  - "保存图片" — generates 900×1200 PNG via Canvas, triggers download
- Button style: orange bg, white text, rounded, Poppins 600
- Hover: `translateY(-2px)`

### 7. Retake Button
- Secondary style: transparent bg, orange border, orange text
- Below share buttons, centered

### 8. Toast Notification
- Small floating pill: "链接已复制 ✓"
- Appears at top-center, 2s auto-dismiss
- `--color-accent` background, white text

---

## Data Flow

### Quiz State
```js
{
  currentQuestion: 0,        // 0-15
  answers: [],              // array of 16 chars ['A','B','C','D']
  resultType: null          // 'SCNU', 'MCTP', etc.
}
```

### Scoring Algorithm (per FBTI_Questions.md)

```js
// Dimension 1 (S/M): Q1-Q4
// A=+1, D=+0.5, B/C=+0 → S ≥ 2.5 ? 'S' : 'M'

// Dimension 2 (C/W): Q5-Q8
// A/C=+1, B=-0.5 (Q5 weight), D ignored → C ≥ 2.5 ? 'C' : 'W'

// Dimension 3 (N/T): Q9-Q12
// A=+1, B=-1, C/D=0 → N ≥ 1 ? 'N' : 'T'

// Dimension 4 (U/P): Q13-Q16
// A=+1, B=-1, C/D=0 → U ≥ 1 ? 'U' : 'P'
```

### URL Sharing
- On page load: parse `?type=SCNU` from URL → skip quiz, show result directly
- On result: update `window.history.pushState` with `?type=XXXX` without reload

### Share Image Generation (Canvas)
1. Create offscreen canvas 900×1200
2. Fill background `--color-bg-base`
3. Draw FBTI Logo SVG scaled at top-center
4. Draw result SVG avatar circular-clipped, centered
5. Draw type code, name, tagline in Lora/Poppins
6. Generate QR code via qrcode.js CDN, draw to canvas bottom
7. `canvas.toDataURL('image/png')` → trigger download as `fbti-{type}.png`

### External CDN Dependencies
- Google Fonts: Noto Serif SC (CJK fallback)
- qrcode.js: `https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js`

---

## Type Mapping (16 types)

| Code | Name (CN) | Tagline (first line) |
|------|-----------|----------------------|
| SCNU | 烈焰暴君 | 此类型是人类味觉边疆的拓荒者 |
| SCNP | 硬核极客 | 他们追求纯粹的化学刺激与物理脆度 |
| SCTU | 江湖老饕 | 地方菜系的坚定捍卫者 |
| SCTP | 盐系刺客 | 纯粹的重口味盐分爱好者 |
| SWNU | 熔岩核心 | 渴望"内在的燃烧" |
| SWNP | 味蕾实验员 | 为了尝试新奇辣味而去排队 |
| SWTU | 红汤居士 | 四川火锅里的"耙牛肉"是他们的归宿 |
| SWTP | 刺激渴求者 | 吃辣只是为了爽，为了多巴胺 |
| MCNU | 风味猎人 | 完全不吃辣，但追求极高风味浓度 |
| MCNP | 清爽极客 | 喜欢口感上的趣味，但讨厌味道上的负担 |
| MCTU | 经典脆党 | 粤菜烧腊的忠实拥趸 |
| MCTP | 纯粹口感派 | 只爱吃薯条、炸猪排、脆皮面包 |
| MWNU | 醇厚鉴赏家 | 用"软"和"浓"来衡量幸福 |
| MWNP | 轻盈梦想家 | 追求"空气感"和"温柔的甜/酸" |
| MWTU | 怀旧治愈家 | "外婆的味道"人格 |
| MWTP | 极简隐士 | 饮食世界的"性冷淡风" |

Full descriptions stored as JS object keyed by type code.

---

## Error Handling

- **All options required**: Cannot skip questions; each option click auto-advances
- **Invalid URL type**: If `?type=` contains unrecognized code, fallback to quiz start
- **Canvas/QRIO failure**: If image generation fails, show toast "图片生成失败，请重试"
- **Clipboard API unavailable**: Fallback to `window.prompt` with selectable text

---

## Testing Strategy

- **Manual**: Load `index.html` directly in browser, complete quiz, verify all 16 types
- **URL parse**: Test `file:///path/index.html?type=SCNU` — should show result directly
- **Share image**: Open in browser, click "保存图片", verify 900×1200 PNG downloads
- **Responsive**: Test at 375px (iPhone SE) and 1440px (desktop)

---

## Out of Scope

- Backend / database — fully client-side
- User session persistence — answers lost on page reload
- Multiple languages — Chinese only (Simplified)
- Dark mode toggle
- Accessibility audit (WCAG full compliance)
- Analytics / event tracking
- Animated transitions between screens (CSS only, no JS animation library)
