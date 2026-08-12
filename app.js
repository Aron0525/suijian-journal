const STORAGE_KEY = 'suijian-calendar-journal-v1';
const DRAFT_PREFIX = 'suijian-draft-';
const AI_CONFIG_KEY = 'suijian-ai-config-v1';
const CLOUD_CONFIG_KEY = 'suijian-supabase-config-v1';
const CLOUD_SESSION_KEY = 'suijian-supabase-session-v1';
const CLOUD_ACTIVITY_KEY = 'suijian-cloud-activity-v1';
const DEFAULT_SUPABASE_URL = 'https://ekotpodfgbkcykfcewmc.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3TEgVHOwGufdfu_DHcvGLg_XD0tXovA';
const MAX_PERIOD_INPUT_CHARS = 60000;
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const MAX_ENTRY_TITLE_CHARS = 80;
const MAX_ENTRY_CONTENT_CHARS = 10000;
const MAX_SUMMARY_CHARS = 60000;
const SESSION_REMEMBER_MS = 2 * 24 * 60 * 60 * 1000;
const AUTO_SYNC_INTERVAL_MS = 10 * 60 * 1000;
const MOBILE_OTA_MANIFEST_URL = 'https://aron0525.github.io/suijian-journal/app-update.json';
const MOBILE_OTA_CHECK_INTERVAL_MS = 10 * 60 * 1000;
let runtimeAiApiKey = '';
const DEFAULT_ORGANIZE_PROMPT = `你是一名日记整理助手。请将我输入的口语化、杂乱、跳跃、逻辑不完整的内容，整理成自然、清晰、易读的日记。

要求：
1. 保留原意、情绪和关键事实，优先保持原有表达顺序。
2. 修正语病、错别字、重复表达和混乱语序，使语言自然流畅。
3. 只有在内容明显混乱、前后矛盾或难以理解时，才进行必要的逻辑调整。
4. 不强制套用固定结构；原文没有感受、原因、总结或计划时，直接省略。
5. 不擅自编造经历、人物、时间或细节。信息不足或存在矛盾时，用【待确认：……】标记。
6. 直接输出整理后的日记，不需要解释修改过程。

我的原始内容：
{{输入内容}}`;
const DEFAULT_SUMMARY_PROMPT = `你是一名日记总结助手。请阅读我提供的一段时间内的多篇日记或记录，提炼其中真正重要的信息，生成一份简洁、清晰的阶段总结。

要求：
1. 只基于原始内容总结，不编造未出现的人物、事件、原因或结论。
2. 合并重复内容，保留反复出现的主题、重要事件、情绪变化、进展、困扰和计划。
3. 按内容自然归类，不强制使用固定结构。
4. 重点说明：这段时间记录了什么、我主要在关注什么、有哪些变化或未解决的问题。
5. 语言自然、准确、有条理，避免逐篇复述日记。
6. 信息不足或存在矛盾时，用【待确认：……】标记。
7. 不修改、评价或替换原始日记内容，只输出独立总结。

输出格式：
阶段总结：
【用 3～8 段或要点概括核心内容】

关键词：
【列出 3～8 个关键词】

原始记录：
{{输入内容}}`;
const LEGACY_SUMMARY_PROMPTS = new Set([
  '你是中文日记汇总助手。严格依据给定日记，提炼主要事件、反复出现的主题、情绪变化、已做决定和待跟进事项；涉及日期时尽量标注相关日期。不要改写、删除或推断原日记没有的事实。用清晰的项目符号输出。',
]);
const LEGACY_ORGANIZE_PROMPTS = new Set([
  '你是中文日记编辑助手。请在不改变事实、情绪和第一人称语气的前提下，理顺句子和段落结构，修正错别字、标点、病句与明显的语序问题。不要增加新信息或解释。只输出整理后的日记正文。',
  '你是中文日记纠错助手。请在不改变事实、情绪、第一人称和叙事顺序的前提下，只修正错别字、标点、病句和明显的语序问题。不要增加新信息，不要解释修改原因。只输出修正后的日记正文。',
]);
const dateFormatter = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
const timeFormatter = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

const state = {
  data: loadData(),
  activeDate: localDateKey(),
  view: 'today',
  visibleMonth: startOfMonth(new Date()),
  busy: false,
  promptEditorType: 'organize',
  archiveJumpDate: '',
  cloud: { session: loadCloudSession(), activity: loadCloudActivity(), syncing: false, syncPromise: null, syncTimer: 0, autoSyncTimer: 0 },
  nativeUpdate: { checking: false, timer: 0, readyPromise: null },
};

const elements = {
  views: document.querySelectorAll('.view'),
  navLinks: document.querySelectorAll('.nav-link'),
  dateLabel: document.querySelector('#date-label'),
  entryCount: document.querySelector('#entry-count'),
  goToday: document.querySelector('#go-today'),
  entryTitle: document.querySelector('#entry-title'),
  entryContent: document.querySelector('#entry-content'),
  wordCount: document.querySelector('#word-count'),
  draftStatus: document.querySelector('#draft-status'),
  clearDraft: document.querySelector('#clear-draft'),
  organizeDraft: document.querySelector('#organize-draft'),
  editOrganizePrompt: document.querySelector('#edit-organize-prompt'),
  editorAiResult: document.querySelector('#editor-ai-result'),
  editorAiContent: document.querySelector('#editor-ai-content'),
  applyAiSuggestion: document.querySelector('#apply-ai-suggestion'),
  dismissAiSuggestion: document.querySelector('#dismiss-ai-suggestion'),
  saveEntry: document.querySelector('#save-entry'),
  entryList: document.querySelector('#entry-list'),
  newEntryFocus: document.querySelector('#new-entry-focus'),
  summarizeDay: document.querySelector('#summarize-day'),
  editSummaryPrompt: document.querySelector('#edit-summary-prompt'),
  daySummary: document.querySelector('#day-summary'),
  previousMonth: document.querySelector('#previous-month'),
  nextMonth: document.querySelector('#next-month'),
  monthLabel: document.querySelector('#month-label'),
  calendarGrid: document.querySelector('#calendar-grid'),
  calendarArchiveList: document.querySelector('#calendar-archive-list'),
  calendarArchiveCount: document.querySelector('#calendar-archive-count'),
  writingStreak: document.querySelector('#writing-streak'),
  writingMonthDays: document.querySelector('#writing-month-days'),
  writingTotalDays: document.querySelector('#writing-total-days'),
  archiveJumpDate: document.querySelector('#archive-jump-date'),
  archiveJumpButton: document.querySelector('#archive-jump-button'),
  calendarFilterStatus: document.querySelector('#calendar-filter-status'),
  periodStart: document.querySelector('#period-start'),
  periodEnd: document.querySelector('#period-end'),
  periodEntryCount: document.querySelector('#period-entry-count'),
  summarizePeriod: document.querySelector('#summarize-period'),
  editPeriodSummaryPrompt: document.querySelector('#edit-period-summary-prompt'),
  periodSummaryList: document.querySelector('#period-summary-list'),
  searchInput: document.querySelector('#search-input'),
  searchResults: document.querySelector('#search-results'),
  summaryPanelButton: document.querySelector('#summary-panel-button'),
  searchPanelButton: document.querySelector('#search-panel-button'),
  cloudSyncButton: document.querySelector('#cloud-sync-button'),
  cloudAccountButton: document.querySelector('#cloud-account-button'),
  accountDialog: document.querySelector('#account-dialog'),
  closeAccountDialog: document.querySelector('#close-account-dialog'),
  accountDialogCopy: document.querySelector('#account-dialog-copy'),
  syncDialog: document.querySelector('#sync-dialog'),
  closeSyncDialog: document.querySelector('#close-sync-dialog'),
  syncDialogCopy: document.querySelector('#sync-dialog-copy'),
  syncAccountBrief: document.querySelector('#sync-account-brief'),
  syncAccountMessage: document.querySelector('#sync-account-message'),
  syncLoginRequired: document.querySelector('#sync-login-required'),
  syncActivePanel: document.querySelector('#sync-active-panel'),
  syncOpenAccount: document.querySelector('#sync-open-account'),
  syncAuthForm: document.querySelector('#sync-auth-form'),
  syncEmail: document.querySelector('#sync-email'),
  syncPassword: document.querySelector('#sync-password'),
  syncSignIn: document.querySelector('#sync-sign-in'),
  syncSignUp: document.querySelector('#sync-sign-up'),
  syncSignedIn: document.querySelector('#sync-signed-in'),
  syncAccountStatus: document.querySelector('#sync-account-status'),
  syncAccountEmail: document.querySelector('#sync-account-email'),
  syncAuthCopy: document.querySelector('#sync-auth-copy'),
  syncLastSession: document.querySelector('#sync-last-session'),
  syncActivityList: document.querySelector('#sync-activity-list'),
  clearSyncActivity: document.querySelector('#clear-sync-activity'),
  syncNowButton: document.querySelector('#sync-now-button'),
  syncSignOut: document.querySelector('#sync-sign-out'),
  periodSummaryDialog: document.querySelector('#period-summary-dialog'),
  closePeriodSummaryDialog: document.querySelector('#close-period-summary-dialog'),
  searchDialog: document.querySelector('#search-dialog'),
  closeSearchDialog: document.querySelector('#close-search-dialog'),
  exportButton: document.querySelector('#export-button'),
  importInput: document.querySelector('#import-input'),
  modelConfigButton: document.querySelector('#model-config-button'),
  aiConfigDialog: document.querySelector('#ai-config-dialog'),
  aiConfigForm: document.querySelector('#ai-config-form'),
  aiEndpoint: document.querySelector('#ai-endpoint'),
  aiModel: document.querySelector('#ai-model'),
  aiApiKey: document.querySelector('#ai-api-key'),
  aiOrganizePrompt: document.querySelector('#ai-organize-prompt'),
  aiOrganizePromptCount: document.querySelector('#ai-organize-prompt-count'),
  restoreOrganizePrompt: document.querySelector('#restore-organize-prompt'),
  aiSummaryPrompt: document.querySelector('#ai-summary-prompt'),
  aiSummaryPromptCount: document.querySelector('#ai-summary-prompt-count'),
  restoreSummaryPrompt: document.querySelector('#restore-summary-prompt'),
  closeAiConfig: document.querySelector('#close-ai-config'),
  removeAiConfig: document.querySelector('#remove-ai-config'),
  promptEditorDialog: document.querySelector('#prompt-editor-dialog'),
  promptEditorForm: document.querySelector('#prompt-editor-form'),
  promptEditorKicker: document.querySelector('#prompt-editor-kicker'),
  promptEditorTitle: document.querySelector('#prompt-editor-title'),
  promptEditorCopy: document.querySelector('#prompt-editor-copy'),
  promptEditorLabel: document.querySelector('#prompt-editor-label'),
  promptEditorInput: document.querySelector('#prompt-editor-input'),
  promptEditorCount: document.querySelector('#prompt-editor-count'),
  closePromptEditor: document.querySelector('#close-prompt-editor'),
  restorePromptEditor: document.querySelector('#restore-prompt-editor'),
  syncStatus: document.querySelector('#sync-status'),
  toast: document.querySelector('#toast'),
  entryTemplate: document.querySelector('#entry-template'),
  periodSummaryTemplate: document.querySelector('#period-summary-template'),
};

