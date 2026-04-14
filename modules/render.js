/**
 * modules/render.js
 * Render engine for TasteType 3.1
 */

import { encodeDimensionResults } from './scoring.js';

// ---- Dimension configuration ----

const DIMENSION_ORDER = ['stimulus', 'taste', 'philosophy', 'novelty'];

const DIMENSION_LABELS = {
  stimulus: '第一维度 · 刺激偏好',
  taste: '第二维度 · 核心味觉引力',
  philosophy: '第三维度 · 风味构建哲学',
  novelty: '第四维度 · 新奇探索指数',
};

export const CODE_COLORS = {
  H: '#E07B54', N: '#C4A4D4', C: '#8BBF8B', M: '#9EB8D0',
  U: '#E07B54', S: '#C4A4D4', W: '#8BBF8B', B: '#9EB8D0',
  O: '#F0C87A', A: '#E07B54', E: '#E07B54',
};

const CODE_LABELS = {
  H: '灼烧', N: '麻感', C: '清凉', M: '温和',
  U: '鲜味', S: '咸味', W: '甜味', B: '苦醇', O: '酸味',
};

const CODE_LABELS_PHILOSOPHY = {
  A: '加法烹饪',
  S: '减法烹饪',
};

const CODE_LABELS_NOVELTY = {
  E: '探索者',
  C: '经典派',
};

export function getCodeLabel(code, dimension) {
  if (dimension === 'philosophy') return CODE_LABELS_PHILOSOPHY[code] || '';
  if (dimension === 'novelty') return CODE_LABELS_NOVELTY[code] || '';
  return CODE_LABELS[code] || '';
}

// ---- escapeHtml utility ----

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---- buildSubCode ----

export function buildSubCode(dimensionResults) {
  const segments = DIMENSION_ORDER.map(dim => {
    const dr = dimensionResults[dim];
    if (!dr) return 'X';
    const dominant = dr.dominant || 'X';
    const secondary = dr.secondary || '';
    return dominant.toUpperCase() + secondary.toLowerCase();
  });
  return segments.join('-');
}

// ---- renderRadarChart ----

// All 13 letter codes in display order (clockwise from top), each with its dimension
const RADAR_CODES = [
  { code: 'H', dim: 'stimulus' },
  { code: 'N', dim: 'stimulus' },
  { code: 'C', dim: 'stimulus' },
  { code: 'M', dim: 'stimulus' },
  { code: 'U', dim: 'taste' },
  { code: 'S', dim: 'taste' },
  { code: 'W', dim: 'taste' },
  { code: 'B', dim: 'taste' },
  { code: 'O', dim: 'taste' },
  { code: 'A', dim: 'philosophy' },
  { code: 'S', dim: 'philosophy' },   // 减法烹饪
  { code: 'E', dim: 'novelty' },
  { code: 'C', dim: 'novelty' },       // 经典派
];
const RADAR_N = RADAR_CODES.length; // 13

