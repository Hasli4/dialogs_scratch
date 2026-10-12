import './style.css';

const AVATARS = {
  boy: {
    title: 'Мальчик',
    colors: ['#5d5ce2', '#9d9cff'],
    art: `<svg viewBox="0 0 160 160" aria-hidden="true"><path fill="#5D5CE2" d="M40 151c2-31 16-47 40-47s38 16 40 47z"/><circle fill="#FFD7B0" cx="80" cy="65" r="37"/><path fill="#2F276F" d="M44 62c0-31 20-46 40-46 25 0 39 16 38 40-12-10-24-12-35-11-12 1-23 7-43 17z"/><circle fill="#2F276F" cx="67" cy="68" r="3"/><circle fill="#2F276F" cx="94" cy="68" r="3"/><path fill="none" stroke="#C76B5C" stroke-linecap="round" stroke-width="4" d="M70 84c6 4 14 4 20 0"/><path fill="#43BF8B" d="M43 111c11-9 21-13 37-13 17 0 29 4 38 13v16H43z"/></svg>`,
  },
  girl: {
    title: 'Девочка',
    colors: ['#ed7091', '#ffb4c8'],
    art: `<svg viewBox="0 0 160 160" aria-hidden="true"><path fill="#F07495" d="M35 151c4-31 19-47 45-47 25 0 40 16 45 47z"/><circle fill="#FFD7B0" cx="80" cy="65" r="37"/><path fill="#5C356D" d="M41 68c0-34 17-52 40-52s40 17 39 52l-11-12V39c-13 7-40 7-56 0v17z"/><path fill="#5C356D" d="M40 69c-8 9-7 33 4 37l10-9V63zm80 0c8 9 7 33-4 37l-10-9V63z"/><circle fill="#5C356D" cx="67" cy="69" r="3"/><circle fill="#5C356D" cx="94" cy="69" r="3"/><path fill="none" stroke="#C76B5C" stroke-linecap="round" stroke-width="4" d="M70 84c6 4 14 4 20 0"/><path fill="#FFCE56" d="m110 22 6 11 12 2-9 9 2 12-11-5-10 5 2-12-9-9 12-2z"/></svg>`,
  },
  dog: {
    title: 'Собака',
    colors: ['#f28a43', '#ffd08b'],
    art: `<svg viewBox="0 0 160 160" aria-hidden="true"><path fill="#F28A43" d="M35 151c4-31 19-47 45-47 25 0 40 16 45 47z"/><path fill="#965D3E" d="M45 68 22 44c-8 21-2 42 18 45zm70 0 23-24c8 21 2 42-18 45z"/><circle fill="#C98458" cx="80" cy="67" r="38"/><path fill="#FFF3DD" d="M52 76c0 27 12 38 28 38 17 0 29-11 29-38-11 5-45 5-57 0z"/><circle fill="#392B2C" cx="66" cy="67" r="4"/><circle fill="#392B2C" cx="95" cy="67" r="4"/><path fill="#392B2C" d="M74 78q6-6 12 0-2 7-6 7t-6-7z"/><path fill="none" stroke="#392B2C" stroke-linecap="round" stroke-width="3" d="M80 85v5m0 0c-6 5-11 4-14 2m14-2c6 5 11 4 14 2"/><path fill="#6DCB94" d="M69 111h22l-4 14H73z"/></svg>`,
  },
};

const makeId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const defaultState = () => ({
  columns: [
    { id: makeId(), name: 'Лика', avatar: 'girl' },
    { id: makeId(), name: 'Артём', avatar: 'boy' },
  ],
  rows: 6,
  cells: {},
  isPreviewing: false,
  activeKeys: [],
  dialog: null,
  editingNameId: null,
  editingTypeId: null,
});

let state = loadState();
let dragItem = null;
let timerId = null;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('scratch-dialogue-v1'));
    return saved?.columns?.length ? { ...defaultState(), ...saved, isPreviewing: false, activeKeys: [] } : defaultState();
  } catch {
    return defaultState();
  }
}

function persist() {
  try {
    localStorage.setItem('scratch-dialogue-v1', JSON.stringify({
      columns: state.columns, rows: state.rows, cells: state.cells,
    }));
    return true;
  } catch {
    alert('Не удалось сохранить изображение: выберите файл поменьше.');
    return false;
  }
}

