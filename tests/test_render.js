/**
 * tests/test_render.js
 * TDD tests for modules/render.js (TasteType 3.1)
 *
 * Uses Node.js built-in test runner (node --test).
 * Mocks DOM APIs since render.js interacts with the DOM.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// ---- DOM Mock ----
// render.js uses document.getElementById and other DOM APIs.
// We mock them before importing the module.

const mockElements = {};

function createMockElement(id) {
  const el = {
    id,
    textContent: '',
    innerHTML: '',
    style: {},
    classList: {
      _classes: [],
      add(...c) { this._classes.push(...c); },
      remove(...c) { this._classes = this._classes.filter(x => !c.includes(x)); },
    },
    children: [],
    appendChild(child) { this.children.push(child); },
    setAttribute(k, v) { this[k] = v; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {},
  };
  mockElements[id] = el;
  return el;
}

/**
 * Pre-register a set of IDs that should auto-create elements on access.
 * This allows renderResult etc. to work in tests. Unknown IDs return null.
 */
function registerMockIds(...ids) {
  ids.forEach(id => { if (!mockElements[id]) createMockElement(id); });
}

// Set up global mocks before import
const globalDocument = {
  getElementById(id) {
    // Issue 5 fix: return null for unknown IDs instead of auto-creating
    return mockElements[id] || null;
  },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  createElement(tag) {
    return {
      tagName: tag.toUpperCase(),
      textContent: '',
      innerHTML: '',
      style: {},
      classList: { _classes: [], add() {}, remove() {} },
      children: [],
      appendChild(child) { this.children.push(child); },
      setAttribute() {},
      addEventListener() {},
    };
  },
};

const globalWindow = {
  history: { pushState() {} },
  location: { href: 'https://fbti.app/result', origin: 'https://fbti.app' },
};

globalThis.document = globalDocument;
globalThis.window = globalWindow;

// Now import the module under test
import {
  renderQuestion,
  renderResult,
  loadTypeSVG,
  buildSubCode,
  renderRadarChart,
  renderStackedBars,
  renderDetailsPanel,
} from '../modules/render.js';

// ---- Test fixtures ----

const sampleDimensionResults = {
  stimulus: { dominant: 'H', secondary: 'n', percentages: { H: 40, N: 30, C: 20, M: 10 } },
  taste: { dominant: 'U', secondary: null, percentages: { U: 30, S: 25, W: 20, B: 15, O: 10 } },
  philosophy: { dominant: 'A', secondary: null, percentages: { A: 60, S: 40 } },
  novelty: { dominant: 'E', secondary: null, percentages: { E: 55, C: 45 } },
};

const sampleDimensionResults2 = {
  stimulus: { dominant: 'C', secondary: 'm', percentages: { H: 10, N: 15, C: 45, M: 30 } },
  taste: { dominant: 'W', secondary: 's', percentages: { U: 10, S: 25, W: 35, B: 20, O: 10 } },
  philosophy: { dominant: 'S', secondary: null, percentages: { A: 40, S: 60 } },
  novelty: { dominant: 'C', secondary: null, percentages: { E: 40, C: 60 } },
};

const sampleTypeData = {
  name: '山野炼金士',
  selfDescription: '辣是明火，鲜是底蕴。',
  tasteSignature: ['H(灼烧)', 'U(鲜味)', 'A(加法烹饪)', 'E(探索者)'],
  analysis: '此类型是饮食界的"时间旅行者"。',
};

// ---------- buildSubCode ----------

describe('buildSubCode', () => {
  it('builds sub-code "Hn-cE" for sample results with one secondary', () => {
    const result = buildSubCode(sampleDimensionResults);
    // stimulus: H+n -> "Hn", taste: U+null -> "U", philosophy: A+null -> "A", novelty: E+null -> "E"
    // Wait - the spec says dominant uppercase + secondary lowercase, join with "-"
    // With stimulus having secondary 'n': "Hn-U-A-E"
    // Actually re-reading: "for each dimension, dominant (uppercase) + secondary (lowercase if present), then join with '-'"
    assert.ok(result.includes('Hn'), 'should contain Hn for stimulus dominant+secondary');
    assert.ok(result.includes('-'), 'should contain hyphens between dimensions');
  });

  it('produces 4 segments separated by hyphens', () => {
    const result = buildSubCode(sampleDimensionResults);
    const segments = result.split('-');
    assert.equal(segments.length, 4, 'should have 4 dimension segments');
  });

  it('uses uppercase for dominant and lowercase for secondary', () => {
    const result = buildSubCode(sampleDimensionResults);
    const segments = result.split('-');
    // stimulus: H + n = "Hn"
    assert.equal(segments[0], 'Hn', 'stimulus segment should be Hn');
    // taste: U + null = "U"
    assert.equal(segments[1], 'U', 'taste segment should be U');
    // philosophy: A (dominant) + null = "A"
    assert.equal(segments[2], 'A', 'philosophy segment should be A');
    // novelty: E (dominant) + null = "E"
    assert.equal(segments[3], 'E', 'novelty segment should be E');
  });

  it('handles multiple secondaries', () => {
    const result = buildSubCode(sampleDimensionResults2);
    const segments = result.split('-');
    assert.equal(segments[0], 'Cm', 'stimulus: C dominant + m secondary');
    assert.equal(segments[1], 'Ws', 'taste: W dominant + s secondary');
    assert.equal(segments[2], 'S', 'philosophy: S dominant + no secondary');
    assert.equal(segments[3], 'C', 'novelty: C dominant + no secondary');
  });

  it('handles dimension with no secondary', () => {
    const noSecondary = {
      stimulus: { dominant: 'N', secondary: null, percentages: { H: 10, N: 60, C: 20, M: 10 } },
      taste: { dominant: 'B', secondary: null, percentages: { U: 10, S: 15, W: 20, B: 40, O: 15 } },
      philosophy: { dominant: 'A', secondary: null, percentages: { A: 70, S: 30 } },
      novelty: { dominant: 'E', secondary: null, percentages: { E: 80, C: 20 } },
    };
    const result = buildSubCode(noSecondary);
    const segments = result.split('-');
    assert.equal(segments[0], 'N');
    assert.equal(segments[1], 'B');
    assert.equal(segments[2], 'A');
    assert.equal(segments[3], 'E');
  });
});

