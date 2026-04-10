# FBTI Web Quiz — Implementation Plan

> **Harness note:** This plan is executed via `harness-execution` using the Orchestrator / Executor / Reviewer architecture. Each task goes through Executor (TDD implementation) → Spec Reviewer (compliance check) → Code Quality Reviewer (adversarial review). Only Code Quality Review PASS closes a task.

**Goal:** A fully functional single-file FBTI quiz — welcome screen, 16-question quiz with auto-advance, result page with SVG avatar and share functionality.

**Milestone ref:** milestone-1 from claude-progress.json

**Architecture:** Single HTML file (`index.html`) with embedded CSS and JS. Three screens toggled via JS (welcome → quiz → result). Canvas API for share image generation. QRCode.js via CDN for QR code rendering.

**Tech Stack:** Vanilla HTML/CSS/JS, Canvas API, qrcode.js CDN, Google Fonts CDN

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `index.html` | Create | Complete single-file app — HTML structure, CSS tokens, JS logic, embedded data |
| `assets/FBTI_logo.svg` | Existing | FBTI logo for share image generation |

---

## Task List

- [x] Task 1: HTML scaffold — three-screen structure + CSS token definitions + font imports
- [x] Task 2: CSS styling — Anthropic design tokens, layout, typography, animations
- [x] Task 3: Welcome screen — FBTI logo, title, tagline, CTA button
- [x] Task 4: Quiz screen — progress bar, question display, option buttons, question transition
- [ ] Task 5: Quiz data — embed all 16 questions, 16 type descriptions, 16 SVG avatars
- [ ] Task 6: Quiz state machine — answer collection, scoring algorithm, navigation
- [ ] Task 7: Result screen — avatar, type code, name, tagline, share buttons
- [ ] Task 8: URL sharing — parse `?type=` on load, pushState on result, copy link
- [ ] Task 9: Image sharing — Canvas-based 900×1200 PNG with QR code (qrcode.js CDN)
- [ ] Task 10: Integration + browser testing

---

### Task 1: HTML scaffold — three-screen structure + CSS token definitions + font imports

**Files:**

- Create: `index.html`

**TDD_EVIDENCE:** File loads in browser with no JS errors; DevTools console shows zero Error-level messages.

- [ ] **Step 1: Create the HTML file with three screen containers and CSS token variables**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TasteType · 口味人格测试</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=Poppins:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">
  <style>
    /* === CSS TOKENS === */
    :root {
      --color-bg-base: #ECE9E0;
      --color-bg-raised: #F5F3EC;
      --color-bg-inverted: #141413;
      --color-accent: #D97757;
      --color-text-primary: #141413;
      --color-text-secondary: #6B6860;
      --color-border: #D8D5CC;

      --font-display: 'Lora', 'Noto Serif SC', serif;
      --font-heading: 'Poppins', 'Noto Serif SC', sans-serif;
      --font-body: 'Lora', 'Noto Serif SC', serif;

      --space-4: 16px;
      --space-6: 24px;
      --space-8: 32px;
      --space-10: 40px;
      --space-16: 64px;

      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 20px;
      --radius-full: 9999px;

      --duration-fast: 150ms;
      --duration-normal: 250ms;
      --duration-slow: 400ms;
      --ease-default: cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* === RESET === */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 16px; }
    body {
      font-family: var(--font-body);
      background-color: var(--color-bg-base);
      color: var(--color-text-primary);
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }

    /* === SCREEN CONTAINERS === */
    .screen { display: none; min-height: 100vh; }
    .screen.active { display: flex; flex-direction: column; }
  </style>
</head>
<body>
  <!-- Screen 1: Welcome -->
  <section id="screen-welcome" class="screen active"></section>
  <!-- Screen 2: Quiz -->
  <section id="screen-quiz" class="screen"></section>
  <!-- Screen 3: Result -->
  <section id="screen-result" class="screen"></section>

  <script>
    // Placeholder: will be filled in Task 6
  </script>
</body>
</html>
```

- [ ] **Step 2: Verify**

Open `index.html` in browser. Confirm:
- Page loads without crash
- No Error-level console messages
- All three `.screen` divs exist in DOM (only `#screen-welcome` visible)

- [ ] **Step 3: Commit**

```bash
git add index.html && git commit -m "feat: FBTI HTML scaffold with CSS tokens and three screens

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: CSS styling — Anthropic design tokens, layout, typography, animations

**Files:**

- Modify: `index.html` (`<style>` block)

**TDD_EVIDENCE:** CSS-only verification — no code logic needed. Visual check: background is warm cream (#ECE9E0), fonts render correctly from Google Fonts CDN.

- [ ] **Step 1: Add all shared component styles to the `<style>` block in `index.html`**

Full CSS classes needed:
- `.container` — max-width 640px, centered, horizontal padding var(--space-6)
- `.btn-primary` — full-width, orange bg, white text, Poppins 600 16px, radius var(--radius-lg), padding 16px 24px, cursor pointer, hover: scale(1.02) + translateY(-2px), transition var(--duration-fast)
- `.btn-secondary` — transparent bg, orange border 2px, orange text, same sizing as primary
- `.option-card` — raised card, bg var(--color-bg-raised), radius var(--radius-md), padding var(--space-6), left-border 3px transparent, cursor pointer, transition left-border var(--duration-normal)
- `.option-card:hover` — subtle shadow, scale(1.01)
- `.option-card.selected` — left-border 3px var(--color-accent), background rgba(217,119,87,0.06)
- `.option-letter` — Poppins 600, color var(--color-accent), margin-right 12px
- `.option-text` — Poppins 500, color var(--color-text-primary), font-size 16px, line-height 1.5
- `.progress-track` — width 100%, height 4px, bg var(--color-border), radius var(--radius-full), overflow hidden
- `.progress-fill` — height 100%, bg var(--color-accent), border-radius var(--radius-full), transition width var(--duration-normal)
- `.fade-in-up` — animation: fadeInUp var(--duration-slow) var(--ease-default) forwards
- `@keyframes fadeInUp` — from `opacity:0; transform:translateY(24px)` to `opacity:1; transform:translateY(0)`
- Stagger delays: `.stagger-1` { animation-delay: 0ms }, `.stagger-2` { 80ms }, `.stagger-3` { 160ms }, `.stagger-4` { 240ms }, `.stagger-5` { 320ms }, `.stagger-6` { 400ms }
- `.toast` — fixed top-center, bg var(--color-accent), white text, Poppins 500 14px, padding 10px 20px, border-radius var(--radius-full), opacity 0→1 transition, z-index 1000, display none
- `.toast.visible` — display block
- Background radial gradient on `#screen-welcome` and `#screen-quiz`
- Dark inverted section for `#screen-result`