function cellKey(row, columnId) { return `${row}:${columnId}`; }
function escapeHTML(value = '') {
  return String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);
}

function speechIcon() {
  return `<svg viewBox="0 0 34 29" aria-hidden="true"><path d="M4 2.3h26a2 2 0 0 1 2 2v16.5a2 2 0 0 1-2 2H14.4L8.2 27v-4.2H4a2 2 0 0 1-2-2V4.3a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"/><circle cx="11" cy="12" r="1.5" fill="currentColor"/><circle cx="17" cy="12" r="1.5" fill="currentColor"/><circle cx="23" cy="12" r="1.5" fill="currentColor"/></svg>`;
}
function waitIcon() {
  return `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13.5" fill="none" stroke="currentColor" stroke-width="3.5"/><path d="M16 8v9l5.7 3.4" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg>`;
}

function commandCard(command, compact = false) {
  const classes = `command-card ${command.type} ${compact ? 'compact' : ''}`;
  const span = Math.max(1, Number(command.span) || 1);
  const content = command.type === 'say'
    ? `<span class="command-icon">${speechIcon()}</span><span class="command-copy"><span class="command-label">говорить</span><textarea class="command-input phrase-input" rows="1" aria-label="Текст реплики" placeholder="Напишите фразу">${escapeHTML(command.text || '')}</textarea><span class="say-duration"><span>длительность</span><input class="command-input say-duration-input" value="${escapeHTML(command.seconds ?? 2)}" type="number" min="0.1" step="0.5" aria-label="Секунды разговора" /><span>сек.</span></span></span>`
    : `<span class="command-icon">${waitIcon()}</span><span class="command-copy"><span class="command-label">ждать</span><span class="wait-value"><input class="command-input seconds-input" value="${escapeHTML(command.seconds ?? 2)}" type="number" min="0.1" step="0.5" aria-label="Секунды ожидания" /><span>сек.</span></span><span class="wait-stretch"><button class="resize-wait-handle" type="button" data-resize-wait aria-label="Растянуть ожидание" title="Тяните вверх или вниз, либо кликните: каждый шаг добавляет секунду">↕</button></span></span>`;
  const waitMeta = command.type === 'wait' ? ` data-span="${span}" style="--row-span:${span}"` : '';
  return `<article class="${classes}" draggable="true" data-command-id="${command.id}"${waitMeta}>${content}<button class="delete-command" type="button" title="Удалить команду" aria-label="Удалить команду">×</button></article>`;
}

function paletteCard(type) {
  const command = type === 'say' ? { type, text: 'Привет!' } : { type, seconds: 2 };
  const label = type === 'say' ? 'Говорить фразу' : 'Ждать секунды';
  return `<button class="palette-card ${type}" draggable="true" type="button" data-palette="${type}">
    <span class="palette-icon">${type === 'say' ? speechIcon() : waitIcon()}</span>
    <span><strong>${label}</strong><small>${type === 'say' ? 'Добавьте свою реплику' : 'Укажите длительность паузы'}</small></span>
    <span class="drag-dots" aria-hidden="true">⠿</span>
  </button>`;
}