function emptyCloudMeta() {
  return { accountId: '', dirty: { entries: [], dailySummaries: [], periodSummaries: [] } };
}

function loadCloudActivity() {
  try {
    const value = JSON.parse(localStorage.getItem(CLOUD_ACTIVITY_KEY));
    if (!Array.isArray(value)) return [];
    return value
      .filter((item) => item && typeof item.message === 'string' && typeof item.at === 'string')
      .slice(0, 8);
  } catch {
    return [];
  }
}

function persistCloudActivity() {
  try {
    localStorage.setItem(CLOUD_ACTIVITY_KEY, JSON.stringify(state.cloud.activity));
  } catch {
    // Account activity is supplementary; journal persistence stays independent.
  }
}

function recordCloudActivity(message, type = 'info') {
  state.cloud.activity.unshift({ at: new Date().toISOString(), message, type });
  state.cloud.activity = state.cloud.activity.slice(0, 8);
  persistCloudActivity();
  renderCloudActivity();
}

function clearCloudActivity() {
  state.cloud.activity = [];
  localStorage.removeItem(CLOUD_ACTIVITY_KEY);
  renderCloudActivity();
}

function renderCloudActivity() {
  if (!elements?.syncActivityList) return;
  elements.syncActivityList.replaceChildren();
  if (!state.cloud.activity.length) {
    const empty = document.createElement('li');
    empty.className = 'sync-activity-empty';
    empty.textContent = '这里会记录登录、注册和手动同步结果。';
    elements.syncActivityList.append(empty);
    return;
  }
  state.cloud.activity.forEach((item) => {
    const row = document.createElement('li');
    const time = document.createElement('time');
    const message = document.createElement('span');
    const date = new Date(item.at);
    time.dateTime = item.at;
    time.textContent = Number.isNaN(date.getTime()) ? '刚刚' : timeFormatter.format(date);
    message.textContent = item.message;
    row.append(time, message);
    elements.syncActivityList.append(row);
  });
}

function normalizeCloudMeta(value) {
  const dirty = value?.dirty && typeof value.dirty === 'object' ? value.dirty : {};
  return {
    accountId: typeof value?.accountId === 'string' ? value.accountId : '',
    dirty: {
      entries: Array.isArray(dirty.entries) ? [...new Set(dirty.entries.filter(Boolean))] : [],
      dailySummaries: Array.isArray(dirty.dailySummaries) ? [...new Set(dirty.dailySummaries.filter(Boolean))] : [],
      periodSummaries: Array.isArray(dirty.periodSummaries) ? [...new Set(dirty.periodSummaries.filter(Boolean))] : [],
    },
  };
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : { entries: [], summaries: {}, periodSummaries: [] };
    return {
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      summaries: parsed.summaries && typeof parsed.summaries === 'object' ? parsed.summaries : {},
      periodSummaries: Array.isArray(parsed.periodSummaries) ? parsed.periodSummaries : [],
      cloudSync: normalizeCloudMeta(parsed.cloudSync),
    };
  } catch {
    return { entries: [], summaries: {}, periodSummaries: [], cloudSync: emptyCloudMeta() };
  }
}

function persistData({ queue = true } = {}) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  } catch (error) {
    console.error('Failed to persist journal data', error);
    showToast('本地存储空间不足，未保存本次更改；请先导出并清理浏览器空间');
    return false;
  }
  renderSyncStatus();
  if (queue) queueCloudSync();
  return true;
}

function persistDataChange(change, options) {
  const previous = structuredClone(state.data);
  change();
  if (persistData(options)) return true;
  state.data = previous;
  render();
  return false;
}