```css
/* === LAYOUT === */
.container {
  max-width: 640px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

/* === BUTTONS === */
.btn-primary {
  display: block;
  width: 100%;
  background: var(--color-accent);
  color: white;
  font-family: var(--font-heading);
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: var(--radius-lg);
  padding: 16px 24px;
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-default),
              box-shadow var(--duration-fast) var(--ease-default);
  text-align: center;
}
.btn-primary:hover {
  transform: scale(1.02) translateY(-2px);
  box-shadow: 0 8px 24px rgba(217,119,87,0.25);
}
.btn-primary:active { transform: scale(0.99); }

.btn-secondary {
  display: block;
  width: 100%;
  background: transparent;
  color: var(--color-accent);
  font-family: var(--font-heading);
  font-size: 16px;
  font-weight: 600;
  border: 2px solid var(--color-accent);
  border-radius: var(--radius-lg);
  padding: 14px 24px;
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-default),
              background var(--duration-fast);
}
.btn-secondary:hover {
  background: rgba(217,119,87,0.06);
  transform: translateY(-1px);
}

/* === OPTION CARDS === */
.option-card {
  display: flex;
  align-items: flex-start;
  background: var(--color-bg-raised);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  border-left: 3px solid transparent;
  cursor: pointer;
  transition: border-color var(--duration-normal) var(--ease-default),
              transform var(--duration-fast) var(--ease-default),
              box-shadow var(--duration-fast);
  margin-bottom: 12px;
}
.option-card:hover {
  transform: scale(1.01);
  box-shadow: 0 4px 16px rgba(20,20,19,0.08);
}
.option-card.selected {
  border-left-color: var(--color-accent);
  background: rgba(217,119,87,0.06);
}
.option-letter {
  font-family: var(--font-heading);
  font-weight: 600;
  color: var(--color-accent);
  margin-right: 12px;
  flex-shrink: 0;
}
.option-text {
  font-family: var(--font-heading);
  font-weight: 500;
  color: var(--color-text-primary);
  font-size: 16px;
  line-height: 1.5;
}

/* === PROGRESS BAR === */
.progress-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-10);
}
.progress-track {
  flex: 1;
  height: 4px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--color-accent);
  border-radius: var(--radius-full);
  transition: width var(--duration-normal) var(--ease-default);
}
.progress-label {
  font-family: var(--font-heading);
  font-size: 14px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

/* === TOAST === */
.toast {
  position: fixed;
  top: var(--space-6);
  left: 50%;
  transform: translateX(-50%) translateY(-8px);
  background: var(--color-accent);
  color: white;
  font-family: var(--font-heading);
  font-size: 14px;
  font-weight: 500;
  padding: 10px 20px;
  border-radius: var(--radius-full);
  z-index: 1000;
  opacity: 0;
  transition: opacity var(--duration-normal), transform var(--duration-normal);
  pointer-events: none;
  white-space: nowrap;
}
.toast.visible {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* === ANIMATIONS === */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fade-in-up {
  opacity: 0;
  animation: fadeInUp var(--duration-slow) var(--ease-default) forwards;
}
.stagger-1 { animation-delay: 0ms; }
.stagger-2 { animation-delay: 80ms; }
.stagger-3 { animation-delay: 160ms; }
.stagger-4 { animation-delay: 240ms; }
.stagger-5 { animation-delay: 320ms; }
.stagger-6 { animation-delay: 400ms; }

/* === SCREEN BACKGROUNDS === */
#screen-welcome,
#screen-quiz {
  background:
    radial-gradient(ellipse 80% 60% at 20% 10%, rgba(217,119,87,0.06) 0%, transparent 60%),
    var(--color-bg-base);
}
#screen-result {
  background: var(--color-bg-inverted);
  color: white;
}
```

- [ ] **Step 2: Verify**

Verify no syntax errors by loading in browser. Confirm Google Fonts loads (check Network tab).

- [ ] **Step 3: Commit**

```bash
git add index.html && git commit -m "style: add Anthropic CSS tokens and component styles

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Welcome screen — FBTI logo, title, tagline, CTA button

**Files:**

- Modify: `index.html` (`<section id="screen-welcome">` content and JS init)

**TDD_EVIDENCE:** Welcome screen shows FBTI logo, title, tagline, CTA. Clicking "开始测试" navigates to quiz screen.

- [ ] **Step 1: Fill in `#screen-welcome` innerHTML**

```html
<section id="screen-welcome" class="screen active">
  <div class="container" style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding-top:var(--space-16);padding-bottom:var(--space-16);">
    <!-- FBTI Logo -->
    <div class="fade-in-up stagger-1" style="margin-bottom:var(--space-8);">
      <img src="assets/FBTI_logo.svg" alt="FBTI Logo" width="80" height="80">
    </div>
    <!-- Title -->
    <h1 class="fade-in-up stagger-2" style="font-family:var(--font-display);font-size:48px;font-weight:700;color:var(--color-text-primary);margin-bottom:var(--space-4);line-height:1.2;">
      口味人格测试
    </h1>
    <!-- Subtitle -->
    <p class="fade-in-up stagger-3" style="font-family:var(--font-heading);font-size:18px;color:var(--color-text-secondary);margin-bottom:var(--space-10);max-width:360px;line-height:1.6;">
      16道情景题 · 发现你的味觉人格
    </p>
    <!-- CTA -->
    <button id="btn-start" class="btn-primary fade-in-up stagger-4" style="max-width:320px;">
      开始测试
    </button>
  </div>
</section>
```

- [ ] **Step 2: Add JS to handle CTA click in the `<script>` block**

```js
document.getElementById('btn-start').addEventListener('click', function() {
  showScreen('quiz');
});
```

- [ ] **Step 3: Verify**

Open page — confirm welcome screen renders. Click "开始测试" — confirm quiz screen appears.

- [ ] **Step 4: Commit**

```bash
git add index.html && git commit -m "feat: welcome screen with logo, title and CTA

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Quiz screen — progress bar, question display, option buttons, question transition

**Files:**

- Modify: `index.html` (quiz screen HTML + quiz navigation JS)

**TDD_EVIDENCE:** Quiz screen shows Q1 with progress "1/16". Clicking an option briefly highlights it then transitions to Q2 with smooth slide animation.

- [ ] **Step 1: Fill `#screen-quiz` structure and add transition CSS**

Add to `<style>`:
```css
/* === QUIZ SCREEN === */
.quiz-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: var(--space-16) 0;
}
.quiz-header {
  margin-bottom: var(--space-10);
}
.quiz-question-text {
  font-family: var(--font-body);
  font-size: 20px;
  color: var(--color-text-primary);
  line-height: 1.6;
  margin-bottom: var(--space-8);
}
.quiz-options { display: flex; flex-direction: column; }

/* Question transition */
#screen-quiz { overflow-x: hidden; }
.quiz-panel {
  transition: transform var(--duration-normal) var(--ease-default),
              opacity var(--duration-normal);
}
.quiz-panel.exit-left {
  transform: translateX(-40px);
  opacity: 0;
}
.quiz-panel.enter-right {
  transform: translateX(40px);
  opacity: 0;
}
.quiz-panel.enter-center {
  transform: translateX(0);
  opacity: 1;
}
```

- [ ] **Step 2: Fill `#screen-quiz` innerHTML (static shell, JS will populate)**