// ---------- renderRadarChart ----------

describe('renderRadarChart', () => {
  it('returns an SVG string', () => {
    const svg = renderRadarChart(sampleDimensionResults);
    assert.ok(svg.startsWith('<svg'), 'should start with <svg tag');
    assert.ok(svg.includes('</svg>'), 'should end with </svg>');
  });

  it('has viewBox for 380x380', () => {
    const svg = renderRadarChart(sampleDimensionResults);
    assert.ok(svg.includes('viewBox'), 'should have viewBox attribute');
    assert.match(svg, /380.*380/, 'viewBox should reference 380x380');
  });

  it('contains a polygon for the data area', () => {
    const svg = renderRadarChart(sampleDimensionResults);
    assert.ok(svg.includes('<polygon'), 'should contain polygon element');
  });

  it('contains axis lines for 4 dimensions', () => {
    const svg = renderRadarChart(sampleDimensionResults);
    // Should have 4 axis lines (one per dimension)
    const lineMatches = svg.match(/<line /g);
    assert.ok(lineMatches && lineMatches.length >= 4, 'should have at least 4 axis lines');
  });

  it('contains labels for all 4 dimensions', () => {
    const svg = renderRadarChart(sampleDimensionResults);
    assert.ok(svg.includes('text'), 'should contain text elements for labels');
  });

  it('maps dominant percentages to axis positions', () => {
    const svg = renderRadarChart(sampleDimensionResults);
    // The polygon points should reflect the dominant percentages
    assert.ok(svg.includes('points='), 'polygon should have points attribute');
  });
});

// ---------- renderStackedBars ----------

describe('renderStackedBars', () => {
  it('returns HTML string', () => {
    const html = renderStackedBars(sampleDimensionResults);
    assert.equal(typeof html, 'string');
    assert.ok(html.length > 0, 'should produce non-empty HTML');
  });

  it('renders all 4 dimensions', () => {
    const html = renderStackedBars(sampleDimensionResults);
    assert.ok(html.includes('刺激偏好'), 'should include stimulus dimension label');
    assert.ok(html.includes('核心味觉引力'), 'should include taste dimension label');
    assert.ok(html.includes('风味构建哲学'), 'should include philosophy dimension label');
    assert.ok(html.includes('新奇探索指数'), 'should include novelty dimension label');
  });

  it('renders stimulus dimension with H, N, C, M codes', () => {
    const html = renderStackedBars(sampleDimensionResults);
    assert.ok(html.includes('灼烧'), 'should include H label');
    assert.ok(html.includes('麻感'), 'should include N label');
    assert.ok(html.includes('清凉'), 'should include C label');
    assert.ok(html.includes('温和'), 'should include M label');
  });

  it('renders taste dimension with U, S, W, B, O codes', () => {
    const html = renderStackedBars(sampleDimensionResults);
    assert.ok(html.includes('鲜味'), 'should include U label');
    assert.ok(html.includes('咸味'), 'should include S label');
    // Note: there are two 咸味 - one for taste S and one for philosophy S
    assert.ok(html.includes('甜味'), 'should include W label');
    assert.ok(html.includes('苦醇'), 'should include B label');
    assert.ok(html.includes('酸味'), 'should include O label');
  });

  it('renders philosophy dimension with A and S codes', () => {
    const html = renderStackedBars(sampleDimensionResults);
    assert.ok(html.includes('加法烹饪'), 'should include A label for philosophy');
  });

  it('renders novelty dimension with E and C codes', () => {
    const html = renderStackedBars(sampleDimensionResults);
    assert.ok(html.includes('探索者'), 'should include E label');
    assert.ok(html.includes('经典派'), 'should include C label for novelty');
  });

  it('uses configured colors', () => {
    const html = renderStackedBars(sampleDimensionResults);
    assert.ok(html.includes('#E07B54'), 'should use H color #E07B54');
    assert.ok(html.includes('#8BBF8B'), 'should use C color #8BBF8B');
    assert.ok(html.includes('#F0C87A'), 'should use O color #F0C87A');
  });

  it('renders percentage values', () => {
    const html = renderStackedBars(sampleDimensionResults);
    assert.ok(html.includes('40'), 'should include percentage values');
  });
});

// ---------- renderDetailsPanel ----------

describe('renderDetailsPanel', () => {
  it('returns HTML string with radar chart and stacked bars', () => {
    const html = renderDetailsPanel(sampleDimensionResults);
    assert.equal(typeof html, 'string');
    assert.ok(html.includes('<svg'), 'should contain SVG radar chart');
    assert.ok(html.includes('刺激偏好'), 'should contain stacked bars content');
  });

  it('wraps content in a details panel container', () => {
    const html = renderDetailsPanel(sampleDimensionResults);
    assert.ok(html.includes('details') || html.includes('panel'), 'should have panel wrapper');
  });
});

// ---------- renderResult (3-param signature) ----------

