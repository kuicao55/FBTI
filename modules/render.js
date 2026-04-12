/**
 * modules/render.js
 * Render engine for TasteType 3.1
 */

// ---- Dimension configuration ----

const DIMENSION_ORDER = ['stimulus', 'taste', 'philosophy', 'novelty'];

const DIMENSION_LABELS = {
  stimulus: '第一维度 · 刺激偏好',
  taste: '第二维度 · 核心味觉引力',
  philosophy: '第三维度 · 风味构建哲学',
  novelty: '第四维度 · 新奇探索指数',
};

const CODE_COLORS = {
  H: '#E07B54', N: '#C4A4D4', C: '#8BBF8B', M: '#9EB8D0',
  U: '#E07B54', S: '#C4A4D4', W: '#8BBF8B', B: '#9EB8D0',
  O: '#F0C87A', A: '#E07B54', E: '#E07B54',
};

// Code labels differ by dimension context for S and C
const CODE_LABELS = {
  H: '灼烧', N: '麻感', C: '清凉', M: '温和',
  U: '鲜味', S: '咸味', W: '甜味', B: '苦醇',
  O: '酸味', A: '加法烹饪', E: '探索者',
};

// Philosophy-specific S label
const CODE_LABELS_PHILOSOPHY = {
  A: '加法烹饪', S: '咸味哲学',
};

// Novelty-specific C label
const CODE_LABELS_NOVELTY = {
  E: '探索者', C: '经典派',
};

function getCodeLabel(code, dimension) {
  if (dimension === 'philosophy' && CODE_LABELS_PHILOSOPHY[code]) {
    return CODE_LABELS_PHILOSOPHY[code];
  }
  if (dimension === 'novelty' && CODE_LABELS_NOVELTY[code]) {
    return CODE_LABELS_NOVELTY[code];
  }
  return CODE_LABELS[code] || code;
}

// ---- escapeHtml utility (Issue 2) ----

export function escapeHtml(str) {
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

export function renderRadarChart(dimensionResults) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = 120;
  const dims = DIMENSION_ORDER;
  const n = dims.length;

  // Axis angles: top, right, bottom, left (0, 90, 180, 270 degrees)
  // Starting from top (north), going clockwise
  const angles = dims.map((_, i) => (i * 2 * Math.PI / n) - Math.PI / 2);

  // Grid rings at 25%, 50%, 75%, 100%
  let gridRings = '';
  for (let pct = 25; pct <= 100; pct += 25) {
    const r = maxRadius * pct / 100;
    const points = angles.map(a => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`).join(' ');
    gridRings += `<polygon points="${points}" fill="none" stroke="#e0e0e0" stroke-width="0.5"/>`;
  }

  // Axis lines
  let axisLines = '';
  let axisLabels = '';
  const radarLabels = ['刺激', '味觉', '哲学', '新奇'];
  angles.forEach((a, i) => {
    const ex = cx + maxRadius * Math.cos(a);
    const ey = cy + maxRadius * Math.sin(a);
    axisLines += `<line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="#ccc" stroke-width="0.5"/>`;
    // Label position slightly beyond the axis endpoint
    const labelR = maxRadius + 20;
    const lx = cx + labelR * Math.cos(a);
    const ly = cy + labelR * Math.sin(a);
    axisLabels += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#666">${radarLabels[i]}</text>`;
  });

  // Data polygon: plot dominant percentage on each axis
  const dataPoints = dims.map((dim, i) => {
    const dr = dimensionResults[dim];
    const rawPct = dr ? (dr.percentages[dr.dominant] || 0) : 0;
    const pct = Math.max(0, Math.min(100, rawPct));
    const r = maxRadius * pct / 100;
    return `${cx + r * Math.cos(angles[i])},${cy + r * Math.sin(angles[i])}`;
  }).join(' ');

  const dataPolygon = `<polygon points="${dataPoints}" fill="rgba(224,123,84,0.25)" stroke="#E07B54" stroke-width="2"/>`;

  // Data point dots
  let dataDots = '';
  dims.forEach((dim, i) => {
    const dr = dimensionResults[dim];
    const rawPct = dr ? (dr.percentages[dr.dominant] || 0) : 0;
    const pct = Math.max(0, Math.min(100, rawPct));
    const r = maxRadius * pct / 100;
    const dx = cx + r * Math.cos(angles[i]);
    const dy = cy + r * Math.sin(angles[i]);
    dataDots += `<circle cx="${dx}" cy="${dy}" r="3" fill="#E07B54"/>`;
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
    const codes = Object.keys(dr.percentages);
    codes.forEach(code => {
      const pct = dr.percentages[code];
      const color = CODE_COLORS[code] || '#ccc';
      html += `<div style="width:${pct}%;background:${color};min-width:0;" title="${escapeHtml(code)}: ${pct}%"></div>`;
    });
    html += `</div>`;

    // Legend rows
    html += `<div class="bar-legend" style="display:flex;flex-wrap:wrap;gap:8px;font-size:12px;">`;
    codes.forEach(code => {
      const pct = dr.percentages[code];
      const color = CODE_COLORS[code] || '#ccc';
      const label = getCodeLabel(code, dim);
      html += `<span style="display:inline-flex;align-items:center;gap:3px;">` +
        `<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${color};"></span>` +
        `${escapeHtml(label)} ${pct}%</span>`;
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

  if (analysisEl && typeData.analysis) {
    analysisEl.textContent = typeData.analysis;
  } else if (analysisEl) {
    analysisEl.textContent = '';
  }

  if (avatarEl) {
    const img = document.createElement('img');
    img.src = loadTypeSVG(typeCode);
    img.alt = typeData.name;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    avatarEl.innerHTML = '';
    avatarEl.appendChild(img);
  }

  if (detailsEl && dimensionResults) {
    detailsEl.innerHTML = renderDetailsPanel(dimensionResults);
  } else if (detailsEl) {
    detailsEl.innerHTML = '';
  }

  // Push URL state
  const url = new URL(window.location.href);
  url.searchParams.set('type', typeCode);
  window.history.pushState({ type: typeCode }, '', url.toString());
}

// ---- loadTypeSVG (unchanged) ----

export function loadTypeSVG(typeCode) {
  return `./assets/${typeCode}.svg`;
}