```html
<section id="screen-quiz" class="screen">
  <div class="container" style="flex:1;display:flex;flex-direction:column;justify-content:center;">
    <div class="quiz-wrap">
      <div class="quiz-header fade-in-up stagger-1">
        <div class="progress-wrap">
          <div class="progress-track">
            <div class="progress-fill" id="progress-fill" style="width:0%"></div>
          </div>
          <span class="progress-label" id="progress-label">1 / 16</span>
        </div>
        <p class="quiz-question-text" id="question-text">题目加载中…</p>
      </div>
      <div class="quiz-options" id="quiz-options">
        <!-- Options populated by JS -->
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Add `showQuestion(n)` function to JS (renders question and options)**

```js
// Quiz state
let currentQuestion = 0;
let answers = [];

const questions = [
  // Populated in Task 5
];

function showQuestion(index) {
  const q = questions[index];
  const total = questions.length;

  // Update progress
  document.getElementById('progress-fill').style.width = ((index) / total * 100) + '%';
  document.getElementById('progress-label').textContent = (index + 1) + ' / ' + total;

  // Update question text
  const questionText = document.getElementById('question-text');
  questionText.textContent = q.text;

  // Render options
  const optionsEl = document.getElementById('quiz-options');
  optionsEl.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];
  q.options.forEach(function(opt, i) {
    const card = document.createElement('div');
    card.className = 'option-card fade-in-up';
    card.style.animationDelay = (i * 80) + 'ms';
    card.innerHTML = '<span class="option-letter">' + letters[i] + '.</span><span class="option-text">' + opt + '</span>';
    card.addEventListener('click', function() { selectOption(index, letters[i]); });
    optionsEl.appendChild(card);
  });
}

function selectOption(questionIndex, letter) {
  answers[questionIndex] = letter;
  if (questionIndex < questions.length - 1) {
    // Transition to next question
    const panel = document.querySelector('#screen-quiz .quiz-wrap');
    panel.classList.add('exit-left');
    setTimeout(function() {
      showQuestion(questionIndex + 1);
      panel.classList.remove('exit-left');
      panel.classList.add('enter-center');
      setTimeout(function() { panel.classList.remove('enter-center'); }, 300);
    }, 200);
  } else {
    // Last question — show result
    showResult();
  }
}
```

- [ ] **Step 4: Verify**

Load page, click start, verify Q1 shows with progress "1/16". Click an option — verify Q2 appears after transition.

- [ ] **Step 5: Commit**

```bash
git add index.html && git commit -m "feat: quiz screen with progress bar, question display and transitions

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Quiz data — embed all 16 questions, 16 type descriptions, 16 SVG avatars

**Files:**

- Modify: `index.html` (embed questions array and type data)

**TDD_EVIDENCE:** All 16 questions render correctly with correct option text. Type descriptions match FBTI_Questions.md. All 16 SVG avatars are present in the JS data.

- [ ] **Step 1: Create the questions array in the `<script>` block**

Replace the placeholder `const questions = []` with full 16 questions from FBTI_Questions.md:

```js
const questions = [
  {
    text: '一碗刚出锅的红油抄手端上来，你的第一注意力落在哪里？',
    options: [
      '那层亮红色的辣椒油和漂浮的芝麻，已经自动分泌口水了',
      '先把辣椒拨开一点，看看里面的肉馅和汤底清不清',
      '我更关心抄手皮是薄是厚、是软是脆',
      '我会先闻味道，判断这是单纯的辣还是有花椒、香料等复合香气'
    ]
  },
  {
    text: '吃火锅调蘸料时，你的碗里通常是什么画风？',
    options: [
      '小米辣、蒜泥、香油、蚝油、香菜葱花都要堆满',
      '酱油底，最多加一点点辣椒圈提味',
      '芝麻酱+腐乳+韭菜花，或沙茶酱+蛋黄，不太放辣椒',
      '看锅底决定，牛油锅就蘸干碟，清汤锅就蘸海鲜汁'
    ]
  },
  {
    text: '当你看到菜单上有"魔鬼辣挑战成功免单"的活动时，你的想法是？',
    options: [
      '让我来，这是我的主场',
      '除非朋友起哄，否则我不想折磨自己',
      '我觉得会影响品尝食物本身的味道，不参加',
      '先研究一下辣椒品种，如果是纯工业辣精就不玩，天然辣椒可以试试'
    ]
  },
  {
    text: '吃完一顿重辣餐后，你的身体通常是什么反应？',
    options: [
      '嘴巴肿了但心里爽了，第二天继续',
      '肠胃可能会抗议，我尽量控制频率',
      '我会大量喝水，并且下一顿一定要吃清淡的缓一缓',
      '看辣椒品质，好辣椒只辣嘴不烧心，坏辣椒会让我难受很久'
    ]
  },
  {
    text: '一份炸鸡摆在面前，哪个瞬间让你觉得"这顿值了"？',
    options: [
      '牙齿咬下去发出"咔嚓"声，脆皮碎屑掉下来',
      '里面的肉汁瞬间烫到舌头，肉质嫩滑到不用怎么嚼',
      '我喜欢先吃皮再吃肉，皮必须脆，肉可以稍干',
      '我其实不爱油炸，我更爱红烧或炖煮的口感'
    ]
  },
  {
    text: '如果一碗红烧肉让你评价，你觉得最不能忍受的缺点是？',
    options: [
      '瘦肉部分太柴，塞牙',
      '肥肉部分没有炖烂，咬起来像肥油块',
      '皮上的毛没去干净',
      '汤汁不够浓稠，挂不住肉'
    ]
  },
  {
    text: '你对"软糯"类食物（如土豆泥、年糕、烩饭）的态度是？',
    options: [
      '可以吃，但不能连续吃，否则觉得嘴巴没劲',
      '这是我的舒适区，我可以天天吃软软的东西',
      '看搭配，如果是软糯主食配脆的小菜，我就很爱',
      '我更关心调味，软或硬没那么重要'
    ]
  },
  {
    text: '吃拉面时，你对"面条硬度"的选择通常是？',
    options: [
      '必须点"超硬"或"硬"，喜欢吃有嚼劲的',
      '点"普通"或"偏软"，好嚼好消化',
      '第一次去会点普通，之后再根据汤头调整',
      '我不吃拉面，或者我不关心这个细节'
    ]
  },
  {
    text: '去一家没去过的异国餐厅，菜单上有一道"香菜菠萝披萨"和一道"玛格丽特披萨"，你会？',
    options: [
      '绝对点香菜菠萝的，没吃过的东西才有意思',
      '保险起见点玛格丽特，不踩雷最重要',
      '先问服务员哪个是招牌，如果是香菜菠萝就试，如果不是就点玛格丽特',
      '我都不点，我会找菜单上看起来最熟悉的肉菜'
    ]
  },
  {
    text: '朋友向你安利一家"用巧克力蘸辣椒面吃"的店，你的第一反应是？',
    options: [
      '听起来很暗黑，但我必须去验证一下',
      '谢谢，这搭配超出了我的认知范围，我不去',
      '如果是黑巧克力我可能考虑，牛奶巧克力就算了',
      '我要先看看大众点评上的图片再决定'
    ]
  },
  {
    text: '你对"正宗"这个词的态度是？',
    options: [
      '正宗很重要，那是文化和风味的根基',
      '好吃就行，我不在乎正不正宗，改良得好我也爱',
      '有些菜必须正宗（比如我妈做的），有些菜可以乱来',
      '我分不清什么是正宗，只要对胃口就是好菜'
    ]
  },
  {
    text: '在自助餐厅，你的取餐策略通常是？',
    options: [
      '每样没见过的都拿一点点尝尝',
      '直奔我最爱吃的那几样，拿满一盘吃到爽',
      '第一轮拿熟悉的，第二轮再探索新菜',
      '看排队人数，人多的一定好吃，先拿那个'
    ]
  },
  {
    text: '你觉得一碗"清汤寡水"的阳春面（只有酱油汤底和葱花）最大的问题是什么？',
    options: [
      '不够鲜，需要加一勺猪油或者高汤料包',
      '没有浇头，吃起来太单调',
      '其实我觉得挺好吃的，能吃到面粉的香气',
      '面条本身的口感比汤更重要'
    ]
  },
  {
    text: '对于"味精/鸡精/蚝油"这类调味品，你的态度是？',
    options: [
      '做饭必备，少了它们菜就没有灵魂',
      '能不放就不放，我更喜欢食材本身的味道',
      '在外面吃无所谓，自己在家做会尽量少放',
      '我吃不出来区别'
    ]
  },
  {
    text: '吃日料刺身时，你会怎么蘸酱油？',
    options: [
      '酱油里一定会加现磨山葵，还要蘸很多下',
      '轻轻蘸一点酱油，甚至有的鱼不蘸直接吃',
      '我其实不太吃生鱼片，觉得腥',
      '我会把山葵直接融进酱油里搅浑了蘸'
    ]
  },
  {
    text: '你觉得"老火靓汤"和"生滚汤"哪个更对你胃口？',
    options: [
      '老火靓汤，那口浓郁鲜甜是时间的味道',
      '生滚汤，清清爽爽，食材新鲜就好',
      '看季节，冬天老火汤夏天生滚汤',
      '我不怎么喝汤'
    ]
  }
];
```