describe('renderResult 3-param signature', () => {
  beforeEach(() => {
    // Reset mock elements before each test
    for (const key of Object.keys(mockElements)) {
      delete mockElements[key];
    }
    // Pre-register IDs that renderResult accesses
    registerMockIds(
      'result-type-code',
      'result-type-code-sub',
      'result-name',
      'result-self-description',
      'result-taste-signature',
      'result-analysis',
      'result-avatar',
      'details-panel',
    );
  });

  it('accepts 3-param (typeCode, typeData, dimensionResults) signature', () => {
    // Should not throw with 3 params
    assert.doesNotThrow(() => {
      renderResult('HUAE', sampleTypeData, sampleDimensionResults);
    });
  });

  it('accepts 2-param (typeCode, typeData) backward-compatible signature', () => {
    // Should not throw with only 2 params (backward compat)
    assert.doesNotThrow(() => {
      renderResult('HUAE', sampleTypeData);
    });
  });

  it('populates #result-type-code with type code', () => {
    renderResult('HUAE', sampleTypeData, sampleDimensionResults);
    const el = mockElements['result-type-code'];
    assert.ok(el, 'should access #result-type-code');
    assert.equal(el.textContent, 'HUAE');
  });

  it('populates #result-type-code-sub with sub-code', () => {
    renderResult('HUAE', sampleTypeData, sampleDimensionResults);
    const el = mockElements['result-type-code-sub'];
    assert.ok(el, 'should access #result-type-code-sub');
    assert.equal(el.textContent, 'Hn-U-A-E');
  });

  it('populates #result-name with type name', () => {
    renderResult('HUAE', sampleTypeData, sampleDimensionResults);
    const el = mockElements['result-name'];
    assert.ok(el, 'should access #result-name');
    assert.equal(el.textContent, '山野炼金士');
  });

  it('populates #result-self-description with selfDescription in quotes', () => {
    renderResult('HUAE', sampleTypeData, sampleDimensionResults);
    const el = mockElements['result-self-description'];
    assert.ok(el, 'should access #result-self-description');
    assert.ok(el.textContent.includes('辣是明火'), 'should contain selfDescription text');
    assert.ok(el.textContent.includes('"') || el.textContent.includes('\u201C'),
      'should be wrapped in quotes');
  });

  it('populates #result-taste-signature with taste signature tags', () => {
    renderResult('HUAE', sampleTypeData, sampleDimensionResults);
    const el = mockElements['result-taste-signature'];
    assert.ok(el, 'should access #result-taste-signature');
    // Should have span children created via DOM creation (not innerHTML)
    const tagSpans = el.children.filter(c => c.className === 'taste-tag');
    assert.ok(tagSpans.length > 0, 'should have taste-tag span children');
    assert.ok(tagSpans[0].textContent.includes('灼烧'), 'should contain first signature tag text');
  });

  it('populates #result-analysis with analysis text', () => {
    renderResult('HUAE', sampleTypeData, sampleDimensionResults);
    const el = mockElements['result-analysis'];
    assert.ok(el, 'should access #result-analysis');
    assert.ok(el.textContent.includes('时间旅行者'), 'should contain analysis text');
  });

  it('populates #details-panel with details panel HTML', () => {
    renderResult('HUAE', sampleTypeData, sampleDimensionResults);
    const el = mockElements['details-panel'];
    assert.ok(el, 'should access #details-panel');
    assert.ok(el.innerHTML.includes('<svg'), 'should contain radar chart SVG');
    assert.ok(el.innerHTML.includes('刺激偏好'), 'should contain stacked bars');
  });

  it('does not populate #result-type-code-sub when dimensionResults is missing (2-param)', () => {
    renderResult('HUAE', sampleTypeData);
    const el = mockElements['result-type-code-sub'];
    // Either element is not accessed, or it's empty/unchanged
    if (el) {
      assert.equal(el.textContent, '', 'sub-code should be empty without dimensionResults');
    }
  });
});

// ---------- renderQuestion behavioral tests (Issue 6) ----------

describe('renderQuestion', () => {
  beforeEach(() => {
    for (const key of Object.keys(mockElements)) {
      delete mockElements[key];
    }
    registerMockIds('progress-fill', 'progress-label', 'question-text', 'quiz-options');
  });

  it('still exports renderQuestion', () => {
    assert.equal(typeof renderQuestion, 'function');
  });

  it('sets question text content', () => {
    const question = { text: 'Which flavor appeals to you most?', options: ['Salty', 'Sweet'] };
    renderQuestion(question, 0, 10);
    const el = mockElements['question-text'];
    assert.ok(el, 'question-text element should exist');
    assert.equal(el.textContent, 'Which flavor appeals to you most?');
  });

  it('renders option cards into quiz-options', () => {
    const question = { text: 'Pick one:', options: ['A', 'B', 'C', 'D'] };
    renderQuestion(question, 2, 10);
    const optionsEl = mockElements['quiz-options'];
    assert.ok(optionsEl, 'quiz-options element should exist');
    assert.ok(optionsEl.children.length > 0, 'should append option cards');
    assert.equal(optionsEl.children.length, 4, 'should create one card per option');
  });

  it('sets progress label with question index', () => {
    const question = { text: 'Q', options: ['X'] };
    renderQuestion(question, 5, 20);
    const label = mockElements['progress-label'];
    assert.ok(label, 'progress-label should exist');
    assert.equal(label.textContent, '6 / 20');
  });

  it('sets progress fill width as percentage', () => {
    const question = { text: 'Q', options: ['X'] };
    renderQuestion(question, 3, 10);
    const fill = mockElements['progress-fill'];
    assert.ok(fill, 'progress-fill should exist');
    assert.equal(fill.style.width, '30%');
  });

  it('does not throw when DOM elements are missing', () => {
    // Clear all mock elements so getElementById returns null
    for (const key of Object.keys(mockElements)) {
      delete mockElements[key];
    }
    const question = { text: 'Q', options: ['X'] };
    assert.doesNotThrow(() => {
      renderQuestion(question, 0, 5);
    });
  });
});