function actorModal() {
  const isReplacing = state.dialog?.mode === 'replace';
  const target = isReplacing ? state.columns.find((column) => column.id === state.dialog.targetId) : null;
  const selectedAvatar = target?.avatar ?? 'dog';
  const customImage = state.dialog?.pendingImage || target?.customAvatar;
  const hasCustomImage = Boolean(customImage);
  return `<dialog id="actor-dialog" class="actor-dialog">
    <form method="dialog" class="dialog-panel">
      <button class="dialog-close" aria-label="Закрыть" value="cancel">×</button>
      <p class="eyebrow">${isReplacing ? 'ОБРАЗ ПЕРСОНАЖА' : 'НОВАЯ КОЛОНКА'}</p>
      <h2>${isReplacing ? 'Выберите новый образ' : 'Кто будет говорить?'}</h2>
      <p class="dialog-text">${isReplacing ? 'Выберите готовый образ или загрузите свою картинку с компьютера.' : 'Выберите сохранённый образ, дайте ему имя — и добавьте дорожку диалога.'}</p>
      <div class="avatar-choices">${Object.entries(AVATARS).map(([key, avatar]) => `<label class="avatar-choice">
        <input type="radio" name="avatar" value="${key}" ${!hasCustomImage && key === selectedAvatar ? 'checked' : ''}>
        <span class="avatar-art" style="--avatar-main:${avatar.colors[0]};--avatar-soft:${avatar.colors[1]}">${avatar.art}</span>
        <span>${avatar.title}</span>
      </label>`).join('')}${isReplacing ? `<div class="avatar-choice custom-avatar-choice">
        <input id="custom-avatar-choice" type="radio" name="avatar" value="custom" ${hasCustomImage ? 'checked' : ''}>
        <label class="custom-avatar-trigger" for="custom-avatar-choice">
          <span class="avatar-art custom-avatar-preview">${hasCustomImage ? `<img src="${escapeHTML(customImage)}" alt="Предпросмотр своей картинки">` : '<span class="upload-plus">＋</span>'}</span>
          <span class="custom-avatar-copy"><strong>Своя картинка</strong><small>Сохранится только на этом устройстве</small></span>
        </label>
        <button id="choose-custom-avatar" class="choose-custom-avatar" type="button">Выбрать файл</button>
        <input id="custom-avatar-input" class="custom-avatar-input" type="file" accept="image/*" aria-label="Выбрать свою картинку">
      </div>` : ''}</div>
      ${isReplacing ? '' : `<label class="name-label">Имя персонажа<input id="new-actor-name" maxlength="18" value="${escapeHTML(`Герой ${state.columns.length + 1}`)}" /></label>`}
      <div class="dialog-actions"><button value="cancel" class="button ghost">Отмена</button><button id="confirm-actor" value="default" class="button primary">${isReplacing ? 'Заменить образ' : 'Добавить персонажа'}</button></div>
    </form>
  </dialog>`;
}