- [ ] **Step 2: Create the type descriptions object**

Add after `questions` array:

```js
const typeData = {
  SCNU: { name: '烈焰暴君', tagline: '此类型是人类味觉边疆的拓荒者。追求极致的复合型感官轰炸——必须辣到流汗、脆到出声、鲜到掉眉毛。', desc: '此类型是人类味觉边疆的拓荒者。追求极致的复合型感官轰炸——必须辣到流汗、脆到出声、鲜到掉眉毛。他们热衷于寻找"变态辣脆皮肥肠"或"烟熏辣椒巧克力脆片"。推荐信源可信度极高，但普通人跟上需要勇气。' },
  SCNP: { name: '硬核极客', tagline: '他们追求纯粹的化学刺激与物理脆度，但对"鲜"非常苛刻。', desc: '他们追求纯粹的化学刺激与物理脆度，但对"鲜"非常苛刻，讨厌味精感和过度的发酵味。他们可能爱吃"死神辣椒薯片"但极度厌恶鸡精。他们推荐的辣馆子通常"干净利落、辣得纯粹"。' },
  SCTU: { name: '江湖老饕', tagline: '地方菜系的坚定捍卫者。只认可"正宗"的辣脆结合。', desc: '地方菜系的坚定捍卫者。只认可"正宗"的辣脆结合，比如重庆火锅里的毛肚黄喉、湖南小炒里的脆骨。拒绝为了猎奇而改良的融合菜。他们对特定菜系的推荐具有权威性。' },
  SCTP: { name: '盐系刺客', tagline: '纯粹的重口味盐分爱好者。比起鲜，更爱直接的咸辣。', desc: '纯粹的重口味盐分爱好者。比起鲜，更爱直接的咸辣。他们热爱的是夜市里的"疯狂烤翅"、校门口的"油炸淀粉肠"。他们对环境不挑，只看"味道够不够劲儿"。' },
  SWNU: { name: '熔岩核心', tagline: '这种类型渴望"内在的燃烧"。最爱炖得软烂入味的辣卤鸡爪。', desc: '这种类型渴望"内在的燃烧"。他们最爱的食物是：炖得软烂入味的辣卤鸡爪、入口即化的水煮脑花、吸饱汤汁的臭豆腐。追求辣与鲜在绵密口感中的缓慢释放。' },
  SWNP: { name: '味蕾实验员', tagline: '他们可能为了尝试"辣椒冰淇淋"而去排队。', desc: '他们可能为了尝试"辣椒冰淇淋"而去排队，或者喜欢吃"软糯的韩式辣年糕"。他们喜欢新奇辣味带来的趣味性，但不希望菜里有"药膳味"或"高汤味"。' },
  SWTU: { name: '红汤居士', tagline: '四川火锅里的"耙牛肉"、湖南的"口味虾"汤汁拌饭是他们的归宿。', desc: '四川火锅里的"耙牛肉"、湖南的"口味虾"汤汁拌饭是他们的归宿。他们是那种会因为一道"老妈蹄花汤不够软烂"而给差评的人。他们对"软"和"辣"的比例有严格的审美标准。' },
  SWTP: { name: '刺激渴求者', tagline: '他们吃辣只是为了爽，为了多巴胺。', desc: '他们吃辣只是为了爽，为了多巴胺。最喜欢的食物是：软糯的麻辣烫宽粉、吸满辣椒油的凉皮。对于食材本身是否高级、是否有鲜味不感兴趣。' },
  MCNU: { name: '风味猎人', tagline: '完全不吃辣，但追求极高风味浓度。热爱焦脆的芝士脆皮。', desc: '这是你提到的"德国烤土豆"人格。完全不吃辣，但追求极高风味浓度。他们热爱焦脆的芝士脆皮、美拉德反应极致的煎烤、复杂的香料组合（不含辣）。推荐非辣菜系的异国料理极准。' },
  MCNP: { name: '清爽极客', tagline: '他们喜欢口感上的趣味，但讨厌味道上的负担。', desc: '他们喜欢口感上的趣味，但讨厌味道上的负担。他们可能会迷恋"海盐焦糖脆片"或"柚子味气泡炸鸡皮"。他们推荐的餐厅通常"有趣且不油腻"。' },
  MCTU: { name: '经典脆党', tagline: '粤菜烧腊的忠实拥趸。烧鹅皮、乳猪皮、炸子鸡皮是他们的灵魂伴侣。', desc: '粤菜烧腊的忠实拥趸。烧鹅皮、乳猪皮、炸子鸡皮是他们的灵魂伴侣。他们重视食材本味的鲜与烹饪技法的脆。他们推荐的粤菜/淮扬菜馆子可信度满分。' },
  MCTP: { name: '纯粹口感派', tagline: '极度挑食的"小孩口味"成人版。只爱吃薯条、炸猪排、脆皮面包。', desc: '极度挑食的"小孩口味"成人版。只爱吃薯条、炸猪排、脆皮面包。对复杂的调味（哪怕是黑胡椒）都可能排斥。他们的推荐仅限于"炸物榜"。' },
  MWNU: { name: '醇厚鉴赏家', tagline: '他们用"软"和"浓"来衡量幸福。热爱提拉米苏、勃艮第红酒炖牛肉。', desc: '这是你提到的"漏奶华/巧克力"人格。他们用"软"和"浓"来衡量幸福。热爱提拉米苏、勃艮第红酒炖牛肉、溏心蛋、葱烧海参。他们是甜品店和西餐厅的优质推荐信源。' },
  MWNP: { name: '轻盈梦想家', tagline: '喜欢尝试各种口味的布丁、慕斯、云朵蛋糕。', desc: '喜欢尝试各种口味的布丁、慕斯、云朵蛋糕。追求的是"空气感"和"温柔的甜/酸"。他们对食物的视觉美感要求往往高于味道浓度。' },
  MWTU: { name: '怀旧治愈家', tagline: '这是最典型的"外婆的味道"人格。番茄炒蛋拌饭、红烧肉汁拌饭。', desc: '这是最典型的"外婆的味道"人格。番茄炒蛋拌饭、红烧肉汁拌饭、烂糊面、鸡蛋羹。他们通过软烂的食物获取安全感。他们推荐的"家常菜馆"往往环境一般但味道窝心。' },
  MWTP: { name: '极简隐士', tagline: '饮食世界的"性冷淡风"。可能最喜欢白粥配腐乳。', desc: '饮食世界的"性冷淡风"。可能最喜欢白粥配腐乳（只吃腐乳的咸味不吃豆子）、白吐司、土豆泥（只放盐）。他们不是挑剔，只是味觉阈值极低且对多数风味物质敏感。' }
};
```