// ---------- loadTypeSVG behavioral tests (Issue 6) ----------

describe('loadTypeSVG', () => {
  it('still exports loadTypeSVG', () => {
    assert.equal(typeof loadTypeSVG, 'function');
  });

  it('returns SVG path for a given type code', () => {
    const path = loadTypeSVG('HUAE');
    assert.ok(path.includes('HUAE'), 'path should contain the type code');
    assert.ok(path.endsWith('.svg'), 'path should end with .svg');
  });

  it('returns path under assets directory', () => {
    const path = loadTypeSVG('CWWA');
    assert.ok(path.includes('assets'), 'path should include assets directory');
  });
});

// ---------- XSS / Security tests (Issues 1, 7) ----------

describe('tasteSignature XSS prevention', () => {
  beforeEach(() => {
    for (const key of Object.keys(mockElements)) {
      delete mockElements[key];
    }
    registerMockIds(
      'result-type-code',
      'result-type-code-sub',
      'result-name',
      'result-self-description',
      'result-taste-signature',
      'result-analysis',
      'result-avatar',
      'details-panel',
    );
  });

  it('does not inject raw HTML from tasteSignature tags', () => {
    const xssTypeData = {
      name: 'Test',
      selfDescription: 'desc',
      tasteSignature: ['<script>alert("xss")</script>', '<img onerror="alert(1)" src=x>'],
      analysis: 'test',
    };
    renderResult('HUAE', xssTypeData, sampleDimensionResults);
    const el = mockElements['result-taste-signature'];
    assert.ok(el, 'taste-signature element should exist');
    // With DOM creation via textContent, children should have text content, not rendered HTML
    const tagSpans = el.children.filter(c => c.className === 'taste-tag');
    assert.equal(tagSpans.length, 2, 'should have 2 taste-tag spans');
    // The textContent should contain the raw string, NOT rendered as HTML elements
    assert.equal(tagSpans[0].textContent, '<script>alert("xss")</script>',
      'script tag should be text, not parsed HTML');
    assert.equal(tagSpans[1].textContent, '<img onerror="alert(1)" src=x>',
      'img tag should be text, not parsed HTML');
  });

  it('uses textContent for taste signature spans, not innerHTML injection', () => {
    const typeData = {
      name: 'Test',
      selfDescription: 'desc',
      tasteSignature: ['H(灼烧)', '<b>bold</b>'],
      analysis: 'test',
    };
    renderResult('HUAE', typeData, sampleDimensionResults);
    const el = mockElements['result-taste-signature'];
    // The span children should be created via createElement + textContent
    const spanChildren = el.children.filter(c => c.className === 'taste-tag');
    assert.ok(spanChildren.length >= 2, 'should have taste-tag span children');
    // The raw HTML should NOT be rendered - <b> should be escaped text
    const boldSpan = spanChildren.find(c => c.textContent === '<b>bold</b>');
    assert.ok(boldSpan, '<b> tag should be treated as text, not HTML');
  });
});

// ---------- Attribute injection in stacked bars (Issues 2, 7) ----------

describe('renderStackedBars attribute injection prevention', () => {
  it('escapes special characters in code values within title attributes', () => {
    // Construct dimensionResults with a code that contains special HTML chars
    const maliciousResults = {
      stimulus: { dominant: 'H"', secondary: null, percentages: { 'H"': 100 } },
      taste: { dominant: 'U', secondary: null, percentages: { U: 100 } },
      philosophy: { dominant: 'A', secondary: null, percentages: { A: 100 } },
      novelty: { dominant: 'E', secondary: null, percentages: { E: 100 } },
    };
    const html = renderStackedBars(maliciousResults);
    // The title attribute should have escaped the quote, not have a raw " in the attribute
    // If escaped: title="H&quot;: 100%"
    // If NOT escaped: title="H": 100%"  (breaks attribute boundary)
    assert.ok(html.includes('&quot;'), 'special chars in code should be HTML-escaped in attributes');
  });

  it('escapes less-than and greater-than in code values', () => {
    const maliciousResults = {
      stimulus: { dominant: 'H<', secondary: null, percentages: { 'H<': 50, 'H>': 50 } },
      taste: { dominant: 'U', secondary: null, percentages: { U: 100 } },
      philosophy: { dominant: 'A', secondary: null, percentages: { A: 100 } },
      novelty: { dominant: 'E', secondary: null, percentages: { E: 100 } },
    };
    const html = renderStackedBars(maliciousResults);
    // Raw < and > should be escaped
    assert.ok(!html.match(/title="[^"]*<[^"]*"/), 'title attribute should not contain raw <');
  });
});

// ---------- Percentage clamping in radar chart (Issues 3, 7) ----------