function render() {
  const gridStyle = `--columns: ${state.columns.length};`;
  const headerColumns = state.columns.map((column) => {
    const avatar = AVATARS[column.avatar];
    const hasCustomAvatar = Boolean(column.customAvatar);
    const avatarTitle = hasCustomAvatar ? 'Своя картинка' : avatar.title;
    const actorType = column.role ?? avatarTitle;
    const avatarArt = hasCustomAvatar ? `<img class="custom-avatar-image" src="${escapeHTML(column.customAvatar)}" alt="">` : avatar.art;
    const avatarColors = hasCustomAvatar ? ['#5d5ce2', '#dcddff'] : avatar.colors;
    const nameControl = state.editingNameId === column.id
      ? `<input class="actor-name-input" value="${escapeHTML(column.name)}" maxlength="18" aria-label="Новое имя персонажа" data-name-id="${column.id}">`
      : `<button class="actor-name" type="button" data-edit-name="${column.id}" title="Дважды кликните, чтобы изменить имя">${escapeHTML(column.name)}</button>`;
    const typeControl = state.editingTypeId === column.id
      ? `<input class="actor-type-input" value="${escapeHTML(actorType)}" maxlength="24" aria-label="Новая подпись персонажа" data-type-id="${column.id}">`
      : `<button class="actor-type" type="button" data-edit-type="${column.id}" title="Дважды кликните, чтобы изменить подпись">${escapeHTML(actorType)}</button>`;
    return `<div class="actor-header" data-column-id="${column.id}">
      <div class="actor-avatar" role="button" tabindex="0" data-edit-avatar="${column.id}" aria-label="Сменить образ ${escapeHTML(column.name)}" title="Дважды кликните, чтобы сменить образ" style="--avatar-main:${avatarColors[0]};--avatar-soft:${avatarColors[1]}">${avatarArt}</div>
      <div class="actor-name-wrap">${nameControl}${typeControl}</div>
      <button class="remove-actor" type="button" data-remove-actor="${column.id}" aria-label="Удалить персонажа" title="Удалить персонажа">×</button>
    </div>`;
  }).join('');

  const rows = Array.from({ length: state.rows }, (_, row) => {
    const cells = state.columns.map((column) => {
      const key = cellKey(row, column.id);
      const command = state.cells[key];
      const covered = Boolean(findCoveringWait(row, column.id));
      return `<div class="timeline-cell ${command ? 'filled' : ''} ${covered ? 'covered-by-wait' : ''} ${state.activeKeys.includes(key) ? 'is-active' : ''}" data-row="${row}" data-column="${column.id}">
        ${covered ? '' : command ? commandCard(command) : `<span class="drop-hint">Перетащите команду</span>`}
      </div>`;
    }).join('');
    return `<div class="timeline-row" style="${gridStyle}"><div class="row-number">${String(row + 1).padStart(2, '0')}</div>${cells}</div>`;
  }).join('');

  document.querySelector('#app').innerHTML = `
    <main class="app-shell">
      <header class="topbar">
        <a class="brand" href="#" aria-label="Диалоговый стол, главная"><span class="brand-mark">✦</span><span>диалоговый<span>стол</span></span></a>
        <div class="project-name"><span class="status-dot"></span><span>Новый диалог</span><button type="button" class="rename-project" title="Переименовать">✎</button></div>
        <div class="top-actions"><button class="text-button" id="reset-project" type="button">Начать заново</button><button class="button outline" id="save-project" type="button">Сохранено <span>✓</span></button><button class="button primary play-button" id="play-dialogue" type="button"><span>▶</span> Просмотреть</button></div>
      </header>
      <section class="workspace">
        <aside class="toolbox" aria-label="Команды">
          <div class="toolbox-heading"><p class="eyebrow">КОМАНДЫ</p><h1>Соберите<br>диалог</h1><p>Перетаскивайте блоки на дорожки персонажей.</p></div>
          <div class="palette">${paletteCard('say')}${paletteCard('wait')}</div>
          <div class="toolbox-tip"><span>⌘</span><p><strong>Небольшой совет</strong><br>Кликните по тексту или времени прямо в блоке, чтобы изменить их.</p></div>
        </aside>
        <section class="board-section">
          <div class="board-toolbar">
            <div><p class="eyebrow">СЦЕНАРИЙ</p><h2>План диалога <span>${Object.keys(state.cells).length} ${pluralCommands(Object.keys(state.cells).length)}</span></h2></div>
            <button class="add-actor" id="add-actor" type="button"><span>＋</span> Добавить персонажа</button>
          </div>
          <div class="stage" style="${gridStyle}">
            <div class="stage-caption"><span class="flag">⚑</span><span>Когда нажат зелёный флажок</span></div>
            <div class="actor-grid">${headerColumns}</div>
            <div class="timeline">${rows}</div>
            <button id="add-row" type="button" class="add-row"><span>＋</span> Добавить шаг</button>
          </div>
        </section>
      </section>
      <footer class="bottom-bar"><span class="bottom-label">КОНСТРУКТОР ДИАЛОГОВ</span><span>Команда начинается с зелёного флажка</span><span class="footer-help">? Нужна помощь</span></footer>
    </main>${actorModal()}`;
  bindEvents();
  const inlineEditor = document.querySelector('.actor-name-input, .actor-type-input');
  if (inlineEditor) requestAnimationFrame(() => { inlineEditor.focus(); inlineEditor.select(); });
  requestAnimationFrame(layoutWaitBlocks);
}

function pluralCommands(number) {
  const n = number % 100;
  if (n >= 11 && n <= 14) return 'команд';
  const last = n % 10;
  return last === 1 ? 'команда' : last >= 2 && last <= 4 ? 'команды' : 'команд';
}

function findCoveringWait(row, columnId) {
  for (let startRow = 0; startRow < row; startRow += 1) {
    const command = state.cells[cellKey(startRow, columnId)];
    if (command?.type === 'wait' && startRow + Math.max(1, Number(command.span) || 1) > row) return command;
  }
  return null;
}

function maxWaitSpan(startRow, columnId) {
  for (let row = startRow + 1; row < state.rows; row += 1) {
    if (state.cells[cellKey(row, columnId)]) return row - startRow;
  }
  return state.rows - startRow;
}

function waitSpanAtPointer(clientY, startRow) {
  const rows = [...document.querySelectorAll('.timeline-row')];
  let targetRow = startRow;
  rows.forEach((row, index) => {
    const rect = row.getBoundingClientRect();
    if (clientY >= rect.top && clientY <= rect.bottom) targetRow = index;
    if (clientY > rect.bottom) targetRow = Math.max(targetRow, index);
  });
  return Math.max(1, targetRow - startRow + 1);
}