- [ ] **Step 3: Create the SVG avatars object**

Add after `typeData`:

```js
const typeSVGs = {
  SCNU: '<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="90" fill="#D32F2F" stroke="#B71C1C" stroke-width="4"/><path d="M100 30 Q120 60 115 85 Q130 70 140 90 Q125 105 130 130 Q115 120 110 145 Q100 120 90 145 Q85 120 70 130 Q75 105 60 90 Q70 70 85 85 Q80 60 100 30Z" fill="#FFC107"/><path d="M85 150 Q90 135 100 140 Q110 135 115 150 Q110 165 100 170 Q90 165 85 150Z" fill="#4CAF50"/><path d="M100 170 L100 185" stroke="#4CAF50" stroke-width="3" stroke-linecap="round"/><text x="100" y="115" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">SCNU</text></svg>',
  SCNP: '<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="90" fill="#E65100" stroke="#BF360C" stroke-width="4"/><rect x="80" y="45" width="15" height="50" rx="3" fill="none" stroke="white" stroke-width="3"/><circle cx="87.5" cy="105" r="12" fill="none" stroke="white" stroke-width="3"/><path d="M87.5 95 L87.5 55" stroke="white" stroke-width="3"/><path d="M95 80 Q105 70 110 80 Q115 70 120 80 Q115 90 110 85 Q105 90 100 80Z" fill="#FFC107"/><circle cx="108" cy="75" r="3" fill="#FFC107"/><text x="100" y="150" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="white" text-anchor="middle">SCNP</text></svg>',
  SCTU: '<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="90" fill="#F57F17" stroke="#E65100" stroke-width="4"/><line x1="50" y1="140" x2="130" y2="60" stroke="#8D6E63" stroke-width="5" stroke-linecap="round"/><line x1="55" y1="145" x2="135" y2="65" stroke="#8D6E63" stroke-width="5" stroke-linecap="round"/><ellipse cx="110" cy="75" rx="18" ry="14" fill="#D84315" stroke="#BF360C" stroke-width="2"/><ellipse cx="110" cy="75" rx="10" ry="7" fill="#FFAB91" opacity="0.6"/><text x="100" y="160" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="white" text-anchor="middle">SCTU</text></svg>',
  SCTP: '<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="90" fill="#827717" stroke="#5D4037" stroke-width="4"/><rect x="60" y="65" width="80" height="70" rx="8" fill="#9E9D24" opacity="0.4"/><circle cx="75" cy="80" r="4" fill="white"/><circle cx="95" cy="75" r="5" fill="white"/><circle cx="85" cy="100" r="4" fill="white"/><circle cx="115" cy="90" r="5" fill="white"/><circle cx="125" cy="110" r="4" fill="white"/><path d="M75 85 Q85 70 95 85 Q105 70 115 85" fill="none" stroke="#D32F2F" stroke-width="3"/><text x="100" y="160" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="white" text-anchor="middle">SCTP</text></svg>',
  SWNU: '<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="90" fill="#C2185B" stroke="#880E4F" stroke-width="4"/><path d="M60 130 Q80 100 100 120 Q120 100 140 130 Q130 150 100 145 Q70 150 60 130Z" fill="#FF5722"/><ellipse cx="100" cy="130" rx="20" ry="12" fill="#FF8A65"/><circle cx="90" cy="125" r="6" fill="#FFCC80"/><circle cx="110" cy="128" r="5" fill="#FFCC80"/><text x="100" y="160" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="white" text-anchor="middle">SWNU</text></svg>',
  SWNP: '<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="90" fill="#AD1457" stroke="#4A0024" stroke-width="4"/><path d="M65 85 Q65 55 100 55 Q135 55 135 85 L130 120 Q100 130 70 120Z" fill="#6D4C41" stroke="#3E2723" stroke-width="3"/><ellipse cx="100" cy="85" rx="32" ry="10" fill="#D32F2F" opacity="0.9"/><path d="M75 95 Q100 110 125 95" fill="none" stroke="#FF8A65" stroke-width="3"/><text x="100" y="160" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="white" text-anchor="middle">SWNP</text></svg>',
  SWTU: '<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="90" fill="#AD1457" stroke="#4A0024" stroke-width="4"/><path d="M65 85 Q65 55 100 55 Q135 55 135 85 L130 120 Q100 130 70 120Z" fill="#6D4C41" stroke="#3E2723" stroke-width="3"/><ellipse cx="100" cy="85" rx="32" ry="10" fill="#D32F2F" opacity="0.9"/><path d="M75 95 Q100 110 125 95" fill="none" stroke="#FF8A65" stroke-width="3"/><text x="100" y="160" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="white" text-anchor="middle">SWTU</text></svg>',
  SWTP: '<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="90" fill="#6A1B9A" stroke="#38006B" stroke-width="4"/><path d="M70 70 Q100 50 130 70 L120 100 Q100 110 80 100Z" fill="#FFF9C4" opacity="0.8"/><path d="M75 75 Q100 60 125 75" fill="none" stroke="#D32F2F" stroke-width="4" stroke-linecap="round"/><circle cx="90" cy="80" r="5" fill="#D32F2F"/><circle cx="110" cy="85" r="4" fill="#D32F2F"/><text x="100" y="160" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="white" text-anchor="middle">SWTP</text></svg>',
  MCNU: '<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="90" fill="#1565C0" stroke="#0D47A1" stroke-width="4"/><ellipse cx="100" cy="85" rx="25" ry="18" fill="#8D6E63"/><ellipse cx="100" cy="85" rx="20" ry="14" fill="#D84315"/><line x1="100" y1="103" x2="100" y2="125" stroke="#5D4037" stroke-width="4"/><path d="M75 70 Q80 50 90 55 Q85 65 80 70" fill="none" stroke="#4CAF50" stroke-width="3"/><path d="M115 75 Q120 55 110 50 Q115 65 112 75" fill="none" stroke="#4CAF50" stroke-width="3"/><text x="100" y="160" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="white" text-anchor="middle">MCNU</text></svg>',
  MCNP: '<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="90" fill="#00838F" stroke="#004D40" stroke-width="4"/><circle cx="85" cy="70" r="15" fill="#FFF59D"/><circle cx="115" cy="70" r="15" fill="#FFF59D"/><rect x="75" y="90" width="50" height="35" rx="6" fill="#FFCC80" transform="rotate(-10 100 105)"/><line x1="80" y1="95" x2="90" y2="115" stroke="#5D4037" stroke-width="2"/><line x1="95" y1="92" x2="100" y2="115" stroke="#5D4037" stroke-width="2"/><line x1="108" y1="90" x2="110" y2="112" stroke="#5D4037" stroke-width="2"/><text x="100" y="160" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="white" text-anchor="middle">MCNP</text></svg>',
  MCTU: '<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="90" fill="#2E7D32" stroke="#1B5E20" stroke-width="4"/><path d="M70 70 Q100 40 130 70 Q135 100 120 115 Q100 125 80 115 Q65 100 70 70Z" fill="#D84315" stroke="#BF360C" stroke-width="2"/><path d="M90 50 L100 30 L110 50" fill="none" stroke="#BF360C" stroke-width="3"/><path d="M80 75 Q100 60 120 75" fill="none" stroke="#FFAB91" stroke-width="3" stroke-linecap="round"/><text x="100" y="160" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="white" text-anchor="middle">MCTU</text></svg>',
  MCTP: '<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="90" fill="#558B2F" stroke="#33691E" stroke-width="4"/><rect x="70" y="70" width="12" height="50" rx="3" fill="#FFC107"/><rect x="88" y="60" width="12" height="60" rx="3" fill="#FFC107"/><rect x="106" y="65" width="12" height="55" rx="3" fill="#FFC107"/><rect x="124" y="75" width="12" height="45" rx="3" fill="#FFC107"/><circle cx="75" cy="78" r="2" fill="white"/><circle cx="95" cy="70" r="2" fill="white"/><circle cx="112" cy="75" r="2" fill="white"/><text x="100" y="160" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="white" text-anchor="middle">MCTP</text></svg>',
  MWNU: '<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="90" fill="#4E342E" stroke="#3E2723" stroke-width="4"/><path d="M70 90 L130 90 L120 125 Q100 135 80 125Z" fill="#3E2723"/><ellipse cx="100" cy="90" rx="28" ry="10" fill="#5D4037"/><path d="M85 95 Q100 115 115 95" fill="none" stroke="#8D6E63" stroke-width="4" stroke-linecap="round"/><circle cx="95" cy="100" r="4" fill="#D7CCC8" opacity="0.8"/><circle cx="110" cy="102" r="3" fill="#D7CCC8" opacity="0.8"/><text x="100" y="160" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">MWNU</text></svg>',
  MWNP: '<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="90" fill="#FF8A65" stroke="#E64A19" stroke-width="4"/><path d="M70 100 Q70 60 100 50 Q130 60 130 100 Q130 115 100 120 Q70 115 70 100Z" fill="#FFF9C4"/><path d="M75 95 Q100 70 125 95" fill="none" stroke="#FFE082" stroke-width="3"/><circle cx="85" cy="75" r="2" fill="white" opacity="0.9"/><circle cx="110" cy="70" r="2" fill="white" opacity="0.9"/><circle cx="100" cy="85" r="1.5" fill="white" opacity="0.9"/><text x="100" y="160" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">MWNP</text></svg>',
  MWTU: '<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="90" fill="#FFB300" stroke="#FF6F00" stroke-width="4"/><path d="M65 80 Q65 60 100 55 Q135 60 135 80 L130 115 Q100 125 70 115Z" fill="#FFF9C4" stroke="#F57F17" stroke-width="2"/><ellipse cx="100" cy="80" rx="32" ry="8" fill="#F57F17"/><circle cx="85" cy="85" r="10" fill="#D32F2F"/><circle cx="115" cy="85" r="10" fill="#D32F2F"/><circle cx="100" cy="95" r="8" fill="#D32F2F"/><text x="100" y="160" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">MWTU</text></svg>',
  MWTP: '<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="90" fill="#90A4AE" stroke="#607D8B" stroke-width="4"/><path d="M65 80 Q65 60 100 55 Q135 60 135 80 L130 115 Q100 125 70 115Z" fill="white" stroke="#CFD8DC" stroke-width="2"/><ellipse cx="100" cy="80" rx="32" ry="8" fill="#ECEFF1"/><ellipse cx="85" cy="85" rx="4" ry="2" fill="#B0BEC5" transform="rotate(30 85 85)"/><ellipse cx="110" cy="90" rx="4" ry="2" fill="#B0BEC5" transform="rotate(-20 110 90)"/><ellipse cx="95" cy="100" rx="3" ry="1.5" fill="#B0BEC5" transform="rotate(15 95 100)"/><text x="100" y="160" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">MWTP</text></svg>'
};
```

