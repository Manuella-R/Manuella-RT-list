(() => {
    'use strict';

    /* =====================================================================
       Config
       ===================================================================== */

    // Keys are prefixed because GitHub Pages serves every project of a user
    // from the same origin (username.github.io), so they share localStorage.
    const KEYS = {
        todos: 'justdoit:todos',
        theme: 'justdoit:theme',
        lastReset: 'justdoit:lastReset',
    };
    // Keys used by the first version of the app (migrated once, never deleted).
    const LEGACY = { todos: 'todos', theme: 'savedTheme', lastReset: 'lastResetDate' };

    const THEMES = ['standard', 'light', 'darker'];
    const PRESET_CATEGORIES = ['Work', 'Personal', 'Study', 'Home', 'Health'];
    const MAX_TEXT = 200;
    const MAX_CATEGORY = 24;
    const MAX_TODOS = 500;

    /* =====================================================================
       DOM references
       ===================================================================== */

    const $ = (selector) => document.querySelector(selector);

    const list = $('.todo-list');
    const form = $('.todo-form');
    const taskInput = $('#task-input');
    const categoryInput = $('#category-input');
    const dueInput = $('#due-input');
    const datalist = $('#category-list');
    const filtersEl = $('#filters');
    const counterEl = $('#counter');
    const statusEl = $('#status');
    const emptyEl = $('#empty');
    const clearBtn = $('#clear-completed');
    const sortBtn = $('#sort-due');
    const menu = $('#save-menu');
    const importInput = $('#import-input');
    const titleEl = $('#title');

    /* =====================================================================
       Storage (localStorage can throw, e.g. private mode or blocked cookies)
       ===================================================================== */

    const store = {
        get(key) {
            try { return localStorage.getItem(key); } catch (_) { return null; }
        },
        set(key, value) {
            try { localStorage.setItem(key, value); return true; } catch (_) { return false; }
        },
    };

    /* =====================================================================
       Small helpers
       ===================================================================== */

    const pad = (n) => String(n).padStart(2, '0');
    const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

    function newId() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    }

    function cleanCategory(value) {
        if (typeof value !== 'string') return '';
        return value.replace(/\s+/g, ' ').trim().slice(0, MAX_CATEGORY).trim();
    }

    // Returns the value only if it's a real YYYY-MM-DD calendar date.
    function cleanDate(value) {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
        const [y, m, d] = value.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        const valid = date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
        return valid ? value : '';
    }

    // "work" and "Work" are the same category; reuse whichever spelling exists already.
    function canonicalCategory(name) {
        if (!name) return '';
        const lower = name.toLowerCase();
        const known = [...todos.map((t) => t.category), ...PRESET_CATEGORIES]
            .find((c) => c && c.toLowerCase() === lower);
        return known || name;
    }

    // Turns untrusted input (storage, imported file) into a clean todo, or null.
    function normalize(raw, keepId) {
        if (!raw || typeof raw.text !== 'string') return null;
        const text = raw.text.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT);
        if (!text) return null;
        return {
            id: keepId && typeof raw.id === 'string' && raw.id ? raw.id : newId(),
            text,
            done: raw.done === true,
            category: cleanCategory(raw.category),
            due: cleanDate(raw.due),
        };
    }

    /* =====================================================================
       State
       ===================================================================== */

    let todos = loadTodos();
    let activeFilter = null;   // null = all categories
    let editingId = null;      // id of the todo being edited, if any
    let warnedAboutStorage = false;

    function loadTodos() {
        const raw = store.get(KEYS.todos);

        if (raw !== null) {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    return parsed.map((t) => normalize(t, true)).filter(Boolean).slice(0, MAX_TODOS);
                }
            } catch (_) { /* fall through to an empty list */ }
            return [];
        }

        // First run of this version: bring over tasks saved by the old version
        // (a plain array of strings). The old key is left in place as a backup.
        const legacy = store.get(LEGACY.todos);
        if (legacy) {
            try {
                const parsed = JSON.parse(legacy);
                if (Array.isArray(parsed)) {
                    const migrated = parsed
                        .filter((s) => typeof s === 'string')
                        .map((text) => normalize({ text }))
                        .filter(Boolean);
                    store.set(KEYS.todos, JSON.stringify(migrated));
                    return migrated;
                }
            } catch (_) { /* ignore */ }
        }
        return [];
    }

    function save() {
        const ok = store.set(KEYS.todos, JSON.stringify(todos));
        if (!ok && !warnedAboutStorage) {
            warnedAboutStorage = true;
            say("Couldn't save: your browser is blocking storage, so tasks will be lost when you close this tab. Use \"Save list\" to keep a copy.", 'error');
        }
    }

    const findTodo = (id) => todos.find((t) => t.id === id);
    const findLi = (id) => [...list.children].find((li) => li.dataset.id === id);

    function visibleTodos() {
        if (!activeFilter) return todos;
        const wanted = activeFilter.toLowerCase();
        return todos.filter((t) => t.category && t.category.toLowerCase() === wanted);
    }

    function uniqueCategories() {
        const seen = new Map();
        todos.forEach((t) => {
            if (t.category && !seen.has(t.category.toLowerCase())) {
                seen.set(t.category.toLowerCase(), t.category);
            }
        });
        return [...seen.values()];
    }

    /* =====================================================================
       Status line (replaces alert() for gentle feedback)
       ===================================================================== */

    let statusTimer;
    function say(message, kind = 'info') {
        statusEl.textContent = message;
        statusEl.className = kind;
        clearTimeout(statusTimer);
        statusTimer = setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = '';
        }, 5000);
    }

    /* =====================================================================
       Due-date wording
       ===================================================================== */

    function daysFromToday(dateStr) {
        const [y, m, d] = dateStr.split('-').map(Number);
        const now = new Date();
        const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
        return Math.round((Date.UTC(y, m - 1, d) - today) / 86400000);
    }

    function formatDate(dateStr) {
        const [y, m, d] = dateStr.split('-').map(Number);
        const sameYear = y === new Date().getFullYear();
        return new Date(y, m - 1, d).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: sameYear ? undefined : 'numeric',
        });
    }

    function dueInfo(todo) {
        if (!todo.due) return null;
        const diff = daysFromToday(todo.due);
        let label;
        if (diff === 0) label = 'Due today';
        else if (diff === 1) label = 'Due tomorrow';
        else if (diff === -1) label = 'Due yesterday';
        else if (diff < 0) label = `Overdue since ${formatDate(todo.due)}`;
        else label = `Due ${formatDate(todo.due)}`;

        let cls = '';
        if (!todo.done && diff < 0) cls = 'overdue';
        else if (!todo.done && diff === 0) cls = 'today';
        return { label, cls };
    }

    /* =====================================================================
       Rendering
       ===================================================================== */

    function makeIcon(iconClass) {
        const i = document.createElement('i');
        i.className = iconClass;
        i.setAttribute('aria-hidden', 'true');
        return i;
    }

    function makeButton(className, iconClass, label) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `icon-btn ${className}`;
        b.setAttribute('aria-label', label);
        b.title = label;
        b.appendChild(makeIcon(iconClass));
        return b;
    }

    function makeEditInput(type, value, label, extra = {}) {
        const input = document.createElement('input');
        input.type = type;
        input.className = 'edit-input';
        input.value = value;
        input.setAttribute('aria-label', label);
        Object.entries(extra).forEach(([k, v]) => input.setAttribute(k, v));
        return input;
    }

    function createTodoEl(todo) {
        const li = document.createElement('li');
        li.className = 'todo';
        li.dataset.id = todo.id;
        if (todo.done) li.classList.add('completed');

        const body = document.createElement('div');
        body.className = 'todo-body';
        const actions = document.createElement('div');
        actions.className = 'todo-actions';

        if (todo.id === editingId) {
            li.classList.add('editing');

            const fields = document.createElement('div');
            fields.className = 'edit-fields';
            fields.append(
                makeEditInput('text', todo.text, 'Task text', { maxlength: MAX_TEXT }),
                makeEditInput('text', todo.category, 'Category', { maxlength: MAX_CATEGORY, list: 'category-list', placeholder: 'Category (optional)' }),
                makeEditInput('date', todo.due, 'Due date'),
            );
            body.appendChild(fields);

            actions.append(
                makeButton('save-btn', 'fa-solid fa-floppy-disk', 'Save changes'),
                makeButton('cancel-btn', 'fa-solid fa-xmark', 'Cancel editing'),
            );
            li.append(body, actions);
            return li;
        }

        // Drag handle (mouse, touch and keyboard)
        const handle = document.createElement('button');
        handle.type = 'button';
        handle.className = 'drag-handle';
        handle.setAttribute('aria-label', `Reorder "${todo.text}". Drag, or press the up and down arrow keys.`);
        handle.title = 'Drag to reorder';
        handle.appendChild(makeIcon('fa-solid fa-grip-vertical'));

        const text = document.createElement('span');
        text.className = 'todo-item';
        text.textContent = todo.text;
        body.appendChild(text);

        const info = dueInfo(todo);
        if (todo.category || info) {
            const meta = document.createElement('div');
            meta.className = 'todo-meta';

            if (todo.category) {
                const tag = document.createElement('span');
                tag.className = 'tag';
                tag.append(makeIcon('fa-solid fa-tag'), document.createTextNode(` ${todo.category}`));
                meta.appendChild(tag);
            }
            if (info) {
                const due = document.createElement('span');
                due.className = `due ${info.cls}`.trim();
                due.append(makeIcon('fa-regular fa-calendar'), document.createTextNode(` ${info.label}`));
                meta.appendChild(due);
            }
            body.appendChild(meta);
        }

        const check = makeButton('check-btn', 'fa-solid fa-check', todo.done ? `Mark "${todo.text}" as not done` : `Mark "${todo.text}" as done`);
        check.setAttribute('aria-pressed', String(todo.done));
        const edit = makeButton('edit-btn', 'fa-solid fa-pencil', `Edit "${todo.text}"`);
        const del = makeButton('delete-btn', 'fa-solid fa-trash', `Delete "${todo.text}"`);
        actions.append(check, edit, del);

        li.append(handle, body, actions);
        return li;
    }

    function makeChip(label, value, count) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip';
        chip.dataset.filter = value === null ? '' : value;
        const selected = (value === null && activeFilter === null) ||
            (value !== null && activeFilter !== null && value.toLowerCase() === activeFilter.toLowerCase());
        chip.setAttribute('aria-pressed', String(selected));
        chip.append(document.createTextNode(label + ' '));
        const n = document.createElement('span');
        n.className = 'chip-count';
        n.textContent = count;
        chip.appendChild(n);
        return chip;
    }

    function renderFilters() {
        const categories = uniqueCategories();
        if (activeFilter && !categories.some((c) => c.toLowerCase() === activeFilter.toLowerCase())) {
            activeFilter = null;
        }
        filtersEl.hidden = categories.length === 0;
        filtersEl.replaceChildren(
            makeChip('All', null, todos.length),
            ...categories.map((c) => makeChip(c, c, todos.filter((t) => t.category && t.category.toLowerCase() === c.toLowerCase()).length)),
        );
    }

    function renderDatalist() {
        const names = [...uniqueCategories(), ...PRESET_CATEGORIES];
        const seen = new Set();
        const options = [];
        names.forEach((name) => {
            const key = name.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            const option = document.createElement('option');
            option.value = name;
            options.push(option);
        });
        datalist.replaceChildren(...options);
    }

    function renderList() {
        const visible = visibleTodos();
        list.replaceChildren(...visible.map(createTodoEl));

        if (todos.length === 0) {
            emptyEl.textContent = 'Nothing here yet. Add your first task above.';
            emptyEl.hidden = false;
        } else if (visible.length === 0) {
            emptyEl.textContent = 'No tasks in this category.';
            emptyEl.hidden = false;
        } else {
            emptyEl.hidden = true;
        }
    }

    function renderCounter() {
        const done = todos.filter((t) => t.done).length;
        counterEl.textContent = todos.length === 0 ? 'No tasks yet' : `${done} of ${todos.length} done`;
        clearBtn.disabled = done === 0;
        sortBtn.disabled = !todos.some((t) => t.due);
    }

    // Re-rendering replaces DOM nodes, so remember what had focus and restore it.
    function captureFocus() {
        const active = document.activeElement;
        if (!active) return null;
        if (active.classList && active.classList.contains('chip')) {
            return { type: 'chip', filter: active.dataset.filter };
        }
        const li = active.closest && active.closest('.todo');
        if (li && list.contains(li)) {
            const cls = ['check-btn', 'edit-btn', 'delete-btn', 'drag-handle', 'save-btn', 'cancel-btn']
                .find((c) => active.classList.contains(c));
            if (cls) return { type: 'todo', id: li.dataset.id, cls };
        }
        return null;
    }

    function restoreFocus(key) {
        if (!key) return;
        let target = null;
        if (key.type === 'chip') {
            target = [...filtersEl.children].find((c) => c.dataset.filter === key.filter);
        } else {
            const li = findLi(key.id);
            target = li && li.querySelector(`.${key.cls}`);
        }
        if (target) target.focus();
    }

    function focusTodo(id, cls) {
        const li = findLi(id);
        const target = li && li.querySelector(`.${cls}`);
        if (target) target.focus();
    }

    function render() {
        const focusKey = captureFocus();
        renderFilters();
        renderDatalist();
        renderList();
        renderCounter();
        restoreFocus(focusKey);
    }

    /* =====================================================================
       Actions
       ===================================================================== */

    function addTodo() {
        const text = taskInput.value.replace(/\s+/g, ' ').trim();
        if (!text) {
            say('You must write something!', 'error');
            taskInput.focus();
            return;
        }
        if (todos.length >= MAX_TODOS) {
            say(`That's the maximum of ${MAX_TODOS} tasks. Clear some completed ones first.`, 'error');
            return;
        }

        const todo = normalize({
            text,
            category: canonicalCategory(cleanCategory(categoryInput.value)),
            due: dueInput.value,
        });
        todos.push(todo);
        save();

        taskInput.value = '';
        categoryInput.value = '';
        dueInput.value = '';

        const hidden = activeFilter && (!todo.category || todo.category.toLowerCase() !== activeFilter.toLowerCase());
        render();
        if (hidden) {
            say(`Added to ${todo.category ? `"${todo.category}"` : 'no category'}. It's hidden by the current filter.`);
        }
        taskInput.focus();
    }

    function toggleDone(id) {
        const todo = findTodo(id);
        if (!todo) return;
        todo.done = !todo.done;
        save();
        render();
    }

    function startEdit(id) {
        editingId = id;
        render();
        const li = findLi(id);
        const input = li && li.querySelector('.edit-input');
        if (input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        }
    }

    function cancelEdit(id) {
        editingId = null;
        render();
        focusTodo(id, 'edit-btn');
    }

    function saveEdit(id) {
        const todo = findTodo(id);
        const li = findLi(id);
        if (!todo || !li) return;

        const [textInput, categoryField, dueField] = li.querySelectorAll('.edit-input');
        const text = textInput.value.replace(/\s+/g, ' ').trim();
        if (!text) {
            say("A task can't be empty.", 'error');
            textInput.focus();
            return;
        }

        todo.text = text.slice(0, MAX_TEXT);
        todo.category = canonicalCategory(cleanCategory(categoryField.value));
        todo.due = cleanDate(dueField.value);
        editingId = null;
        save();
        render();
        focusTodo(id, 'edit-btn');
    }

    function deleteTodo(id) {
        const todo = findTodo(id);
        const li = findLi(id);
        if (!todo || !li) return;
        if (!confirm(`Are you sure you want to delete "${todo.text}"?`)) return;

        let finished = false;
        const finish = () => {
            if (finished) return;
            finished = true;
            todos = todos.filter((t) => t.id !== id);
            if (editingId === id) editingId = null;
            save();
            render();
        };

        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            finish();
            return;
        }
        li.classList.add('fall');
        li.addEventListener('transitionend', (e) => {
            if (e.target === li && e.propertyName === 'transform') finish();
        });
        setTimeout(finish, 700); // safety net if transitionend never fires
    }

    function clearCompleted() {
        const done = todos.filter((t) => t.done).length;
        if (!done) return;
        if (!confirm(`Remove ${plural(done, 'completed task')}?`)) return;
        todos = todos.filter((t) => !t.done);
        editingId = null;
        save();
        render();
        say(`Removed ${plural(done, 'completed task')}.`);
    }

    function sortByDue() {
        todos.sort((a, b) => (a.due || '9999-99-99').localeCompare(b.due || '9999-99-99'));
        save();
        render();
        say('Sorted by due date. Tasks without a date are at the bottom.');
    }

    /* =====================================================================
       Reordering: pointer drag (mouse + touch) and keyboard arrows
       ===================================================================== */

    // Writes a new order for the *visible* tasks back into the full list,
    // keeping hidden tasks (other categories) in their original slots.
    function applyVisibleOrder(ids) {
        const visibleSet = new Set(ids);
        const byId = new Map(todos.map((t) => [t.id, t]));
        const slots = [];
        todos.forEach((t, index) => { if (visibleSet.has(t.id)) slots.push(index); });
        const next = todos.slice();
        slots.forEach((slot, k) => { next[slot] = byId.get(ids[k]); });
        todos = next;
    }

    let drag = null;

    function onDragMove(e) {
        if (!drag) return;

        // Gentle auto-scroll near the top/bottom edge of the screen
        if (e.clientY < 70) window.scrollBy(0, -12);
        else if (e.clientY > window.innerHeight - 70) window.scrollBy(0, 12);

        const others = [...list.children].filter((el) => el !== drag.li);
        const next = others.find((el) => {
            const r = el.getBoundingClientRect();
            return e.clientY < r.top + r.height / 2;
        });
        if (next) {
            if (drag.li.nextElementSibling !== next) list.insertBefore(drag.li, next);
        } else if (list.lastElementChild !== drag.li) {
            list.appendChild(drag.li);
        }
    }

    function onDragEnd() {
        if (!drag) return;
        document.removeEventListener('pointermove', onDragMove);
        document.removeEventListener('pointerup', onDragEnd);
        document.removeEventListener('pointercancel', onDragEnd);
        document.body.classList.remove('is-dragging');
        drag.li.classList.remove('dragging');

        const id = drag.li.dataset.id;
        const ids = [...list.children].map((el) => el.dataset.id);
        drag = null;

        applyVisibleOrder(ids);
        save();
        render();
        focusTodo(id, 'drag-handle');
    }

    list.addEventListener('pointerdown', (e) => {
        const handle = e.target.closest('.drag-handle');
        if (!handle) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();

        drag = { li: handle.closest('.todo') };
        drag.li.classList.add('dragging');
        document.body.classList.add('is-dragging');
        document.addEventListener('pointermove', onDragMove);
        document.addEventListener('pointerup', onDragEnd);
        document.addEventListener('pointercancel', onDragEnd);
    });

    /* =====================================================================
       Saving a copy: download as .txt / .csv / .json, restore from .json
       ===================================================================== */

    function csvCell(value) {
        let v = String(value);
        // Stop spreadsheet apps from running a task like "=1+1" as a formula
        if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
        return `"${v.replace(/"/g, '""')}"`;
    }

    function buildFile(kind) {
        if (kind === 'csv') {
            const rows = [['Task', 'Category', 'Due date', 'Status']];
            todos.forEach((t) => rows.push([t.text, t.category, t.due, t.done ? 'Done' : 'To do']));
            return {
                ext: 'csv',
                mime: 'text/csv',
                // BOM so Excel opens non-English characters correctly
                content: '\uFEFF' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n'),
            };
        }
        if (kind === 'json') {
            return {
                ext: 'json',
                mime: 'application/json',
                content: JSON.stringify({
                    app: 'just-do-it',
                    version: 2,
                    exportedAt: new Date().toISOString(),
                    todos: todos.map(({ text, done, category, due }) => ({ text, done, category, due })),
                }, null, 2),
            };
        }
        const lines = ['Just do it. - my to-do list', `Saved ${new Date().toLocaleString()}`, ''];
        todos.forEach((t) => {
            let line = `[${t.done ? 'x' : ' '}] ${t.text}`;
            if (t.category) line += `  [${t.category}]`;
            if (t.due) line += `  (due ${t.due})`;
            lines.push(line);
        });
        return { ext: 'txt', mime: 'text/plain', content: lines.join('\n') + '\n' };
    }

    function download(kind) {
        if (todos.length === 0) {
            say('Nothing to download yet. Add a task first.', 'error');
            return;
        }
        const file = buildFile(kind);
        const blob = new Blob([file.content], { type: `${file.mime};charset=utf-8` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `just-do-it-${toDateStr(new Date())}.${file.ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        say(`Saved ${plural(todos.length, 'task')} as .${file.ext}`);
    }

    async function importFile(file) {
        try {
            if (file.size > 1000000) throw new Error('too large');
            const data = JSON.parse(await file.text());
            const rawItems = Array.isArray(data) ? data : data && data.todos;
            if (!Array.isArray(rawItems)) throw new Error('unexpected format');

            const items = rawItems
                .map((x) => (typeof x === 'string' ? normalize({ text: x }) : normalize(x)))
                .filter(Boolean)
                .slice(0, Math.max(0, MAX_TODOS - todos.length));
            if (items.length === 0) throw new Error('nothing to import');

            if (!confirm(`Add ${plural(items.length, 'task')} from "${file.name}" to your list?`)) return;

            items.forEach((item) => {
                item.category = canonicalCategory(item.category);
                todos.push(item);
            });
            save();
            render();
            say(`Added ${plural(items.length, 'task')} from your backup.`);
        } catch (_) {
            say("Couldn't read that file. Use a .json backup downloaded from this app.", 'error');
        }
    }

    /* =====================================================================
       Themes
       ===================================================================== */

    function setTheme(name, persist) {
        if (!THEMES.includes(name)) name = 'standard';
        document.body.className = name;
        titleEl.classList.toggle('darker-title', name === 'darker');
        document.querySelectorAll('.theme-selector').forEach((btn) => {
            btn.setAttribute('aria-pressed', String(btn.dataset.theme === name));
        });
        if (persist) store.set(KEYS.theme, name);
    }

    /* =====================================================================
       New-day prompt
       ===================================================================== */

    function checkNewDay() {
        const today = toDateStr(new Date());
        let last = store.get(KEYS.lastReset);
        if (!last) {
            const legacy = store.get(LEGACY.lastReset);
            const d = legacy ? new Date(legacy) : null;
            last = d && !isNaN(d) ? toDateStr(d) : null;
        }
        if (last === today) return;

        store.set(KEYS.lastReset, today);
        const done = todos.filter((t) => t.done).length;
        if (last && done > 0 &&
            confirm(`It's a new day! Clear the ${plural(done, 'completed task')} from before? Unfinished tasks will stay.`)) {
            todos = todos.filter((t) => !t.done);
            save();
            render();
        }
    }

    /* =====================================================================
       Location display (asks the browser for permission; optional)
       ===================================================================== */

    function showLocation() {
        const el = $('#location');
        if (!el || !navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
                .then((response) => {
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return response.json();
                })
                .then((data) => {
                    const place = [data.city || data.locality, data.countryName].filter(Boolean).join(', ');
                    el.textContent = place;
                })
                .catch((error) => {
                    console.error('Error fetching location data:', error);
                    el.textContent = '';
                });
        }, (error) => {
            // Denied = stay quiet; anything else = a short note
            el.textContent = error.code === error.PERMISSION_DENIED ? '' : 'Location unavailable.';
        });
    }

    /* =====================================================================
       Event wiring
       ===================================================================== */

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        addTodo();
    });

    list.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        const li = btn && btn.closest('.todo');
        if (!btn || !li) return;
        const id = li.dataset.id;

        if (btn.classList.contains('check-btn')) toggleDone(id);
        else if (btn.classList.contains('edit-btn')) startEdit(id);
        else if (btn.classList.contains('save-btn')) saveEdit(id);
        else if (btn.classList.contains('cancel-btn')) cancelEdit(id);
        else if (btn.classList.contains('delete-btn')) deleteTodo(id);
    });

    list.addEventListener('keydown', (e) => {
        const li = e.target.closest && e.target.closest('.todo');
        if (!li) return;
        const id = li.dataset.id;

        // Editing: Enter saves, Escape cancels
        if (e.target.classList.contains('edit-input')) {
            if (e.key === 'Enter') { e.preventDefault(); saveEdit(id); }
            else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(id); }
            return;
        }

        // Reordering with the keyboard
        if (e.target.classList.contains('drag-handle') && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            e.preventDefault();
            const ids = visibleTodos().map((t) => t.id);
            const from = ids.indexOf(id);
            const to = from + (e.key === 'ArrowUp' ? -1 : 1);
            if (from < 0 || to < 0 || to >= ids.length) return;
            [ids[from], ids[to]] = [ids[to], ids[from]];
            applyVisibleOrder(ids);
            save();
            render();
            focusTodo(id, 'drag-handle');
            say(`Moved to position ${to + 1} of ${ids.length}.`);
        }
    });

    filtersEl.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        activeFilter = chip.dataset.filter === '' ? null : chip.dataset.filter;
        editingId = null;
        render();
    });

    clearBtn.addEventListener('click', clearCompleted);
    sortBtn.addEventListener('click', sortByDue);

    document.querySelectorAll('.theme-selector').forEach((btn) => {
        btn.addEventListener('click', () => setTheme(btn.dataset.theme, true));
    });

    menu.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        menu.open = false;
        const action = btn.dataset.action;
        if (action === 'import') importInput.click();
        else download(action);
    });
    menu.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.open) {
            menu.open = false;
            menu.querySelector('summary').focus();
        }
    });
    document.addEventListener('click', (e) => {
        if (menu.open && !menu.contains(e.target)) menu.open = false;
    });

    importInput.addEventListener('change', () => {
        const file = importInput.files && importInput.files[0];
        importInput.value = '';
        if (file) importFile(file);
    });

    /* =====================================================================
       Start
       ===================================================================== */

    // Theme: new key first, then the old one from the previous version
    let initialTheme = store.get(KEYS.theme);
    if (!initialTheme) {
        initialTheme = store.get(LEGACY.theme);
        if (THEMES.includes(initialTheme)) store.set(KEYS.theme, initialTheme);
    }
    setTheme(initialTheme, false);

    render();
    showLocation();
    // Let the page paint before any confirm() dialog appears
    setTimeout(checkNewDay, 400);
})();
