/**
 * modules/render.js
 * 渲染引擎
 */

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

export function renderResult(typeCode, typeData) {
  const typeEl = document.getElementById('result-type-code');
  const nameEl = document.getElementById('result-name');
  const taglineEl = document.getElementById('result-tagline');
  const avatarEl = document.getElementById('result-avatar');

  if (typeEl) typeEl.textContent = typeCode;
  if (nameEl) nameEl.textContent = typeData.name;
  if (taglineEl) taglineEl.textContent = typeData.tagline;
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

  // Push URL state
  const url = new URL(window.location.href);
  url.searchParams.set('type', typeCode);
  window.history.pushState({ type: typeCode }, '', url.toString());
}

export function loadTypeSVG(typeCode) {
  return `./assets/${typeCode}.svg`;
}