export function renderRadarChart(dimensionResults) {
  const size = 380;
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = 120;
  const labelR = maxRadius + 28;

  // Evenly space 13 axes clockwise, starting from top (-PI/2)
  const angles = RADAR_CODES.map((_, i) => (i * 2 * Math.PI / RADAR_N) - Math.PI / 2);

  // Grid rings at 25%, 50%, 75%, 100%
  let gridRings = '';
  for (let pct = 25; pct <= 100; pct += 25) {
    const r = maxRadius * pct / 100;
    const points = angles.map(a => `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`).join(' ');
    gridRings += `<polygon points="${points}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="0.5"/>`;
  }

  // Axis lines
  let axisLines = '';
  let axisLabels = '';
  RADAR_CODES.forEach(({ code, dim }, i) => {
    const a = angles[i];
    const ex = cx + maxRadius * Math.cos(a);
    const ey = cy + maxRadius * Math.sin(a);
    axisLines += `<line x1="${cx.toFixed(2)}" y1="${cy.toFixed(2)}" x2="${ex.toFixed(2)}" y2="${ey.toFixed(2)}" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>`;

    // Label with code + meaning, e.g. H(灼烧)
    const label = getCodeLabel(code, dim);
    const displayText = `${code}(${label})`;
    const lx = cx + labelR * Math.cos(a);
    const ly = cy + labelR * Math.sin(a);
    // Anchor text based on angle quadrant
    const anchor = Math.cos(a) > 0.1 ? 'start' : Math.cos(a) < -0.1 ? 'end' : 'middle';
    const dx = anchor === 'start' ? 4 : anchor === 'end' ? -4 : 0;
    const color = CODE_COLORS[code] || 'rgba(255,255,255,0.55)';
    axisLabels += `<text x="${(lx + dx).toFixed(2)}" y="${ly.toFixed(2)}" text-anchor="${anchor}" dominant-baseline="middle" font-size="9" fill="${color}">${escapeHtml(displayText)}</text>`;
  });

  // Data polygon: plot each code's percentage (normalized within dimension)
  const dataPoints = RADAR_CODES.map(({ code, dim }, i) => {
    const dr = dimensionResults[dim];
    const pct = dr ? (dr.percentages[code] || 0) : 0;
    const r = maxRadius * Math.max(0, Math.min(100, pct)) / 100;
    return `${(cx + r * Math.cos(angles[i])).toFixed(2)},${(cy + r * Math.sin(angles[i])).toFixed(2)}`;
  });

  const dataPolygon = `<polygon points="${dataPoints.join(' ')}" fill="rgba(224,123,84,0.25)" stroke="#E07B54" stroke-width="1.5"/>`;

  // Data point dots
  let dataDots = '';
  RADAR_CODES.forEach(({ code, dim }, i) => {
    const dr = dimensionResults[dim];
    const pct = dr ? (dr.percentages[code] || 0) : 0;
    const r = maxRadius * Math.max(0, Math.min(100, pct)) / 100;
    const dx = cx + r * Math.cos(angles[i]);
    const dy = cy + r * Math.sin(angles[i]);
    dataDots += `<circle cx="${dx.toFixed(2)}" cy="${dy.toFixed(2)}" r="2.5" fill="#E07B54"/>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">` +
    gridRings +
    axisLines +
    dataPolygon +
    dataDots +
    axisLabels +
    `</svg>`;
}

// ---- renderStackedBars ----

export function renderStackedBars(dimensionResults) {
  let html = '<div class="stacked-bars">';

  DIMENSION_ORDER.forEach(dim => {
    const dr = dimensionResults[dim];
    if (!dr) return;

    const dimLabel = DIMENSION_LABELS[dim];
    html += `<div class="dimension-bar">`;
    html += `<div class="dimension-title">${dimLabel}</div>`;

    // Stacked bar
    html += `<div class="bar-track" style="display:flex;height:24px;border-radius:4px;overflow:hidden;margin:6px 0;">`;
    const sortedCodes = Object.entries(dr.percentages).sort((a, b) => b[1] - a[1]).map(e => e[0]);
    sortedCodes.forEach(code => {
      const pct = Math.round(dr.percentages[code]);
      const color = CODE_COLORS[code] || '#ccc';
      html += `<div style="width:${pct}%;background:${color};min-width:0;" title="${escapeHtml(code)}: ${pct}%"></div>`;
    });
    html += `</div>`;

    // Legend rows
    html += `<div class="bar-legend" style="display:flex;flex-wrap:wrap;gap:8px;font-size:12px;">`;
    sortedCodes.forEach(code => {
      const pct = Math.round(dr.percentages[code]);
      const color = CODE_COLORS[code] || '#ccc';
      const label = getCodeLabel(code, dim);
      html += `<span style="display:inline-flex;align-items:center;gap:3px;">` +
        `<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${color};"></span>` +
        `${escapeHtml(code)}(${escapeHtml(label)}) ${pct}%</span>`;
    });
    html += `</div>`;

    html += `</div>`;
  });

  html += '</div>';
  return html;
}

// ---- renderDetailsPanel ----

export function renderDetailsPanel(dimensionResults) {
  const radarSvg = renderRadarChart(dimensionResults);
  const barsHtml = renderStackedBars(dimensionResults);

  return `<div class="details-panel">` +
    `<div class="radar-section">${radarSvg}</div>` +
    `<div class="bars-section">${barsHtml}</div>` +
    `</div>`;
}

// ---- renderQuestion (unchanged) ----

export function renderQuestion(question, questionIndex, totalQuestions) {
  // Update progress bar and label
  const progressFill = document.getElementById('progress-fill');
  const progressLabel = document.getElementById('progress-label');
  const questionText = document.getElementById('question-text');
  const optionsEl = document.getElementById('quiz-options');

  if (progressFill) {
    progressFill.style.width = (questionIndex / totalQuestions * 100) + '%';
  }
  if (progressLabel) {
    progressLabel.textContent = (questionIndex + 1) + ' / ' + totalQuestions;
  }
  if (questionText) {
    questionText.textContent = question.text;
  }

  // Render options into #quiz-options
  if (optionsEl) {
    optionsEl.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];
    question.options.forEach((opt, i) => {
      const card = document.createElement('div');
      card.className = 'option-card fade-in-up';
      card.style.animationDelay = (i * 80) + 'ms';

      const letterSpan = document.createElement('span');
      letterSpan.className = 'option-letter';
      letterSpan.textContent = letters[i] + '.';

      const textSpan = document.createElement('span');
      textSpan.className = 'option-text';
      // Support both old (string) and new ({label, text, value}) option formats
      textSpan.textContent = opt.text || opt;

      card.appendChild(letterSpan);
      card.appendChild(textSpan);
      // Handler is set by caller via returned card elements
      optionsEl.appendChild(card);
    });
  }
}

// ---- renderResult (3-param, backward-compatible) ----

export function renderResult(typeCode, typeData, dimensionResults) {
  const typeEl = document.getElementById('result-type-code');
  const subCodeEl = document.getElementById('result-type-code-sub');
  const nameEl = document.getElementById('result-name');
  const selfDescEl = document.getElementById('result-self-description');
  const tasteSigEl = document.getElementById('result-taste-signature');
  const analysisEl = document.getElementById('result-analysis');
  const avatarEl = document.getElementById('result-avatar');
  const detailsEl = document.getElementById('details-panel');

  if (typeEl) typeEl.textContent = typeCode;

  if (subCodeEl && dimensionResults) {
    subCodeEl.textContent = buildSubCode(dimensionResults);
  } else if (subCodeEl) {
    subCodeEl.textContent = '';
  }

  if (nameEl) nameEl.textContent = typeData.name;

  if (selfDescEl && typeData.selfDescription) {
    selfDescEl.textContent = '\u201C' + typeData.selfDescription + '\u201D';
  } else if (selfDescEl) {
    selfDescEl.textContent = '';
  }

  if (tasteSigEl && typeData.tasteSignature) {
    tasteSigEl.innerHTML = '';
    typeData.tasteSignature.forEach(tag => {
      const span = document.createElement('span');
      span.className = 'taste-tag';
      span.textContent = tag;
      tasteSigEl.appendChild(span);
    });
  } else if (tasteSigEl) {
    tasteSigEl.innerHTML = '';
  }

  // Secondary tags: lowercase letters from sub-code (e.g., h, s, c)
  const secondaryEl = document.getElementById('result-taste-signature-secondary');
  if (secondaryEl && dimensionResults) {
    secondaryEl.innerHTML = '';
    DIMENSION_ORDER.forEach(dim => {
      const dr = dimensionResults[dim];
      if (!dr || !dr.secondary) return;
      const secCode = dr.secondary.toLowerCase();
      const secLabel = getCodeLabel(dr.secondary, dim);
      const span = document.createElement('span');
      span.className = 'taste-tag-secondary';
      span.textContent = `${secCode} · ${secLabel}`;
      secondaryEl.appendChild(span);
    });
  } else if (secondaryEl) {
    secondaryEl.innerHTML = '';
  }

  if (analysisEl && typeData.analysis) {
    analysisEl.textContent = typeData.analysis;
  } else if (analysisEl) {
    analysisEl.textContent = '';
  }

  if (avatarEl) {
    avatarEl.innerHTML = '';
    // Try svg, png, jpg — load first that exists, draw placeholder if all fail
    const exts = ['svg', 'png', 'jpg'];
    let loaded = false;
    const img = document.createElement('img');
    img.alt = typeData.name;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    (async function() {
      for (const ext of exts) {
        const path = './assets/' + typeCode + '.' + ext;
        try {
          if (ext === 'svg') {
            const r = await fetch(path);
            if (!r.ok) continue;
            const svgText = await r.text();
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgText)));
          } else {
            img.src = path;
          }
          await new Promise(function(res, rej) {
            const t = setTimeout(function() { rej(new Error('timeout')); }, 2000);
            img.onload = function() { clearTimeout(t); loaded = true; res(); };
            img.onerror = function() { clearTimeout(t); rej(new Error('load error')); };
          });
          // success
          avatarEl.appendChild(img);
          return;
        } catch(e) {}
      }
      // All failed: draw colored circle with type code letter as placeholder
      const size = 80;
      const cav = document.createElement('canvas');
      cav.width = size;
      cav.height = size;
      cav.style.width = '100%';
      cav.style.height = '100%';
      const cx = cav.getContext('2d');
      cx.fillStyle = '#D97757';
      cx.beginPath();
      cx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      cx.fill();
      cx.fillStyle = 'white';
      cx.font = 'bold 40px Poppins, Arial, sans-serif';
      cx.textAlign = 'center';
      cx.textBaseline = 'middle';
      cx.fillText(typeCode[0] || '?', size / 2, size / 2);
      avatarEl.appendChild(cav);
    })();
  }

  if (detailsEl && dimensionResults) {
    detailsEl.innerHTML = renderDetailsPanel(dimensionResults);
  } else if (detailsEl) {
    detailsEl.innerHTML = '';
  }

  // Push URL state
  const url = new URL(window.location.href);
  url.searchParams.set('type', typeCode);
  if (dimensionResults) {
    url.searchParams.set('data', encodeDimensionResults(dimensionResults));
  } else {
    url.searchParams.delete('data');
  }
  window.history.pushState({ type: typeCode }, '', url.toString());
}