- [ ] **Step 4: Verify**

Open page, click through all 16 questions — verify each question text and options match FBTI_Questions.md exactly.

- [ ] **Step 5: Commit**

```bash
git add index.html && git commit -m "feat: embed all 16 questions, type descriptions and SVG avatars

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Quiz state machine — answer collection, scoring algorithm, navigation

**Files:**

- Modify: `index.html` (scoring logic in `<script>`)

**TDD_EVIDENCE:** Completing all 16 questions with known answers produces the correct type code. Test: Q1-4 all A → S; Q5 A, Q6 A, Q7 B, Q8 B → C (Q5 weight +0.5); Q9 A, Q10 A, Q11 A, Q12 A → N (score 4); Q13 A, Q14 A, Q15 A, Q16 A → U (score 4). Result should be SCNU.

- [ ] **Step 1: Add the scoring function and wire up `showResult()`**

Replace the placeholder `showResult()` function with:

```js
function calculateType(answers) {
  // Dimension 1: S/M (Q1-Q4, indices 0-3)
  // A=+1, D=+0.5, B/C=+0
  let sScore = 0;
  for (let i = 0; i < 4; i++) {
    if (answers[i] === 'A') sScore += 1;
    else if (answers[i] === 'D') sScore += 0.5;
  }
  const dim1 = sScore >= 2.5 ? 'S' : 'M';

  // Dimension 2: C/W (Q5-Q8, indices 4-7)
  // A/C=+1, B=-0.5 (Q5 weight), D=0
  let cScore = 0;
  for (let i = 4; i < 8; i++) {
    if (answers[i] === 'A' || answers[i] === 'C') cScore += 1;
    if (i === 4 && answers[i] === 'A') cScore += 0.5;  // Q5 weight
    if (i === 4 && answers[i] === 'B') cScore -= 0.5;
  }
  const dim2 = cScore >= 2.5 ? 'C' : 'W';

  // Dimension 3: N/T (Q9-Q12, indices 8-11)
  // A=+1, B=-1, C/D=0
  let nScore = 0;
  for (let i = 8; i < 12; i++) {
    if (answers[i] === 'A') nScore += 1;
    else if (answers[i] === 'B') nScore -= 1;
  }
  const dim3 = nScore >= 1 ? 'N' : 'T';

  // Dimension 4: U/P (Q13-Q16, indices 12-15)
  // A=+1, B=-1, C/D=0
  let uScore = 0;
  for (let i = 12; i < 16; i++) {
    if (answers[i] === 'A') uScore += 1;
    else if (answers[i] === 'B') uScore -= 1;
  }
  const dim4 = uScore >= 1 ? 'U' : 'P';

  return dim1 + dim2 + dim3 + dim4;
}