describe('renderRadarChart percentage clamping', () => {
  it('handles percentage > 100 without producing coordinates outside viewBox', () => {
    const overflowResults = {
      stimulus: { dominant: 'H', secondary: null, percentages: { H: 150 } },
      taste: { dominant: 'U', secondary: null, percentages: { U: 30 } },
      philosophy: { dominant: 'A', secondary: null, percentages: { A: 60 } },
      novelty: { dominant: 'E', secondary: null, percentages: { E: 50 } },
    };
    const svg = renderRadarChart(overflowResults);
    // The max radius is 120, center is 150. Max coordinate = 150+120 = 270.
    // Without clamping, pct=150 would produce r = 120*150/100 = 180, coords up to 330 (outside viewBox 0-300)
    // After clamping, coordinates should stay within 0-300 range
    // Extract data polygon points (the one with rgba fill, not grid rings)
    const pointsMatch = svg.match(/<polygon points="([^"]+)" fill="rgba/);
    assert.ok(pointsMatch, 'should have data polygon points');
    const points = pointsMatch[1].split(/\s+/);
    let outOfBounds = false;
    for (const pt of points) {
      const [x, y] = pt.split(',').map(Number);
      if (x < 0 || x > 380 || y < 0 || y > 380) {
        outOfBounds = true;
      }
    }
    assert.ok(!outOfBounds, 'all polygon points should be within the 380x380 viewBox');
  });

  it('handles negative percentage by clamping to 0 (point at center)', () => {
    const negativeResults = {
      stimulus: { dominant: 'H', secondary: null, percentages: { H: -20 } },
      taste: { dominant: 'U', secondary: null, percentages: { U: 30 } },
      philosophy: { dominant: 'A', secondary: null, percentages: { A: 60 } },
      novelty: { dominant: 'E', secondary: null, percentages: { E: 50 } },
    };
    const svg = renderRadarChart(negativeResults);
    const pointsMatch = svg.match(/<polygon points="([^"]+)" fill="rgba/);
    assert.ok(pointsMatch, 'should have data polygon points');
    const points = pointsMatch[1].split(/\s+/);
    // The H axis (first point) should be at center (190,190) since -20 should be clamped to 0
    const [x, y] = points[0].split(',').map(Number);
    assert.equal(x, 190, 'negative pct should clamp to center x');
    assert.equal(y, 190, 'negative pct should clamp to center y');
  });

  it('clamps percentage at 0 for zero and negative values', () => {
    const zeroResults = {
      stimulus: { dominant: 'H', secondary: null, percentages: { H: 0 } },
      taste: { dominant: 'U', secondary: null, percentages: { U: 0 } },
      philosophy: { dominant: 'A', secondary: null, percentages: { A: 0 } },
      novelty: { dominant: 'E', secondary: null, percentages: { E: 0 } },
    };
    const svg = renderRadarChart(zeroResults);
    // All data points should collapse to center (190,190) when pct=0
    const pointsMatch = svg.match(/<polygon points="([^"]+)" fill="rgba/);
    assert.ok(pointsMatch, 'should have data polygon points');
    const points = pointsMatch[1].split(/\s+/);
    for (const pt of points) {
      const [x, y] = pt.split(',').map(Number);
      assert.equal(x, 190, 'x should be at center when pct=0');
      assert.equal(y, 190, 'y should be at center when pct=0');
    }
  });
});

// ---------- buildSubCode edge cases (Issues 4, 7) ----------

describe('buildSubCode missing dimensions', () => {
  it('handles missing dimension data gracefully', () => {
    const partialResults = {
      stimulus: { dominant: 'H', secondary: 'n', percentages: { H: 40, N: 30, C: 20, M: 10 } },
      // taste is missing entirely
      philosophy: { dominant: 'A', secondary: null, percentages: { A: 60, S: 40 } },
      novelty: { dominant: 'E', secondary: null, percentages: { E: 55, C: 45 } },
    };
    const result = buildSubCode(partialResults);
    // Should not produce malformed output like "Hn--A-E" (double hyphen)
    assert.ok(!result.includes('--'), 'should not have double hyphens for missing dimensions');
    assert.ok(!result.startsWith('-'), 'should not start with hyphen');
    assert.ok(!result.endsWith('-'), 'should not end with hyphen');
  });

  it('handles dimension with null dominant gracefully', () => {
    const nullDomResults = {
      stimulus: { dominant: null, secondary: null, percentages: { H: 0, N: 0, C: 0, M: 0 } },
      taste: { dominant: 'U', secondary: null, percentages: { U: 100 } },
      philosophy: { dominant: 'A', secondary: null, percentages: { A: 100 } },
      novelty: { dominant: 'E', secondary: null, percentages: { E: 100 } },
    };
    const result = buildSubCode(nullDomResults);
    // Should not produce empty segments leading to double hyphens
    assert.ok(!result.includes('--'), 'should not have double hyphens');
  });

  it('handles completely empty dimensionResults', () => {
    const result = buildSubCode({});
    // Should produce something valid, not just hyphens
    assert.ok(typeof result === 'string', 'should return a string');
    assert.ok(!result.includes('--'), 'should not have double hyphens');
  });

  it('uses X placeholder for missing dimension dominant', () => {
    const partialResults = {
      stimulus: { dominant: 'H', secondary: null, percentages: { H: 100 } },
      // taste missing
      philosophy: { dominant: 'A', secondary: null, percentages: { A: 100 } },
      novelty: { dominant: 'E', secondary: null, percentages: { E: 100 } },
    };
    const result = buildSubCode(partialResults);
    const segments = result.split('-');
    assert.equal(segments.length, 4, 'should always have 4 segments');
    assert.equal(segments[1], 'X', 'missing dimension should use X placeholder');
  });
});

// ---------- DOM null-branch tests (Issue 5) ----------

describe('renderResult with missing DOM elements', () => {
  it('does not throw when all DOM elements are missing', () => {
    // Ensure no mock elements exist
    for (const key of Object.keys(mockElements)) {
      delete mockElements[key];
    }
    assert.doesNotThrow(() => {
      renderResult('HUAE', sampleTypeData, sampleDimensionResults);
    });
  });

  it('getElementById returns null for unknown IDs', () => {
    for (const key of Object.keys(mockElements)) {
      delete mockElements[key];
    }
    const el = document.getElementById('nonexistent-id-12345');
    assert.equal(el, null, 'should return null for unregistered IDs');
  });
});

// ---------- renderRestaurantSection ----------