function layoutWaitBlocks() {
  document.querySelectorAll('.command-card.wait[data-span]').forEach((card) => {
    const startCell = card.closest('.timeline-cell');
    const startRow = Number(startCell.dataset.row);
    const columnId = startCell.dataset.column;
    const span = Math.max(1, Number(card.dataset.previewSpan || card.dataset.span) || 1);
    const endCell = document.querySelector(`.timeline-cell[data-row="${startRow + span - 1}"][data-column="${columnId}"]`);
    if (!endCell) return;
    const startRect = startCell.getBoundingClientRect();
    const endRect = endCell.getBoundingClientRect();
    card.style.height = `${Math.max(startRect.height, endRect.bottom - startRect.top)}px`;
  });
}

function bindEvents() {
  document.querySelectorAll('[data-palette]').forEach((el) => {
    el.addEventListener('dragstart', () => { dragItem = { source: 'palette', type: el.dataset.palette }; el.classList.add('is-dragging'); });
    el.addEventListener('dragend', () => el.classList.remove('is-dragging'));
  });
  document.querySelectorAll('.command-card').forEach((el) => {
    el.addEventListener('dragstart', (event) => {
      if (event.target.matches('input, textarea, button')) { event.preventDefault(); return; }
      const cell = el.closest('.timeline-cell');
      dragItem = { source: 'cell', key: cellKey(cell.dataset.row, cell.dataset.column), command: state.cells[cellKey(cell.dataset.row, cell.dataset.column)] };
      el.classList.add('is-dragging');
    });
    el.addEventListener('dragend', () => el.classList.remove('is-dragging'));
  });
  document.querySelectorAll('.timeline-cell').forEach((cell) => {
    cell.addEventListener('dragover', (event) => { event.preventDefault(); cell.classList.add('drag-over'); });
    cell.addEventListener('dragleave', () => cell.classList.remove('drag-over'));
    cell.addEventListener('drop', (event) => {
      event.preventDefault(); cell.classList.remove('drag-over');
      if (!dragItem) return;
      const targetKey = cellKey(cell.dataset.row, cell.dataset.column);
      const replacement = dragItem.source === 'palette'
        ? dragItem.type === 'say' ? { id: makeId(), type: 'say', text: 'Привет!', seconds: 2 } : { id: makeId(), type: 'wait', seconds: 2, span: 1 }
        : dragItem.command;
      if (dragItem.source === 'cell' && dragItem.key !== targetKey) delete state.cells[dragItem.key];
      if (replacement.type === 'wait') replacement.span = Math.min(Math.max(1, Number(replacement.span) || 1), maxWaitSpan(Number(cell.dataset.row), cell.dataset.column));
      state.cells[targetKey] = replacement;
      dragItem = null; persist(); render();
    });
  });
  document.querySelectorAll('.phrase-input').forEach((input) => {
    resizePhraseInput(input);
    input.addEventListener('input', () => {
      resizePhraseInput(input);
      requestAnimationFrame(layoutWaitBlocks);
      const cell = input.closest('.timeline-cell'); state.cells[cellKey(cell.dataset.row, cell.dataset.column)].text = input.value; persist();
    });
  });
  document.querySelectorAll('.say-duration-input').forEach((input) => input.addEventListener('input', () => {
    const cell = input.closest('.timeline-cell'); state.cells[cellKey(cell.dataset.row, cell.dataset.column)].seconds = Math.max(0.1, Number(input.value) || 0.1); persist();
  }));
  document.querySelectorAll('.seconds-input').forEach((input) => input.addEventListener('input', () => {
    const cell = input.closest('.timeline-cell'); state.cells[cellKey(cell.dataset.row, cell.dataset.column)].seconds = Math.max(0.1, Number(input.value) || 0.1); persist();
  }));
  document.querySelectorAll('[data-resize-wait]').forEach((handle) => {
    const card = handle.closest('.command-card');
    const cell = card.closest('.timeline-cell');
    const startRow = Number(cell.dataset.row);
    const columnId = cell.dataset.column;
    const command = state.cells[cellKey(startRow, columnId)];
    const initialSpan = Math.max(1, Number(command.span) || 1);
    const initialSeconds = Math.max(0.1, Number(command.seconds) || 2);
    let previewSpan = initialSpan;
    let dragged = false;
    handle.addEventListener('pointerdown', (event) => {
      event.preventDefault(); event.stopPropagation();
      const onMove = (moveEvent) => {
        const nextSpan = Math.min(waitSpanAtPointer(moveEvent.clientY, startRow), maxWaitSpan(startRow, columnId));
        if (nextSpan !== previewSpan) {
          dragged = true; previewSpan = nextSpan; card.dataset.previewSpan = String(nextSpan);
          handle.textContent = String(nextSpan); layoutWaitBlocks();
        }
      };
      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        if (dragged) {
          command.span = previewSpan;
          command.seconds = Math.max(0.1, initialSeconds + previewSpan - initialSpan);
          persist(); handle.dataset.ignoreClick = 'true'; render();
        }
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp, { once: true });
    });
    handle.addEventListener('click', () => {
      if (handle.dataset.ignoreClick === 'true') { delete handle.dataset.ignoreClick; return; }
      const nextSpan = Math.min(initialSpan + 1, maxWaitSpan(startRow, columnId));
      command.span = nextSpan;
      command.seconds = Math.max(0.1, initialSeconds + nextSpan - initialSpan);
      persist(); render();
    });
  });
  document.querySelectorAll('.delete-command').forEach((button) => button.addEventListener('click', () => {
    const cell = button.closest('.timeline-cell'); delete state.cells[cellKey(cell.dataset.row, cell.dataset.column)]; persist(); render();
  }));
  document.querySelectorAll('[data-edit-name]').forEach((button) => {
    button.addEventListener('dblclick', () => { state.editingNameId = button.dataset.editName; render(); });
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); state.editingNameId = button.dataset.editName; render(); }
    });
  });
  document.querySelectorAll('.actor-name-input').forEach((input) => {
    const saveName = () => {
      const column = state.columns.find((item) => item.id === input.dataset.nameId);
      column.name = input.value.trim() || 'Без имени';
      state.editingNameId = null; persist(); render();
    };
    input.addEventListener('blur', saveName);
    input.addEventListener('keydown', (event) => { if (event.key === 'Enter') input.blur(); });
  });
  document.querySelectorAll('[data-edit-type]').forEach((button) => {
    button.addEventListener('dblclick', () => { state.editingTypeId = button.dataset.editType; render(); });
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); state.editingTypeId = button.dataset.editType; render(); }
    });
  });
  document.querySelectorAll('.actor-type-input').forEach((input) => {
    const saveType = () => {
      const column = state.columns.find((item) => item.id === input.dataset.typeId);
      const value = input.value.trim();
      if (value) column.role = value;
      else delete column.role;
      state.editingTypeId = null; persist(); render();
    };
    input.addEventListener('blur', saveType);
    input.addEventListener('keydown', (event) => { if (event.key === 'Enter') input.blur(); });
  });
  document.querySelectorAll('[data-edit-avatar]').forEach((avatar) => {
    avatar.addEventListener('dblclick', () => openActorDialog('replace', avatar.dataset.editAvatar));
    avatar.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openActorDialog('replace', avatar.dataset.editAvatar); }
    });
  });
  document.querySelectorAll('[data-remove-actor]').forEach((button) => button.addEventListener('click', () => {
    if (state.columns.length === 1) return;
    const id = button.dataset.removeActor;
    state.columns = state.columns.filter((column) => column.id !== id);
    Object.keys(state.cells).filter((key) => key.endsWith(`:${id}`)).forEach((key) => delete state.cells[key]);
    persist(); render();
  }));
  document.querySelector('#add-row').addEventListener('click', () => { state.rows += 1; persist(); render(); });
  document.querySelector('#add-actor').addEventListener('click', () => openActorDialog('create'));
  document.querySelector('#choose-custom-avatar')?.addEventListener('click', () => document.querySelector('#custom-avatar-input').click());
  document.querySelector('#custom-avatar-input')?.addEventListener('change', async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    try {
      const image = await prepareAvatarForStorage(file);
      state.dialog.pendingImage = image;
      document.querySelector('#custom-avatar-choice').checked = true;
      const preview = document.querySelector('.custom-avatar-preview');
      preview.innerHTML = `<img src="${escapeHTML(image)}" alt="Предпросмотр своей картинки">`;
    } catch (error) {
      alert(error.message || 'Не удалось открыть эту картинку.');
      event.target.value = '';
    }
  });
  document.querySelector('#confirm-actor').addEventListener('click', (event) => {
    event.preventDefault(); const dialog = document.querySelector('#actor-dialog');
    const avatar = dialog.querySelector('input[name="avatar"]:checked').value;
    if (state.dialog?.mode === 'replace') {
      const column = state.columns.find((item) => item.id === state.dialog.targetId);
      if (avatar === 'custom') {
        const customImage = state.dialog.pendingImage || column.customAvatar;
        if (!customImage) { alert('Сначала выберите картинку с компьютера.'); return; }
        column.customAvatar = customImage;
      } else {
        column.avatar = avatar;
        column.customAvatar = null;
      }
    } else {
      const name = dialog.querySelector('#new-actor-name').value.trim() || AVATARS[avatar].title;
      state.columns.push({ id: makeId(), name, avatar });
    }
    state.dialog = null; persist(); dialog.close(); render();
  });
  document.querySelector('#actor-dialog').addEventListener('close', () => {
    if (state.dialog) { state.dialog = null; render(); }
  });
  document.querySelector('#save-project').addEventListener('click', (event) => {
    persist(); const button = event.currentTarget; button.innerHTML = 'Сохранено <span>✓</span>'; button.classList.add('saved-flash'); setTimeout(() => button.classList.remove('saved-flash'), 900);
  });
  document.querySelector('#reset-project').addEventListener('click', () => {
    if (confirm('Очистить весь план диалога?')) { state = defaultState(); persist(); render(); }
  });
  document.querySelector('#play-dialogue').addEventListener('click', playDialogue);
}