function showResult() {
  const typeCode = calculateType(answers);
  showScreen('result');
  renderResult(typeCode);
}
```

- [ ] **Step 2: Add `renderResult(typeCode)` stub (filled in Task 7)**

```js
function renderResult(typeCode) {
  // Stub — populated in Task 7
  const data = typeData[typeCode];
  if (!data) {
    showScreen('quiz');
    return;
  }
  document.getElementById('result-type-code').textContent = typeCode;
  document.getElementById('result-name').textContent = data.name;
  document.getElementById('result-tagline').textContent = data.tagline;
  document.getElementById('result-avatar').innerHTML = typeSVGs[typeCode] || '';
  // Push URL
  const url = new URL(window.location.href);
  url.searchParams.set('type', typeCode);
  window.history.pushState({ type: typeCode }, '', url.toString());
}
```

- [ ] **Step 3: Add `showScreen(name)` helper and initialize on page load**

```js
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(function(s) {
    s.classList.remove('active');
  });
  document.getElementById('screen-' + name).classList.add('active');
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  // Check URL for ?type=
  const urlParams = new URLSearchParams(window.location.search);
  const urlType = urlParams.get('type');
  if (urlType && typeData[urlType]) {
    // Show result directly
    showScreen('result');
    renderResult(urlType);
  } else {
    showScreen('welcome');
  }
});
```

- [ ] **Step 4: Verify the SCNU test case**

Manually test by calling `calculateType(['A','A','A','A','A','A','B','B','A','A','A','A','A','A','A','A'])` in browser console — expect `'SCNU'`.

- [ ] **Step 5: Commit**

```bash
git add index.html && git commit -m "feat: scoring algorithm and state machine

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Result screen — avatar, type code, name, tagline, share buttons

**Files:**

- Modify: `index.html` (result screen HTML + `renderResult` implementation)

**TDD_EVIDENCE:** Completing quiz shows result screen with correct avatar SVG, type code (e.g. "S C N U" with spaces), personality name, and tagline. Clicking "重新测试" returns to welcome screen.

- [ ] **Step 1: Fill `#screen-result` innerHTML**

```html
<section id="screen-result" class="screen">
  <div class="container" style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding-top:var(--space-16);padding-bottom:var(--space-16);">

    <!-- Avatar -->
    <div id="result-avatar" class="fade-in-up stagger-1" style="width:200px;height:200px;border-radius:50%;overflow:hidden;margin:0 auto var(--space-8);box-shadow:0 0 0 6px rgba(255,255,255,0.15);">
      <!-- SVG inserted by JS -->
    </div>

    <!-- Type code -->
    <div id="result-type-code" class="fade-in-up stagger-2" style="font-family:var(--font-heading);font-size:56px;font-weight:700;color:white;letter-spacing:8px;margin-bottom:var(--space-4);line-height:1;">
      S C N U
    </div>

    <!-- Personality name -->
    <div id="result-name" class="fade-in-up stagger-3" style="font-family:var(--font-display);font-size:28px;font-weight:600;font-style:italic;color:white;margin-bottom:var(--space-6);">
      烈焰暴君
    </div>

    <!-- Tagline -->
    <div id="result-tagline" class="fade-in-up stagger-4" style="font-family:var(--font-body);font-size:16px;color:rgba(255,255,255,0.8);max-width:480px;line-height:1.7;margin-bottom:var(--space-10);">
      此类型是人类味觉边疆的拓荒者…
    </div>

    <!-- Share buttons -->
    <div class="fade-in-up stagger-5" style="display:flex;gap:var(--space-4);width:100%;max-width:360px;margin-bottom:var(--space-4);">
      <button id="btn-copy-link" class="btn-primary" style="flex:1;">复制链接</button>
      <button id="btn-share-image" class="btn-primary" style="flex:1;">保存图片</button>
    </div>

    <!-- Retake button -->
    <div class="fade-in-up stagger-6" style="width:100%;max-width:360px;">
      <button id="btn-retake" class="btn-secondary" style="color:white;border-color:rgba(255,255,255,0.4);">重新测试</button>
    </div>

  </div>
</section>
```

- [ ] **Step 2: Add button event handlers in JS**

```js
document.getElementById('btn-copy-link').addEventListener('click', copyLink);
document.getElementById('btn-share-image').addEventListener('click', generateShareImage);
document.getElementById('btn-retake').addEventListener('click', retakeQuiz);

function copyLink() {
  navigator.clipboard.writeText(window.location.href).then(function() {
    showToast('链接已复制 ✓');
  }).catch(function() {
    showToast('复制失败，请长按复制');
  });
}

function retakeQuiz() {
  // Reset state
  currentQuestion = 0;
  answers = [];
  // Clear URL params
  window.history.pushState({}, '', window.location.pathname);
  showScreen('welcome');
}

function showToast(msg) {
  var toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('visible');
  setTimeout(function() { toast.classList.remove('visible'); }, 2000);
}
```

- [ ] **Step 3: Add toast element to body**

```html
<div id="toast" class="toast">链接已复制 ✓</div>
```

- [ ] **Step 4: Verify**

Complete quiz, verify result screen displays. Click "重新测试" — verify welcome appears and state resets.

- [ ] **Step 5: Commit**

```bash
git add index.html && git commit -m "feat: result screen with avatar, share buttons and retake

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 8: URL sharing — parse `?type=` on load, pushState on result, copy link

**Files:**

- Modify: `index.html` (URL parsing in DOMContentLoaded)

**TDD_EVIDENCE:** With `?type=SCNU` in URL, page loads directly to result screen showing SCNU result without quiz. Without `?type=`, shows welcome screen.

- [ ] **Step 1: Verify existing URL parsing in `DOMContentLoaded` works correctly**

The URL parsing logic was already added in Task 6 Step 3. Verify by:
1. Opening `index.html?type=MCTP` in browser — should show MCTP result directly
2. Opening `index.html` (no params) — should show welcome screen
3. Completing quiz and seeing URL update to `?type=XXXX` via pushState

- [ ] **Step 2: Commit (no code changes needed — already implemented in Task 6)**

```bash
git add index.html && git commit -m "feat: URL sharing via pushState and ?type= parsing

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 9: Image sharing — Canvas-based 900×1200 PNG with QR code (qrcode.js CDN)

**Files:**

- Modify: `index.html` (add qrcode.js CDN + `generateShareImage()` function)

**TDD_EVIDENCE:** Clicking "保存图片" downloads a 900×1200 PNG file named `fbti-SCnu.png`. The image contains: FBTI logo at top, circular SVG avatar, type code, name, tagline, QR code with `https://fbti.app/result?type=SCNU`.