function createMockQuerySelector(root) {
  return function querySelector(selector) {
    const search = selector.replace('.', '');
    const searchEl = (el) => {
      if (el.className && el.className.includes(search)) return el;
      if (el.innerHTML && el.innerHTML.includes(`class="${search}"`)) return el;
      // Also search children's innerHTML for content (not just class attrs)
      for (const c of el.children) {
        if (c.innerHTML && c.innerHTML.includes(search)) return el;
        const found = searchEl(c);
        if (found) return found;
      }
      return null;
    };
    for (const c of root.children) {
      const found = searchEl(c);
      if (found) return found;
    }
    return null;
  };
}

// ---------- renderRestaurantCarousel ----------

describe('renderRestaurantCarousel', () => {
  it('does not render when restaurants array is empty', async () => {
    const containerEl = {
      id: 'container',
      children: [],
      appendChild(child) { this.children.push(child); },
    };
    containerEl.querySelector = createMockQuerySelector(containerEl);
    const doc = {
      getElementById(id) { return id === 'container' ? containerEl : null; },
      createElement(tag) {
        let _innerHTML = '';
        return {
          tagName: tag.toUpperCase(),
          textContent: '',
          get innerHTML() { return _innerHTML || this.children.map(c => c.innerHTML || '').join(''); },
          set innerHTML(v) { _innerHTML = v; },
          style: {},
          classList: { _classes: [], add(...c) { this._classes.push(...c); }, remove() {} },
          children: [],
          appendChild(child) { this.children.push(child); },
          setAttribute() {},
          addEventListener() {},
          querySelector() { return null; },
          querySelectorAll() { return []; },
        };
      },
    };
    globalThis.document = doc;
    globalThis.window = { restaurantMaxPerType: 5 };

    try {
      const { renderRestaurantCarousel } = await import('../modules/render.js');
      const result = renderRestaurantCarousel(containerEl, 'HUAE', [], 5);

      // Should return early without rendering anything
      assert.strictEqual(containerEl.children.length, 0, 'should not append any children');
      assert.strictEqual(result, undefined, 'should return undefined when no restaurants');
    } finally {
      globalThis.document = undefined;
      globalThis.window = undefined;
    }
  });

  it('creates .restaurant-carousel container with one restaurant', async () => {
    const containerEl = {
      id: 'container',
      children: [],
      appendChild(child) { this.children.push(child); },
    };
    containerEl.querySelector = createMockQuerySelector(containerEl);
    const doc = {
      getElementById(id) { return id === 'container' ? containerEl : null; },
      createElement(tag) {
        let _innerHTML = '';
        return {
          tagName: tag.toUpperCase(),
          textContent: '',
          get innerHTML() { return _innerHTML || this.children.map(c => c.innerHTML || '').join(''); },
          set innerHTML(v) { _innerHTML = v; },
          style: {},
          classList: { _classes: [], add(...c) { this._classes.push(...c); }, remove() {} },
          children: [],
          appendChild(child) { this.children.push(child); },
          setAttribute() {},
          addEventListener() {},
          querySelector() { return null; },
          querySelectorAll() { return []; },
        };
      },
    };
    globalThis.document = doc;
    globalThis.window = { restaurantMaxPerType: 5 };

    try {
      const { renderRestaurantCarousel } = await import('../modules/render.js');
      const restaurants = [
        { name: '鼎泰丰', by: '小王', date: '2026-04-14' }
      ];
      const result = renderRestaurantCarousel(containerEl, 'HUAE', restaurants, 5);

      assert.ok(result, 'should return carousel instance');
      assert.strictEqual(containerEl.children.length, 1, 'should append one child');
      assert.ok(containerEl.querySelector('.restaurant-carousel'), 'should have carousel container');
    } finally {
      globalThis.document = undefined;
      globalThis.window = undefined;
    }
  });

  it('shows restaurant name and by nickname', async () => {
    const containerEl = {
      id: 'container',
      children: [],
      appendChild(child) { this.children.push(child); },
    };
    containerEl.querySelector = createMockQuerySelector(containerEl);
    const doc = {
      getElementById(id) { return id === 'container' ? containerEl : null; },
      createElement(tag) {
        let _innerHTML = '';
        let _textContent = '';
        return {
          tagName: tag.toUpperCase(),
          get textContent() { return _textContent; },
          set textContent(v) { _textContent = v; },
          get innerHTML() { return _innerHTML || this.children.map(c => c.innerHTML || '').join(''); },
          set innerHTML(v) { _innerHTML = v; },
          style: {},
          classList: { _classes: [], add(...c) { this._classes.push(...c); }, remove() {}, get length() { return this._classes.length; }, contains(c) { return this._classes.includes(c); } },
          children: [],
          appendChild(child) { this.children.push(child); },
          setAttribute() {},
          addEventListener() {},
          querySelector() { return null; },
          querySelectorAll() { return []; },
        };
      },
    };
    globalThis.document = doc;
    globalThis.window = { restaurantMaxPerType: 5 };

    try {
      const { renderRestaurantCarousel } = await import('../modules/render.js');
      const restaurants = [
        { name: '鼎泰丰', by: '小王', date: '2026-04-14' }
      ];
      renderRestaurantCarousel(containerEl, 'HUAE', restaurants, 5);

      const carouselEl = containerEl.querySelector('.restaurant-carousel');
      // Check children: nameEl (index 0) and byEl (index 1)
      const nameEl = carouselEl.children[0];
      const byEl = carouselEl.children[1];
      assert.strictEqual(nameEl.textContent, '鼎泰丰', 'name element should contain restaurant name');
      assert.ok(byEl.textContent.includes('小王'), 'by element should contain nickname');
    } finally {
      globalThis.document = undefined;
      globalThis.window = undefined;
    }
  });

  it('shows dots container when multiple restaurants', async () => {
    const containerEl = {
      id: 'container',
      children: [],
      appendChild(child) { this.children.push(child); },
    };
    containerEl.querySelector = createMockQuerySelector(containerEl);
    const doc = {
      getElementById(id) { return id === 'container' ? containerEl : null; },
      createElement(tag) {
        let _innerHTML = '';
        let _className = '';
        return {
          tagName: tag.toUpperCase(),
          textContent: '',
          get className() { return _className; },
          set className(v) { _className = v; },
          get innerHTML() { return _innerHTML || this.children.map(c => c.innerHTML || '').join(''); },
          set innerHTML(v) { _innerHTML = v; },
          style: {},
          classList: { _classes: [], add(...c) { this._classes.push(...c); }, remove() {}, get length() { return this._classes.length; }, contains(c) { return this._classes.includes(c); } },
          children: [],
          appendChild(child) { this.children.push(child); },
          setAttribute() {},
          addEventListener() {},
          querySelector() { return null; },
          querySelectorAll() { return []; },
        };
      },
    };
    globalThis.document = doc;
    globalThis.window = { restaurantMaxPerType: 5 };

    try {
      const { renderRestaurantCarousel } = await import('../modules/render.js');
      const restaurants = [
        { name: '餐厅A', by: 'a', date: '2026-04-01' },
        { name: '餐厅B', by: 'b', date: '2026-04-02' },
      ];
      renderRestaurantCarousel(containerEl, 'HUAE', restaurants, 5);

      const carouselEl = containerEl.querySelector('.restaurant-carousel');
      // dotsEl is the 3rd child (index 2)
      const dotsEl = carouselEl.children[2];
      assert.strictEqual(dotsEl.className, 'restaurant-carousel-dots', 'third child should be dots container');
      assert.strictEqual(dotsEl.children.length, 2, 'dots container should have 2 dots for 2 restaurants');
    } finally {
      globalThis.document = undefined;
      globalThis.window = undefined;
    }
  });

  it('returns carousel instance with destroy() method', async () => {
    const containerEl = {
      id: 'container',
      children: [],
      appendChild(child) { this.children.push(child); },
    };
    containerEl.querySelector = createMockQuerySelector(containerEl);
    const doc = {
      getElementById(id) { return id === 'container' ? containerEl : null; },
      createElement(tag) {
        let _innerHTML = '';
        return {
          tagName: tag.toUpperCase(),
          textContent: '',
          get innerHTML() { return _innerHTML || this.children.map(c => c.innerHTML || '').join(''); },
          set innerHTML(v) { _innerHTML = v; },
          style: {},
          classList: { _classes: [], add(...c) { this._classes.push(...c); }, remove() {} },
          children: [],
          appendChild(child) { this.children.push(child); },
          setAttribute() {},
          addEventListener() {},
          querySelector() { return null; },
          querySelectorAll() { return []; },
        };
      },
    };
    globalThis.document = doc;
    globalThis.window = { restaurantMaxPerType: 5 };

    try {
      const { renderRestaurantCarousel } = await import('../modules/render.js');
      const restaurants = [
        { name: '鼎泰丰', by: '小王', date: '2026-04-14' }
      ];
      const instance = renderRestaurantCarousel(containerEl, 'HUAE', restaurants, 5);

      assert.ok(instance, 'should return an object');
      assert.strictEqual(typeof instance.destroy, 'function', 'should have destroy method');
      assert.doesNotThrow(() => { instance.destroy(); }, 'destroy should not throw');
    } finally {
      globalThis.document = undefined;
      globalThis.window = undefined;
    }
  });

  it('registers mouseenter/mouseleave listeners for pause on hover', async () => {
    const containerEl = {
      id: 'container',
      children: [],
      appendChild(child) { this.children.push(child); },
    };
    containerEl.querySelector = createMockQuerySelector(containerEl);
    const listeners = {};
    const doc = {
      getElementById(id) { return id === 'container' ? containerEl : null; },
      createElement(tag) {
        let _innerHTML = '';
        return {
          tagName: tag.toUpperCase(),
          textContent: '',
          get innerHTML() { return _innerHTML || this.children.map(c => c.innerHTML || '').join(''); },
          set innerHTML(v) { _innerHTML = v; },
          style: {},
          classList: { _classes: [], add(...c) { this._classes.push(...c); }, remove() {} },
          children: [],
          appendChild(child) { this.children.push(child); },
          setAttribute() {},
          addEventListener(evt, handler) {
            if (!listeners[evt]) listeners[evt] = [];
            listeners[evt].push(handler);
          },
          removeEventListener() {},
          querySelector() { return null; },
          querySelectorAll() { return []; },
        };
      },
    };
    globalThis.document = doc;
    globalThis.window = { restaurantMaxPerType: 5 };

    try {
      const { renderRestaurantCarousel } = await import('../modules/render.js');
      const restaurants = [
        { name: '鼎泰丰', by: '小王', date: '2026-04-14' },
        { name: '鼎泰丰2', by: '小王2', date: '2026-04-15' },
      ];
      renderRestaurantCarousel(containerEl, 'HUAE', restaurants, 5);

      assert.ok(listeners['mouseenter'], 'should register mouseenter listener for pause');
      assert.ok(listeners['mouseleave'], 'should register mouseleave listener for resume');
    } finally {
      globalThis.document = undefined;
      globalThis.window = undefined;
    }
  });

  it('registers click listener on restaurant name for clipboard copy', async () => {
    const containerEl = {
      id: 'container',
      children: [],
      appendChild(child) { this.children.push(child); },
    };
    containerEl.querySelector = createMockQuerySelector(containerEl);
    const listeners = {};
    const doc = {
      getElementById(id) { return id === 'container' ? containerEl : null; },
      createElement(tag) {
        let _innerHTML = '';
        return {
          tagName: tag.toUpperCase(),
          textContent: '',
          get innerHTML() { return _innerHTML || this.children.map(c => c.innerHTML || '').join(''); },
          set innerHTML(v) { _innerHTML = v; },
          style: {},
          classList: { _classes: [], add(...c) { this._classes.push(...c); }, remove() {} },
          children: [],
          appendChild(child) { this.children.push(child); },
          setAttribute() {},
          addEventListener(evt, handler) {
            if (!listeners[evt]) listeners[evt] = [];
            listeners[evt].push(handler);
          },
          removeEventListener() {},
          querySelector() { return null; },
          querySelectorAll() { return []; },
        };
      },
    };
    globalThis.document = doc;
    globalThis.window = { restaurantMaxPerType: 5, clipboard: { writeText: async () => {} } };

    try {
      const { renderRestaurantCarousel } = await import('../modules/render.js');
      const restaurants = [
        { name: '鼎泰丰', by: '小王', date: '2026-04-14' }
      ];
      renderRestaurantCarousel(containerEl, 'HUAE', restaurants, 5);

      // The click listener should be registered on the name element
      assert.ok(listeners['click'], 'should register click listener for clipboard copy');
    } finally {
      globalThis.document = undefined;
      globalThis.window = undefined;
    }
  });
});