// ---- loadTypeImage ----
// Tries svg, png, jpg in order and returns the first one found
export function loadTypeImage(typeCode) {
  const exts = ['svg', 'png', 'jpg'];
  for (const ext of exts) {
    const path = `./assets/${typeCode}.${ext}`;
    // Return path without checking existence — caller should load and handle 404
    return path;
  }
}

// Kept for backward compatibility
export function loadTypeSVG(typeCode) {
  return loadTypeImage(typeCode);
}

// ---- drawRadarToCanvas ----
// Draws radar chart directly onto a canvas 2D context (used for share image generation)
export function renderRestaurantSection(container, typeCode, restaurants) {
  if (!restaurants || restaurants.length === 0) return;

  const section = document.createElement('div');
  section.className = 'restaurant-section';

  const header = document.createElement('div');
  header.className = 'restaurant-section-header';
  header.innerHTML = `
    <div class="restaurant-section-title">
      <svg class="restaurant-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;opacity:0.8;color:rgba(255,255,255,0.9)">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
        <path d="M7 2v20"/>
        <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
      </svg>
      推荐餐厅
    </div>
    <span class="restaurant-count">${restaurants.length} / ${window.restaurantMaxPerType || 5}</span>
  `;
  section.appendChild(header);

  const list = document.createElement('div');
  list.className = 'restaurant-list';
  restaurants.forEach(r => {
    const item = document.createElement('div');
    item.className = 'restaurant-item';
    item.innerHTML = `
      <div class="restaurant-dot" style="width:6px;height:6px;border-radius:50%;background:#D97757;flex-shrink:0;"></div>
      <span class="restaurant-name" style="flex:1;font-family:var(--font-heading);font-size:14px;font-weight:500;color:white;">${escapeHtml(r.name)}</span>
      <span class="restaurant-meta" style="font-family:var(--font-heading);font-size:12px;color:rgba(255,255,255,0.4);">by ${escapeHtml(r.by || '匿名用户')}</span>
    `;
    list.appendChild(item);
  });
  section.appendChild(list);

  // Submit button or limit message
  const btnWrap = document.createElement('div');
  const max = window.restaurantMaxPerType || 5;
  if (restaurants.length >= max) {
    btnWrap.innerHTML = `<div class="at-limit-msg" style="font-family:var(--font-heading);font-size:12px;color:rgba(255,255,255,0.35);text-align:center;padding:8px;">该人格已有 ${max} 条推荐上限，不再接受新的推荐</div>`;
  } else {
    const btn = document.createElement('button');
    btn.className = 'btn-add-restaurant';
    btn.style.cssText = 'width:100%;background:rgba(217,119,87,0.15);color:#D97757;border:1px dashed rgba(217,119,87,0.4);border-radius:10px;padding:10px;font-family:var(--font-heading);font-size:13px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:background 150ms,border-color 150ms;';
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 添加推荐`;
    btn.addEventListener('click', () => openRestaurantModal(typeCode));
    btnWrap.appendChild(btn);
  }
  section.appendChild(btnWrap);
  container.appendChild(section);
}

export function drawRadarToCanvas(ctx, dimensionResults, cx, cy, size) {
  const maxRadius = size * 0.32;
  const labelR = maxRadius + size * 0.075;
  const RADAR_N = RADAR_CODES.length;

  // Evenly space 13 axes clockwise, starting from top (-PI/2)
  const angles = RADAR_CODES.map((_, i) => (i * 2 * Math.PI / RADAR_N) - Math.PI / 2);

  // Grid rings at 25%, 50%, 75%, 100%
  for (let pct = 25; pct <= 100; pct += 25) {
    const r = maxRadius * pct / 100;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(20,20,19,0.20)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // Axis lines + labels
  RADAR_CODES.forEach(({ code, dim }, i) => {
    const a = angles[i];
    const ex = cx + maxRadius * Math.cos(a);
    const ey = cy + maxRadius * Math.sin(a);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = 'rgba(20,20,19,0.20)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    const label = getCodeLabel(code, dim);
    const displayText = code + '(' + label + ')';
    const lx = cx + labelR * Math.cos(a);
    const ly = cy + labelR * Math.sin(a);
    const anchor = Math.cos(a) > 0.1 ? 'left' : Math.cos(a) < -0.1 ? 'right' : 'center';
    ctx.font = 'bold ' + (size * 0.024) + 'px Poppins, Arial, sans-serif';
    ctx.fillStyle = 'rgba(20,20,19,0.75)';
    ctx.textAlign = anchor;
    ctx.textBaseline = 'middle';
    const dx = anchor === 'left' ? 3 : anchor === 'right' ? -3 : 0;
    ctx.fillText(displayText, lx + dx, ly);
  });

  // Data polygon
  const dataPoints = RADAR_CODES.map(({ code, dim }, i) => {
    const dr = dimensionResults[dim];
    const pct = dr ? (dr.percentages[code] || 0) : 0;
    const r = maxRadius * Math.max(0, Math.min(100, pct)) / 100;
    return [cx + r * Math.cos(angles[i]), cy + r * Math.sin(angles[i])];
  });

  ctx.beginPath();
  dataPoints.forEach((p, i) => i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]));
  ctx.closePath();
  ctx.fillStyle = 'rgba(224,123,84,0.25)';
  ctx.fill();
  ctx.strokeStyle = '#D97757';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Data point dots
  dataPoints.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p[0], p[1], 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#D97757';
    ctx.fill();
  });
}