- [ ] **Step 1: Add qrcode.js CDN to `<head>`**

```html
<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
```

- [ ] **Step 2: Add `generateShareImage()` function**

```js
async function generateShareImage() {
  var typeCode = calculateType(answers.length === 16 ? answers : (window.__fbti_last_type || 'SCNU'));
  if (!typeData[typeCode]) typeCode = 'SCNU';

  var data = typeData[typeCode];
  var W = 900, H = 1200;
  var canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  var ctx = canvas.getContext('2d');

  // 1. Background
  ctx.fillStyle = '#ECE9E0';
  ctx.fillRect(0, 0, W, H);

  // 2. Radial gradient overlay
  var grad = ctx.createRadialGradient(W * 0.2, H * 0.1, 0, W * 0.2, H * 0.1, W * 0.8);
  grad.addColorStop(0, 'rgba(217,119,87,0.08)');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 3. FBTI Logo (top center)
  var logoImg = new Image();
  logoImg.src = 'assets/FBTI_logo.svg';
  await new Promise(function(r) { logoImg.onload = r; });
  var logoW = 100, logoH = 100;
  ctx.drawImage(logoImg, (W - logoW) / 2, 60, logoW, logoH);

  // 4. SVG Avatar (circular clip)
  var avatarSVG = typeSVGs[typeCode];
  var avatarImg = new Image();
  avatarImg.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(avatarSVG)));
  await new Promise(function(r) { avatarImg.onload = r; });
  var avatarSize = 200;
  var avatarX = (W - avatarSize) / 2;
  var avatarY = 200;
  ctx.save();
  ctx.beginPath();
  ctx.arc(W / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
  ctx.restore();
  // Ring
  ctx.strokeStyle = 'rgba(20,20,19,0.15)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(W / 2, avatarY + avatarSize / 2, avatarSize / 2 + 3, 0, Math.PI * 2);
  ctx.stroke();

  // 5. Type code
  var spacedCode = typeCode.split('').join(' ');
  ctx.font = '700 64px Poppins, Arial, sans-serif';
  ctx.fillStyle = '#141413';
  ctx.textAlign = 'center';
  ctx.fillText(spacedCode, W / 2, avatarY + avatarSize + 80);

  // 6. Personality name
  ctx.font = 'italic 600 28px Lora, "Noto Serif SC", serif';
  ctx.fillStyle = '#141413';
  ctx.textAlign = 'center';
  ctx.fillText(data.name, W / 2, avatarY + avatarSize + 130);

  // 7. Tagline (word-wrap)
  ctx.font = '400 16px Lora, "Noto Serif SC", serif';
  ctx.fillStyle = '#6B6860';
  ctx.textAlign = 'center';
  var tagline = data.tagline;
  var maxWidth = W - 80;
  var lineHeight = 26;
  var lines = wrapText(ctx, tagline, maxWidth);
  var tagY = avatarY + avatarSize + 170;
  lines.forEach(function(line, i) {
    ctx.fillText(line, W / 2, tagY + i * lineHeight);
  });

  // 8. Decorative line
  ctx.strokeStyle = '#D97757';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 40, tagY + lines.length * lineHeight + 20);
  ctx.lineTo(W / 2 + 40, tagY + lines.length * lineHeight + 20);
  ctx.stroke();

  // 9. QR Code
  var qrUrl = 'https://fbti.app/result?type=' + typeCode;
  var qrCanvas = document.createElement('canvas');
  qrCanvas.width = 160; qrCanvas.height = 160;
  await new Promise(function(resolve) {
    QRCode.toCanvas(qrCanvas, qrUrl, { width: 160, margin: 1 }, function(err) {
      if (!err) resolve();
    });
  });
  var qrX = (W - 160) / 2;
  var qrY = H - 160 - 60;
  ctx.drawImage(qrCanvas, qrX, qrY, 160, 160);
  // QR label
  ctx.font = '400 12px Poppins, Arial, sans-serif';
  ctx.fillStyle = '#6B6860';
  ctx.textAlign = 'center';
  ctx.fillText('fbti.app/result', W / 2, qrY + 170);

  // 10. Download
  var link = document.createElement('a');
  link.download = 'fbti-' + typeCode.toLowerCase() + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('图片已保存 ✓');
}

function wrapText(ctx, text, maxWidth) {
  var words = text.split('');
  var lines = [];
  var current = '';
  for (var i = 0; i < words.length; i++) {
    var test = current + words[i];
    if (ctx.measureText(test).width > maxWidth && current.length > 0) {
      lines.push(current);
      current = words[i];
    } else {
      current = test;
    }
  }
  if (current.length > 0) lines.push(current);
  return lines;
}
```

- [ ] **Step 3: Handle case when answers are 16 but called after URL load**

Add at top of `generateShareImage`:
```js
if (answers.length !== 16) {
  var urlParams = new URLSearchParams(window.location.search);
  typeCode = urlParams.get('type') || 'SCNU';
} else {
  typeCode = calculateType(answers);
}
```

- [ ] **Step 4: Verify**

Open page, complete quiz or use `?type=SCNU`, click "保存图片" — confirm PNG downloads.

- [ ] **Step 5: Commit**

```bash
git add index.html && git commit -m "feat: Canvas-based share image with QR code

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 10: Integration + browser testing

**Files:**

- Modify: `index.html` (final integration pass)

**TDD_EVIDENCE:** All three flows work: (1) Welcome → Quiz → Result for all 16 types. (2) Direct URL `?type=XXXX` loads correct result. (3) "保存图片" downloads valid PNG. No console errors on any flow.

- [ ] **Step 1: Add `<meta>` and favicon to `<head>`**

```html
<meta name="description" content="16道情景题，发现你的味觉人格。TasteType 口味人格测试。">
<meta property="og:title" content="口味人格测试 · TasteType">
<meta property="og:description" content="16道情景题，发现你的味觉人格。">
<meta property="og:type" content="website">
<link rel="icon" href="assets/FBTI_logo.svg" type="image/svg+xml">
```

- [ ] **Step 2: Final verification checklist**

Run through each of these manually:

1. **Welcome screen** — loads with logo, title, tagline, orange CTA button
2. **Q1 renders correctly** — first question from FBTI_Questions.md with 4 options
3. **Clicking option advances** — smooth transition to Q2, progress bar updates
4. **All 16 questions** — complete flow, no crashes
5. **Result screen** — shows correct avatar, code, name, tagline
6. **URL updates** — after result, URL has `?type=XXXX`
7. **Direct URL** — open `index.html?type=MCTP` directly → result page without quiz
8. **Copy link** — "复制链接" shows toast and copies URL
9. **Save image** — "保存图片" downloads PNG with QR code
10. **重新测试** — returns to welcome, clears state
11. **Invalid type in URL** — `?type=XXXX` (invalid) → fallback to welcome screen
12. **Responsive 375px** — iPhone SE: content readable, no overflow

- [ ] **Step 3: Fix any issues found**

Address any problems found during verification.

- [ ] **Step 4: Final commit**

```bash
git add index.html && git commit -m "feat: complete FBTI quiz app - all flows verified

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```