// ---------- fetchRestaurants ----------

describe('fetchRestaurants', () => {
  beforeEach(async () => {
    const { clearCache } = await import('../modules/loader.js');
    clearCache();
  });

  it('fetchRestaurants returns restaurants data from API', async () => {
    const mockData = {
      ok: true,
      data: [
        { id: 1, name: '鼎泰丰', by: '小王', date: '2026-04-14' },
        { id: 2, name: '绿茶餐厅', by: '小李', date: '2026-04-15' }
      ],
      count: 2,
      maxPerType: 5
    };
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
      if (url.includes('api/restaurants.php')) {
        return { ok: true, json: async () => mockData };
      }
      return originalFetch(url);
    };

    try {
      const { fetchRestaurants } = await import('../modules/loader.js');
      const result = await fetchRestaurants('HUAE');
      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.count, 2);
      assert.strictEqual(result.data[0].name, '鼎泰丰');
      assert.strictEqual(result.data[1].name, '绿茶餐厅');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('fetchRestaurants throws error on API failure', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
      if (url.includes('api/restaurants.php')) {
        throw new Error('API error: 500');
      }
      return originalFetch(url);
    };

    try {
      const { fetchRestaurants } = await import('../modules/loader.js');
      await assert.rejects(
        async () => await fetchRestaurants('HUAE'),
        /API error/
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('fetchRestaurants encodes category parameter in URL', async () => {
    const capturedUrls = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
      capturedUrls.push(url);
      // Return a valid response to prevent unhandled rejection
      return { ok: true, json: async () => ({ ok: true, data: [], count: 0, maxPerType: 5 }) };
    };

    try {
      const { fetchRestaurants } = await import('../modules/loader.js');
      await fetchRestaurants('HUAE');
      // Should have called the API with encoded category
      assert.ok(capturedUrls.some(u => u.includes('category=HUAE')), 'URL should contain encoded category');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

// ---------- submitRestaurant ----------

describe('submitRestaurant', () => {
  beforeEach(async () => {
    const { clearCache } = await import('../modules/loader.js');
    clearCache();
  });

  it('submitRestaurant returns success response from API', async () => {
    const mockData = {
      ok: true,
      message: 'Restaurant added',
      res_id: 42
    };
    const originalFetch = globalThis.fetch;
    let capturedBody;
    globalThis.fetch = async (url, options) => {
      if (url.includes('api/restaurants.php')) {
        capturedBody = JSON.parse(options.body);
        return { ok: true, json: async () => mockData };
      }
      return originalFetch(url, options);
    };

    try {
      const { submitRestaurant } = await import('../modules/loader.js');
      const result = await submitRestaurant('HUAE', '新餐厅', '小明');
      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.res_id, 42);
      assert.strictEqual(capturedBody.category, 'HUAE');
      assert.strictEqual(capturedBody.name, '新餐厅');
      assert.strictEqual(capturedBody.by, '小明');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('submitRestaurant uses default "匿名" when by is not provided', async () => {
    let capturedBody;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      if (url.includes('api/restaurants.php')) {
        capturedBody = JSON.parse(options.body);
        return { ok: true, json: async () => ({ ok: true }) };
      }
      return originalFetch(url, options);
    };

    try {
      const { submitRestaurant } = await import('../modules/loader.js');
      await submitRestaurant('HUAE', '新餐厅');
      assert.strictEqual(capturedBody.by, '匿名');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('submitRestaurant throws error on API failure', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      if (url.includes('api/restaurants.php')) {
        throw new Error('API error: 500');
      }
      return originalFetch(url, options);
    };

    try {
      const { submitRestaurant } = await import('../modules/loader.js');
      await assert.rejects(
        async () => await submitRestaurant('HUAE', '新餐厅'),
        /API error/
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('submitRestaurant uses POST method with JSON body', async () => {
    let capturedOptions;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      if (url.includes('api/restaurants.php')) {
        capturedOptions = options;
        return { ok: true, json: async () => ({ ok: true }) };
      }
      return originalFetch(url, options);
    };

    try {
      const { submitRestaurant } = await import('../modules/loader.js');
      await submitRestaurant('HUAE', '新餐厅', '小明');
      assert.strictEqual(capturedOptions.method, 'POST');
      assert.strictEqual(capturedOptions.headers['Content-Type'], 'application/json');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