function openActorDialog(mode, targetId = null) {
  state.dialog = { mode, targetId };
  render();
  document.querySelector('#actor-dialog').showModal();
}

function prepareAvatarForStorage(file) {
  if (!file.type.startsWith('image/')) return Promise.reject(new Error('Выберите файл с изображением.'));
  if (file.size > 12 * 1024 * 1024) return Promise.reject(new Error('Картинка слишком большая. Выберите файл до 12 МБ.'));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Не удалось прочитать файл.'));
    reader.onload = () => {
      const source = new Image();
      source.onerror = () => reject(new Error('Браузер не смог открыть эту картинку.'));
      source.onload = () => {
        const maxSide = 320;
        const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(source.width * scale));
        canvas.height = Math.max(1, Math.round(source.height * scale));
        canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
        const optimized = canvas.toDataURL('image/webp', 0.86);
        if (optimized.length > 1_700_000) reject(new Error('Картинка всё ещё слишком большая. Выберите другую.'));
        else resolve(optimized);
      };
      source.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function commandDuration(command) {
  return Math.max(0.1, Number(command.seconds ?? 2) || 0.1) * 1000;
}

function resizePhraseInput(input) {
  input.style.height = 'auto';
  input.style.height = `${input.scrollHeight}px`;
}

function playDialogue() {
  if (timerId) { clearTimeout(timerId); timerId = null; state.activeKeys = []; render(); return; }
  const rows = Array.from({ length: state.rows }, (_, row) => state.columns.map((column) => {
    const key = cellKey(row, column.id);
    return state.cells[key] ? { key, command: state.cells[key] } : null;
  }).filter(Boolean)).filter((row) => row.length);
  if (!rows.length) { alert('Добавьте хотя бы одну команду на дорожку.'); return; }
  let index = 0;
  const runRow = () => {
    if (index >= rows.length) { timerId = null; state.activeKeys = []; render(); return; }
    const currentRow = rows[index++];
    state.activeKeys = currentRow.map((step) => step.key); render();
    timerId = setTimeout(runRow, Math.max(...currentRow.map((step) => commandDuration(step.command))));
  };
  runRow();
}

window.addEventListener('resize', () => requestAnimationFrame(layoutWaitBlocks));
render();