function localDateKey(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function parseDateKey(key) {
  return new Date(`${key}T12:00:00`);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function dateKeyFromParts(year, month, day) {
  return localDateKey(new Date(year, month, day, 12));
}

function entriesForDate(dateKey) {
  return state.data.entries
    .filter((entry) => !entry.deletedAt && entry.date === dateKey)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function entriesForPeriod(start, end) {
  return state.data.entries
    .filter((entry) => !entry.deletedAt && entry.date >= start && entry.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date) || new Date(a.createdAt) - new Date(b.createdAt));
}

function writingRhythm() {
  const recordedDates = new Set(
    state.data.entries
      .filter((entry) => !entry.deletedAt && isDateKey(entry.date))
      .map((entry) => entry.date)
  );
  const today = localDateKey();
  const month = today.slice(0, 7);
  const cursor = parseDateKey(today);
  if (!recordedDates.has(today)) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (recordedDates.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    streak,
    monthDays: [...recordedDates].filter((date) => date.startsWith(month)).length,
    totalDays: recordedDates.size,
  };
}

function draftKey() {
  return `${DRAFT_PREFIX}${state.activeDate}`;
}

function loadDraft() {
  const raw = localStorage.getItem(draftKey());
  if (!raw) return { title: '', content: '', aiSuggestion: '', aiOriginal: '', originalContent: '' };
  try {
    const draft = JSON.parse(raw);
    return { title: '', content: '', aiSuggestion: '', aiOriginal: '', originalContent: '', ...draft };
  } catch {
    return { title: '', content: '', aiSuggestion: '', aiOriginal: '', originalContent: '' };
  }
}

function saveDraftObject(draft, message = '草稿已保存') {
  localStorage.setItem(draftKey(), JSON.stringify(draft));
  elements.draftStatus.textContent = message;
  updateWordCount();
}

function saveDraft() {
  const previous = loadDraft();
  const content = elements.entryContent.value;
  const title = elements.entryTitle.value;
  const isSuggestionStale = previous.aiSuggestion && previous.aiOriginal !== content;
  const draft = {
    ...previous,
    title,
    content,
    aiSuggestion: isSuggestionStale ? '' : previous.aiSuggestion,
    aiOriginal: isSuggestionStale ? '' : previous.aiOriginal,
  };
  saveDraftObject(draft);
  renderEditorAiSuggestion(draft);
}

function render() {
  renderToday();
  renderCalendar();
  renderWritingRhythm();
  renderCalendarArchive();
  renderPeriodPanel();
  renderPeriodSummaries();
  renderSearchResults();
  updateActiveView();
}

function renderWritingRhythm() {
  const rhythm = writingRhythm();
  elements.writingStreak.textContent = `${rhythm.streak} 天`;
  elements.writingMonthDays.textContent = `${rhythm.monthDays} 天`;
  elements.writingTotalDays.textContent = `${rhythm.totalDays} 天`;
}

function renderToday() {
  const date = parseDateKey(state.activeDate);
  const isToday = state.activeDate === localDateKey();
  elements.dateLabel.textContent = isToday ? `今天 · ${dateFormatter.format(date)}` : dateFormatter.format(date);
  const count = entriesForDate(state.activeDate).length;
  elements.entryCount.textContent = `${count} 条记录`;
  const draft = loadDraft();
  elements.entryTitle.value = draft.title;
  elements.entryContent.value = draft.content;
  renderEditorAiSuggestion(draft);
  updateWordCount();
}

function renderEditorAiSuggestion(draft) {
  const hasSuggestion = Boolean(draft.aiSuggestion && draft.aiOriginal === draft.content);
  elements.editorAiResult.hidden = !hasSuggestion;
  if (hasSuggestion) elements.editorAiContent.textContent = draft.aiSuggestion;
}

function renderEntries() {
  const entries = entriesForDate(state.activeDate);
  elements.entryList.replaceChildren();
  if (!entries.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = '这一天还没有留下文字。先写一句也好。';
    elements.entryList.append(empty);
    return;
  }

  entries.forEach((entry) => {
    const fragment = elements.entryTemplate.content.cloneNode(true);
    fragment.querySelector('.entry-time').textContent = timeFormatter.format(new Date(entry.createdAt));
    fragment.querySelector('.entry-card-title').textContent = entry.title || '未命名片段';
    fragment.querySelector('.entry-content').textContent = entry.content;
    const originalVersion = fragment.querySelector('.original-version');
    if (entry.originalContent) {
      originalVersion.hidden = false;
      fragment.querySelector('.original-content').textContent = entry.originalContent;
    }

    fragment.querySelector('.entry-delete').addEventListener('click', () => {
      if (!window.confirm('删除这条记录？此操作会立即更新本地数据。')) return;
      const now = new Date().toISOString();
      if (!persistDataChange(() => {
        entry.deletedAt = now;
        entry.updatedAt = now;
        markCloudDirty('entries', entry.id);
        invalidateDailySummary(state.activeDate, now);
      })) return;
      render();
      showToast('记录已删除');
    });
    elements.entryList.append(fragment);
  });
}

function renderSummary() {
  const summary = summaryForDate(state.activeDate);
  if (!summary || summary.deletedAt) {
    elements.daySummary.className = 'summary-empty';
    elements.daySummary.textContent = '写下第一条记录后，可以在这里生成当天摘要。';
    return;
  }
  elements.daySummary.className = 'summary-content';
  elements.daySummary.textContent = typeof summary === 'string' ? summary : summary.content;
}

function renderCalendar() {
  const year = state.visibleMonth.getFullYear();
  const month = state.visibleMonth.getMonth();
  elements.monthLabel.textContent = `${year} 年 ${month + 1} 月`;
  elements.calendarGrid.replaceChildren();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - firstWeekday);
  const todayKey = localDateKey();

  for (let index = 0; index < 42; index += 1) {
    const current = new Date(gridStart);
    current.setDate(gridStart.getDate() + index);
    const key = dateKeyFromParts(current.getFullYear(), current.getMonth(), current.getDate());
    const count = entriesForDate(key).length;
    const button = document.createElement('button');
    button.className = 'calendar-day';
    button.type = 'button';
    button.setAttribute('role', 'gridcell');
    button.setAttribute('aria-label', `${key}${count ? `，${count} 条记录` : ''}`);
    if (current.getMonth() !== month) button.classList.add('other-month');
    if (key === (state.archiveJumpDate || state.activeDate)) button.classList.add('active-date');
    if (key === todayKey) button.classList.add('today-date');
    button.innerHTML = `<span class="day-number">${current.getDate()}</span>${count ? `<span class="entry-ink"></span><span class="entry-mini-count">${count}</span>` : ''}`;
    button.addEventListener('click', () => {
      jumpToArchiveDate(key);
    });
    elements.calendarGrid.append(button);
  }
}

function calendarArchiveEntries() {
  return [...state.data.entries]
    .filter((entry) => !entry.deletedAt)
    .sort((a, b) => b.date.localeCompare(a.date) || new Date(b.createdAt) - new Date(a.createdAt));
}

function renderCalendarArchive() {
  const entries = calendarArchiveEntries();
  elements.calendarArchiveCount.textContent = `${entries.length} 条记录`;
  elements.calendarFilterStatus.textContent = `全部日记 · ${entries.length} 条 · 按时间从新到旧排列`;
  elements.calendarArchiveList.replaceChildren();
  if (!entries.length) {
    const empty = document.createElement('p');
    empty.className = 'calendar-archive-empty';
    empty.textContent = '还没有日记记录。';
    elements.calendarArchiveList.append(empty);
    return;
  }
  const entriesByDate = new Map();
  entries.forEach((entry) => {
    const dayEntries = entriesByDate.get(entry.date) || [];
    dayEntries.push(entry);
    entriesByDate.set(entry.date, dayEntries);
  });
  entriesByDate.forEach((dayEntries, date) => {
    const group = document.createElement('section');
    group.className = 'calendar-day-group';
    group.dataset.archiveDate = date;
    const dayHead = document.createElement('div');
    dayHead.className = 'calendar-day-group-head';
    const dayLabel = document.createElement('h2');
    const day = parseDateKey(date);
    dayLabel.textContent = `${day.getMonth() + 1}月${day.getDate()}日`;
    const dot = document.createElement('span');
    dot.className = 'calendar-day-dot';
    dot.setAttribute('aria-hidden', 'true');
    const count = document.createElement('span');
    count.className = 'calendar-day-count';
    count.textContent = `${dayEntries.length} 条`;
    const rule = document.createElement('span');
    rule.className = 'calendar-day-rule';
    rule.setAttribute('aria-hidden', 'true');
    dayHead.append(dayLabel, dot, count, rule);
    group.append(dayHead);
    dayEntries.forEach((entry) => {
      const article = document.createElement('article');
      article.className = 'calendar-archive-entry';
      const meta = document.createElement('p');
      meta.className = 'calendar-entry-meta';
      meta.textContent = timeFormatter.format(new Date(entry.createdAt));
      const title = document.createElement('h3');
      title.textContent = entry.title || '未命名片段';
      const content = document.createElement('p');
      content.textContent = entry.content;
      article.append(meta, title, content);
      group.append(article);
    });
    elements.calendarArchiveList.append(group);
  });
}

function jumpToArchiveDate(date) {
  if (!isDateKey(date)) return;
  state.archiveJumpDate = date;
  state.visibleMonth = startOfMonth(parseDateKey(date));
  elements.archiveJumpDate.value = date;
  renderCalendar();
  document.querySelector(`[data-archive-date="${date}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function defaultPeriodStart() {
  const date = parseDateKey(state.activeDate);
  date.setDate(date.getDate() - 6);
  return localDateKey(date);
}

function renderPeriodPanel() {
  if (!elements.periodStart.value) elements.periodStart.value = defaultPeriodStart();
  if (!elements.periodEnd.value) elements.periodEnd.value = state.activeDate;
  updatePeriodEntryCount();
}

function updatePeriodEntryCount() {
  const start = elements.periodStart.value;
  const end = elements.periodEnd.value;
  if (!start || !end || start > end) {
    elements.periodEntryCount.textContent = '请选择有效日期范围';
    return;
  }
  elements.periodEntryCount.textContent = `${entriesForPeriod(start, end).length} 条来源记录`;
}

function renderPeriodSummaries() {
  elements.periodSummaryList.replaceChildren();
  const summaries = state.data.periodSummaries
    .filter((summary) => !summary.deletedAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (!summaries.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state period-empty';
    empty.textContent = '还没有跨日汇总。选择日期范围后，生成第一份回顾。';
    elements.periodSummaryList.append(empty);
    return;
  }

  summaries.forEach((summary) => {
    const fragment = elements.periodSummaryTemplate.content.cloneNode(true);
    fragment.querySelector('.period-summary-date').textContent = `${summary.startDate} — ${summary.endDate}`;
    fragment.querySelector('.period-summary-title').textContent = '这一段时间的回顾';
    fragment.querySelector('.period-summary-source').textContent = `基于 ${summary.entryIds.length} 条日记生成 · 原日记未被改写`;
    fragment.querySelector('.period-summary-content').textContent = summary.content;
    fragment.querySelector('.delete-period-summary').addEventListener('click', () => {
      const now = new Date().toISOString();
      if (!persistDataChange(() => {
        summary.deletedAt = now;
        summary.updatedAt = now;
        markCloudDirty('periodSummaries', summary.id);
      })) return;
      renderPeriodSummaries();
      showToast('汇总已删除，原日记仍保留');
    });
    elements.periodSummaryList.append(fragment);
  });
}

function renderSearchResults() {
  const query = elements.searchInput.value.trim().toLocaleLowerCase();
  elements.searchResults.replaceChildren();
  if (!query) {
    const help = document.createElement('p');
    help.className = 'summary-empty';
    help.textContent = '输入一个词，翻找写过的片段。';
    elements.searchResults.append(help);
    return;
  }
  const matches = state.data.entries
    .filter((entry) => !entry.deletedAt)
    .filter((entry) => `${entry.title} ${entry.content} ${entry.originalContent ?? ''}`.toLocaleLowerCase().includes(query))
    .sort((a, b) => b.date.localeCompare(a.date));
  if (!matches.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = '没有找到匹配的记录。';
    elements.searchResults.append(empty);
    return;
  }
  matches.forEach((entry) => {
    const result = document.createElement('button');
    result.className = 'search-result';
    result.type = 'button';
    result.innerHTML = `<div class="search-result-date">${entry.date}</div><h3>${escapeHtml(entry.title || '未命名片段')}</h3><p>${escapeHtml(entry.content)}</p>`;
    result.addEventListener('click', () => {
      state.activeDate = entry.date;
      state.archiveJumpDate = entry.date;
      state.visibleMonth = startOfMonth(parseDateKey(entry.date));
      state.view = 'today';
      closeSearchDialog();
      render();
      document.querySelector('.archive-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    elements.searchResults.append(result);
  });
}

function updateActiveView() {
  elements.views.forEach((view) => view.classList.toggle('active', view.id === `${state.view}-view`));
  elements.navLinks.forEach((link) => link.classList.toggle('active', link.dataset.view === state.view));
}

function updateWordCount() {
  elements.wordCount.textContent = `${elements.entryContent.value.trim().length} 字`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function saveNewEntry() {
  const title = elements.entryTitle.value.trim();
  const content = elements.entryContent.value.trim();
  if (!content) {
    showToast('先写一点内容再保存');
    elements.entryContent.focus();
    return;
  }
  const draft = loadDraft();
  const now = new Date().toISOString();
  const entry = {
    id: crypto.randomUUID(),
    date: state.activeDate,
    title,
    content,
    originalContent: draft.originalContent || '',
    createdAt: now,
    updatedAt: now,
  };
  if (!persistDataChange(() => {
    state.data.entries.push(entry);
    markCloudDirty('entries', entry.id);
    invalidateDailySummary(state.activeDate, now);
  })) return;
  localStorage.removeItem(draftKey());
  elements.entryTitle.value = '';
  elements.entryContent.value = '';
  render();
  showToast('记录已保存');
}

function readAiConfigDraft() {
  try {
    const config = JSON.parse(localStorage.getItem(AI_CONFIG_KEY));
    if (!config || typeof config !== 'object') return {};
    // Migrate older installations away from storing an API key in localStorage.
    const { apiKey: legacyApiKey, ...safeConfig } = config;
    if (legacyApiKey) localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(safeConfig));
    return safeConfig;
  } catch { return {}; }
}

function getAiConfig() {
  const config = readAiConfigDraft();
  return config.endpoint && config.model && runtimeAiApiKey ? { ...config, apiKey: runtimeAiApiKey } : null;
}

function openAiConfig() {
  const config = readAiConfigDraft();
  elements.aiEndpoint.value = config?.endpoint ?? '';
  elements.aiModel.value = config?.model ?? '';
  elements.aiApiKey.value = runtimeAiApiKey;
  elements.aiOrganizePrompt.value = organizePromptFor(config);
  elements.aiSummaryPrompt.value = summaryPromptFor(config);
  updateAiPromptMeta();
  if (typeof elements.aiConfigDialog.showModal === 'function') elements.aiConfigDialog.showModal();
  else elements.aiConfigDialog.setAttribute('open', '');
}

function closeAiConfig() {
  if (typeof elements.aiConfigDialog.close === 'function') elements.aiConfigDialog.close();
  else elements.aiConfigDialog.removeAttribute('open');
}

function organizePromptFor(config) {
  const savedPrompt = config?.organizePrompt?.trim() || config?.correctionPrompt?.trim();
  return savedPrompt && !LEGACY_ORGANIZE_PROMPTS.has(savedPrompt) ? savedPrompt : DEFAULT_ORGANIZE_PROMPT;
}

function buildOrganizeRequest(config, content) {
  const template = organizePromptFor(config);
  if (template.includes('{{输入内容}}')) {
    return {
      system: template.replaceAll('{{输入内容}}', content),
      prompt: '请直接输出整理后的日记正文。',
    };
  }
  return {
    system: template,
    prompt: `请按 AI 整理提示词处理下面这段日记，只输出整理后的日记正文：\n\n${content}`,
  };
}

function summaryPromptFor(config) {
  const savedPrompt = config?.summaryPrompt?.trim();
  return savedPrompt && !LEGACY_SUMMARY_PROMPTS.has(savedPrompt) ? savedPrompt : DEFAULT_SUMMARY_PROMPT;
}

function promptConfigKey(type) {
  return type === 'organize' ? 'organizePrompt' : 'summaryPrompt';
}

function promptTitle(type) {
  return type === 'organize' ? 'AI 转写提示词' : 'AI 总结提示词';
}

function promptFor(type, config) {
  return type === 'organize' ? organizePromptFor(config) : summaryPromptFor(config);
}

function updatePromptEditorCount() {
  elements.promptEditorCount.textContent = `${elements.promptEditorInput.value.trim().length} 字`;
}

function openPromptEditor(type) {
  state.promptEditorType = type;
  const isOrganize = type === 'organize';
  elements.promptEditorKicker.textContent = isOrganize ? '写作时使用' : '回顾时使用';
  elements.promptEditorTitle.textContent = `编辑${promptTitle(type)}`;
  elements.promptEditorCopy.textContent = isOrganize
    ? '这里保存的内容就是 AI 转写时使用的提示词。'
    : '这里保存的内容就是 AI 总结时使用的提示词。';
  elements.promptEditorLabel.firstChild.textContent = promptTitle(type);
  elements.promptEditorInput.value = promptFor(type, readAiConfigDraft());
  updatePromptEditorCount();
  if (typeof elements.promptEditorDialog.showModal === 'function') elements.promptEditorDialog.showModal();
  else elements.promptEditorDialog.setAttribute('open', '');
}

function closePromptEditor() {
  if (typeof elements.promptEditorDialog.close === 'function') elements.promptEditorDialog.close();
  else elements.promptEditorDialog.removeAttribute('open');
}

function closeDialogOnBackdrop(dialog, closeDialog) {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog();
  });
}

function openWorkspaceDialog(dialog, focusTarget) {
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
  requestAnimationFrame(() => focusTarget?.focus());
}

function closeWorkspaceDialog(dialog) {
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
}

function openPeriodSummaryDialog() {
  renderPeriodPanel();
  renderPeriodSummaries();
  openWorkspaceDialog(elements.periodSummaryDialog, elements.periodStart);
}

function closePeriodSummaryDialog() {
  closeWorkspaceDialog(elements.periodSummaryDialog);
}

function openSearchDialog() {
  renderSearchResults();
  openWorkspaceDialog(elements.searchDialog, elements.searchInput);
}

function closeSearchDialog() {
  closeWorkspaceDialog(elements.searchDialog);
}

function savePromptEditor() {
  const value = elements.promptEditorInput.value.trim();
  const type = state.promptEditorType;
  const config = readAiConfigDraft();
  config[promptConfigKey(type)] = value || promptFor(type, null);
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
  closePromptEditor();
  showToast(`${promptTitle(type)}已保存`);
}

function buildSummaryRequest(config, content) {
  const template = summaryPromptFor(config);
  if (template.includes('{{输入内容}}')) {
    return {
      system: template.replaceAll('{{输入内容}}', content),
      prompt: '请直接输出阶段总结。',
    };
  }
  return {
    system: template,
    prompt: content,
  };
}

function updatePromptCount(input, count) {
  count.textContent = `${input.value.trim().length} 字`;
}

function updateAiPromptMeta() {
  updatePromptCount(elements.aiOrganizePrompt, elements.aiOrganizePromptCount);
  updatePromptCount(elements.aiSummaryPrompt, elements.aiSummaryPromptCount);
}

function ensureAiConfigured() {
  if (getAiConfig()) return true;
  openAiConfig();
  showToast('请先完成模型配置');
  return false;
}

function usesLocalAiProxy() {
  const isNativeApp = Boolean(window.Capacitor?.isNativePlatform?.());
  return !isNativeApp && ['localhost', '127.0.0.1'].includes(window.location.hostname);
}

async function aiProxyRequest() {
  if (usesLocalAiProxy()) return { url: '/api/ai', headers: { 'Content-Type': 'application/json' } };
  const cloudConfig = readCloudConfig();
  if (!isCloudConfigured(cloudConfig)) throw new Error('云同步服务暂未连接，请稍后重试');
  const session = await activeCloudSession();
  return {
    url: `${cloudConfig.url}/functions/v1/ai-proxy`,
    headers: {
      'Content-Type': 'application/json',
      apikey: cloudConfig.publishableKey,
      Authorization: `Bearer ${session.accessToken}`,
    },
  };
}

async function requestAI({ system, prompt }) {
  const config = getAiConfig();
  if (!config) throw new Error('请先完成模型配置');
  let response;
  try {
    const proxy = await aiProxyRequest();
    response = await fetch(proxy.url, {
      method: 'POST',
      headers: proxy.headers,
      body: JSON.stringify({
        config: {
          endpoint: config.endpoint,
          model: config.model,
          apiKey: config.apiKey,
        },
        system,
        prompt,
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('请先')) throw error;
    throw new Error(usesLocalAiProxy()
      ? '本地 AI 代理未启动，请在项目目录运行 python3 server.py'
      : '云端 AI 代理请求失败，请先登录同步账号后重试');
  }
  const payload = await response.json().catch(() => ({}));
  if (response.status === 404 && usesLocalAiProxy()) throw new Error('本地 AI 代理未启动，请用 python3 server.py 打开网站');
  if (!response.ok) throw new Error(payload?.error?.message || `接口返回 ${response.status}`);
  const result = extractModelText(payload);
  if (!result) throw new Error('接口未返回可用文本，请检查模型和 API 格式');
  return result;
}

function extractModelText(payload) {
  const content = payload?.choices?.[0]?.message?.content ?? payload?.output_text ?? payload?.response;
  if (Array.isArray(content)) return content.map((item) => item?.text ?? item?.content ?? '').join('').trim();
  return typeof content === 'string' ? content.trim() : '';
}

function setBusy(button, busy, busyText) {
  state.busy = busy;
  if (busy) {
    button.dataset.originalText = button.textContent;
    button.textContent = busyText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

async function organizeDraftWithAI() {
  const content = elements.entryContent.value.trim();
  if (!content) {
    showToast('先写一点内容再交给 AI 整理');
    elements.entryContent.focus();
    return;
  }
  if (!ensureAiConfigured()) return;
  setBusy(elements.organizeDraft, true, 'AI 正在整理…');
  elements.draftStatus.textContent = '正在请求 AI…';
  try {
    const suggestion = await requestAI(buildOrganizeRequest(getAiConfig(), content));
    const previous = loadDraft();
    const draft = { ...previous, title: elements.entryTitle.value, content, aiOriginal: content, aiSuggestion: suggestion };
    saveDraftObject(draft, 'AI 建议已生成，等待确认');
    renderEditorAiSuggestion(draft);
    showToast('AI 建议已生成，原文仍未改变');
  } catch (error) {
    elements.draftStatus.textContent = 'AI 整理未完成';
    showToast(`模型请求失败：${error.message}`);
  } finally {
    setBusy(elements.organizeDraft, false);
  }
}

function applyAiSuggestion() {
  const draft = loadDraft();
  if (!draft.aiSuggestion || draft.aiOriginal !== elements.entryContent.value) {
    showToast('建议已过期，请重新整理');
    return;
  }
  if (!window.confirm('确认采用 AI 建议并替换输入框内容？替换前原文会随这条日记保存。')) return;
  const previousContent = elements.entryContent.value;
  elements.entryContent.value = draft.aiSuggestion;
  const updatedDraft = {
    ...draft,
    content: draft.aiSuggestion,
    originalContent: previousContent,
    aiSuggestion: '',
    aiOriginal: '',
  };
  saveDraftObject(updatedDraft, '已采用 AI 建议，原文已保留');
  renderEditorAiSuggestion(updatedDraft);
  showToast('输入内容已替换，保存时会保留替换前原文');
}

function dismissAiSuggestion() {
  const draft = loadDraft();
  const updatedDraft = { ...draft, aiSuggestion: '', aiOriginal: '' };
  saveDraftObject(updatedDraft, '已保留原文并放弃建议');
  renderEditorAiSuggestion(updatedDraft);
}

async function summarizeDay() {
  const entries = entriesForDate(state.activeDate);
  if (!entries.length) {
    showToast('今天还没有记录可以整理');
    return;
  }
  if (!ensureAiConfigured()) return;
  setBusy(elements.summarizeDay, true, '…');
  try {
    const content = formatEntriesForAI(entries);
    const summary = await requestAI(buildSummaryRequest(getAiConfig(), content));
    const now = new Date().toISOString();
    const previous = summaryForDate(state.activeDate);
    if (!persistDataChange(() => {
      state.data.summaries[state.activeDate] = { content: summary, createdAt: previous?.createdAt || now, updatedAt: now, model: getAiConfig().model };
      markCloudDirty('dailySummaries', state.activeDate);
    })) return;
    renderSummary();
    showToast('当天 AI 摘要已生成，原日记未改变');
  } catch (error) {
    showToast(`模型请求失败：${error.message}`);
  } finally {
    setBusy(elements.summarizeDay, false);
  }
}

function formatEntriesForAI(entries) {
  return entries.map((entry) => `【${entry.date} ${entry.title || '未命名记录'}】\n${entry.content}`).join('\n\n');
}

async function summarizePeriod() {
  const start = elements.periodStart.value;
  const end = elements.periodEnd.value;
  if (!start || !end || start > end) {
    showToast('请选择有效的开始和结束日期');
    return;
  }
  const entries = entriesForPeriod(start, end);
  if (!entries.length) {
    showToast('这个日期范围内没有可汇总的日记');
    return;
  }
  const content = formatEntriesForAI(entries);
  if (content.length > MAX_PERIOD_INPUT_CHARS) {
    showToast('选中的内容过长，请缩小日期范围后再汇总');
    return;
  }
  if (!ensureAiConfigured()) return;
  setBusy(elements.summarizePeriod, true, 'AI 正在汇总…');
  try {
    const summary = await requestAI(buildSummaryRequest(getAiConfig(), content));
    const periodSummary = {
      id: crypto.randomUUID(),
      startDate: start,
      endDate: end,
      entryIds: entries.map((entry) => entry.id),
      content: summary,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      model: getAiConfig().model,
    };
    if (!persistDataChange(() => {
      state.data.periodSummaries.push(periodSummary);
      markCloudDirty('periodSummaries', periodSummary.id);
    })) return;
    renderPeriodSummaries();
    showToast('跨日 AI 汇总已生成，来源日记未改变');
  } catch (error) {
    showToast(`模型请求失败：${error.message}`);
  } finally {
    setBusy(elements.summarizePeriod, false);
  }
}

function exportData() {
  const payload = { app: '岁笺 Calendar Journal', version: 2, exportedAt: new Date().toISOString(), data: state.data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `suijian-backup-${localDateKey()}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('完整备份已导出');
}

function isDateKey(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00`));
}

function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function validText(value, maxLength) {
  return typeof value === 'string' && value.length <= maxLength;
}

function normalizeImportedEntry(entry) {
  if (!entry || !isUuid(entry.id) || !isDateKey(entry.date) || !validText(entry.content, MAX_ENTRY_CONTENT_CHARS)) return null;
  if (entry.title !== undefined && !validText(entry.title, MAX_ENTRY_TITLE_CHARS)) return null;
  if (entry.originalContent !== undefined && !validText(entry.originalContent, MAX_ENTRY_CONTENT_CHARS)) return null;
  return {
    id: entry.id,
    date: entry.date,
    title: entry.title || '',
    content: entry.content,
    originalContent: entry.originalContent || '',
    createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : new Date().toISOString(),
    updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : new Date().toISOString(),
    ...(typeof entry.deletedAt === 'string' ? { deletedAt: entry.deletedAt } : {}),
  };
}

function normalizeImportedPeriodSummary(summary) {
  if (!summary || !isUuid(summary.id) || !isDateKey(summary.startDate) || !isDateKey(summary.endDate) || summary.startDate > summary.endDate) return null;
  if (!validText(summary.content, MAX_SUMMARY_CHARS) || !Array.isArray(summary.entryIds) || !summary.entryIds.every(isUuid)) return null;
  return {
    id: summary.id,
    startDate: summary.startDate,
    endDate: summary.endDate,
    entryIds: summary.entryIds,
    content: summary.content,
    model: validText(summary.model || '', 200) ? summary.model || '' : '',
    createdAt: typeof summary.createdAt === 'string' ? summary.createdAt : new Date().toISOString(),
    updatedAt: typeof summary.updatedAt === 'string' ? summary.updatedAt : new Date().toISOString(),
    ...(typeof summary.deletedAt === 'string' ? { deletedAt: summary.deletedAt } : {}),
  };
}

async function importData(file) {
  try {
    if (file.size > MAX_IMPORT_BYTES) throw new Error('too-large');
    const raw = await file.text();
    const parsed = JSON.parse(raw);
    const incoming = parsed.data ?? parsed;
    if (!incoming || !Array.isArray(incoming.entries) || !incoming.summaries || typeof incoming.summaries !== 'object') throw new Error('invalid');
    const confirmed = window.confirm(`准备导入 ${incoming.entries.length} 条记录。相同 ID 的记录会跳过，是否继续？`);
    if (!confirmed) return;
    const ids = new Set(state.data.entries.map((entry) => entry.id));
    const newEntries = incoming.entries.map(normalizeImportedEntry).filter((entry) => entry && !ids.has(entry.id));
    const incomingSummaries = Object.entries(incoming.summaries)
      .filter(([date, summary]) => isDateKey(date) && validText(typeof summary === 'string' ? summary : summary?.content, MAX_SUMMARY_CHARS))
      .map(([date, summary]) => [date, typeof summary === 'string' ? { content: summary } : summary]);
    const newSummaries = Object.fromEntries(incomingSummaries.filter(([date]) => !state.data.summaries[date]));
    const periodIds = new Set(state.data.periodSummaries.map((summary) => summary.id));
    const newPeriodSummaries = Array.isArray(incoming.periodSummaries)
      ? incoming.periodSummaries.map(normalizeImportedPeriodSummary).filter((summary) => summary && !periodIds.has(summary.id))
      : [];
    const previous = structuredClone(state.data);
    state.data.entries.push(...newEntries);
    state.data.summaries = { ...state.data.summaries, ...newSummaries };
    state.data.periodSummaries.push(...newPeriodSummaries);
    newEntries.forEach((entry) => markCloudDirty('entries', entry.id));
    Object.keys(newSummaries).forEach((date) => markCloudDirty('dailySummaries', date));
    newPeriodSummaries.forEach((summary) => markCloudDirty('periodSummaries', summary.id));
    if (!persistData()) {
      state.data = previous;
      throw new Error('storage');
    }
    render();
    showToast(`已导入 ${newEntries.length} 条记录；跳过了格式不正确或重复的内容`);
  } catch {
    showToast('导入失败：文件格式不正确、内容过大或本地存储空间不足');
  } finally {
    elements.importInput.value = '';
  }
}

let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add('visible');
  toastTimer = setTimeout(() => elements.toast.classList.remove('visible'), 3000);
}

let draftTimer;
function scheduleDraftSave() {
  elements.draftStatus.textContent = '正在保存草稿…';
  clearTimeout(draftTimer);
  draftTimer = setTimeout(saveDraft, 320);
}


function summaryForDate(date) {
  const value = state.data.summaries[date];
  if (!value) return null;
  if (typeof value === 'string') return { content: value, createdAt: '', updatedAt: '', model: '' };
  return value;
}

function invalidateDailySummary(date, now = new Date().toISOString()) {
  const existing = summaryForDate(date);
  if (!existing || existing.deletedAt) return;
  state.data.summaries[date] = {
    ...existing,
    content: '',
    updatedAt: now,
    deletedAt: now,
  };
  markCloudDirty('dailySummaries', date);
}

function cloudDirty(kind) {
  const meta = state.data.cloudSync ?? (state.data.cloudSync = emptyCloudMeta());
  return meta.dirty[kind] ?? (meta.dirty[kind] = []);
}

function markCloudDirty(kind, id) {
  if (!id) return;
  const dirty = cloudDirty(kind);
  if (!dirty.includes(id)) dirty.push(id);
}

function clearCloudDirty(kind, ids) {
  const processed = new Set(ids);
  const meta = state.data.cloudSync ?? (state.data.cloudSync = emptyCloudMeta());
  meta.dirty[kind] = cloudDirty(kind).filter((id) => !processed.has(id));
}

function hasCloudChanges() {
  const meta = state.data.cloudSync ?? emptyCloudMeta();
  return Object.values(meta.dirty).some((values) => values.length > 0);
}

function readCloudConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(CLOUD_CONFIG_KEY));
    const url = (saved?.url || DEFAULT_SUPABASE_URL).trim().replace(/\/$/, '');
    const publishableKey = (saved?.publishableKey || DEFAULT_SUPABASE_PUBLISHABLE_KEY).trim();
    return { url, publishableKey };
  } catch {
    return { url: DEFAULT_SUPABASE_URL, publishableKey: DEFAULT_SUPABASE_PUBLISHABLE_KEY };
  }
}

function isCloudConfigured(config = readCloudConfig()) {
  return Boolean(config.url && config.publishableKey);
}

function saveCloudConfig(config) {
  localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
}

function loadCloudSession() {
  try {
    const persistentRaw = localStorage.getItem(CLOUD_SESSION_KEY);
    const legacyRaw = sessionStorage.getItem(CLOUD_SESSION_KEY);
    const saved = JSON.parse(persistentRaw || legacyRaw || 'null');
    if (!saved || typeof saved !== 'object') return null;
    const rememberUntil = Number(saved.rememberUntil) || (Date.now() + SESSION_REMEMBER_MS);
    if (rememberUntil <= Date.now()) {
      localStorage.removeItem(CLOUD_SESSION_KEY);
      sessionStorage.removeItem(CLOUD_SESSION_KEY);
      return null;
    }
    const session = { ...saved, rememberUntil };
    // Migrate the former tab-only session to the two-day device login window.
    localStorage.setItem(CLOUD_SESSION_KEY, JSON.stringify(session));
    sessionStorage.removeItem(CLOUD_SESSION_KEY);
    return session;
  } catch {
    localStorage.removeItem(CLOUD_SESSION_KEY);
    sessionStorage.removeItem(CLOUD_SESSION_KEY);
    return null;
  }
}

function storeCloudSession(session) {
  const rememberUntil = Number(session?.rememberUntil);
  const rememberedSession = session ? {
    ...session,
    rememberUntil: rememberUntil > Date.now() ? rememberUntil : Date.now() + SESSION_REMEMBER_MS,
  } : null;
  state.cloud.session = rememberedSession;
  if (rememberedSession) localStorage.setItem(CLOUD_SESSION_KEY, JSON.stringify(rememberedSession));
  else localStorage.removeItem(CLOUD_SESSION_KEY);
  sessionStorage.removeItem(CLOUD_SESSION_KEY);
}

function sessionFromPayload(payload, rememberUntil = Date.now() + SESSION_REMEMBER_MS) {
  const raw = payload?.session || payload;
  const accessToken = raw?.access_token;
  const refreshToken = raw?.refresh_token;
  const user = raw?.user || payload?.user;
  if (!accessToken || !refreshToken || !user?.id) return null;
  const expiry = Number(raw.expires_at);
  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email || '' },
    expiresAt: Number.isFinite(expiry) ? expiry * 1000 : Date.now() + Number(raw.expires_in || 3600) * 1000,
    rememberUntil,
  };
}

function renderSyncStatus() {
  if (!elements.syncStatus) return;
  const config = readCloudConfig();
  const session = state.cloud?.session;
  if (!isCloudConfigured(config)) {
    elements.syncStatus.textContent = '本地已保存';
    return;
  }
  if (!session) {
    elements.syncStatus.textContent = '云同步待登录';
    return;
  }
  const accountId = state.data.cloudSync?.accountId;
  if (accountId && accountId !== session.user.id) {
    elements.syncStatus.textContent = '账号已切换，等待确认';
    return;
  }
  if (state.cloud.syncing) {
    elements.syncStatus.textContent = '正在同步';
    return;
  }
  elements.syncStatus.textContent = hasCloudChanges() ? '等待云同步' : '云端已同步';
}

function renderCloudAccountDialog() {
  const session = state.cloud.session;
  elements.syncAccountStatus.textContent = session ? '已登录' : '未登录';
  elements.syncAuthForm.hidden = Boolean(session);
  elements.syncSignedIn.hidden = !session;
  elements.syncAccountEmail.textContent = session?.user?.email || '';
  elements.syncAuthCopy.textContent = session
    ? '这台设备保持登录两天；期间打开手机或电脑会自动同步。'
    : '登录或注册后，这台设备会保持登录两天；打开、回到前台和每 10 分钟都会自动同步。';
  elements.syncLastSession.textContent = session?.expiresAt
    ? `登录记忆至 ${new Date(session.rememberUntil).toLocaleString('zh-CN')}`
    : '';
  elements.accountDialogCopy.textContent = session
    ? '同一邮箱登录手机和电脑后，日记会自动合并到这个账号。'
    : '注册一个账号后，即可把日记同步到其他设备。';
  elements.cloudAccountButton.textContent = '账号';
  elements.cloudAccountButton.setAttribute('aria-label', session ? '打开账号窗口' : '打开登录或注册窗口');
}

function renderCloudSyncDialog() {
  const session = state.cloud.session;
  const accountId = state.data.cloudSync?.accountId;
  elements.syncLoginRequired.hidden = Boolean(session);
  elements.syncActivePanel.hidden = !session;
  elements.syncAccountBrief.textContent = session?.user?.email || '尚未登录同步账号';
  elements.syncAccountMessage.textContent = session
    ? (accountId && accountId !== session.user.id
      ? '检测到本机曾使用其他账号。立即同步时会先让你确认是否合并。'
      : (hasCloudChanges() ? '本机有新内容等待上传。' : '登录、返回前台和每 10 分钟都会自动同步。'))
    : '登录后，日记、当天摘要与跨日汇总会保存到你的云端账号。';
  elements.syncDialogCopy.textContent = session
    ? '这里仅处理跨设备同步，不修改你的日记内容。'
    : '请先登录账号，再开始跨设备同步。';
  renderCloudActivity();
  renderSyncStatus();
}

function renderCloudDialogs() {
  renderCloudAccountDialog();
  renderCloudSyncDialog();
}

function openCloudSyncDialog() {
  renderCloudDialogs();
  const target = state.cloud.session ? elements.syncNowButton : elements.syncOpenAccount;
  openWorkspaceDialog(elements.syncDialog, target);
}

function openCloudAccountDialog() {
  renderCloudDialogs();
  const target = state.cloud.session ? elements.syncSignOut : elements.syncEmail;
  openWorkspaceDialog(elements.accountDialog, target);
}

function handleCloudSyncButton() {
  if (!state.cloud.session) {
    showToast('请先在“账号”中登录后再同步');
    return;
  }
  if (!ensureCloudConfigured()) return;
  void syncCloud();
}

function closeCloudSyncDialog() {
  closeWorkspaceDialog(elements.syncDialog);
}

function closeCloudAccountDialog() {
  closeWorkspaceDialog(elements.accountDialog);
}

function ensureCloudConfigured() {
  if (isCloudConfigured()) return true;
  showToast('云同步服务暂未连接，请稍后重试');
  return false;
}

function validateCloudCredentials() {
  if (!elements.syncAuthForm.reportValidity()) return null;
  const email = elements.syncEmail.value.trim();
  const password = elements.syncPassword.value;
  if (password.length < 8) {
    showToast('密码至少需要 8 位');
    return null;
  }
  return { email, password };
}

function emailRedirectUrl() {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  return url.toString();
}

function cloudUrl(path) {
  return `${readCloudConfig().url}${path}`;
}

function authCallbackParams() {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : '');
  const hasAuthCallback = ['access_token', 'refresh_token', 'error', 'error_code', 'error_description']
    .some((key) => params.has(key));
  if (!hasAuthCallback) return null;

  // Supabase returns the confirmation session in the URL fragment. Remove it
  // immediately so tokens do not remain visible in the address bar or history.
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
  return params;
}

function sessionFromAuthCallback(params, user) {
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken || !user?.id) return null;

  const expiresAt = Number(params.get('expires_at'));
  const expiresIn = Number(params.get('expires_in'));
  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email || '' },
    expiresAt: Number.isFinite(expiresAt)
      ? expiresAt * 1000
      : Date.now() + (Number.isFinite(expiresIn) ? expiresIn : 3600) * 1000,
    rememberUntil: Date.now() + SESSION_REMEMBER_MS,
  };
}

async function restoreCloudSessionFromAuthCallback() {
  const params = authCallbackParams();
  if (!params) return false;

  const authError = params.get('error_description') || params.get('error');
  if (authError) {
    recordCloudActivity(`邮箱验证失败：${authError}`, 'error');
    showToast(`邮箱验证失败：${authError}`);
    return true;
  }

  const config = readCloudConfig();
  const accessToken = params.get('access_token');
  if (!isCloudConfigured(config) || !accessToken) {
    recordCloudActivity('邮箱验证未返回有效登录信息', 'error');
    showToast('邮箱验证未返回有效登录信息，请在登录窗口重新登录');
    return true;
  }

  try {
    const response = await fetch(cloudUrl('/auth/v1/user'), {
      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const user = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(user?.msg || user?.message || `同步服务返回 ${response.status}`);

    const session = sessionFromAuthCallback(params, user);
    if (!session) throw new Error('邮箱验证返回的数据不完整');
    storeCloudSession(session);
    recordCloudActivity('邮箱验证成功，已登录同步账号', 'success');
    render();
    renderCloudDialogs();
    await syncCloud();
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    recordCloudActivity(`邮箱验证登录失败：${message}`, 'error');
    showToast(`邮箱验证登录失败：${message}`);
  }
  return true;
}

async function cloudAuthRequest(path, body) {
  const config = readCloudConfig();
  if (!isCloudConfigured(config)) throw new Error('请先保存 Supabase Publishable Key');
  const response = await fetch(cloudUrl(path), {
    method: 'POST',
    headers: { apikey: config.publishableKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.msg || payload?.error_description || payload?.message || `同步服务返回 ${response.status}`);
  return payload;
}

async function refreshCloudSession() {
  const existing = state.cloud.session;
  if (!existing?.refreshToken) return null;
  const payload = await cloudAuthRequest('/auth/v1/token?grant_type=refresh_token', { refresh_token: existing.refreshToken });
  const session = sessionFromPayload(payload, existing.rememberUntil);
  if (!session) throw new Error('登录状态已过期，请重新登录');
  storeCloudSession(session);
  return session;
}

async function activeCloudSession() {
  const session = state.cloud.session;
  if (!session) throw new Error('请先登录同步账号');
  if (!session.rememberUntil || session.rememberUntil <= Date.now()) {
    storeCloudSession(null);
    stopCloudAutoSync();
    throw new Error('登录记忆已到期，请重新登录');
  }
  if (session.expiresAt && session.expiresAt > Date.now() + 60_000) return session;
  return refreshCloudSession();
}

async function cloudRequest(path, options = {}, retry = true) {
  const config = readCloudConfig();
  const session = await activeCloudSession();
  const response = await fetch(cloudUrl(path), {
    ...options,
    headers: {
      apikey: config.publishableKey,
      Authorization: `Bearer ${session.accessToken}`,
      ...(options.headers || {}),
    },
  });
  if (response.status === 401 && retry) {
    await refreshCloudSession();
    return cloudRequest(path, options, false);
  }
  const payload = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.message || payload?.hint || payload?.error || `同步服务返回 ${response.status}`);
  return payload;
}

function cloudUpdatedAt(item) {
  const value = item?.updatedAt || item?.updated_at || item?.createdAt || item?.created_at || '';
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function incomingWins(local, remote) {
  const localTime = cloudUpdatedAt(local);
  const remoteTime = cloudUpdatedAt(remote);
  if (remoteTime !== localTime) return remoteTime > localTime;
  return Boolean(remote.deletedAt || remote.deleted_at) && !(local?.deletedAt || local?.deleted_at);
}

function remoteEntryToLocal(entry) {
  return {
    id: entry.id,
    date: entry.entry_date,
    title: entry.title || '',
    content: entry.content || '',
    originalContent: entry.original_content || '',
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
    deletedAt: entry.deleted_at || undefined,
  };
}

function remoteSummaryToLocal(summary) {
  return {
    id: summary.id,
    content: summary.content || '',
    model: summary.model || '',
    createdAt: summary.created_at,
    updatedAt: summary.updated_at,
    deletedAt: summary.deleted_at || undefined,
  };
}

function remotePeriodToLocal(summary) {
  return {
    id: summary.id,
    startDate: summary.start_date,
    endDate: summary.end_date,
    entryIds: Array.isArray(summary.entry_ids) ? summary.entry_ids : [],
    content: summary.content || '',
    model: summary.model || '',
    createdAt: summary.created_at,
    updatedAt: summary.updated_at,
    deletedAt: summary.deleted_at || undefined,
  };
}

function mergeRemoteData({ entries = [], dailySummaries = [], periodSummaries = [] }) {
  const entryMap = new Map(state.data.entries.map((entry) => [entry.id, entry]));
  entries.map(remoteEntryToLocal).forEach((remote) => {
    const local = entryMap.get(remote.id);
    if (!local || incomingWins(local, remote)) entryMap.set(remote.id, remote);
  });
  state.data.entries = [...entryMap.values()];

  dailySummaries.forEach((remoteRecord) => {
    const remote = remoteSummaryToLocal(remoteRecord);
    const local = summaryForDate(remoteRecord.entry_date);
    if (!local || incomingWins(local, remote)) state.data.summaries[remoteRecord.entry_date] = remote;
  });

  const periodMap = new Map(state.data.periodSummaries.map((summary) => [summary.id, summary]));
  periodSummaries.map(remotePeriodToLocal).forEach((remote) => {
    const local = periodMap.get(remote.id);
    if (!local || incomingWins(local, remote)) periodMap.set(remote.id, remote);
  });
  state.data.periodSummaries = [...periodMap.values()];
}

function ensureCloudMetadata(item, now) {
  if (!item.createdAt) item.createdAt = now;
  if (!item.updatedAt) item.updatedAt = now;
  return item;
}

function markAllCloudDirty() {
  const now = new Date().toISOString();
  state.data.entries.forEach((entry) => {
    ensureCloudMetadata(entry, now);
    markCloudDirty('entries', entry.id);
  });
  Object.keys(state.data.summaries).forEach((date) => {
    const summary = summaryForDate(date);
    if (!summary) return;
    state.data.summaries[date] = ensureCloudMetadata(summary, now);
    markCloudDirty('dailySummaries', date);
  });
  state.data.periodSummaries.forEach((summary) => {
    ensureCloudMetadata(summary, now);
    markCloudDirty('periodSummaries', summary.id);
  });
}

async function pullCloudData() {
  const entryColumns = 'id,entry_date,title,content,original_content,created_at,updated_at,deleted_at';
  const summaryColumns = 'id,entry_date,content,model,created_at,updated_at,deleted_at';
  const periodColumns = 'id,start_date,end_date,entry_ids,content,model,created_at,updated_at,deleted_at';
  const [entries, dailySummaries, periodSummaries] = await Promise.all([
    cloudRequest(`/rest/v1/journal_entries?select=${encodeURIComponent(entryColumns)}&order=updated_at.desc`),
    cloudRequest(`/rest/v1/daily_summaries?select=${encodeURIComponent(summaryColumns)}&order=updated_at.desc`),
    cloudRequest(`/rest/v1/period_summaries?select=${encodeURIComponent(periodColumns)}&order=updated_at.desc`),
  ]);
  mergeRemoteData({ entries, dailySummaries, periodSummaries });
}

function entryToCloud(entry, userId) {
  return {
    id: entry.id,
    user_id: userId,
    entry_date: entry.date,
    title: entry.title || '',
    content: entry.content || '',
    original_content: entry.originalContent || '',
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
    deleted_at: entry.deletedAt || null,
  };
}

function summaryToCloud(date, summary, userId) {
  return {
    user_id: userId,
    entry_date: date,
    content: summary.content || '',
    model: summary.model || '',
    created_at: summary.createdAt,
    updated_at: summary.updatedAt,
    deleted_at: summary.deletedAt || null,
  };
}

function periodToCloud(summary, userId) {
  return {
    id: summary.id,
    user_id: userId,
    start_date: summary.startDate,
    end_date: summary.endDate,
    entry_ids: summary.entryIds || [],
    content: summary.content || '',
    model: summary.model || '',
    created_at: summary.createdAt,
    updated_at: summary.updatedAt,
    deleted_at: summary.deletedAt || null,
  };
}

async function pushCloudChanges() {
  const userId = state.cloud.session.user.id;
  const entryIds = [...cloudDirty('entries')];
  const entries = entryIds.map((id) => state.data.entries.find((entry) => entry.id === id)).filter(Boolean);
  if (entries.length) {
    const saved = await cloudRequest('/rest/v1/journal_entries?on_conflict=id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(entries.map((entry) => entryToCloud(entry, userId))),
    });
    mergeRemoteData({ entries: saved || [] });
  }
  clearCloudDirty('entries', entryIds);

  const dailyDates = [...cloudDirty('dailySummaries')];
  const summaries = dailyDates.map((date) => ({ date, summary: summaryForDate(date) })).filter(({ summary }) => Boolean(summary));
  if (summaries.length) {
    const saved = await cloudRequest('/rest/v1/daily_summaries?on_conflict=user_id,entry_date', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(summaries.map(({ date, summary }) => summaryToCloud(date, summary, userId))),
    });
    mergeRemoteData({ dailySummaries: saved || [] });
  }
  clearCloudDirty('dailySummaries', dailyDates);

  const periodIds = [...cloudDirty('periodSummaries')];
  const periods = periodIds.map((id) => state.data.periodSummaries.find((summary) => summary.id === id)).filter(Boolean);
  if (periods.length) {
    const saved = await cloudRequest('/rest/v1/period_summaries?on_conflict=id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(periods.map((summary) => periodToCloud(summary, userId))),
    });
    mergeRemoteData({ periodSummaries: saved || [] });
  }
  clearCloudDirty('periodSummaries', periodIds);
}

async function syncCloud({ quiet = false } = {}) {
  if (!isCloudConfigured() || !state.cloud.session) return;
  if (state.cloud.syncing) return state.cloud.syncPromise;
  state.cloud.syncing = true;
  const task = (async () => {
    renderCloudSyncDialog();
    try {
      const session = await activeCloudSession();
      const meta = state.data.cloudSync ?? (state.data.cloudSync = emptyCloudMeta());
      if (meta.accountId !== session.user.id) {
        if (meta.accountId) {
          if (quiet) return;
          const approved = window.confirm(
            '检测到设备上保留着另一个同步账号的数据。为防止日记串号，默认不会上传。\n\n确认后，当前本地日记会合并并上传到新账号；取消则保持本地数据不变，建议先导出备份。'
          );
          if (!approved) {
            renderCloudSyncDialog();
            return;
          }
        }
        meta.accountId = session.user.id;
        markAllCloudDirty();
        persistData({ queue: false });
      }
      await pullCloudData();
      await pushCloudChanges();
      persistData({ queue: false });
      render();
      renderCloudDialogs();
      if (!quiet) {
        recordCloudActivity('手动同步完成', 'success');
        showToast('云端内容已同步');
      }
    } catch (error) {
      renderCloudSyncDialog();
      if (!quiet) {
        const message = error instanceof Error ? error.message : '未知错误';
        recordCloudActivity(`同步失败：${message}`, 'error');
        showToast(message.includes('stale update')
          ? '检测到另一台设备的较新版本：已停止上传以防覆盖，请先导出本机内容后刷新同步。'
          : `同步失败：${message}`);
      }
    } finally {
      state.cloud.syncing = false;
      renderCloudDialogs();
    }
  })();
  state.cloud.syncPromise = task;
  try {
    return await task;
  } finally {
    state.cloud.syncPromise = null;
  }
}

function queueCloudSync() {
  if (!isCloudConfigured() || !state.cloud?.session || !hasCloudChanges()) return;
  clearTimeout(state.cloud.syncTimer);
  state.cloud.syncTimer = setTimeout(() => syncCloud({ quiet: true }), 650);
}

function startCloudAutoSync() {
  clearInterval(state.cloud.autoSyncTimer);
  state.cloud.autoSyncTimer = 0;
  if (!state.cloud.session || !isCloudConfigured()) return;
  state.cloud.autoSyncTimer = window.setInterval(() => syncCloud({ quiet: true }), AUTO_SYNC_INTERVAL_MS);
}

function stopCloudAutoSync() {
  clearInterval(state.cloud.autoSyncTimer);
  state.cloud.autoSyncTimer = 0;
}

function syncBeforeLeaving() {
  if (!state.cloud.session || state.cloud.syncing) return;
  void syncCloud({ quiet: true });
}

async function signInCloud() {
  if (!ensureCloudConfigured()) return;
  const credentials = validateCloudCredentials();
  if (!credentials) return;
  setBusy(elements.syncSignIn, true, '正在登录…');
  try {
    const payload = await cloudAuthRequest('/auth/v1/token?grant_type=password', credentials);
    const session = sessionFromPayload(payload);
    if (!session) throw new Error('登录结果缺少会话信息');
    storeCloudSession(session);
    startCloudAutoSync();
    elements.syncPassword.value = '';
    recordCloudActivity('登录成功', 'success');
    await syncCloud();
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    recordCloudActivity(`登录失败：${message}`, 'error');
    showToast(`登录失败：${message}`);
  } finally {
    setBusy(elements.syncSignIn, false);
    renderCloudDialogs();
  }
}

async function signUpCloud() {
  if (!ensureCloudConfigured()) return;
  const credentials = validateCloudCredentials();
  if (!credentials) return;
  setBusy(elements.syncSignUp, true, '正在注册…');
  try {
    const payload = await cloudAuthRequest('/auth/v1/signup', {
      ...credentials,
      email_redirect_to: emailRedirectUrl(),
    });
    const session = sessionFromPayload(payload);
    if (session) {
      storeCloudSession(session);
      startCloudAutoSync();
      elements.syncPassword.value = '';
      recordCloudActivity('注册并登录成功', 'success');
      await syncCloud();
    } else {
      elements.syncPassword.value = '';
      recordCloudActivity('注册已提交，等待邮箱验证', 'info');
      showToast('注册已提交，请按页面提示完成后再登录同步');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    recordCloudActivity(`注册失败：${message}`, 'error');
    showToast(`注册失败：${message}`);
  } finally {
    setBusy(elements.syncSignUp, false);
    renderCloudDialogs();
  }
}

async function signOutCloud() {
  try {
    await syncCloud({ quiet: true });
    const session = state.cloud.session;
    if (session) {
      await fetch(cloudUrl('/auth/v1/logout'), {
        method: 'POST',
        headers: {
          apikey: readCloudConfig().publishableKey,
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
    }
  } finally {
    storeCloudSession(null);
    stopCloudAutoSync();
    recordCloudActivity('已退出同步账号', 'info');
    renderCloudDialogs();
    showToast('已退出同步账号，本地日记仍保留');
  }
}

async function initializeCloudSync() {
  const restoredFromCallback = await restoreCloudSessionFromAuthCallback();
  renderCloudDialogs();
  startCloudAutoSync();
  if (!restoredFromCallback && state.cloud.session && isCloudConfigured()) syncCloud({ quiet: true });
}

function nativeUpdater() {
  const capacitor = window.Capacitor;
  if (!capacitor?.isNativePlatform?.()) return null;
  return capacitor.Plugins?.CapacitorUpdater ?? capacitor.registerPlugin?.('CapacitorUpdater') ?? null;
}

function isTrustedMobileUpdate(manifest) {
  if (!manifest || typeof manifest.version !== 'string' || typeof manifest.url !== 'string' || typeof manifest.checksum !== 'string') return false;
  if (!/^mobile-ota-[a-f0-9]{16}$/.test(manifest.version) || !/^[a-f0-9]{64}$/.test(manifest.checksum)) return false;
  try {
    const url = new URL(manifest.url);
    const base = new URL(MOBILE_OTA_MANIFEST_URL);
    return url.origin === base.origin
      && url.pathname === `/suijian-journal/updates/suijian-web-${manifest.version}.zip`;
  } catch {
    return false;
  }
}

function notifyNativeBundleReady(updater) {
  if (state.nativeUpdate.readyPromise) return state.nativeUpdate.readyPromise;
  state.nativeUpdate.readyPromise = updater.notifyAppReady().catch(() => undefined);
  return state.nativeUpdate.readyPromise;
}

async function checkNativeAppUpdate({ quiet = true } = {}) {
  const updater = nativeUpdater();
  if (!updater || state.nativeUpdate.checking) return;
  state.nativeUpdate.checking = true;
  try {
    await notifyNativeBundleReady(updater);
    const response = await fetch(MOBILE_OTA_MANIFEST_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`更新清单请求失败：${response.status}`);
    const manifest = await response.json();
    if (!isTrustedMobileUpdate(manifest)) throw new Error('更新清单格式无效');

    const [current, pending] = await Promise.all([updater.current(), updater.getNextBundle()]);
    if ([current?.bundle?.version, pending?.version].includes(manifest.version)) return;

    const bundle = await updater.download({ url: manifest.url, version: manifest.version, checksum: manifest.checksum });
    await updater.next({ id: bundle.id });
    if (!quiet) showToast('新版已下载，退出或重开 App 后会自动启用');
  } catch (error) {
    // 保留当前已验证的本地版本；下次启动、回到前台或定时检查时会重试。
    console.info('Mobile update check skipped', error instanceof Error ? error.message : error);
  } finally {
    state.nativeUpdate.checking = false;
  }
}

function initializeNativeUpdates() {
  const updater = nativeUpdater();
  if (!updater) return;
  // This runs before cloud/API work so a newly switched bundle can prove it booted.
  void notifyNativeBundleReady(updater);
  void checkNativeAppUpdate({ quiet: true });
  clearInterval(state.nativeUpdate.timer);
  state.nativeUpdate.timer = window.setInterval(() => void checkNativeAppUpdate({ quiet: true }), MOBILE_OTA_CHECK_INTERVAL_MS);
}

function bindEvents() {
  elements.navLinks.forEach((link) => link.addEventListener('click', () => {
    state.view = link.dataset.view;
    render();
  }));
  elements.summaryPanelButton.addEventListener('click', openPeriodSummaryDialog);
  elements.searchPanelButton.addEventListener('click', openSearchDialog);
  elements.cloudSyncButton.addEventListener('click', handleCloudSyncButton);
  elements.cloudAccountButton.addEventListener('click', openCloudAccountDialog);
  elements.closeAccountDialog.addEventListener('click', closeCloudAccountDialog);
  elements.closeSyncDialog.addEventListener('click', closeCloudSyncDialog);
  closeDialogOnBackdrop(elements.accountDialog, closeCloudAccountDialog);
  closeDialogOnBackdrop(elements.syncDialog, closeCloudSyncDialog);
  elements.syncAuthForm.addEventListener('submit', (event) => event.preventDefault());
  elements.syncSignIn.addEventListener('click', signInCloud);
  elements.syncSignUp.addEventListener('click', signUpCloud);
  elements.syncOpenAccount.addEventListener('click', () => {
    closeCloudSyncDialog();
    openCloudAccountDialog();
  });
  elements.syncNowButton.addEventListener('click', () => syncCloud());
  elements.syncSignOut.addEventListener('click', signOutCloud);
  elements.clearSyncActivity.addEventListener('click', clearCloudActivity);
  window.addEventListener('online', () => {
    syncCloud({ quiet: true });
    void checkNativeAppUpdate({ quiet: true });
  });
  window.addEventListener('focus', () => {
    syncCloud({ quiet: true });
    void checkNativeAppUpdate({ quiet: true });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') syncBeforeLeaving();
    if (document.visibilityState === 'visible') {
      syncCloud({ quiet: true });
      void checkNativeAppUpdate({ quiet: true });
    }
  });
  window.addEventListener('pagehide', syncBeforeLeaving);
  elements.closePeriodSummaryDialog.addEventListener('click', closePeriodSummaryDialog);
  elements.closeSearchDialog.addEventListener('click', closeSearchDialog);
  closeDialogOnBackdrop(elements.periodSummaryDialog, closePeriodSummaryDialog);
  closeDialogOnBackdrop(elements.searchDialog, closeSearchDialog);
  elements.goToday.addEventListener('click', () => {
    state.activeDate = localDateKey();
    state.archiveJumpDate = state.activeDate;
    state.visibleMonth = startOfMonth(new Date());
    render();
  });
  elements.entryTitle.addEventListener('input', scheduleDraftSave);
  elements.entryContent.addEventListener('input', scheduleDraftSave);
  elements.clearDraft.addEventListener('click', () => {
    elements.entryTitle.value = '';
    elements.entryContent.value = '';
    localStorage.removeItem(draftKey());
    updateWordCount();
    renderEditorAiSuggestion({});
    elements.draftStatus.textContent = '草稿已清空';
  });
  elements.organizeDraft.addEventListener('click', organizeDraftWithAI);
  elements.editOrganizePrompt.addEventListener('click', () => openPromptEditor('organize'));
  elements.applyAiSuggestion.addEventListener('click', applyAiSuggestion);
  elements.dismissAiSuggestion.addEventListener('click', dismissAiSuggestion);
  elements.saveEntry.addEventListener('click', saveNewEntry);
  elements.previousMonth.addEventListener('click', () => {
    state.visibleMonth = new Date(state.visibleMonth.getFullYear(), state.visibleMonth.getMonth() - 1, 1);
    renderCalendar();
  });
  elements.nextMonth.addEventListener('click', () => {
    state.visibleMonth = new Date(state.visibleMonth.getFullYear(), state.visibleMonth.getMonth() + 1, 1);
    renderCalendar();
  });
  elements.archiveJumpButton.addEventListener('click', () => jumpToArchiveDate(elements.archiveJumpDate.value));
  elements.archiveJumpDate.addEventListener('change', () => jumpToArchiveDate(elements.archiveJumpDate.value));
  elements.periodStart.addEventListener('change', updatePeriodEntryCount);
  elements.periodEnd.addEventListener('change', updatePeriodEntryCount);
  elements.summarizePeriod.addEventListener('click', summarizePeriod);
  elements.editPeriodSummaryPrompt.addEventListener('click', () => openPromptEditor('summary'));
  elements.searchInput.addEventListener('input', renderSearchResults);
  elements.exportButton.addEventListener('click', exportData);
  elements.importInput.addEventListener('change', (event) => {
    const [file] = event.target.files;
    if (file) importData(file);
  });
  elements.modelConfigButton.addEventListener('click', openAiConfig);
  elements.closeAiConfig.addEventListener('click', closeAiConfig);
  elements.closePromptEditor.addEventListener('click', closePromptEditor);
  closeDialogOnBackdrop(elements.aiConfigDialog, closeAiConfig);
  closeDialogOnBackdrop(elements.promptEditorDialog, closePromptEditor);
  elements.promptEditorInput.addEventListener('input', updatePromptEditorCount);
  elements.restorePromptEditor.addEventListener('click', () => {
    elements.promptEditorInput.value = promptFor(state.promptEditorType, null);
    updatePromptEditorCount();
  });
  elements.promptEditorForm.addEventListener('submit', (event) => {
    event.preventDefault();
    savePromptEditor();
  });
  elements.aiOrganizePrompt.addEventListener('input', updateAiPromptMeta);
  elements.aiSummaryPrompt.addEventListener('input', updateAiPromptMeta);
  elements.restoreOrganizePrompt.addEventListener('click', () => {
    elements.aiOrganizePrompt.value = DEFAULT_ORGANIZE_PROMPT;
    updateAiPromptMeta();
  });
  elements.restoreSummaryPrompt.addEventListener('click', () => {
    elements.aiSummaryPrompt.value = DEFAULT_SUMMARY_PROMPT;
    updateAiPromptMeta();
  });
  elements.aiConfigForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const config = {
      endpoint: elements.aiEndpoint.value.trim(),
      model: elements.aiModel.value.trim(),
      organizePrompt: elements.aiOrganizePrompt.value.trim() || DEFAULT_ORGANIZE_PROMPT,
      summaryPrompt: elements.aiSummaryPrompt.value.trim() || DEFAULT_SUMMARY_PROMPT,
    };
    const apiKey = elements.aiApiKey.value.trim();
    if (!config.endpoint || !config.model || !apiKey) return;
    runtimeAiApiKey = apiKey;
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
    closeAiConfig();
    showToast(`模型配置已保存：${config.model}；Key 仅保留到本次页面会话结束`);
  });
  elements.removeAiConfig.addEventListener('click', () => {
    localStorage.removeItem(AI_CONFIG_KEY);
    runtimeAiApiKey = '';
    elements.aiConfigForm.reset();
    elements.aiOrganizePrompt.value = DEFAULT_ORGANIZE_PROMPT;
    elements.aiSummaryPrompt.value = DEFAULT_SUMMARY_PROMPT;
    updateAiPromptMeta();
    showToast('模型配置已清除');
  });
}

bindEvents();
render();
void initializeNativeUpdates();
initializeCloudSync();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js?release=20260812-mobile-ota'));
}
