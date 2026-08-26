const ACCOUNT_DATA_PREFIX = 'suijian-calendar-journal-account-v2:';
const ACCOUNT_DRAFT_PREFIX = 'suijian-draft-account-v2:';
const LEGACY_AI_CONFIG_KEY = 'suijian-ai-config-v1';
const ACCOUNT_AI_CONFIG_PREFIX = 'suijian-ai-config-account-v2:';
const AI_SETTINGS_TABLE = 'ai_settings';
const DESKTOP_APP_URL = 'https://aron0525.github.io/suijian-journal/';
const CLOUD_CONFIG_KEY = 'suijian-supabase-config-v1';
const CLOUD_SESSION_KEY = 'suijian-supabase-session-v1';
const ACCOUNT_CLOUD_ACTIVITY_PREFIX = 'suijian-cloud-activity-v2:';
const LEGACY_STORAGE_KEY = 'suijian-calendar-journal-v1';
const DEFAULT_SUPABASE_URL = 'https://ekotpodfgbkcykfcewmc.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3TEgVHOwGufdfu_DHcvGLg_XD0tXovA';
const MAX_PERIOD_INPUT_CHARS = 60000;
const MAX_IMPORT_BYTES = 12 * 1024 * 1024;
const MAX_ATTACHMENT_COUNT = 4;
const MAX_ATTACHMENT_BYTES = 1024 * 1024;
const MAX_ATTACHMENTS_TOTAL_BYTES = Math.floor(2.25 * 1024 * 1024);
const MAX_ATTACHMENT_DATA_URL_CHARS = Math.ceil(MAX_ATTACHMENT_BYTES * 1.38) + 128;
const MAX_ATTACHMENT_NAME_CHARS = 120;
const ALLOWED_ATTACHMENT_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf',
  'text/plain', 'text/markdown', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);
const AUTO_BACKUP_DB = 'suijian-auto-backups-v1';
const AUTO_BACKUP_STORE = 'recovery-snapshots';
const AUTO_BACKUP_SNAPSHOT_COUNT = 3;
const AUTO_BACKUP_DELAY_MS = 800;
const CLOUD_DAILY_BACKUP_PREFIX = 'suijian-cloud-daily-backup-v1:';
const CLOUD_DAILY_BACKUP_RETENTION_DAYS = 14;
const MAX_ENTRY_TITLE_CHARS = 80;
const MAX_ENTRY_TAGS = 8;
const MAX_ENTRY_TAG_CHARS = 18;
const MAX_ENTRY_MOOD_CHARS = 18;
const JOURNAL_MOODS = Object.freeze(['舒展', '平静', '充实', '开心', '焦虑', '低落', '疲惫', '烦躁']);
const JOURNAL_ATTACHMENT_BUCKET = 'journal-attachments';
const MAX_ENTRY_CONTENT_CHARS = 10000;
const MAX_ENTRY_WORK_CONTENT_CHARS = 3000;
const MAX_SUMMARY_CHARS = 60000;
const AUTO_SYNC_INTERVAL_MS = 10 * 60 * 1000;
const MOBILE_OTA_MANIFEST_URL = 'https://aron0525.github.io/suijian-journal/app-update.json';
const MOBILE_OTA_CHECK_INTERVAL_MS = 10 * 60 * 1000;
const NATIVE_APP_UPDATE_MANIFEST_URL = 'https://aron0525.github.io/suijian-journal/native-app-update.json';
const REMINDER_SETTINGS_KEY = 'suijian-writing-reminder-v1';
const DEFAULT_REMINDER_SETTINGS = Object.freeze({ enabled: false, time: '21:30', days: [1, 2, 3, 4, 5, 6, 7], skipDate: '', snoozedUntil: '' });
let runtimeAiApiKey = '';
const AI_API_STYLES = Object.freeze({
  OPENAI_COMPATIBLE: 'openai-compatible',
  AZURE_OPENAI: 'azure-openai',
});
const AI_PROVIDER_PRESETS = Object.freeze({
  deepseek: Object.freeze({
    label: 'DeepSeek', apiStyle: AI_API_STYLES.OPENAI_COMPATIBLE,
    endpoint: 'https://api.deepseek.com', model: 'deepseek-v4-flash',
    models: Object.freeze(['deepseek-v4-flash', 'deepseek-chat', 'deepseek-reasoner']),
    description: 'DeepSeek 官方 Chat Completions 地址已自动填入。',
  }),
  openai: Object.freeze({
    label: 'OpenAI', apiStyle: AI_API_STYLES.OPENAI_COMPATIBLE,
    endpoint: 'https://api.openai.com/v1', model: 'gpt-5-mini',
    models: Object.freeze(['gpt-5-mini', 'gpt-4.1-mini', 'gpt-4o-mini']),
    description: 'OpenAI 官方 API 地址已自动填入；可从推荐模型中选择或直接填写模型 ID。',
  }),
  'openai-compatible': Object.freeze({
    label: '自定义 OpenAI 兼容 API', apiStyle: AI_API_STYLES.OPENAI_COMPATIBLE,
    endpoint: '', model: '', models: Object.freeze([]),
    description: '填写服务商提供的 OpenAI 兼容基础地址和模型 ID。',
  }),
  'azure-openai': Object.freeze({
    label: 'Azure OpenAI', apiStyle: AI_API_STYLES.AZURE_OPENAI,
    endpoint: 'https://YOUR-RESOURCE-NAME.openai.azure.com/openai/v1', model: 'YOUR-DEPLOYMENT-NAME',
    models: Object.freeze(['YOUR-DEPLOYMENT-NAME']),
    description: '沿用 Azure OpenAI 的现有配置；模型名称填写 Azure 中的 deployment 名称。',
  }),
  qwen: Object.freeze({
    label: '千问 Qwen', apiStyle: AI_API_STYLES.OPENAI_COMPATIBLE,
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus',
    models: Object.freeze(['qwen-plus', 'qwen-turbo', 'qwen-max']),
    description: '百炼 OpenAI 兼容地址已自动填入。',
  }),
  kimi: Object.freeze({
    label: 'Kimi', apiStyle: AI_API_STYLES.OPENAI_COMPATIBLE,
    endpoint: 'https://api.moonshot.cn/v1', model: 'kimi-k2.6',
    models: Object.freeze(['kimi-k2.6', 'moonshot-v1-8k']),
    description: 'Kimi OpenAI 兼容地址已自动填入。',
  }),
  minimax: Object.freeze({
    label: 'MiniMax', apiStyle: AI_API_STYLES.OPENAI_COMPATIBLE,
    endpoint: 'https://api.minimax.io/v1', model: 'MiniMax-M2.7',
    models: Object.freeze(['MiniMax-M2.7', 'MiniMax-Text-01']),
    description: 'MiniMax OpenAI 兼容地址已自动填入。',
  }),
  glm: Object.freeze({
    label: '智谱 GLM', apiStyle: AI_API_STYLES.OPENAI_COMPATIBLE,
    endpoint: 'https://api.z.ai/api/paas/v4', model: 'glm-5.1',
    models: Object.freeze(['glm-5.1', 'glm-4.7-flash']),
    description: '智谱 GLM OpenAI 兼容地址已自动填入。',
  }),
});
const AI_COMPATIBLE_PLATFORM_KEYS = Object.freeze(['openai-compatible', 'qwen', 'kimi', 'minimax', 'glm', 'azure-openai']);

const PREVIOUS_DEFAULT_ORGANIZE_PROMPT = `你是一名日记整理助手。请将我输入的口语化、杂乱、跳跃、逻辑不完整的内容，整理成自然、清晰、易读的日记。

要求：
1. 保留原意、情绪和关键事实，优先保持原有表达顺序。
2. 修正语病、错别字、重复表达和混乱语序，使语言自然流畅。
3. 只有在内容明显混乱、前后矛盾或难以理解时，才进行必要的逻辑调整。
4. 不强制套用固定结构；原文没有感受、原因、总结或计划时，直接省略。
5. 不擅自编造经历、人物、时间或细节。信息不足或存在矛盾时，用【待确认：……】标记。
6. 直接输出整理后的日记，不需要解释修改过程。

我的原始内容：
{{输入内容}}`;
const PREVIOUS_DEFAULT_SUMMARY_PROMPT = `你是一名日记总结助手。请阅读我提供的一段时间内的多篇日记或记录，提炼其中真正重要的信息，生成一份简洁、清晰的阶段总结。

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
const PREVIOUS_REFINED_ORGANIZE_PROMPT = `你是一名日记整理助手。请把我的原始记录整理为一篇清晰、自然、适合留存的书面日记。

任务重点：
把口语化、碎片化、跳跃或指代不清的表达，转成完整、明确、连贯的书面表达；只在原文信息足以支持时补足省略的主语、时间关系或连接词。

要求：
1. 保留原文中的事实、顺序、情绪和语气，不新增人物、经历、时间、动机、原因或结论。
2. 合并重复内容，修正错别字、语病和混乱语序；把口头语、半句话改成准确、自然的书面句子。
3. 以原文的记录顺序为主；只有为消除明显歧义或断裂时才调整顺序。
4. 不强行补写“感受、反思、总结、计划”或标题；原文没有就不写。
5. 信息不足、指代不明或前后矛盾时，用【待确认：……】标记，不猜测。
6. 直接输出整理后的日记正文；不解释修改内容，不写前言或评价。

原始记录：
{{输入内容}}`;
const PREVIOUS_REFINED_SUMMARY_PROMPT = `你是一名日记记录整理助手。请根据一段时间内的多篇日记，提炼“我做了什么”和“我想了什么”的事实性阶段记录。

任务重点：
汇总实际发生的事情、推进的事项和明确写出的想法、关注点、判断、困扰或计划。不是反思报告、心理分析、建议或鼓励；不要从记录推导成长、意义、教训或情绪结论。

要求：
1. 只基于原始记录中明确出现的信息，合并重复内容，不编造人物、事件、原因或结论。
2. 重点提炼实际完成、推进、安排或经历的事情，以及明确写出的想法、关注点和计划；没有的类别直接省略。
3. 按时间或内容自然归类，避免逐篇复述日记。
4. 不评价、不劝导、不提出改进建议，也不把零散记录强行写成反思。
5. 信息不足、指代不明或前后矛盾时，用【待确认：……】标记，不猜测。
6. 不修改、评价或替换原始日记内容，只输出独立的阶段记录。

输出格式：
阶段记录：

做了什么：
- 【按时间或主题列出实际做过、推进或安排的事情】

想了什么：
- 【列出明确写下的想法、关注点、判断、困扰或计划】

原始记录：
{{输入内容}}`;
const PREVIOUS_CURRENT_ORGANIZE_PROMPT = `你是一名日记整理助手。请把我的原始记录整理为一篇清晰、自然、适合留存的书面日记。

任务重点：
把口语化、碎片化、跳跃或指代不清的表达，转成完整、明确、连贯的书面表达；只在原文信息足以支持时补足省略的主语、时间关系或连接词。

要求：
1. 保留原文中的事实、顺序、情绪和语气，不新增人物、经历、时间、动机、原因或结论。
2. 合并重复内容，修正错别字、语病和混乱语序；把口头语、半句话改成准确、自然的书面句子。
3. 以原文的记录顺序为主；只有为消除明显歧义或断裂时才调整顺序。
4. 不强行补写“感受、反思、总结、计划”或标题；原文没有就不写。
5. 无法确定的信息保持原样，不改写、不补全；不要使用【待确认】或任何推测性标记。
6. 直接输出整理后的日记正文；不解释修改内容，不写前言或评价。

原始记录：
{{输入内容}}`;
const PREVIOUS_CURRENT_SUMMARY_PROMPT = `你是一名日记记录整理助手。请根据一段时间内的多篇日记，提炼“我做了什么”和“我想了什么”的事实性阶段记录。

任务重点：
汇总实际发生的事情、推进的事项和明确写出的想法、关注点、判断、困扰或计划。不是反思报告、心理分析、建议或鼓励；不要从记录推导成长、意义、教训或情绪结论。

要求：
1. 只基于原始记录中明确出现的信息，合并重复内容，不编造人物、事件、原因或结论。
2. 重点提炼实际完成、推进、安排或经历的事情，以及明确写出的想法、关注点和计划；没有的类别直接省略。
3. 按时间或内容自然归类，避免逐篇复述日记。
4. 不评价、不劝导、不提出改进建议，也不把零散记录强行写成反思。
5. 无法确定的内容不写入总结，不猜测、不补全；不要使用【待确认】或任何推测性标记。
6. 不修改、评价或替换原始日记内容，只输出独立的阶段记录。

输出格式：
阶段记录：

做了什么：
- 【按时间或主题列出实际做过、推进或安排的事情】

想了什么：
- 【列出明确写下的想法、关注点、判断、困扰或计划】

原始记录：
{{输入内容}}`;
const DEFAULT_ORGANIZE_PROMPT = `你是一名日记编辑。请把原始记录整理成自然、清楚的书面日记。你只负责改善表达，不重写经历。

处理边界：
1. 直接修改：错别字、标点、病句、口头语、无意义重复，以及能从同一句或相邻句明确判断的语序问题。
2. 谨慎补全：只有原文已明确出现依据时，才补出省略的主语、对象或连接词。
3. 保持不动：人物身份、事情原因、时间先后、地点、动机、结果、指代对象或未说完的内容，只要不能确定，就保留原有说法；不要猜测、补全、泛化替换，也不要添加【待确认】等标记。
4. 保留第一人称、事实、细节、情绪和叙述顺序。不要添加标题、清单、反思、总结、计划、评价或原文没有的内容。

示例：
原始：今天开会说产品里导入那里要改，我先看看，晚上想起来有点烦。
整理：今天开会时提到，产品的导入功能需要修改。我准备先查看具体情况。晚上想起这件事时，感到有些烦躁。

原始：他昨天又说那个事，我没回，后面再看吧。
整理：他昨天又说起那件事，我没有回复，后面再看吧。

输出要求：
只输出整理后的日记正文；按原文自然停顿分段，不解释修改过程。

原始记录：
{{输入内容}}`;
const DEFAULT_SUMMARY_PROMPT = `你是一名日记记录整理助手。请把一段时间内的多篇日记压缩为事实性的阶段记录，只说明“我做了什么”和“我想了什么”。

提炼边界：
1. 只采纳原文明确写出的事件、进展、安排、想法、判断、关注点、困扰或计划；不推断原因、意义、成长、情绪变化或结论。
2. 合并反复出现的同一件事，但必须区分“已完成、进行中、计划”，不能把它们混成同一种状态；日期明确时保留日期或时间范围。
3. “做了什么”只写实际经历、推进事项和明确计划；“想了什么”只写明确表达的想法、判断、关注点或困扰。
4. 指代不明、信息不足或前后矛盾的内容不写入总结；不猜测、不补全、不使用【待确认】等标记。
5. 不逐篇复述；不写反思、评价、建议、鼓励、心理分析或结尾总结。

示例：
原始记录：
【4月2日】下午处理导入功能，没有完成，明天继续。一直在想这个功能是不是得改。
【4月3日】把导入功能改完了，顺手约了用户聊。

阶段记录：
做了什么：
- 4月2日，进行中：处理导入功能，尚未完成。
- 4月3日，已完成：完成导入功能修改；安排与用户沟通。

想了什么：
- 关注导入功能是否需要调整。

输出格式：
阶段记录：

做了什么：
- 【按时间或主题合并；必要时标注“已完成 / 进行中 / 计划”】

想了什么：
- 【只列出明确写下的想法、判断、关注点或困扰】

没有可靠内容的栏目直接省略。

原始记录：
{{输入内容}}`;
const LEGACY_SUMMARY_PROMPTS = new Set([
  PREVIOUS_CURRENT_SUMMARY_PROMPT,
  PREVIOUS_REFINED_SUMMARY_PROMPT,
  PREVIOUS_DEFAULT_SUMMARY_PROMPT,
  '你是中文日记汇总助手。严格依据给定日记，提炼主要事件、反复出现的主题、情绪变化、已做决定和待跟进事项；涉及日期时尽量标注相关日期。不要改写、删除或推断原日记没有的事实。用清晰的项目符号输出。',
]);
const LEGACY_ORGANIZE_PROMPTS = new Set([
  PREVIOUS_CURRENT_ORGANIZE_PROMPT,
  PREVIOUS_REFINED_ORGANIZE_PROMPT,
  PREVIOUS_DEFAULT_ORGANIZE_PROMPT,
  '你是中文日记编辑助手。请在不改变事实、情绪和第一人称语气的前提下，理顺句子和段落结构，修正错别字、标点、病句与明显的语序问题。不要增加新信息或解释。只输出整理后的日记正文。',
  '你是中文日记纠错助手。请在不改变事实、情绪、第一人称和叙事顺序的前提下，只修正错别字、标点、病句和明显的语序问题。不要增加新信息，不要解释修改原因。只输出修正后的日记正文。',
]);
const dateFormatter = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
const timeFormatter = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

const initialCloudSession = loadCloudSession();

const state = {
  data: loadData(initialCloudSession?.user?.id),
  activeDate: localDateKey(),
  view: 'today',
  visibleMonth: startOfMonth(new Date()),
  busy: false,
  promptEditorType: 'organize',
  archiveJumpDate: '',
  cloud: { session: initialCloudSession, activity: loadCloudActivity(initialCloudSession?.user?.id), syncing: false, syncPromise: null, syncTimer: 0, autoSyncTimer: 0, attachmentsSupported: null, tasksSupported: null, backupsSupported: null, aiConfigSupported: null, aiConfigError: '', lastError: '' },
  nativeUpdate: { checking: false, timer: 0, readyPromise: null },
  nativeInstaller: { checking: false, timer: 0, manifest: null, installed: null, status: '' },
  backup: { timer: 0 },
  pastedDraft: null,
  reviewYear: new Date().getFullYear(),
  reviewMode: 'year',
  reminder: { settings: loadReminderSettings(), status: '', timer: 0 },
  editingEntryId: '',
};

const elements = {
  appShell: document.querySelector('.app-shell'),
  topActions: document.querySelector('.top-actions'),
  authGate: document.querySelector('#auth-gate'),
  authGateLogin: document.querySelector('#auth-gate-login'),
  journalWorkspace: document.querySelector('#journal-workspace'),
  views: document.querySelectorAll('.view'),
  navLinks: document.querySelectorAll('.nav-link'),
  dateLabel: document.querySelector('#date-label'),
  entryCount: document.querySelector('#entry-count'),
  goToday: document.querySelector('#go-today'),
  entryTitle: document.querySelector('#entry-title'),
  entryMoodToggle: document.querySelector('#toggle-entry-mood'),
  entryTagsToggle: document.querySelector('#toggle-entry-tags'),
  entryMoodPanel: document.querySelector('#entry-mood-panel'),
  entryTagsPanel: document.querySelector('#entry-tags-panel'),
  entryMoodValue: document.querySelector('#entry-mood-value'),
  entryTagsValue: document.querySelector('#entry-tags-value'),
  entryMood: document.querySelector('#entry-mood'),
  clearEntryMood: document.querySelector('#clear-entry-mood'),
  entryTags: document.querySelector('#entry-tags'),
  addEntryTag: document.querySelector('#add-entry-tag'),
  entryTagList: document.querySelector('#entry-tag-list'),
  entryDetailDialog: document.querySelector('#entry-detail-dialog'),
  closeEntryDetail: document.querySelector('#close-entry-detail'),
  entryDetailForm: document.querySelector('#entry-detail-form'),
  entryDetailDate: document.querySelector('#entry-detail-date'),
  entryDetailTitle: document.querySelector('#entry-detail-title'),
  entryDetailMoodToggle: document.querySelector('#toggle-entry-detail-mood'),
  entryDetailTagsToggle: document.querySelector('#toggle-entry-detail-tags'),
  entryDetailMoodPanel: document.querySelector('#entry-detail-mood-panel'),
  entryDetailTagsPanel: document.querySelector('#entry-detail-tags-panel'),
  entryDetailMoodValue: document.querySelector('#entry-detail-mood-value'),
  entryDetailTagsValue: document.querySelector('#entry-detail-tags-value'),
  entryDetailMood: document.querySelector('#entry-detail-mood'),
  clearEntryDetailMood: document.querySelector('#clear-entry-detail-mood'),
  entryDetailTags: document.querySelector('#entry-detail-tags'),
  addEntryDetailTag: document.querySelector('#add-entry-detail-tag'),
  entryDetailTagList: document.querySelector('#entry-detail-tag-list'),
  entryDetailContent: document.querySelector('#entry-detail-content'),
  entryDetailAttachmentNote: document.querySelector('#entry-detail-attachment-note'),
  cancelEntryDetail: document.querySelector('#cancel-entry-detail'),
  deleteEntryDetail: document.querySelector('#delete-entry-detail'),
  journalTagOptions: document.querySelector('#journal-tag-options'),
  entryContent: document.querySelector('#entry-content'),
  wordCount: document.querySelector('#word-count'),
  draftStatus: document.querySelector('#draft-status'),
  draftLibraryButton: document.querySelector('#draft-library-button'),
  draftLibraryCount: document.querySelector('#draft-library-count'),
  draftLibraryDialog: document.querySelector('#draft-library-dialog'),
  closeDraftLibraryDialog: document.querySelector('#close-draft-library-dialog'),
  clearDraftLibrary: document.querySelector('#clear-draft-library'),
  draftLibraryList: document.querySelector('#draft-library-list'),
  addAttachment: document.querySelector('#add-attachment'),
  attachmentInput: document.querySelector('#attachment-input'),
  draftAttachments: document.querySelector('#draft-attachments'),
  clearDraft: document.querySelector('#clear-draft'),
  organizeDraft: document.querySelector('#organize-draft'),
  editOrganizePrompt: document.querySelector('#edit-organize-prompt'),
  editorAiResult: document.querySelector('#editor-ai-result'),
  editorAiContent: document.querySelector('#editor-ai-content'),
  editorAiDiff: document.querySelector('#editor-ai-diff'),
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
  searchStartDate: document.querySelector('#search-start-date'),
  searchEndDate: document.querySelector('#search-end-date'),
  searchTagFilter: document.querySelector('#search-tag-filter'),
  searchMoodFilter: document.querySelector('#search-mood-filter'),
  searchHasAttachment: document.querySelector('#search-has-attachment'),
  clearSearchFilters: document.querySelector('#clear-search-filters'),
  searchResults: document.querySelector('#search-results'),
  toolPanelButton: document.querySelector('#tool-panel-button'),
  quickToolsDialog: document.querySelector('#quick-tools-dialog'),
  closeQuickToolsDialog: document.querySelector('#close-quick-tools-dialog'),
  summaryPanelButton: document.querySelector('#summary-panel-button'),
  reviewPanelButton: document.querySelector('#review-panel-button'),
  reviewDialog: document.querySelector('#review-dialog'),
  closeReviewDialog: document.querySelector('#close-review-dialog'),
  reviewYear: document.querySelector('#review-year'),
  reviewRangeMode: document.querySelector('#review-range-mode'),
  reviewScopeKicker: document.querySelector('#review-scope-kicker'),
  reviewRangeLabel: document.querySelector('#review-range-label'),
  reviewRangeCopy: document.querySelector('#review-range-copy'),
  reviewYearlyDetails: document.querySelector('#review-yearly-details'),
  reviewHeatmap: document.querySelector('#review-heatmap'),
  reviewTaskList: document.querySelector('#review-task-list'),
  reviewDayCount: document.querySelector('#review-day-count'),
  reviewEntryCount: document.querySelector('#review-entry-count'),
  reviewWordCount: document.querySelector('#review-word-count'),
  reviewBestStreak: document.querySelector('#review-best-streak'),
  reviewMonthlyActivity: document.querySelector('#review-monthly-activity'),
  reviewEmotionTrend: document.querySelector('#review-emotion-trend'),
  reviewKeywords: document.querySelector('#review-keywords'),
  reviewAnnualCopy: document.querySelector('#review-annual-copy'),
  reminderForm: document.querySelector('#reminder-form'),
  reminderEnabled: document.querySelector('#reminder-enabled'),
  reminderTime: document.querySelector('#reminder-time'),
  reminderDayInputs: document.querySelectorAll('[data-reminder-day]'),
  reminderStatus: document.querySelector('#reminder-status'),
  reminderSnooze: document.querySelector('#reminder-snooze'),
  reminderSkipToday: document.querySelector('#reminder-skip-today'),
  searchPanelButton: document.querySelector('#search-panel-button'),
  backupPanelButton: document.querySelector('#backup-panel-button'),
  backupDialog: document.querySelector('#backup-dialog'),
  closeBackupDialog: document.querySelector('#close-backup-dialog'),
  backupSnapshotList: document.querySelector('#backup-snapshot-list'),
  backupStatus: document.querySelector('#backup-status'),
  cloudDailyBackupStatus: document.querySelector('#cloud-daily-backup-status'),
  backupExportJson: document.querySelector('#backup-export-json'),
  backupExportMarkdown: document.querySelector('#backup-export-markdown'),
  backupExportZip: document.querySelector('#backup-export-zip'),
  cloudSyncButton: document.querySelector('#cloud-sync-button'),
  cloudAccountButton: document.querySelector('#cloud-account-button'),
  accountDialog: document.querySelector('#account-dialog'),
  closeAccountDialog: document.querySelector('#close-account-dialog'),
  accountDialogCopy: document.querySelector('#account-dialog-copy'),
  desktopAppUrl: document.querySelector('#desktop-app-url'),
  copyDesktopAppUrl: document.querySelector('#copy-desktop-app-url'),
  mobileUpdatePanel: document.querySelector('#mobile-update-panel'),
  mobileAppVersion: document.querySelector('#mobile-app-version'),
  mobileAppUpdateStatus: document.querySelector('#mobile-app-update-status'),
  checkMobileUpdate: document.querySelector('#check-mobile-update'),
  downloadMobileUpdate: document.querySelector('#download-mobile-update'),
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
  toggleSyncPassword: document.querySelector('#toggle-sync-password'),
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
  importButton: document.querySelector('#import-button'),
  importInput: document.querySelector('#import-input'),
  modelConfigButton: document.querySelector('#model-config-button'),
  aiConfigDialog: document.querySelector('#ai-config-dialog'),
  aiConfigForm: document.querySelector('#ai-config-form'),
  aiInterfaceType: document.querySelector('#ai-interface-type'),
  aiPlatformField: document.querySelector('#ai-platform-field'),
  aiPlatformPreset: document.querySelector('#ai-platform-preset'),
  aiProviderDescription: document.querySelector('#ai-provider-description'),
  aiEndpoint: document.querySelector('#ai-endpoint'),
  aiModelLabel: document.querySelector('#ai-model-label'),
  aiModel: document.querySelector('#ai-model'),
  aiModelOptions: document.querySelector('#ai-model-options'),
  aiApiKey: document.querySelector('#ai-api-key'),
  openOrganizePromptSettings: document.querySelector('#open-organize-prompt-settings'),
  openSummaryPromptSettings: document.querySelector('#open-summary-prompt-settings'),
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
  return { accountId: '', dirty: { entries: [], dailySummaries: [], periodSummaries: [], tasks: [] } };
}

function emptyJournalData() {
  return { entries: [], summaries: {}, periodSummaries: [], tasks: [], cloudSync: emptyCloudMeta() };
}

function validJournalAccountId(userId) {
  return typeof userId === 'string' && userId.trim().length > 0 ? userId.trim() : '';
}

function journalDataStorageKey(userId) {
  const accountId = validJournalAccountId(userId);
  return accountId ? `${ACCOUNT_DATA_PREFIX}${accountId}` : '';
}

function accountDraftPrefix(userId) {
  const accountId = validJournalAccountId(userId);
  return accountId ? `${ACCOUNT_DRAFT_PREFIX}${accountId}:` : '';
}

function accountCloudActivityKey(userId) {
  const accountId = validJournalAccountId(userId);
  return accountId ? `${ACCOUNT_CLOUD_ACTIVITY_PREFIX}${accountId}` : '';
}

function activeJournalAccountId() {
  return validJournalAccountId(state.cloud?.session?.user?.id);
}

function loadCloudActivity(userId) {
  const storageKey = accountCloudActivityKey(userId);
  if (!storageKey) return [];
  try {
    const value = JSON.parse(localStorage.getItem(storageKey));
    if (!Array.isArray(value)) return [];
    return value
      .filter((item) => item && typeof item.message === 'string' && typeof item.at === 'string')
      .slice(0, 8);
  } catch {
    return [];
  }
}

function persistCloudActivity() {
  const storageKey = accountCloudActivityKey(activeJournalAccountId());
  if (!storageKey) return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(state.cloud.activity));
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
  const storageKey = accountCloudActivityKey(activeJournalAccountId());
  if (storageKey) localStorage.removeItem(storageKey);
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
      tasks: Array.isArray(dirty.tasks) ? [...new Set(dirty.tasks.filter(Boolean))] : [],
    },
  };
}

function normalizeStoredJournalData(parsed) {
  return {
    entries: Array.isArray(parsed?.entries) ? parsed.entries.map((entry) => ({ ...entry, attachments: normalizeAttachments(entry?.attachments), tags: normalizeTags(entry?.tags), mood: normalizeMood(entry?.mood), workContent: normalizeWorkContent(entry?.workContent) })) : [],
    summaries: parsed?.summaries && typeof parsed.summaries === 'object' ? parsed.summaries : {},
    periodSummaries: Array.isArray(parsed?.periodSummaries) ? parsed.periodSummaries : [],
    tasks: Array.isArray(parsed?.tasks) ? parsed.tasks.map(normalizeJournalTask).filter(Boolean) : [],
    cloudSync: normalizeCloudMeta(parsed?.cloudSync),
  };
}

function readStoredJournalData(storageKey) {
  if (!storageKey) return null;
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? normalizeStoredJournalData(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function hasStoredJournalContent(data) {
  return Boolean(data
    && (data.entries.length || Object.keys(data.summaries).length || data.periodSummaries.length || data.tasks.length));
}

function migrateLegacyAccountData(userId) {
  const accountId = validJournalAccountId(userId);
  const storageKey = journalDataStorageKey(accountId);
  if (!accountId || !storageKey) return false;

  // A previous failed read may already have created an empty v2 cache. It has no
  // content to preserve, so the verified legacy owner can still recover into it.
  const currentData = readStoredJournalData(storageKey);
  if (hasStoredJournalContent(currentData)) return false;

  // The old app used one browser-wide key. Move it only when that cache already
  // records the same authenticated owner; unbound or mismatched data stays hidden.
  const legacyData = readStoredJournalData(LEGACY_STORAGE_KEY);
  if (!legacyData?.cloudSync?.accountId || legacyData.cloudSync.accountId !== accountId) return false;

  legacyData.cloudSync.accountId = accountId;
  try {
    localStorage.setItem(storageKey, JSON.stringify(legacyData));
    return true;
  } catch {
    return false;
  }
}

function loadData(userId) {
  const accountId = validJournalAccountId(userId);
  const storageKey = journalDataStorageKey(accountId);
  if (!storageKey) return emptyJournalData();
  const data = readStoredJournalData(storageKey);
  // A cache is keyed by account and must also carry the same owner marker.
  if (!data || (data.cloudSync.accountId && data.cloudSync.accountId !== accountId)) return emptyJournalData();
  data.cloudSync.accountId = accountId;
  return data;
}

function persistData({ queue = true } = {}) {
  const storageKey = journalDataStorageKey(activeJournalAccountId());
  if (!storageKey) return false;
  try {
    localStorage.setItem(storageKey, JSON.stringify(state.data));
  } catch (error) {
    console.error('Failed to persist journal data', error);
    showToast('本地存储空间不足，未保存本次更改；请先导出并清理浏览器空间');
    return false;
  }
  renderSyncStatus();
  scheduleAutomaticBackup();
  if (queue) queueCloudSync();
  return true;
}

function activateJournalAccount(userId) {
  const accountId = validJournalAccountId(userId);
  if (!accountId) {
    clearJournalAccount();
    return false;
  }
  const restoredLegacyCache = migrateLegacyAccountData(accountId);
  runtimeAiApiKey = '';
  state.data = loadData(accountId);
  state.cloud.activity = loadCloudActivity(accountId);
  if (restoredLegacyCache) recordCloudActivity('已恢复此账号的旧版本本机日记，正在与云端核对', 'info');
  state.cloud.lastError = '';
  state.cloud.attachmentsSupported = null;
  state.cloud.tasksSupported = null;
  state.cloud.backupsSupported = null;
  state.cloud.aiConfigSupported = null;
  state.cloud.aiConfigError = '';
  state.pastedDraft = null;
  state.editingEntryId = '';
  return true;
}

function clearJournalAccount() {
  runtimeAiApiKey = '';
  clearTimeout(draftTimer);
  clearTimeout(state.cloud.syncTimer);
  clearTimeout(state.backup.timer);
  state.data = emptyJournalData();
  state.cloud.activity = [];
  state.cloud.lastError = '';
  state.cloud.attachmentsSupported = null;
  state.cloud.tasksSupported = null;
  state.cloud.backupsSupported = null;
  state.cloud.aiConfigSupported = null;
  state.cloud.aiConfigError = '';
  state.pastedDraft = null;
  state.editingEntryId = '';
}

function renderJournalAccess() {
  const locked = !activeJournalAccountId();
  elements.authGate.hidden = !locked;
  elements.journalWorkspace.hidden = locked;
  elements.appShell.classList.toggle('auth-required', locked);
  elements.topActions.classList.toggle('auth-required', locked);
  if (locked) elements.syncStatus.textContent = '请先登录';
  return locked;
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


function normalizeTags(value) {
  const raw = Array.isArray(value) ? value : String(value || '').split(/[，,、\n]/);
  const seen = new Set();
  return raw.reduce((tags, candidate) => {
    const tag = String(candidate || '').trim().replace(/\s+/g, ' ').slice(0, MAX_ENTRY_TAG_CHARS);
    const key = tag.toLocaleLowerCase();
    if (!tag || seen.has(key) || tags.length >= MAX_ENTRY_TAGS) return tags;
    seen.add(key);
    tags.push(tag);
    return tags;
  }, []);
}

function normalizeMood(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, MAX_ENTRY_MOOD_CHARS);
}

function normalizeWorkContent(value) {
  return String(value || '').trim().slice(0, MAX_ENTRY_WORK_CONTENT_CHARS);
}

function entryTagsLabel(tags) {
  return normalizeTags(tags).join(' · ');
}

function entryMetadataValues(entry) {
  return { mood: normalizeMood(entry?.mood), tags: normalizeTags(entry?.tags) };
}

function renderEntryMetadata(target, entry) {
  if (!target) return;
  const { mood, tags } = entryMetadataValues(entry);
  target.replaceChildren();
  target.hidden = !mood && !tags.length;
  if (mood) {
    const moodChip = document.createElement('span');
    moodChip.className = `entry-mood-chip mood-${mood}`;
    moodChip.textContent = mood;
    target.append(moodChip);
  }
  tags.forEach((tag) => {
    const chip = document.createElement('span');
    chip.className = 'entry-tag-chip';
    chip.textContent = `# ${tag}`;
    target.append(chip);
  });
}

function renderOptionalEntryTitle(target, entry) {
  if (!target) return;
  const title = String(entry?.title || '').trim();
  target.hidden = !title;
  target.textContent = title;
}

function archiveEntryLabel(entry) {
  const title = String(entry?.title || '').trim();
  if (title) return title;
  return String(entry?.content || '').replace(/\s+/g, ' ').trim();
}

function refreshJournalTagOptions() {
  if (!elements.journalTagOptions) return;
  const tags = [...new Set(state.data.entries.flatMap((entry) => normalizeTags(entry.tags)))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  elements.journalTagOptions.replaceChildren();
  tags.forEach((tag) => {
    const option = document.createElement('option');
    option.value = tag;
    elements.journalTagOptions.append(option);
  });
}

function tagEditorValues(target) {
  if (!target) return [];
  try {
    return normalizeTags(JSON.parse(target.dataset.tags || '[]'));
  } catch {
    return [];
  }
}

function tagEditorChanged(target) {
  if (target === elements.entryTagList) scheduleDraftSave();
  if (target === elements.entryTagList) updateMetadataPicker('entry');
  if (target === elements.entryDetailTagList) updateMetadataPicker('detail');
}

function renderTagEditor(target, tags) {
  if (!target) return;
  const values = normalizeTags(tags);
  target.dataset.tags = JSON.stringify(values);
  target.replaceChildren();
  if (!values.length) {
    const empty = document.createElement('span');
    empty.className = 'tag-editor-empty';
    empty.textContent = '还没有标签';
    target.append(empty);
    return;
  }
  values.forEach((tag) => {
    const chip = document.createElement('span');
    chip.className = 'tag-editor-chip';
    const label = document.createElement('span');
    label.textContent = `# ${tag}`;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'tag-editor-chip-remove';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `删除标签：${tag}`);
    remove.addEventListener('click', () => {
      renderTagEditor(target, values.filter((value) => value !== tag));
      tagEditorChanged(target);
    });
    chip.append(label, remove);
    target.append(chip);
  });
}

function addTagFromInput(input, target) {
  if (!input || !target) return false;
  const raw = input.value.trim();
  if (!raw) return false;
  const previous = tagEditorValues(target);
  const tags = normalizeTags([...previous, ...raw.split(/[，,、\n]/)]);
  input.value = '';
  renderTagEditor(target, tags);
  tagEditorChanged(target);
  return tags.length > previous.length;
}

function editorTags() {
  return tagEditorValues(elements.entryTagList);
}

function metadataPickerControls(scope) {
  if (scope === 'detail') {
    return {
      moodInput: elements.entryDetailMood,
      tagList: elements.entryDetailTagList,
      moodToggle: elements.entryDetailMoodToggle,
      tagsToggle: elements.entryDetailTagsToggle,
      moodPanel: elements.entryDetailMoodPanel,
      tagsPanel: elements.entryDetailTagsPanel,
      moodValue: elements.entryDetailMoodValue,
      tagsValue: elements.entryDetailTagsValue,
    };
  }
  return {
    moodInput: elements.entryMood,
    tagList: elements.entryTagList,
    moodToggle: elements.entryMoodToggle,
    tagsToggle: elements.entryTagsToggle,
    moodPanel: elements.entryMoodPanel,
    tagsPanel: elements.entryTagsPanel,
    moodValue: elements.entryMoodValue,
    tagsValue: elements.entryTagsValue,
  };
}

function updateMetadataPicker(scope) {
  const controls = metadataPickerControls(scope);
  const mood = normalizeMood(controls.moodInput?.value);
  const tags = tagEditorValues(controls.tagList);
  if (controls.moodValue) controls.moodValue.textContent = mood || '未选';
  if (controls.tagsValue) controls.tagsValue.textContent = tags.length ? `${tags.length} 个` : '未选';
  controls.moodToggle?.classList.toggle('has-value', Boolean(mood));
  controls.tagsToggle?.classList.toggle('has-value', Boolean(tags.length));
}

function closeMetadataPickers(scope) {
  const controls = metadataPickerControls(scope);
  [
    [controls.moodToggle, controls.moodPanel],
    [controls.tagsToggle, controls.tagsPanel],
  ].forEach(([toggle, panel]) => {
    if (panel) panel.hidden = true;
    toggle?.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
  });
}

function toggleMetadataPicker(scope, type) {
  const controls = metadataPickerControls(scope);
  const selectedToggle = type === 'mood' ? controls.moodToggle : controls.tagsToggle;
  const selectedPanel = type === 'mood' ? controls.moodPanel : controls.tagsPanel;
  const shouldOpen = Boolean(selectedPanel?.hidden);
  closeMetadataPickers(scope);
  if (!shouldOpen || !selectedPanel) return;
  selectedPanel.hidden = false;
  selectedToggle?.classList.add('is-open');
  selectedToggle?.setAttribute('aria-expanded', 'true');
  const focusTarget = selectedPanel.querySelector('input, button');
  window.requestAnimationFrame(() => focusTarget?.focus());
}

function chooseMood(scope, value) {
  const controls = metadataPickerControls(scope);
  if (!controls.moodInput) return;
  controls.moodInput.value = normalizeMood(value);
  updateMetadataPicker(scope);
  if (scope === 'entry') scheduleDraftSave();
  closeMetadataPickers(scope);
}

function attachmentPayload(value) {
  if (Array.isArray(value)) return { files: value, tags: [], mood: '', workContent: '' };
  if (!value || typeof value !== 'object') return { files: [], tags: [], mood: '', workContent: '' };
  return { files: Array.isArray(value.files) ? value.files : [], tags: normalizeTags(value.tags), mood: normalizeMood(value.mood), workContent: normalizeWorkContent(value.workContent) };
}

function cloudAttachmentPayload(entry) {
  return { files: normalizeAttachments(entry.attachments), tags: normalizeTags(entry.tags), mood: normalizeMood(entry.mood), workContent: normalizeWorkContent(entry.workContent) };
}

function draftKey() {
  const prefix = accountDraftPrefix(activeJournalAccountId());
  return prefix ? `${prefix}${state.activeDate}` : '';
}

function emptyDraft() {
  return { title: '', content: '', tags: [], mood: '', workContent: '', aiSuggestion: '', aiOriginal: '', workAiSuggestion: '', workAiOriginal: '', originalContent: '', attachments: [], updatedAt: '' };
}

function normalizeDraft(value) {
  const draft = value && typeof value === 'object' ? value : {};
  return {
    ...emptyDraft(),
    ...draft,
    title: typeof draft.title === 'string' ? draft.title.slice(0, MAX_ENTRY_TITLE_CHARS) : '',
    tags: normalizeTags(draft.tags),
    mood: normalizeMood(draft.mood),
    content: typeof draft.content === 'string' ? draft.content.slice(0, MAX_ENTRY_CONTENT_CHARS) : '',
    workContent: normalizeWorkContent(draft.workContent),
    aiSuggestion: typeof draft.aiSuggestion === 'string' ? draft.aiSuggestion.slice(0, MAX_ENTRY_CONTENT_CHARS) : '',
    aiOriginal: typeof draft.aiOriginal === 'string' ? draft.aiOriginal.slice(0, MAX_ENTRY_CONTENT_CHARS) : '',
    workAiSuggestion: typeof draft.workAiSuggestion === 'string' ? draft.workAiSuggestion.slice(0, MAX_ENTRY_WORK_CONTENT_CHARS) : '',
    workAiOriginal: typeof draft.workAiOriginal === 'string' ? draft.workAiOriginal.slice(0, MAX_ENTRY_WORK_CONTENT_CHARS) : '',
    originalContent: typeof draft.originalContent === 'string' ? draft.originalContent.slice(0, MAX_ENTRY_CONTENT_CHARS) : '',
    attachments: normalizeAttachments(draft.attachments),
    updatedAt: typeof draft.updatedAt === 'string' ? draft.updatedAt : '',
  };
}

function readDraft(storageKey) {
  if (!storageKey) return emptyDraft();
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? normalizeDraft(JSON.parse(raw)) : emptyDraft();
  } catch {
    return emptyDraft();
  }
}

function loadDraft() {
  return readDraft(draftKey());
}

function editorDraft() {
  return state.pastedDraft ? normalizeDraft(state.pastedDraft) : loadDraft();
}

function draftHasContent(draft) {
  return Boolean(draft.title.trim() || draft.content.trim() || normalizeWorkContent(draft.workContent) || normalizeAttachments(draft.attachments).length);
}

function savedDrafts() {
  const drafts = [];
  const prefix = accountDraftPrefix(activeJournalAccountId());
  if (!prefix) return drafts;
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const storageKey = localStorage.key(index);
      if (!storageKey?.startsWith(prefix)) continue;
      const date = storageKey.slice(prefix.length);
      if (!isDateKey(date)) continue;
      const draft = readDraft(storageKey);
      if (!draftHasContent(draft)) continue;
      const updatedAt = Date.parse(draft.updatedAt) || Date.parse(`${date}T00:00:00`);
      drafts.push({ storageKey, date, draft, updatedAt });
    }
  } catch {
    return [];
  }
  return drafts.sort((first, second) => second.updatedAt - first.updatedAt || second.date.localeCompare(first.date));
}

function updateDraftLibraryButton() {
  const count = savedDrafts().length;
  elements.draftLibraryCount.textContent = String(count);
  elements.draftLibraryCount.hidden = count === 0;
  elements.draftLibraryButton.setAttribute('aria-label', count ? `打开草稿箱，共 ${count} 条草稿` : '打开草稿箱');
}

const REVIEW_MONTH_LABELS = Object.freeze(['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']);
const REVIEW_EMOTION_TERMS = Object.freeze({
  舒展: ['开心', '高兴', '快乐', '满足', '轻松', '顺利', '期待', '喜欢', '幸福', '兴奋', '感激'],
  平静: ['平静', '普通', '稳定', '安静', '还好', '日常', '休息', '慢慢'],
  低落: ['难过', '焦虑', '烦', '累', '失望', '生气', '压力', '痛苦', '孤独', '崩溃', '内耗'],
});
const REVIEW_STOP_WORDS = new Set([
  '今天', '昨天', '明天', '我们', '他们', '自己', '这个', '那个', '已经', '还是', '就是', '因为', '所以', '然后', '但是',
  '可能', '感觉', '觉得', '真的', '有点', '一下', '一个', '一些', '没有', '什么', '时候', '事情', '现在', '这样', '那样',
  '记录', '日记', '内容', '时间', '一天', '可以', '需要', '晚上', '下午', '上午', '回来', '开始', '继续', '今天的',
]);
const REMINDER_WEEKDAY_LABELS = Object.freeze({ 1: '周日', 2: '周一', 3: '周二', 4: '周三', 5: '周四', 6: '周五', 7: '周六' });
const REMINDER_NOTIFICATION_IDS = Object.freeze([4101, 4102, 4103, 4104, 4105, 4106, 4107]);
const REMINDER_CHANNEL_ID = 'journal-writing-reminders';
function reviewEntriesForYear(year) {
  return state.data.entries
    .filter((entry) => !entry.deletedAt && isDateKey(entry.date) && Number(entry.date.slice(0, 4)) === year)
    .sort((first, second) => first.date.localeCompare(second.date) || new Date(first.createdAt) - new Date(second.createdAt));
}

function reviewCharacterCount(entry) {
  return `${entry.title || ''}${entry.content || ''}`.replace(/\s/g, '').length;
}

function countReviewTerm(text, term) {
  return text.split(term).length - 1;
}

function reviewEmotionCounts(text) {
  const result = Object.fromEntries(Object.keys(REVIEW_EMOTION_TERMS).map((label) => [label, 0]));
  Object.entries(REVIEW_EMOTION_TERMS).forEach(([label, terms]) => {
    result[label] = terms.reduce((total, term) => total + countReviewTerm(text, term), 0);
  });
  return result;
}

function dominantReviewEmotion(counts) {
  const ranked = Object.entries(counts).sort((first, second) => second[1] - first[1]);
  return ranked[0]?.[1] ? ranked[0][0] : '未标记';
}

function longestReviewStreak(entries) {
  const dates = [...new Set(entries.map((entry) => entry.date))].sort();
  let best = 0;
  let current = 0;
  let previous = null;
  dates.forEach((date) => {
    if (previous && (parseDateKey(date) - parseDateKey(previous)) === 24 * 60 * 60 * 1000) current += 1;
    else current = 1;
    best = Math.max(best, current);
    previous = date;
  });
  return best;
}

function reviewTokens(text) {
  const source = text.toLowerCase();
  if (typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });
    return [...segmenter.segment(source)]
      .filter((part) => part.isWordLike)
      .map((part) => part.segment.trim())
      .filter((word) => word.length >= 2 && !REVIEW_STOP_WORDS.has(word));
  }
  return source.match(/[\u4e00-\u9fff]{2,}|[a-z][a-z0-9-]{1,}/g) ?? [];
}

function commonKeywords(entries) {
  const counts = new Map();
  entries.forEach((entry) => {
    reviewTokens(`${entry.title || ''} ${entry.content || ''}`).forEach((word) => {
      counts.set(word, (counts.get(word) || 0) + 1);
    });
  });
  return [...counts.entries()]
    .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0], 'zh-CN'))
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }));
}

function journalReview(year) {
  const entries = reviewEntriesForYear(year);
  const monthly = REVIEW_MONTH_LABELS.map((label, month) => ({
    label,
    month,
    days: new Set(),
    entries: 0,
    words: 0,
    emotions: { 舒展: 0, 平静: 0, 低落: 0 },
  }));
  const emotions = { 舒展: 0, 平静: 0, 低落: 0 };

  entries.forEach((entry) => {
    const month = Number(entry.date.slice(5, 7)) - 1;
    const target = monthly[month];
    const source = `${entry.title || ''}\n${entry.content || ''}`;
    const entryEmotions = reviewEmotionCounts(source);
    target.days.add(entry.date);
    target.entries += 1;
    target.words += reviewCharacterCount(entry);
    Object.keys(emotions).forEach((label) => {
      target.emotions[label] += entryEmotions[label];
      emotions[label] += entryEmotions[label];
    });
  });

  const days = new Set(entries.map((entry) => entry.date));
  const activeMonths = monthly.filter((month) => month.entries > 0);
  const mostActive = [...monthly].sort((first, second) => second.entries - first.entries)[0];
  const keywords = commonKeywords(entries);
  const dominantEmotion = dominantReviewEmotion(emotions);
  const summary = !entries.length
    ? `${year} 年还没有可回顾的日记。先写下第一条，回顾会随记录自动生成。`
    : `${year} 年共写下 ${entries.length} 条记录，覆盖 ${days.size} 天${mostActive?.entries ? `；${mostActive.label}记录最多，共 ${mostActive.entries} 条` : ''}。${dominantEmotion === '未标记' ? '文字里暂未识别到明显的情绪词。' : `文字中更常出现“${dominantEmotion}”相关线索。`}${keywords.length ? `反复出现的主题包括：${keywords.slice(0, 4).map((item) => item.word).join('、')}。` : ''}`;

  return {
    year,
    entries,
    totalDays: days.size,
    totalEntries: entries.length,
    totalWords: entries.reduce((total, entry) => total + reviewCharacterCount(entry), 0),
    bestStreak: longestReviewStreak(entries),
    monthly,
    emotions,
    activeMonths: activeMonths.length,
    keywords,
    summary,
  };
}

function reviewRange(mode = state.reviewMode) {
  const today = parseDateKey(localDateKey());
  if (mode === 'year') {
    const start = dateKeyFromParts(state.reviewYear, 0, 1);
    const end = dateKeyFromParts(state.reviewYear, 11, 31);
    return { mode, start, end, label: `${state.reviewYear} 年`, title: '这一年的记录', kicker: '年度回顾', entries: entriesForPeriod(start, end) };
  }
  if (mode === 'month') {
    const start = dateKeyFromParts(today.getFullYear(), today.getMonth(), 1);
    const end = dateKeyFromParts(today.getFullYear(), today.getMonth() + 1, 0);
    return { mode, start, end, label: `${today.getFullYear()} 年 ${today.getMonth() + 1} 月`, title: '这个月的记录', kicker: '月回顾', entries: entriesForPeriod(start, end) };
  }
  const weekday = (today.getDay() + 6) % 7;
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - weekday);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  const start = localDateKey(startDate);
  const end = localDateKey(endDate);
  return { mode: 'week', start, end, label: `${start.slice(5).replace('-', ' 月 ')} 日 — ${end.slice(5).replace('-', ' 月 ')} 日`, title: '这一周的记录', kicker: '周回顾', entries: entriesForPeriod(start, end) };
}

function scopedReviewStats(entries, label) {
  const days = new Set(entries.map((entry) => entry.date));
  const emotions = { 舒展: 0, 平静: 0, 低落: 0 };
  entries.forEach((entry) => {
    const fromText = reviewEmotionCounts(`${entry.title || ''}\n${entry.content || ''}`);
    const selectedMood = normalizeMood(entry.mood);
    Object.keys(emotions).forEach((mood) => { emotions[mood] += fromText[mood]; });
    if (selectedMood === '舒展' || selectedMood === '开心' || selectedMood === '充实') emotions.舒展 += 1;
    if (selectedMood === '平静') emotions.平静 += 1;
    if (selectedMood === '焦虑' || selectedMood === '低落' || selectedMood === '疲惫' || selectedMood === '烦躁') emotions.低落 += 1;
  });
  const keywords = commonKeywords(entries);
  const focus = [...new Map(entries.flatMap((entry) => normalizeTags(entry.tags)).map((tag) => [tag, 0])).keys()];
  const dominant = dominantReviewEmotion(emotions);
  const summary = !entries.length
    ? `${label}还没有日记。写下第一条后，这里会出现主题、情绪和计划线索。`
    : `${label}共记录 ${entries.length} 条，覆盖 ${days.size} 天。${focus.length ? `最常标记为 ${focus.slice(0, 4).join('、')}。` : ''}${keywords.length ? `文字里反复出现 ${keywords.slice(0, 4).map((item) => item.word).join('、')}。` : ''}${dominant === '未标记' ? '' : `整体更接近“${dominant}”的情绪线索。`}`;
  return { totalDays: days.size, totalEntries: entries.length, totalWords: entries.reduce((sum, entry) => sum + reviewCharacterCount(entry), 0), bestStreak: longestReviewStreak(entries), keywords, dominant, summary };
}

function normalizeJournalTask(value) {
  if (!value || typeof value !== 'object' || !isUuid(value.id) || !isUuid(value.entryId)) return null;
  const text = String(value.text || '').trim().slice(0, 180);
  const sourceKey = String(value.sourceKey || '').trim().slice(0, 260);
  if (!text || !sourceKey) return null;
  return { id: value.id, entryId: value.entryId, sourceKey, text, completed: Boolean(value.completed), createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(), updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(), ...(typeof value.deletedAt === 'string' ? { deletedAt: value.deletedAt } : {}) };
}

function tombstoneLinkedTasks(tasks, entryId, now) {
  return tasks.map((task) => {
    if (task.entryId !== entryId || task.deletedAt) return task;
    return { ...task, updatedAt: now, deletedAt: now };
  });
}

function tombstoneJournalEntry(entry, now) {
  entry.deletedAt = now;
  entry.updatedAt = now;
  markCloudDirty('entries', entry.id);
  const deletedTaskIds = state.data.tasks
    .filter((task) => task.entryId === entry.id && !task.deletedAt)
    .map((task) => task.id);
  state.data.tasks = tombstoneLinkedTasks(state.data.tasks, entry.id, now);
  deletedTaskIds.forEach((id) => markCloudDirty('tasks', id));
  invalidateDailySummary(entry.date, now);
}

function extractJournalTasks(entries) {
  const candidates = [];
  entries.forEach((entry) => {
    if (entry.deletedAt) return;
    const source = `${entry.title || ''}\n${entry.content || ''}`;
    const matches = [...source.matchAll(/(?:待办|TODO|Todo|计划)[：:]\s*([^\n。！？!?]+)/g)];
    matches.forEach((match, matchIndex) => {
      match[1].split(/[、，,；;]/).map((item) => item.trim()).filter((item) => item.length >= 2).slice(0, 5).forEach((text, index) => {
        candidates.push({ entryId: entry.id, sourceKey: `${entry.id}:${matchIndex}:${index}`, text: text.slice(0, 180) });
      });
    });
  });
  return candidates;
}

function taskSourceSlot(sourceKey) {
  return String(sourceKey || '').split(':').slice(0, 3).join(':');
}

function taskCreatedAt(task) {
  const value = Date.parse(task?.createdAt || '');
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

function reconcileJournalTasks(tasks, entries, now = new Date().toISOString()) {
  const nextTasks = [...tasks];
  const changedTaskIds = [];
  const removedTaskIds = [];
  const markChanged = (task) => {
    if (!changedTaskIds.includes(task.id)) changedTaskIds.push(task.id);
  };

  extractJournalTasks(entries).forEach((candidate) => {
    const matchingIndexes = nextTasks
      .map((task, index) => ({ task, index }))
      .filter(({ task }) => task.entryId === candidate.entryId && taskSourceSlot(task.sourceKey) === candidate.sourceKey)
      .sort((first, second) => taskCreatedAt(first.task) - taskCreatedAt(second.task) || first.index - second.index);

    if (!matchingIndexes.length) {
      const task = { ...candidate, id: crypto.randomUUID(), completed: false, createdAt: now, updatedAt: now };
      nextTasks.push(task);
      markChanged(task);
      return;
    }

    const primary = matchingIndexes[0].task;
    if (primary.text !== candidate.text || primary.deletedAt) {
      primary.text = candidate.text;
      primary.updatedAt = now;
      delete primary.deletedAt;
      markChanged(primary);
    }

    matchingIndexes.slice(1).forEach(({ task }) => {
      if (task.sourceKey === primary.sourceKey) {
        const index = nextTasks.indexOf(task);
        if (index >= 0) nextTasks.splice(index, 1);
        removedTaskIds.push(task.id);
        return;
      }
      if (!task.deletedAt) {
        task.updatedAt = now;
        task.deletedAt = now;
        markChanged(task);
      }
    });
  });

  return { tasks: nextTasks, changedTaskIds, removedTaskIds };
}

function reconcileEntryTasks(entries, now = new Date().toISOString()) {
  const reconciliation = reconcileJournalTasks(state.data.tasks, entries, now);
  if (!reconciliation.changedTaskIds.length && !reconciliation.removedTaskIds.length) return reconciliation;
  state.data.tasks = reconciliation.tasks;
  clearCloudDirty('tasks', reconciliation.removedTaskIds);
  reconciliation.changedTaskIds.forEach((id) => markCloudDirty('tasks', id));
  return reconciliation;
}

function ensureExtractedJournalTasks(entries) {
  const reconciliation = reconcileEntryTasks(entries);
  if (!reconciliation.changedTaskIds.length && !reconciliation.removedTaskIds.length) return;
  persistData();
}

function reviewTasks(entries) {
  const sourceIds = new Set(entries.map((entry) => entry.id));
  return state.data.tasks.filter((task) => !task.deletedAt && sourceIds.has(task.entryId)).sort((first, second) => Number(first.completed) - Number(second.completed) || new Date(second.updatedAt) - new Date(first.updatedAt));
}

function renderReviewTasks(entries) {
  ensureExtractedJournalTasks(entries);
  const tasks = reviewTasks(entries);
  elements.reviewTaskList.replaceChildren();
  if (!tasks.length) {
    const empty = document.createElement('p');
    empty.className = 'review-empty';
    empty.textContent = '在日记中写“待办：……”或“计划：……”，这里会自动列出。';
    elements.reviewTaskList.append(empty);
    return;
  }
  tasks.forEach((task) => {
    const label = document.createElement('label');
    label.className = 'review-task';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = task.completed;
    const copy = document.createElement('span');
    copy.textContent = task.text;
    label.append(input, copy);
    input.addEventListener('change', () => {
      const now = new Date().toISOString();
      if (!persistDataChange(() => { task.completed = input.checked; task.updatedAt = now; markCloudDirty('tasks', task.id); })) return;
      renderReviewTasks(reviewRange().entries);
    });
    elements.reviewTaskList.append(label);
  });
}

function renderReviewHeatmap(year) {
  elements.reviewHeatmap.replaceChildren();
  const counts = new Map();
  reviewEntriesForYear(year).forEach((entry) => counts.set(entry.date, (counts.get(entry.date) || 0) + 1));
  const first = parseDateKey(`${year}-01-01`);
  const last = parseDateKey(`${year}-12-31`);
  const start = new Date(first);
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  for (let date = new Date(start); date <= last; date.setDate(date.getDate() + 1)) {
    const key = localDateKey(date);
    const count = counts.get(key) || 0;
    const cell = document.createElement('span');
    cell.className = `review-heatmap-cell heat-${Math.min(count, 4)}`;
    cell.title = `${key} · ${count} 条`;
    cell.setAttribute('aria-label', cell.title);
    elements.reviewHeatmap.append(cell);
  }
}

function renderReviewStat(target, value) {
  target.textContent = value;
}

function renderReview() {
  if (!elements.reviewYear) return;
  const currentYear = new Date().getFullYear();
  const years = [...new Set([currentYear, ...state.data.entries
    .filter((entry) => !entry.deletedAt && isDateKey(entry.date))
    .map((entry) => Number(entry.date.slice(0, 4)))])]
    .filter(Number.isInteger)
    .sort((first, second) => second - first);
  if (!years.includes(state.reviewYear)) state.reviewYear = years[0] || currentYear;

  elements.reviewYear.replaceChildren();
  years.forEach((year) => {
    const option = document.createElement('option');
    option.value = String(year);
    option.textContent = `${year} 年`;
    option.selected = year === state.reviewYear;
    elements.reviewYear.append(option);
  });
  elements.reviewRangeMode.value = state.reviewMode;
  elements.reviewYear.closest('label').hidden = state.reviewMode !== 'year';

  const annual = journalReview(state.reviewYear);
  const range = reviewRange();
  const scoped = scopedReviewStats(range.entries, range.label);
  elements.reviewScopeKicker.textContent = range.kicker;
  document.querySelector('#yearly-review-heading').textContent = range.title;
  elements.reviewRangeLabel.textContent = range.label;
  elements.reviewYearlyDetails.hidden = range.mode !== 'year';
  renderReviewStat(elements.reviewDayCount, `${scoped.totalDays} 天`);
  renderReviewStat(elements.reviewEntryCount, `${scoped.totalEntries} 条`);
  renderReviewStat(elements.reviewWordCount, `${scoped.totalWords} 字`);
  renderReviewStat(elements.reviewBestStreak, `${scoped.bestStreak} 天`);
  elements.reviewAnnualCopy.textContent = scoped.summary;
  elements.reviewRangeCopy.textContent = scoped.totalEntries
    ? `主要关注：${scoped.keywords.length ? scoped.keywords.slice(0, 5).map((item) => item.word).join('、') : '继续记录更多细节'}。情绪变化线索：${scoped.dominant === '未标记' ? '暂未识别到明显倾向' : `整体偏向${scoped.dominant}`}。下方待办来自日记正文，可直接勾选完成。`
    : '这段时间还没有内容，回顾会随着记录自动补齐。';
  renderReviewHeatmap(state.reviewYear);
  renderReviewTasks(range.entries);

  elements.reviewMonthlyActivity.replaceChildren();
  annual.monthly.forEach((month) => {
    const item = document.createElement('article');
    item.className = 'review-month-item';
    const label = document.createElement('span');
    label.textContent = month.label;
    const count = document.createElement('strong');
    count.textContent = `${month.entries} 条`;
    const detail = document.createElement('small');
    detail.textContent = month.entries ? `${month.days.size} 天 · ${month.words} 字` : '未记录';
    item.append(label, count, detail);
    elements.reviewMonthlyActivity.append(item);
  });

  elements.reviewEmotionTrend.replaceChildren();
  annual.monthly.forEach((month) => {
    const item = document.createElement('div');
    item.className = 'review-emotion-item';
    const label = document.createElement('span');
    label.textContent = month.label;
    const value = document.createElement('strong');
    value.textContent = month.entries ? dominantReviewEmotion(month.emotions) : '—';
    const detail = document.createElement('small');
    detail.textContent = month.entries ? `${month.entries} 条` : '未记录';
    item.append(label, value, detail);
    elements.reviewEmotionTrend.append(item);
  });

  elements.reviewKeywords.replaceChildren();
  if (!annual.keywords.length) {
    const empty = document.createElement('span');
    empty.className = 'review-empty';
    empty.textContent = '记录多一些后，这里会出现反复关注的主题。';
    elements.reviewKeywords.append(empty);
  } else {
    annual.keywords.forEach(({ word, count }) => {
      const keyword = document.createElement('span');
      keyword.className = 'review-keyword';
      keyword.textContent = `${word} · ${count}`;
      elements.reviewKeywords.append(keyword);
    });
  }
}
function normalizeReminderSettings(value) {
  const candidate = value && typeof value === 'object' ? value : {};
  const time = typeof candidate.time === 'string' && /^\d{2}:\d{2}$/.test(candidate.time) ? candidate.time : DEFAULT_REMINDER_SETTINGS.time;
  const [hour, minute] = time.split(':').map(Number);
  const validTime = Number.isInteger(hour) && hour >= 0 && hour <= 23 && Number.isInteger(minute) && minute >= 0 && minute <= 59;
  const days = [...new Set((Array.isArray(candidate.days) ? candidate.days : DEFAULT_REMINDER_SETTINGS.days)
    .map(Number)
    .filter((day) => Number.isInteger(day) && day >= 1 && day <= 7))].sort((first, second) => first - second);
  const skipDate = isDateKey(candidate.skipDate) ? candidate.skipDate : '';
  const snoozeTimestamp = Date.parse(candidate.snoozedUntil);
  return {
    enabled: Boolean(candidate.enabled),
    time: validTime ? time : DEFAULT_REMINDER_SETTINGS.time,
    days: days.length ? days : [...DEFAULT_REMINDER_SETTINGS.days],
    skipDate,
    snoozedUntil: Number.isFinite(snoozeTimestamp) && snoozeTimestamp > Date.now() ? new Date(snoozeTimestamp).toISOString() : '',
  };
}

function loadReminderSettings() {
  try {
    return normalizeReminderSettings(JSON.parse(localStorage.getItem(REMINDER_SETTINGS_KEY)));
  } catch {
    return normalizeReminderSettings(DEFAULT_REMINDER_SETTINGS);
  }
}

function persistReminderSettings(settings) {
  const normalized = normalizeReminderSettings(settings);
  state.reminder.settings = normalized;
  localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(normalized));
  return normalized;
}

function reminderDaysLabel(days) {
  if (days.length === 7) return '每天';
  return days.map((day) => REMINDER_WEEKDAY_LABELS[day]).join('、');
}

function reminderSettingsLabel(settings) {
  if (!settings.enabled) return '未开启每日提醒';
  return `${reminderDaysLabel(settings.days)} ${settings.time}`;
}

function renderReminderSettings() {
  if (!elements.reminderEnabled) return;
  const settings = state.reminder.settings;
  elements.reminderEnabled.checked = settings.enabled;
  elements.reminderTime.value = settings.time;
  elements.reminderDayInputs.forEach((input) => {
    input.checked = settings.days.includes(Number(input.value));
  });
  elements.reminderStatus.textContent = state.reminder.status || `${reminderSettingsLabel(settings)}。`;
}

function nativeLocalNotifications() {
  const capacitor = window.Capacitor;
  if (!capacitor?.isNativePlatform?.()) return null;
  return capacitor.Plugins?.LocalNotifications ?? capacitor.registerPlugin?.('LocalNotifications') ?? null;
}

function hasEntryForDate(date) {
  return entriesForDate(date).length > 0;
}

function nextReminderDateForWeekday(weekday, time) {
  const now = new Date();
  const [hour, minute] = time.split(':').map(Number);
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  const currentWeekday = now.getDay() + 1;
  let daysAhead = (weekday - currentWeekday + 7) % 7;
  if (daysAhead === 0 && (target <= now || hasEntryForDate(localDateKey(now)) || state.reminder.settings.skipDate === localDateKey(now))) daysAhead = 7;
  target.setDate(target.getDate() + daysAhead);
  return target;
}

async function scheduleNativeReminders(settings, { requestPermission = false } = {}) {
  const notifications = nativeLocalNotifications();
  if (!notifications) return null;
  const scheduled = REMINDER_NOTIFICATION_IDS.map((id) => ({ id }));
  if (!settings.enabled) {
    await notifications.cancel({ notifications: scheduled });
    return { message: '已关闭 App 本地提醒。' };
  }
  let permission = await notifications.checkPermissions();
  if (permission.display !== 'granted' && requestPermission) permission = await notifications.requestPermissions();
  if (permission.display !== 'granted') return { message: '请允许 App 的通知权限后，提醒才会按时送达。' };

  if (typeof notifications.createChannel === 'function') {
    await notifications.createChannel({ id: REMINDER_CHANNEL_ID, name: '写日记提醒', description: '岁笺的每日写日记提醒', importance: 3, visibility: 1 });
  }
  await notifications.cancel({ notifications: scheduled });
  await notifications.schedule({
    notifications: settings.days.map((weekday, index) => ({
      id: REMINDER_NOTIFICATION_IDS[index],
      title: '岁笺',
      body: '留一点时间，写下今天。',
      channelId: REMINDER_CHANNEL_ID,
      schedule: { at: nextReminderDateForWeekday(weekday, settings.time), repeats: true, allowWhileIdle: true },
    })),
  });
  return { message: `App 提醒已设为${reminderDaysLabel(settings.days)} ${settings.time}；当天已写日记会顺延到下次。` };
}
function stopBrowserReminder() {
  clearTimeout(state.reminder.timer);
  state.reminder.timer = 0;
}

function nextBrowserReminderAt(settings, now = new Date()) {
  const snoozed = Date.parse(settings.snoozedUntil);
  if (Number.isFinite(snoozed) && snoozed > now.getTime() && !hasEntryForDate(localDateKey(new Date(snoozed)))) return new Date(snoozed);
  const [hour, minute] = settings.time.split(':').map(Number);
  for (let offset = 0; offset <= 14; offset += 1) {
    const candidate = new Date(now);
    candidate.setDate(candidate.getDate() + offset);
    candidate.setHours(hour, minute, 0, 0);
    const key = localDateKey(candidate);
    if (candidate <= now || !settings.days.includes(candidate.getDay() + 1) || hasEntryForDate(key) || settings.skipDate === key) continue;
    return candidate;
  }
  return null;
}
function notifyBrowserReminder() {
  if (hasEntryForDate(localDateKey()) || state.reminder.settings.skipDate === localDateKey()) return;
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('岁笺', { body: '留一点时间，写下今天。', icon: './icons/icon-192.png' });
  } else {
    showToast('到写日记的时间了。');
  }
}

function startBrowserReminder() {
  stopBrowserReminder();
  if (nativeLocalNotifications()) return;
  const settings = state.reminder.settings;
  if (!settings.enabled) return;
  const next = nextBrowserReminderAt(settings);
  if (!next) return;
  state.reminder.timer = window.setTimeout(() => {
    notifyBrowserReminder();
    startBrowserReminder();
  }, Math.max(1000, next.getTime() - Date.now()));
}

async function scheduleBrowserReminder(settings, { requestPermission = false } = {}) {
  if (!settings.enabled) {
    stopBrowserReminder();
    return { message: '已关闭网页内提醒。' };
  }
  if ('Notification' in window && Notification.permission !== 'granted' && requestPermission) await Notification.requestPermission();
  startBrowserReminder();
  if (!('Notification' in window)) return { message: '网页会在保持打开时显示站内提醒。' };
  if (Notification.permission === 'denied') return { message: '浏览器通知已关闭；网页保持打开时会显示站内提醒。' };
  if (Notification.permission !== 'granted') return { message: '网页保持打开时会提醒；允许通知后可显示系统通知。' };
  return { message: `网页提醒已设为${reminderSettingsLabel(settings)}；网页保持打开时生效。` };
}

async function applyReminderSchedule(settings, options = {}) {
  const nativeResult = await scheduleNativeReminders(settings, options);
  return nativeResult ?? scheduleBrowserReminder(settings, options);
}

async function saveReminderSettings() {
  const days = [...elements.reminderDayInputs].filter((input) => input.checked).map((input) => Number(input.value));
  if (!days.length) {
    state.reminder.status = '至少选择一天。';
    renderReminderSettings();
    return;
  }
  const settings = persistReminderSettings({
    enabled: elements.reminderEnabled.checked,
    time: elements.reminderTime.value,
    days,
  });
  try {
    const result = await applyReminderSchedule(settings, { requestPermission: settings.enabled });
    state.reminder.status = result.message;
    renderReminderSettings();
    showToast('每日提醒已保存');
  } catch {
    state.reminder.status = '提醒保存了，但系统排程暂时没有完成；下次打开会重试。';
    renderReminderSettings();
  }
}

async function snoozeReminder() {
  const until = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const settings = persistReminderSettings({ ...state.reminder.settings, snoozedUntil: until, skipDate: '' });
  try { await applyReminderSchedule(settings); } catch { /* the local setting remains and will be retried */ }
  state.reminder.status = `已稍后提醒，预计 ${new Date(until).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })} 再提醒。`;
  renderReminderSettings();
  showToast('已设置 1 小时后提醒');
}

async function skipReminderToday() {
  const settings = persistReminderSettings({ ...state.reminder.settings, skipDate: localDateKey(), snoozedUntil: '' });
  try { await applyReminderSchedule(settings); } catch { /* saved for next app start */ }
  state.reminder.status = '今天已跳过提醒；明天会按原计划继续。';
  renderReminderSettings();
  showToast('今天不再提醒');
}

async function initializeWritingReminders() {
  try {
    const result = await applyReminderSchedule(state.reminder.settings);
    state.reminder.status = result.message;
  } catch {
    state.reminder.status = '提醒设置已保存，等待下次尝试排程。';
  }
  renderReminderSettings();
}


function saveDraftObject(draft, message = '草稿已保存') {
  const storageKey = draftKey();
  if (!storageKey) return;
  state.pastedDraft = null;
  const normalizedDraft = normalizeDraft({ ...draft, updatedAt: new Date().toISOString() });
  localStorage.setItem(storageKey, JSON.stringify(normalizedDraft));
  elements.draftStatus.textContent = message;
  updateWordCount();
  updateDraftLibraryButton();
}

function resetEditorDraftInputs() {
  state.pastedDraft = null;
  elements.entryTitle.value = '';
  elements.entryMood.value = '';
  elements.entryTags.value = '';
  renderTagEditor(elements.entryTagList, []);
  elements.entryContent.value = '';
  renderDraftAttachments([]);
  renderEditorAiSuggestion({});
  closeMetadataPickers('entry');
  updateMetadataPicker('entry');
  updateWordCount();
}

function renderDraftLibrary() {
  const drafts = savedDrafts();
  elements.draftLibraryList.replaceChildren();
  elements.clearDraftLibrary.disabled = !drafts.length;
  if (!drafts.length) {
    const empty = document.createElement('p');
    empty.className = 'draft-library-empty';
    empty.textContent = '草稿箱还是空的。输入内容后会自动保存。';
    elements.draftLibraryList.append(empty);
    return;
  }
  drafts.forEach(({ storageKey, date, draft }) => {
    const item = document.createElement('article');
    item.className = 'draft-library-item';
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'draft-library-open';
    open.setAttribute('aria-label', `粘贴 ${draft.title || '未命名草稿'} 到日记输入框并移除草稿`);
    const meta = document.createElement('span');
    meta.className = 'draft-library-meta';
    const dateValue = parseDateKey(date);
    meta.textContent = `${dateFormatter.format(dateValue)} · 粘贴后自动移除`;
    const title = document.createElement('strong');
    title.textContent = draft.title || '未命名草稿';
    const preview = document.createElement('span');
    preview.className = 'draft-library-preview';
    const attachmentCount = normalizeAttachments(draft.attachments).length;
    preview.textContent = draft.content.trim() || (attachmentCount ? `含 ${attachmentCount} 个附件` : '只有标题');
    open.append(meta, title, preview);
    open.addEventListener('click', () => pasteDraftIntoEditor(storageKey));
    const actions = document.createElement('div');
    actions.className = 'draft-library-actions';
    const paste = document.createElement('span');
    paste.className = 'draft-library-action';
    paste.textContent = '粘贴到日记';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'quiet-button danger-button draft-library-remove';
    remove.textContent = '移除';
    remove.setAttribute('aria-label', `移除草稿：${draft.title || '未命名草稿'}`);
    remove.addEventListener('click', () => removeDraftFromLibrary(storageKey));
    actions.append(paste, remove);
    item.append(open, actions);
    elements.draftLibraryList.append(item);
  });
}

function removeDraftFromLibrary(storageKey) {
  const exists = savedDrafts().some((item) => item.storageKey === storageKey);
  if (!exists) return;
  clearTimeout(draftTimer);
  localStorage.removeItem(storageKey);
  if (storageKey === draftKey()) resetEditorDraftInputs();
  updateDraftLibraryButton();
  renderDraftLibrary();
  elements.draftStatus.textContent = '草稿已移除';
  showToast('草稿已移除');
}

function clearDraftLibrary() {
  const drafts = savedDrafts();
  if (!drafts.length) return;
  if (!window.confirm(`确认移除草稿箱中的 ${drafts.length} 条草稿吗？此操作不会删除已保存的日记。`)) return;
  clearTimeout(draftTimer);
  const currentStorageKey = draftKey();
  drafts.forEach(({ storageKey }) => localStorage.removeItem(storageKey));
  if (drafts.some(({ storageKey }) => storageKey === currentStorageKey)) resetEditorDraftInputs();
  updateDraftLibraryButton();
  renderDraftLibrary();
  elements.draftStatus.textContent = '草稿箱已清空';
  showToast('草稿箱已清空');
}

function openDraftLibrary() {
  clearTimeout(draftTimer);
  const current = { ...editorDraft(), title: elements.entryTitle.value, mood: elements.entryMood.value, tags: editorTags(), content: elements.entryContent.value };
  if (draftHasContent(current)) saveDraft();
  renderDraftLibrary();
  openWorkspaceDialog(elements.draftLibraryDialog, elements.draftLibraryList.querySelector('.draft-library-item'));
}

function closeDraftLibrary() {
  closeWorkspaceDialog(elements.draftLibraryDialog);
}

function pasteDraftIntoEditor(storageKey) {
  const saved = savedDrafts().find((item) => item.storageKey === storageKey);
  if (!saved) return;
  clearTimeout(draftTimer);
  localStorage.removeItem(storageKey);
  state.pastedDraft = saved.draft;
  elements.entryTitle.value = saved.draft.title;
  elements.entryMood.value = normalizeMood(saved.draft.mood);
  elements.entryTags.value = '';
  renderTagEditor(elements.entryTagList, saved.draft.tags);
  elements.entryContent.value = saved.draft.content;
  renderDraftAttachments(saved.draft.attachments);
  renderEditorAiSuggestion(saved.draft);
  updateMetadataPicker('entry');
  updateWordCount();
  updateDraftLibraryButton();
  closeDraftLibrary();
  elements.draftStatus.textContent = '草稿已粘贴到输入框，原草稿已删除';
  elements.entryContent.focus();
  showToast('草稿已粘贴到日记输入框');
}

function saveDraft() {
  addTagFromInput(elements.entryTags, elements.entryTagList);
  const previous = editorDraft();
  const content = elements.entryContent.value;
  const title = elements.entryTitle.value;
  const mood = normalizeMood(elements.entryMood.value);
  const tags = editorTags();
  const isSuggestionStale = previous.aiSuggestion && previous.aiOriginal !== content;
  const draft = {
    ...previous,
    title,
    tags,
    mood,
    content,
    aiSuggestion: isSuggestionStale ? '' : previous.aiSuggestion,
    aiOriginal: isSuggestionStale ? '' : previous.aiOriginal,
  };
  saveDraftObject(draft);
  renderEditorAiSuggestion(draft);
  updateMetadataPicker('entry');
}

function attachmentFileName(value) {
  const name = String(value || '').split(/[\\/]/).pop().trim();
  return name.slice(0, MAX_ATTACHMENT_NAME_CHARS) || '未命名附件';
}

function isAllowedAttachmentMime(type) {
  return ALLOWED_ATTACHMENT_TYPES.has(String(type || '').toLowerCase());
}

function attachmentDataUrlIsSafe(value, type) {
  if (typeof value !== 'string' || value.length > MAX_ATTACHMENT_DATA_URL_CHARS) return false;
  const match = value.match(/^data:([^;,]+);base64,([a-z0-9+/=]+)$/i);
  return Boolean(match && match[1].toLowerCase() === String(type || '').toLowerCase() && isAllowedAttachmentMime(match[1]));
}

function normalizeStoragePath(value) {
  const path = String(value || '').trim();
  const parts = path.split('/');
  if (parts.length !== 4 || !parts.slice(0, 3).every(isUuid) || !/^[a-z0-9][a-z0-9._-]{0,140}$/i.test(parts[3])) return '';
  return path;
}

function normalizeAttachment(value) {
  if (!value || typeof value !== 'object' || !isUuid(value.id)) return null;
  const type = String(value.type || '').toLowerCase();
  const size = Number(value.size);
  const dataUrl = attachmentDataUrlIsSafe(value.dataUrl, type) ? value.dataUrl : '';
  const storagePath = normalizeStoragePath(value.storagePath);
  if (!isAllowedAttachmentMime(type) || !Number.isSafeInteger(size) || size < 0 || size > MAX_ATTACHMENT_BYTES || (!dataUrl && !storagePath)) return null;
  return {
    id: value.id,
    name: attachmentFileName(value.name),
    type,
    size,
    ...(dataUrl ? { dataUrl } : {}),
    ...(storagePath ? { storagePath } : {}),
  };
}

function normalizeAttachments(value) {
  const candidates = Array.isArray(value) ? value : attachmentPayload(value).files;
  if (!Array.isArray(candidates)) return [];
  const ids = new Set();
  let total = 0;
  return candidates.reduce((attachments, candidate) => {
    const attachment = normalizeAttachment(candidate);
    if (!attachment || ids.has(attachment.id) || attachments.length >= MAX_ATTACHMENT_COUNT) return attachments;
    if (total + attachment.size > MAX_ATTACHMENTS_TOTAL_BYTES) return attachments;
    ids.add(attachment.id);
    total += attachment.size;
    attachments.push(attachment);
    return attachments;
  }, []);
}

function attachmentSizeLabel(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageAttachment(attachment) {
  return attachment.type.startsWith('image/');
}

function readAttachmentFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('error', () => reject(new Error('文件读取失败')));
    reader.addEventListener('load', () => resolve({
      id: crypto.randomUUID(),
      name: attachmentFileName(file.name),
      type: file.type.toLowerCase(),
      size: file.size,
      dataUrl: String(reader.result || ''),
    }), { once: true });
    reader.readAsDataURL(file);
  });
}

async function attachFiles(files) {
  const draft = editorDraft();
  const current = normalizeAttachments(draft.attachments);
  const selected = Array.from(files || []);
  if (!selected.length) return;
  const attached = [];
  let skipped = 0;
  let total = current.reduce((sum, attachment) => sum + attachment.size, 0);

  for (const file of selected) {
    if (current.length + attached.length >= MAX_ATTACHMENT_COUNT
      || !isAllowedAttachmentMime(file.type)
      || file.size > MAX_ATTACHMENT_BYTES
      || total + file.size > MAX_ATTACHMENTS_TOTAL_BYTES) {
      skipped += 1;
      continue;
    }
    try {
      const attachment = normalizeAttachment(await readAttachmentFile(file));
      if (!attachment) {
        skipped += 1;
        continue;
      }
      attached.push(attachment);
      total += attachment.size;
    } catch {
      skipped += 1;
    }
  }

  if (!attached.length) {
    showToast(`未添加附件：单个不超过 ${attachmentSizeLabel(MAX_ATTACHMENT_BYTES)}，最多 ${MAX_ATTACHMENT_COUNT} 个`);
    return;
  }
  const updatedDraft = { ...draft, attachments: [...current, ...attached] };
  saveDraftObject(updatedDraft, `已添加 ${attached.length} 个附件`);
  renderDraftAttachments(updatedDraft.attachments);
  if (skipped) showToast(`${skipped} 个文件未添加：格式、数量或大小超出限制`);
}

function removeDraftAttachment(id) {
  const draft = editorDraft();
  const attachments = normalizeAttachments(draft.attachments).filter((attachment) => attachment.id !== id);
  const updatedDraft = { ...draft, attachments };
  saveDraftObject(updatedDraft, '附件已移除');
  renderDraftAttachments(attachments);
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = attachmentFileName(fileName);
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function downloadAttachment(attachment) {
  if (attachmentDataUrlIsSafe(attachment?.dataUrl, attachment?.type)) {
    const response = await fetch(attachment.dataUrl);
    downloadBlob(await response.blob(), attachment.name);
    return;
  }
  if (!attachment?.storagePath) return;
  try {
    const blob = await cloudBlobRequest(`/storage/v1/object/${JOURNAL_ATTACHMENT_BUCKET}/${attachment.storagePath}`);
    downloadBlob(blob, attachment.name);
  } catch {
    showToast('附件暂时无法下载，请先登录同步账号后重试');
  }
}

function attachmentVisual(attachment) {
  const visual = isImageAttachment(attachment) && attachmentDataUrlIsSafe(attachment.dataUrl, attachment.type) ? document.createElement('img') : document.createElement('span');
  if (visual instanceof HTMLImageElement) {
    visual.className = 'attachment-preview-image';
    visual.src = attachment.dataUrl;
    visual.alt = attachment.name;
  } else {
    visual.className = 'attachment-file-mark';
    visual.textContent = isImageAttachment(attachment) ? '图片' : (attachment.type === 'application/pdf' ? 'PDF' : '附件');
  }
  return visual;
}

function renderDraftAttachments(attachments) {
  const list = elements.draftAttachments;
  const normalized = normalizeAttachments(attachments);
  list.replaceChildren();
  list.hidden = !normalized.length;
  normalized.forEach((attachment) => {
    const item = document.createElement('article');
    item.className = 'attachment-preview';
    const download = document.createElement('button');
    download.type = 'button';
    download.className = 'attachment-open';
    download.title = `下载 ${attachment.name}`;
    download.append(attachmentVisual(attachment));
    const detail = document.createElement('span');
    detail.className = 'attachment-detail';
    const name = document.createElement('strong');
    name.textContent = attachment.name;
    const size = document.createElement('small');
    size.textContent = attachmentSizeLabel(attachment.size);
    detail.append(name, size);
    download.append(detail);
    download.addEventListener('click', () => downloadAttachment(attachment));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'attachment-remove';
    remove.setAttribute('aria-label', `移除 ${attachment.name}`);
    remove.textContent = '×';
    remove.addEventListener('click', () => removeDraftAttachment(attachment.id));
    item.append(download, remove);
    list.append(item);
  });
}

function renderEntryAttachments(attachments) {
  const normalized = normalizeAttachments(attachments);
  if (!normalized.length) return null;
  const list = document.createElement('div');
  list.className = 'entry-attachments';
  normalized.forEach((attachment) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'entry-attachment';
    item.title = `下载 ${attachment.name}`;
    item.append(attachmentVisual(attachment));
    const detail = document.createElement('span');
    detail.className = 'entry-attachment-detail';
    const name = document.createElement('strong');
    name.textContent = attachment.name;
    const size = document.createElement('small');
    size.textContent = attachmentSizeLabel(attachment.size);
    detail.append(name, size);
    item.append(detail);
    item.addEventListener('click', () => downloadAttachment(attachment));
    list.append(item);
  });
  return list;
}

function scheduleAutomaticBackup() {
  if (!activeJournalAccountId()) return;
  clearTimeout(state.backup.timer);
  state.backup.timer = window.setTimeout(() => { void saveAutomaticBackup(); }, AUTO_BACKUP_DELAY_MS);
}

function saveAutomaticBackup() {
  const accountId = activeJournalAccountId();
  if (!accountId || !('indexedDB' in window)) return Promise.resolve(false);
  const snapshot = {
    id: `${new Date().toISOString()}-${crypto.randomUUID()}`,
    accountId,
    backedUpAt: new Date().toISOString(),
    data: structuredClone(state.data),
  };
  return new Promise((resolve) => {
    const request = indexedDB.open(AUTO_BACKUP_DB, 1);
    request.addEventListener('upgradeneeded', () => {
      if (!request.result.objectStoreNames.contains(AUTO_BACKUP_STORE)) request.result.createObjectStore(AUTO_BACKUP_STORE, { keyPath: 'id' });
    });
    request.addEventListener('error', () => resolve(false));
    request.addEventListener('success', () => {
      const database = request.result;
      const transaction = database.transaction(AUTO_BACKUP_STORE, 'readwrite');
      const store = transaction.objectStore(AUTO_BACKUP_STORE);
      store.put(snapshot);
      const snapshots = store.getAll();
      snapshots.addEventListener('success', () => {
        snapshots.result
          .filter((item) => item?.accountId === accountId)
          .sort((first, second) => String(second.backedUpAt).localeCompare(String(first.backedUpAt)))
          .slice(AUTO_BACKUP_SNAPSHOT_COUNT)
          .forEach((item) => store.delete(item.id));
      });
      transaction.addEventListener('complete', () => { database.close(); resolve(true); });
      transaction.addEventListener('abort', () => { database.close(); resolve(false); });
      transaction.addEventListener('error', () => { database.close(); resolve(false); });
    });
  });
}

function dailyCloudBackupMarkerKey(userId) {
  return `${CLOUD_DAILY_BACKUP_PREFIX}${userId}`;
}

function savedDailyCloudBackupDate(userId) {
  try {
    return localStorage.getItem(dailyCloudBackupMarkerKey(userId)) || '';
  } catch {
    return '';
  }
}

function saveDailyCloudBackupDate(userId, date) {
  try {
    localStorage.setItem(dailyCloudBackupMarkerKey(userId), date);
  } catch {
    // A full browser storage quota must not prevent normal journal sync.
  }
}

function dailyCloudBackupCutoffDate(now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - CLOUD_DAILY_BACKUP_RETENTION_DAYS + 1);
  return localDateKey(cutoff);
}

function cloudDailyBackupPayload() {
  return {
    version: 1,
    backedUpAt: new Date().toISOString(),
    data: structuredClone(state.data),
  };
}

function dailyCloudBackupStatus() {
  const session = state.cloud.session;
  if (!session) return '登录后自动启用';
  if (state.cloud.backupsSupported === false) return '等待云端数据库迁移';
  return savedDailyCloudBackupDate(session.user.id) === localDateKey()
    ? `今日 ${localDateKey()} 已备份`
    : '将在本次同步后自动备份';
}

async function pruneDailyCloudBackups() {
  const cutoff = dailyCloudBackupCutoffDate();
  await cloudRequest(`/rest/v1/journal_backups?backup_date=lt.${encodeURIComponent(cutoff)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  });
}

async function saveDailyCloudBackup(userId) {
  if (!userId || state.cloud.backupsSupported === false) return false;
  const backupDate = localDateKey();
  if (savedDailyCloudBackupDate(userId) === backupDate) return false;
  try {
    const saved = await cloudRequest('/rest/v1/journal_backups?on_conflict=user_id,backup_date', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=representation',
      },
      body: JSON.stringify({
        user_id: userId,
        backup_date: backupDate,
        payload: cloudDailyBackupPayload(),
      }),
    });
    state.cloud.backupsSupported = true;
    saveDailyCloudBackupDate(userId, backupDate);
    try {
      await pruneDailyCloudBackups();
    } catch {
      // Retention cleanup may retry on the next daily backup without risking the new snapshot.
    }
    if (Array.isArray(saved) && saved.length) recordCloudActivity(`云端每日备份已创建（${backupDate}）`, 'success');
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    if (isMissingCloudBackupsTable(error)) {
      const wasUnsupported = state.cloud.backupsSupported === false;
      state.cloud.backupsSupported = false;
      if (!wasUnsupported) recordCloudActivity('云端每日备份等待数据库迁移', 'info');
      return false;
    }
    recordCloudActivity(`云端每日备份失败：${message}`, 'error');
    return false;
  }
}


function render() {
  if (renderJournalAccess()) return;
  refreshJournalTagOptions();
  renderToday();
  renderCalendar();
  renderWritingRhythm();
  renderReview();
  renderReminderSettings();
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
  state.pastedDraft = null;
  const draft = loadDraft();
  elements.entryTitle.value = draft.title;
  elements.entryMood.value = normalizeMood(draft.mood);
  elements.entryTags.value = '';
  renderTagEditor(elements.entryTagList, draft.tags);
  elements.entryContent.value = draft.content;
  renderEditorAiSuggestion(draft);
  updateMetadataPicker('entry');
  renderDraftAttachments(draft.attachments);
  updateWordCount();
  updateDraftLibraryButton();
}

function tokenizeDiffText(value) {
  const text = String(value || '');
  if (!text) return [];
  try {
    return text.match(/\s+|[\p{Script=Han}]|[\p{L}\p{N}_]+|[^\s]/gu) || [];
  } catch {
    return Array.from(text);
  }
}

function appendDiffSegment(segments, type, text) {
  if (!text) return;
  const previous = segments.at(-1);
  if (previous?.type === type) previous.text += text;
  else segments.push({ type, text });
}

function buildMarkedDiffSegments(original, suggestion) {
  const before = tokenizeDiffText(original);
  const after = tokenizeDiffText(suggestion);
  const segments = [];
  let prefix = 0;
  while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix]) prefix += 1;
  let beforeEnd = before.length;
  let afterEnd = after.length;
  while (beforeEnd > prefix && afterEnd > prefix && before[beforeEnd - 1] === after[afterEnd - 1]) {
    beforeEnd -= 1;
    afterEnd -= 1;
  }
  appendDiffSegment(segments, 'equal', before.slice(0, prefix).join(''));
  const beforeMiddle = before.slice(prefix, beforeEnd);
  const afterMiddle = after.slice(prefix, afterEnd);
  const cellCount = (beforeMiddle.length + 1) * (afterMiddle.length + 1);
  if (cellCount <= 300_000) {
    const width = afterMiddle.length + 1;
    const table = new Uint16Array(cellCount);
    for (let row = beforeMiddle.length - 1; row >= 0; row -= 1) {
      for (let column = afterMiddle.length - 1; column >= 0; column -= 1) {
        const index = row * width + column;
        table[index] = beforeMiddle[row] === afterMiddle[column]
          ? table[(row + 1) * width + column + 1] + 1
          : Math.max(table[(row + 1) * width + column], table[row * width + column + 1]);
      }
    }
    let row = 0;
    let column = 0;
    while (row < beforeMiddle.length || column < afterMiddle.length) {
      if (row < beforeMiddle.length && column < afterMiddle.length && beforeMiddle[row] === afterMiddle[column]) {
        appendDiffSegment(segments, 'equal', beforeMiddle[row]);
        row += 1;
        column += 1;
      } else if (column >= afterMiddle.length || (row < beforeMiddle.length && table[(row + 1) * width + column] >= table[row * width + column + 1])) {
        appendDiffSegment(segments, 'removed', beforeMiddle[row]);
        row += 1;
      } else {
        appendDiffSegment(segments, 'added', afterMiddle[column]);
        column += 1;
      }
    }
  } else {
    appendDiffSegment(segments, 'removed', beforeMiddle.join(''));
    appendDiffSegment(segments, 'added', afterMiddle.join(''));
  }
  appendDiffSegment(segments, 'equal', before.slice(beforeEnd).join(''));
  return segments;
}

function renderAiMarkedDiff(original, suggestion) {
  elements.editorAiDiff.replaceChildren();
  buildMarkedDiffSegments(original, suggestion).forEach((part) => {
    if (part.type === 'equal') {
      elements.editorAiDiff.append(document.createTextNode(part.text));
      return;
    }
    const mark = document.createElement('span');
    mark.className = part.type === 'removed' ? 'ai-diff-removed' : 'ai-diff-added';
    mark.textContent = part.text;
    elements.editorAiDiff.append(mark);
  });
}

function renderEditorAiSuggestion(draft) {
  const hasSuggestion = Boolean(draft.aiSuggestion && draft.aiOriginal === draft.content);
  elements.editorAiResult.hidden = !hasSuggestion;
  if (!hasSuggestion) return;
  renderAiMarkedDiff(draft.aiOriginal, draft.aiSuggestion);
  elements.editorAiContent.textContent = draft.aiSuggestion;
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
    renderOptionalEntryTitle(fragment.querySelector('.entry-card-title'), entry);
    renderEntryMetadata(fragment.querySelector('.entry-card-meta'), entry);
    fragment.querySelector('.entry-content').textContent = entry.content;
    const attachmentList = renderEntryAttachments(entry.attachments);
    if (attachmentList) fragment.querySelector('.entry-content').after(attachmentList);
    const originalVersion = fragment.querySelector('.original-version');
    if (entry.originalContent) {
      originalVersion.hidden = false;
      fragment.querySelector('.original-content').textContent = entry.originalContent;
    }

    fragment.querySelector('.entry-delete').addEventListener('click', () => deleteJournalEntry(entry.id));
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
    const tags = document.createElement('div');
    tags.className = 'calendar-entry-tags';
    dayEntries.forEach((entry) => {
      const tag = document.createElement('button');
      tag.type = 'button';
      tag.className = 'calendar-archive-entry-tag';
      tag.setAttribute('aria-label', `打开并修改 ${dayLabel.textContent} 的日记：${archiveEntryLabel(entry)}`);
      const time = document.createElement('span');
      time.className = 'calendar-archive-entry-tag-time';
      time.textContent = timeFormatter.format(new Date(entry.createdAt));
      const label = document.createElement('span');
      label.className = 'calendar-archive-entry-tag-label';
      label.textContent = archiveEntryLabel(entry);
      const detail = document.createElement('span');
      detail.className = 'calendar-archive-entry-tag-detail';
      const attachmentCount = normalizeAttachments(entry.attachments).length;
      detail.textContent = attachmentCount ? `附件 ${attachmentCount}` : '编辑';
      tag.append(time, label, detail);
      tag.addEventListener('click', () => openEntryDetail(entry.id));
      tags.append(tag);
    });
    group.append(tags);
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

function searchEntries() {
  const query = elements.searchInput.value.trim().toLocaleLowerCase();
  const start = elements.searchStartDate.value;
  const end = elements.searchEndDate.value;
  const tag = elements.searchTagFilter.value.trim().toLocaleLowerCase();
  const mood = normalizeMood(elements.searchMoodFilter.value);
  const requireAttachment = elements.searchHasAttachment.checked;
  return state.data.entries
    .filter((entry) => !entry.deletedAt)
    .filter((entry) => !start || entry.date >= start)
    .filter((entry) => !end || entry.date <= end)
    .filter((entry) => !tag || normalizeTags(entry.tags).some((item) => item.toLocaleLowerCase().includes(tag)))
    .filter((entry) => !mood || normalizeMood(entry.mood) === mood)
    .filter((entry) => !requireAttachment || normalizeAttachments(entry.attachments).length > 0)
    .filter((entry) => {
      if (!query) return true;
      const haystack = `${entry.title} ${entry.content} ${entry.originalContent ?? ''} ${entryTagsLabel(entry.tags)} ${entry.mood || ''} ${normalizeAttachments(entry.attachments).map((attachment) => attachment.name).join(' ')}`.toLocaleLowerCase();
      return haystack.includes(query);
    })
    .sort((a, b) => b.date.localeCompare(a.date) || new Date(b.createdAt) - new Date(a.createdAt));
}

function appendHighlightedText(target, text, query) {
  const source = String(text || '');
  const needle = String(query || '').trim();
  if (!needle) {
    target.textContent = source;
    return;
  }
  const lower = source.toLocaleLowerCase();
  const lowerNeedle = needle.toLocaleLowerCase();
  let cursor = 0;
  let index = lower.indexOf(lowerNeedle, cursor);
  while (index !== -1) {
    target.append(document.createTextNode(source.slice(cursor, index)));
    const mark = document.createElement('mark');
    mark.textContent = source.slice(index, index + needle.length);
    target.append(mark);
    cursor = index + needle.length;
    index = lower.indexOf(lowerNeedle, cursor);
  }
  target.append(document.createTextNode(source.slice(cursor)));
}

function renderSearchResults() {
  const query = elements.searchInput.value.trim();
  const filtering = Boolean(query || elements.searchStartDate.value || elements.searchEndDate.value || elements.searchTagFilter.value.trim() || elements.searchMoodFilter.value || elements.searchHasAttachment.checked);
  elements.searchResults.replaceChildren();
  if (!filtering) {
    const help = document.createElement('p');
    help.className = 'summary-empty';
    help.textContent = '输入关键词，或按日期、标签、心情和附件筛选。';
    elements.searchResults.append(help);
    return;
  }
  const matches = searchEntries();
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
    const date = document.createElement('div');
    date.className = 'search-result-date';
    date.textContent = entry.date;
    const title = document.createElement('h3');
    const hasTitle = Boolean(String(entry.title || '').trim());
    title.hidden = !hasTitle;
    if (hasTitle) appendHighlightedText(title, entry.title, query);
    const metadata = document.createElement('div');
    metadata.className = 'entry-metadata search-result-meta';
    renderEntryMetadata(metadata, entry);
    const copy = document.createElement('p');
    appendHighlightedText(copy, entry.content, query);
    result.append(date, title, metadata, copy);
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
  clearTimeout(draftTimer);
  addTagFromInput(elements.entryTags, elements.entryTagList);
  const title = elements.entryTitle.value.trim();
  const content = elements.entryContent.value.trim();
  if (!content) {
    showToast('先写一点内容再保存');
    elements.entryContent.focus();
    return;
  }
  const draft = editorDraft();
  const now = new Date().toISOString();
  const entry = {
    id: crypto.randomUUID(),
    date: state.activeDate,
    title,
    tags: editorTags(),
    mood: normalizeMood(elements.entryMood.value),
    content,
    originalContent: draft.originalContent || '',
    attachments: normalizeAttachments(draft.attachments),
    createdAt: now,
    updatedAt: now,
  };
  if (!persistDataChange(() => {
    state.data.entries.push(entry);
    markCloudDirty('entries', entry.id);
    invalidateDailySummary(state.activeDate, now);
    reconcileEntryTasks([entry], now);
  })) return;
  localStorage.removeItem(draftKey());
  state.pastedDraft = null;
  updateDraftLibraryButton();
  elements.entryTitle.value = '';
  elements.entryMood.value = '';
  elements.entryTags.value = '';
  renderTagEditor(elements.entryTagList, []);
  elements.entryContent.value = '';
  closeMetadataPickers('entry');
  render();
  void applyReminderSchedule(state.reminder.settings).catch(() => undefined);
  showToast('记录已保存');
}

function aiProviderKeyForConfig(config = {}) {
  if (AI_PROVIDER_PRESETS[config?.provider]) return config.provider;
  const endpoint = String(config?.endpoint || '').toLowerCase();
  if (endpoint.includes('api.deepseek.com')) return 'deepseek';
  if (endpoint.includes('api.openai.com')) return 'openai';
  if (endpoint.includes('dashscope.aliyuncs.com') || endpoint.includes('maas.aliyuncs.com')) return 'qwen';
  if (endpoint.includes('api.moonshot.cn') || endpoint.includes('api.moonshot.ai')) return 'kimi';
  if (endpoint.includes('api.minimax.io')) return 'minimax';
  if (endpoint.includes('api.z.ai')) return 'glm';
  if (endpoint.includes('.openai.azure.com')) return 'azure-openai';
  return 'openai-compatible';
}

function aiInterfaceTypeForProvider(provider) {
  if (provider === 'deepseek') return 'deepseek';
  if (provider === 'openai') return 'openai';
  return 'openai-compatible';
}

function normalizeAiConfig(config = {}) {
  const provider = aiProviderKeyForConfig(config);
  const preset = AI_PROVIDER_PRESETS[provider] || AI_PROVIDER_PRESETS['openai-compatible'];
  const updatedAt = typeof config?.updatedAt === 'string' && Number.isFinite(Date.parse(config.updatedAt))
    ? config.updatedAt
    : '';
  return {
    ...(config && typeof config === 'object' ? config : {}),
    provider,
    apiStyle: config?.apiStyle === AI_API_STYLES.AZURE_OPENAI || preset.apiStyle === AI_API_STYLES.AZURE_OPENAI
      ? AI_API_STYLES.AZURE_OPENAI
      : AI_API_STYLES.OPENAI_COMPATIBLE,
    endpoint: String(config?.endpoint || '').trim(),
    model: String(config?.model || '').trim(),
    updatedAt,
  };
}

function aiConfigStorageKey(userId = activeJournalAccountId()) {
  const accountId = validJournalAccountId(userId);
  return accountId ? `${ACCOUNT_AI_CONFIG_PREFIX}${accountId}` : '';
}

function readLegacyAiConfigDraft() {
  try {
    const config = JSON.parse(localStorage.getItem(LEGACY_AI_CONFIG_KEY));
    if (!config || typeof config !== 'object') return null;
    // Migrate older installations away from storing an API key in localStorage.
    const { apiKey: legacyApiKey, ...safeConfig } = config;
    if (legacyApiKey) localStorage.setItem(LEGACY_AI_CONFIG_KEY, JSON.stringify(safeConfig));
    return normalizeAiConfig(safeConfig);
  } catch {
    return null;
  }
}

function readAiConfigDraft() {
  const storageKey = aiConfigStorageKey();
  if (!storageKey) return normalizeAiConfig();
  try {
    const config = JSON.parse(localStorage.getItem(storageKey));
    return config && typeof config === 'object' ? normalizeAiConfig(config) : normalizeAiConfig();
  } catch {
    return normalizeAiConfig();
  }
}

function writeAiConfigDraft(config) {
  const storageKey = aiConfigStorageKey();
  if (!storageKey) return false;
  try {
    const { apiKey, ...safeConfig } = normalizeAiConfig(config);
    localStorage.setItem(storageKey, JSON.stringify(safeConfig));
    return true;
  } catch {
    return false;
  }
}

function isAiConfigComplete(config) {
  const endpoint = String(config?.endpoint || '').trim();
  const model = String(config?.model || '').trim();
  return Boolean(endpoint && model && !endpoint.includes('YOUR-RESOURCE-NAME') && !model.includes('YOUR-DEPLOYMENT-NAME'));
}

function getAiConfig() {
  const config = readAiConfigDraft();
  return isAiConfigComplete(config) && runtimeAiApiKey ? { ...config, apiKey: runtimeAiApiKey } : null;
}

function selectedAiProvider() {
  const interfaceType = elements.aiInterfaceType.value;
  if (interfaceType === 'deepseek' || interfaceType === 'openai') return interfaceType;
  const preset = elements.aiPlatformPreset.value;
  return AI_COMPATIBLE_PLATFORM_KEYS.includes(preset) ? preset : 'openai-compatible';
}

function renderAiPlatformOptions(interfaceType, selectedProvider = '') {
  const visible = interfaceType === 'openai-compatible';
  elements.aiPlatformField.hidden = !visible;
  elements.aiPlatformPreset.disabled = !visible;
  elements.aiPlatformPreset.replaceChildren();
  if (!visible) return;
  const preferred = AI_COMPATIBLE_PLATFORM_KEYS.includes(selectedProvider) ? selectedProvider : 'openai-compatible';
  AI_COMPATIBLE_PLATFORM_KEYS.forEach((provider) => {
    const option = document.createElement('option');
    option.value = provider;
    option.textContent = AI_PROVIDER_PRESETS[provider].label;
    option.selected = provider === preferred;
    elements.aiPlatformPreset.append(option);
  });
}

function renderAiModelOptions(provider) {
  const preset = AI_PROVIDER_PRESETS[provider] || AI_PROVIDER_PRESETS['openai-compatible'];
  elements.aiModelOptions.replaceChildren();
  (preset.models || []).forEach((model) => {
    const option = document.createElement('option');
    option.value = model;
    elements.aiModelOptions.append(option);
  });
}

function updateAiProviderUi(provider = selectedAiProvider()) {
  const preset = AI_PROVIDER_PRESETS[provider] || AI_PROVIDER_PRESETS['openai-compatible'];
  const isAzure = preset.apiStyle === AI_API_STYLES.AZURE_OPENAI;
  elements.aiProviderDescription.textContent = preset.description;
  elements.aiEndpoint.placeholder = preset.endpoint || 'https://api.example.com/v1 或完整 /chat/completions 地址';
  elements.aiModelLabel.textContent = isAzure ? 'Azure 部署名称' : '模型名称';
  elements.aiModel.placeholder = isAzure ? '填写 Azure 中已部署的模型名称' : (preset.model || '选择推荐模型或手动填写模型 ID');
  renderAiModelOptions(provider);
}

function applyAiProviderPreset(provider, { preserveValues = false } = {}) {
  const normalizedProvider = AI_PROVIDER_PRESETS[provider] ? provider : 'openai-compatible';
  const preset = AI_PROVIDER_PRESETS[normalizedProvider];
  const interfaceType = aiInterfaceTypeForProvider(normalizedProvider);
  elements.aiInterfaceType.value = interfaceType;
  renderAiPlatformOptions(interfaceType, normalizedProvider);
  if (!preserveValues) {
    elements.aiEndpoint.value = preset.endpoint;
    elements.aiModel.value = preset.model;
  }
  updateAiProviderUi(normalizedProvider);
}

function openAiConfig() {
  const config = readAiConfigDraft();
  const provider = aiProviderKeyForConfig(config);
  applyAiProviderPreset(provider, { preserveValues: true });
  elements.aiEndpoint.value = config.endpoint || AI_PROVIDER_PRESETS[provider].endpoint;
  elements.aiModel.value = config.model || AI_PROVIDER_PRESETS[provider].model;
  elements.aiApiKey.value = runtimeAiApiKey;
  updateAiProviderUi(provider);
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

function openReviewDialog() {
  renderReview();
  renderReminderSettings();
  openWorkspaceDialog(elements.reviewDialog, elements.reviewYear);
}

function closeReviewDialog() {
  closeWorkspaceDialog(elements.reviewDialog);
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

function openQuickToolsDialog() {
  openWorkspaceDialog(elements.quickToolsDialog, elements.summaryPanelButton);
}

function closeQuickToolsDialog() {
  closeWorkspaceDialog(elements.quickToolsDialog);
}

function copyDesktopAppUrl() {
  const copy = navigator.clipboard?.writeText(DESKTOP_APP_URL);
  if (copy) {
    copy.then(() => showToast('电脑端网址已复制')).catch(() => showToast(DESKTOP_APP_URL));
    return;
  }
  showToast(DESKTOP_APP_URL);
}

function entryForEditing(id) {
  return state.data.entries.find((entry) => entry.id === id && !entry.deletedAt) || null;
}

function openEntryDetail(entryId) {
  const entry = entryForEditing(entryId);
  if (!entry) return;
  state.editingEntryId = entry.id;
  const date = parseDateKey(entry.date);
  elements.entryDetailDate.textContent = `${dateFormatter.format(date)} · ${timeFormatter.format(new Date(entry.createdAt))}`;
  elements.entryDetailTitle.value = entry.title || '';
  elements.entryDetailMood.value = normalizeMood(entry.mood);
  elements.entryDetailTags.value = '';
  renderTagEditor(elements.entryDetailTagList, entry.tags);
  elements.entryDetailContent.value = entry.content || '';
  updateMetadataPicker('detail');
  closeMetadataPickers('detail');
  const attachmentCount = normalizeAttachments(entry.attachments).length;
  elements.entryDetailAttachmentNote.textContent = attachmentCount
    ? `这条日记附有 ${attachmentCount} 个图片或附件，保存文字修改时会继续保留。`
    : '修改后会自动同步到已登录的设备。';
  openWorkspaceDialog(elements.entryDetailDialog, elements.entryDetailContent);
}

function closeEntryDetail() {
  state.editingEntryId = '';
  closeWorkspaceDialog(elements.entryDetailDialog);
}

function deleteJournalEntry(entryId) {
  const entry = entryForEditing(entryId);
  if (!entry) return false;
  if (!window.confirm('删除这条记录？日记与关联待办会从其他已同步设备中一并移除。')) return false;
  const now = new Date().toISOString();
  if (!persistDataChange(() => tombstoneJournalEntry(entry, now))) return false;
  if (state.editingEntryId === entry.id) closeEntryDetail();
  render();
  showToast('记录已删除');
  return true;
}

function deleteEntryDetail() {
  return deleteJournalEntry(state.editingEntryId);
}

function saveEntryDetail() {
  const entry = entryForEditing(state.editingEntryId);
  if (!entry) {
    closeEntryDetail();
    return;
  }
  const content = elements.entryDetailContent.value.trim();
  if (!content) {
    showToast('日记内容不能为空');
    elements.entryDetailContent.focus();
    return;
  }
  const now = new Date().toISOString();
  const title = elements.entryDetailTitle.value.trim().slice(0, MAX_ENTRY_TITLE_CHARS);
  addTagFromInput(elements.entryDetailTags, elements.entryDetailTagList);
  const tags = tagEditorValues(elements.entryDetailTagList);
  const mood = normalizeMood(elements.entryDetailMood.value);
  if (!persistDataChange(() => {
    entry.title = title;
    entry.tags = tags;
    entry.mood = mood;
    entry.content = content.slice(0, MAX_ENTRY_CONTENT_CHARS);
    entry.updatedAt = now;
    markCloudDirty('entries', entry.id);
    invalidateDailySummary(entry.date, now);
    reconcileEntryTasks([entry], now);
  })) return;
  closeEntryDetail();
  render();
  showToast('日记修改已保存');
}

function savePromptEditor() {
  const value = elements.promptEditorInput.value.trim();
  const type = state.promptEditorType;
  const config = readAiConfigDraft();
  config[promptConfigKey(type)] = value || promptFor(type, null);
  config.updatedAt = new Date().toISOString();
  if (!writeAiConfigDraft(config)) {
    showToast('请先登录账号后再保存提示词');
    return;
  }
  closePromptEditor();
  void syncCloudAiSettings({ preferLocal: true });
  showToast(`${promptTitle(type)}已保存，并会同步到同一账号的其他设备`);
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
          apiStyle: config.apiStyle,
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
    const previous = editorDraft();
    const draft = { ...previous, title: elements.entryTitle.value, tags: editorTags(), mood: normalizeMood(elements.entryMood.value), content, aiOriginal: content, aiSuggestion: suggestion };
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
  const draft = editorDraft();
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
  const draft = editorDraft();
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
  const payload = { app: '岁笺 Calendar Journal', version: 4, exportedAt: new Date().toISOString(), data: state.data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `suijian-backup-${localDateKey()}.json`);
  showToast('完整备份已导出');
}

function journalMarkdown() {
  const lines = ['# 岁笺日记归档', '', `导出时间：${new Date().toLocaleString('zh-CN')}`, ''];
  calendarArchiveEntries().slice().reverse().forEach((entry) => {
    lines.push(`## ${entry.date}${entry.title ? ` · ${entry.title}` : ''}`, '');
    const metadata = [];
    if (entry.mood) metadata.push(`心情：${entry.mood}`);
    if (normalizeTags(entry.tags).length) metadata.push(`标签：${normalizeTags(entry.tags).map((tag) => `#${tag}`).join(' ')}`);
    if (metadata.length) lines.push(metadata.join(' · '), '');
    lines.push(entry.content || '', '');
    const attachments = normalizeAttachments(entry.attachments);
    if (attachments.length) lines.push(`附件：${attachments.map((item) => item.name).join('、')}`, '');
  });
  return lines.join('\n');
}

function exportMarkdown() {
  downloadBlob(new Blob([journalMarkdown()], { type: 'text/markdown;charset=utf-8' }), `suijian-journal-${localDateKey()}.md`);
  showToast('Markdown 日记归档已导出');
}

let crcTable;
function crc32(bytes) {
  if (!crcTable) {
    crcTable = Array.from({ length: 256 }, (_, index) => {
      let value = index;
      for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
      return value >>> 0;
    });
  }
  let value = 0xffffffff;
  bytes.forEach((byte) => { value = (value >>> 8) ^ crcTable[(value ^ byte) & 0xff]; });
  return (value ^ 0xffffffff) >>> 0;
}

function zipUint16(value) { return new Uint8Array([value & 0xff, (value >>> 8) & 0xff]); }
function zipUint32(value) { return new Uint8Array([value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff]); }
function concatZipBytes(parts) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const out = new Uint8Array(length);
  let cursor = 0;
  parts.forEach((part) => { out.set(part, cursor); cursor += part.length; });
  return out;
}

function buildStoredZip(files) {
  const encoder = new TextEncoder();
  const local = [];
  const central = [];
  let offset = 0;
  files.forEach(({ name, bytes }) => {
    const nameBytes = encoder.encode(name);
    const checksum = crc32(bytes);
    const flags = 0x0800;
    const localHeader = concatZipBytes([zipUint32(0x04034b50), zipUint16(20), zipUint16(flags), zipUint16(0), zipUint16(0), zipUint16(0), zipUint32(checksum), zipUint32(bytes.length), zipUint32(bytes.length), zipUint16(nameBytes.length), zipUint16(0), nameBytes, bytes]);
    local.push(localHeader);
    central.push(concatZipBytes([zipUint32(0x02014b50), zipUint16(20), zipUint16(20), zipUint16(flags), zipUint16(0), zipUint16(0), zipUint16(0), zipUint32(checksum), zipUint32(bytes.length), zipUint32(bytes.length), zipUint16(nameBytes.length), zipUint16(0), zipUint16(0), zipUint16(0), zipUint16(0), zipUint32(0), zipUint32(offset), nameBytes]));
    offset += localHeader.length;
  });
  const centralBytes = concatZipBytes(central);
  const end = concatZipBytes([zipUint32(0x06054b50), zipUint16(0), zipUint16(0), zipUint16(files.length), zipUint16(files.length), zipUint32(centralBytes.length), zipUint32(offset), zipUint16(0)]);
  return concatZipBytes([...local, centralBytes, end]);
}

async function exportZipBackup() {
  setBusy(elements.backupExportZip, true, '正在打包…');
  try {
    const encoder = new TextEncoder();
    const payload = { app: '岁笺 Calendar Journal', version: 4, exportedAt: new Date().toISOString(), data: state.data };
    const files = [
      { name: '日记归档.md', bytes: encoder.encode(journalMarkdown()) },
      { name: 'suijian-backup.json', bytes: encoder.encode(JSON.stringify(payload, null, 2)) },
    ];
    for (const entry of calendarArchiveEntries()) {
      for (const attachment of normalizeAttachments(entry.attachments)) {
        try {
          let blob;
          if (attachmentDataUrlIsSafe(attachment.dataUrl, attachment.type)) blob = await (await fetch(attachment.dataUrl)).blob();
          else if (attachment.storagePath && state.cloud.session) blob = await cloudBlobRequest(`/storage/v1/object/${JOURNAL_ATTACHMENT_BUCKET}/${attachment.storagePath}`);
          if (!blob) continue;
          const safeName = attachmentFileName(attachment.name).replace(/[^\w.\-\u4e00-\u9fff]/g, '_');
          files.push({ name: `attachments/${entry.date}-${attachment.id.slice(0, 8)}-${safeName}`, bytes: new Uint8Array(await blob.arrayBuffer()) });
        } catch { /* metadata remains in JSON even when a remote object is offline */ }
      }
    }
    downloadBlob(new Blob([buildStoredZip(files)], { type: 'application/zip' }), `suijian-backup-${localDateKey()}.zip`);
    showToast('ZIP 备份已导出');
  } finally {
    setBusy(elements.backupExportZip, false);
  }
}

function automaticBackupRequest(mode, action) {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { resolve(null); return; }
    const request = indexedDB.open(AUTO_BACKUP_DB, 1);
    request.addEventListener('upgradeneeded', () => {
      if (!request.result.objectStoreNames.contains(AUTO_BACKUP_STORE)) request.result.createObjectStore(AUTO_BACKUP_STORE, { keyPath: 'id' });
    });
    request.addEventListener('error', () => reject(request.error || new Error('backup-db')));
    request.addEventListener('success', () => {
      const database = request.result;
      const transaction = database.transaction(AUTO_BACKUP_STORE, mode);
      const result = action(transaction.objectStore(AUTO_BACKUP_STORE));
      transaction.addEventListener('complete', () => { database.close(); resolve(result?.result ?? result ?? null); });
      transaction.addEventListener('error', () => { database.close(); reject(transaction.error || new Error('backup-db')); });
      transaction.addEventListener('abort', () => { database.close(); reject(transaction.error || new Error('backup-db')); });
    });
  });
}

async function listAutomaticBackups() {
  const accountId = activeJournalAccountId();
  if (!accountId) return [];
  try {
    const value = await automaticBackupRequest('readonly', (store) => store.getAll());
    return Array.isArray(value)
      ? value.filter((item) => item?.accountId === accountId).sort((first, second) => String(second.backedUpAt).localeCompare(String(first.backedUpAt)))
      : [];
  } catch { return []; }
}

async function restoreAutomaticBackup(id) {
  const snapshots = await listAutomaticBackups();
  const snapshot = snapshots.find((item) => item.id === id);
  if (!snapshot?.data || !window.confirm(`恢复 ${new Date(snapshot.backedUpAt).toLocaleString('zh-CN')} 的备份？当前内容会先另存为自动备份。`)) return;
  await saveAutomaticBackup();
  const next = snapshot.data;
  state.data = {
    entries: Array.isArray(next.entries) ? next.entries.map((entry) => ({ ...entry, attachments: normalizeAttachments(entry.attachments), tags: normalizeTags(entry.tags), mood: normalizeMood(entry.mood), workContent: normalizeWorkContent(entry.workContent) })) : [],
    summaries: next.summaries && typeof next.summaries === 'object' ? next.summaries : {},
    periodSummaries: Array.isArray(next.periodSummaries) ? next.periodSummaries : [],
    tasks: Array.isArray(next.tasks) ? next.tasks.map(normalizeJournalTask).filter(Boolean) : [],
    cloudSync: normalizeCloudMeta(next.cloudSync),
  };
  markAllCloudDirty();
  if (!persistData()) return;
  render();
  await renderBackupSnapshots();
  showToast('已恢复所选自动备份');
}

async function renderBackupSnapshots() {
  const snapshots = await listAutomaticBackups();
  elements.cloudDailyBackupStatus.textContent = dailyCloudBackupStatus();
  elements.backupSnapshotList.replaceChildren();
  elements.backupStatus.textContent = snapshots.length ? `保留 ${snapshots.length} 份` : '暂无快照';
  if (!snapshots.length) {
    const empty = document.createElement('p');
    empty.className = 'review-empty';
    empty.textContent = '保存一条日记后，会自动生成本机恢复快照。';
    elements.backupSnapshotList.append(empty);
    return;
  }
  snapshots.forEach((snapshot) => {
    const item = document.createElement('article');
    item.className = 'backup-snapshot';
    const copy = document.createElement('div');
    const time = document.createElement('strong');
    time.textContent = new Date(snapshot.backedUpAt).toLocaleString('zh-CN');
    const detail = document.createElement('span');
    detail.textContent = `${Array.isArray(snapshot.data?.entries) ? snapshot.data.entries.filter((entry) => !entry.deletedAt).length : 0} 条日记`;
    copy.append(time, detail);
    const restore = document.createElement('button');
    restore.type = 'button';
    restore.className = 'quiet-button';
    restore.textContent = '恢复这份';
    restore.addEventListener('click', () => void restoreAutomaticBackup(snapshot.id));
    item.append(copy, restore);
    elements.backupSnapshotList.append(item);
  });
}

function openBackupDialog() {
  void renderBackupSnapshots();
  openWorkspaceDialog(elements.backupDialog, elements.backupExportZip);
}

function closeBackupDialog() {
  closeWorkspaceDialog(elements.backupDialog);
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
  if (entry.workContent !== undefined && !validText(entry.workContent, MAX_ENTRY_WORK_CONTENT_CHARS)) return null;
  return {
    id: entry.id,
    date: entry.date,
    title: entry.title || '',
    content: entry.content,
    originalContent: entry.originalContent || '',
    workContent: normalizeWorkContent(entry.workContent),
    attachments: normalizeAttachments(entry.attachments),
    tags: normalizeTags(entry.tags),
    mood: normalizeMood(entry.mood),
    createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : new Date().toISOString(),
    updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : new Date().toISOString(),
    ...(typeof entry.deletedAt === 'string' ? { deletedAt: entry.deletedAt } : {}),
  };
}

function shouldMergeImportedEntry(local, incoming) {
  return Boolean(local && !incoming?.deletedAt && incomingWins(local, incoming));
}

function shouldRestoreImportedEntry(local, incoming) {
  return Boolean(local?.deletedAt && shouldMergeImportedEntry(local, incoming));
}

function resolveImportedEntries(localEntries, incomingEntries) {
  const localEntriesById = new Map(localEntries.map((entry) => [entry.id, entry]));
  const seenIncomingEntryIds = new Set();
  const newEntries = [];
  const mergedEntries = [];
  let restoredEntryCount = 0;
  incomingEntries.forEach((entry) => {
    if (seenIncomingEntryIds.has(entry.id)) return;
    seenIncomingEntryIds.add(entry.id);
    const local = localEntriesById.get(entry.id);
    if (!local) {
      newEntries.push(entry);
      return;
    }
    if (shouldMergeImportedEntry(local, entry)) {
      mergedEntries.push(entry);
      if (local.deletedAt) restoredEntryCount += 1;
    }
  });
  return { newEntries, mergedEntries, restoredEntryCount };
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
    const confirmed = window.confirm(`准备导入 ${incoming.entries.length} 条记录。同 ID 会保留较新版本；备份中较新的记录可恢复本机已删除的日记，是否继续？`);
    if (!confirmed) return;
    const { newEntries, mergedEntries, restoredEntryCount } = resolveImportedEntries(
      state.data.entries,
      incoming.entries.map(normalizeImportedEntry).filter(Boolean),
    );
    const incomingSummaries = Object.entries(incoming.summaries)
      .filter(([date, summary]) => isDateKey(date) && validText(typeof summary === 'string' ? summary : summary?.content, MAX_SUMMARY_CHARS))
      .map(([date, summary]) => [date, typeof summary === 'string' ? { content: summary } : summary]);
    const newSummaries = Object.fromEntries(incomingSummaries.filter(([date]) => !state.data.summaries[date]));
    const taskIds = new Set(state.data.tasks.map((task) => task.id));
    const newTasks = Array.isArray(incoming.tasks) ? incoming.tasks.map(normalizeJournalTask).filter((task) => task && !taskIds.has(task.id)) : [];
    const periodIds = new Set(state.data.periodSummaries.map((summary) => summary.id));
    const newPeriodSummaries = Array.isArray(incoming.periodSummaries)
      ? incoming.periodSummaries.map(normalizeImportedPeriodSummary).filter((summary) => summary && !periodIds.has(summary.id))
      : [];
    const previous = structuredClone(state.data);
    const mergedEntriesById = new Map(mergedEntries.map((entry) => [entry.id, entry]));
    state.data.entries = state.data.entries.map((entry) => mergedEntriesById.get(entry.id) || entry);
    state.data.entries.push(...newEntries);
    state.data.summaries = { ...state.data.summaries, ...newSummaries };
    state.data.periodSummaries.push(...newPeriodSummaries);
    state.data.tasks.push(...newTasks);
    reconcileEntryTasks([...newEntries, ...mergedEntries]);
    const remainingTaskIds = new Set(state.data.tasks.map((task) => task.id));
    [...newEntries, ...mergedEntries].forEach((entry) => markCloudDirty('entries', entry.id));
    Object.keys(newSummaries).forEach((date) => markCloudDirty('dailySummaries', date));
    newPeriodSummaries.forEach((summary) => markCloudDirty('periodSummaries', summary.id));
    newTasks.filter((task) => remainingTaskIds.has(task.id)).forEach((task) => markCloudDirty('tasks', task.id));
    if (!persistData()) {
      state.data = previous;
      throw new Error('storage');
    }
    render();
    const mergedLiveCount = mergedEntries.length - restoredEntryCount;
    const results = [`新增 ${newEntries.length} 条记录`];
    if (mergedLiveCount) results.push(`合并 ${mergedLiveCount} 条较新记录`);
    if (restoredEntryCount) results.push(`恢复 ${restoredEntryCount} 条已删除记录`);
    showToast(`已导入：${results.join('，')}；跳过了格式不正确、重复或较旧的内容`);
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
  return Object.entries(meta.dirty).some(([kind, values]) => values.length > 0 && (kind !== 'tasks' || state.cloud.tasksSupported !== false));
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
    if (!saved || typeof saved !== 'object' || !saved.accessToken || !saved.refreshToken || !saved.user?.id) return null;
    // Legacy sessions included a local expiry. Migrate them to explicit-sign-out persistence.
    const { rememberUntil: legacyRememberUntil, ...session } = saved;
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
  state.cloud.session = session || null;
  if (session) localStorage.setItem(CLOUD_SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(CLOUD_SESSION_KEY);
  sessionStorage.removeItem(CLOUD_SESSION_KEY);
}

function sessionFromPayload(payload) {
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
  if (state.cloud.lastError) {
    elements.syncStatus.textContent = '云同步失败，等待重试';
    return;
  }
  elements.syncStatus.textContent = hasCloudChanges()
    ? '等待云同步'
    : (state.cloud.attachmentsSupported === false ? '文本日记已同步（兼容模式）' : '云端已同步');
}

function renderCloudAccountDialog() {
  const session = state.cloud.session;
  elements.syncAccountStatus.textContent = session ? '已登录' : '未登录';
  elements.syncAuthForm.hidden = Boolean(session);
  elements.syncSignedIn.hidden = !session;
  elements.syncAccountEmail.textContent = session?.user?.email || '';
  elements.syncAuthCopy.textContent = session
    ? '这台设备会持续保持登录；打开手机或电脑时，日记和模型配置都会自动同步。'
    : '登录或注册后会持续保持登录；打开、回到前台和每 10 分钟都会自动同步。';
  elements.syncLastSession.textContent = session
    ? '仅在你主动退出、清除站点数据或同步服务撤销会话后需要再次登录。'
    : '';
  elements.accountDialogCopy.textContent = session
    ? '同一邮箱登录手机和电脑后，日记与模型配置都会自动合并到这个账号。'
    : '注册一个账号后，即可把日记同步到其他设备。';
  elements.cloudAccountButton.textContent = session ? '账号' : '登录';
  elements.cloudAccountButton.setAttribute('aria-label', session ? '打开账号窗口' : '打开登录或注册窗口');
}

function renderCloudSyncDialog() {
  const session = state.cloud.session;
  const accountId = state.data.cloudSync?.accountId;
  elements.syncLoginRequired.hidden = Boolean(session);
  elements.syncActivePanel.hidden = !session;
  elements.syncAccountBrief.textContent = session?.user?.email || '尚未登录同步账号';
  const compatibilityNotice = state.cloud.attachmentsSupported === false
    ? '云端日记表尚未迁移附件字段，已启用文本同步兼容模式；图片、标签和心情仍保留在本机。'
    : '';
  elements.syncAccountMessage.textContent = session
    ? (state.cloud.lastError
      ? `上次同步失败：${state.cloud.lastError}`
      : (accountId && accountId !== session.user.id
      ? '检测到本机曾使用其他账号。立即同步时会先让你确认是否合并。'
      : (hasCloudChanges() ? '本机有新内容等待上传。' : (`登录、返回前台和每 10 分钟都会自动同步。${compatibilityNotice}`))))
    : '登录后，日记、当天摘要与跨日汇总会保存到你的云端账号。';
  elements.syncDialogCopy.textContent = session
    ? '这里仅处理跨设备同步，不修改你的日记内容。'
    : '请先登录账号，再开始跨设备同步。';
  renderCloudActivity();
  renderSyncStatus();
}

function renderCloudDialogs() {
  renderMobileAppUpdatePanel();
  renderCloudAccountDialog();
  renderCloudSyncDialog();
}

function openCloudSyncDialog() {
  renderCloudDialogs();
  const target = state.cloud.session ? elements.syncNowButton : elements.syncOpenAccount;
  openWorkspaceDialog(elements.syncDialog, target);
}

function setPasswordVisibility(input, button, visible) {
  if (!input || !button) return;
  input.type = visible ? 'text' : 'password';
  button.textContent = visible ? '隐藏' : '显示';
  button.setAttribute('aria-pressed', String(visible));
  button.setAttribute('aria-label', visible ? '隐藏密码' : '显示密码');
}

function resetSyncPasswordVisibility() {
  setPasswordVisibility(elements.syncPassword, elements.toggleSyncPassword, false);
}

function openCloudAccountDialog() {
  resetSyncPasswordVisibility();
  renderCloudDialogs();
  void checkNativeInstallerUpdate({ quiet: true });
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
    activateJournalAccount(session.user.id);
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
  if (!response.ok) {
    const error = new Error(payload?.msg || payload?.error_description || payload?.message || `同步服务返回 ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

async function refreshCloudSession() {
  const existing = state.cloud.session;
  if (!existing?.refreshToken) return null;
  try {
    const payload = await cloudAuthRequest('/auth/v1/token?grant_type=refresh_token', { refresh_token: existing.refreshToken });
    const session = sessionFromPayload(payload);
    if (!session) throw new Error('登录状态已过期，请重新登录');
    storeCloudSession(session);
    return session;
  } catch (error) {
    if ([400, 401, 403].includes(error?.status)) {
      storeCloudSession(null);
      stopCloudAutoSync();
      clearJournalAccount();
      render();
      renderCloudDialogs();
    }
    throw error;
  }
}

async function activeCloudSession() {
  const session = state.cloud.session;
  if (!session) throw new Error('请先登录同步账号');
  if (session.expiresAt && session.expiresAt > Date.now() + 60_000) return session;
  return refreshCloudSession();
}

async function cloudBlobRequest(path, options = {}, retry = true) {
  const config = readCloudConfig();
  const session = await activeCloudSession();
  const response = await fetch(cloudUrl(path), {
    ...options,
    headers: { apikey: config.publishableKey, Authorization: `Bearer ${session.accessToken}`, ...(options.headers || {}) },
  });
  if (response.status === 401 && retry) {
    await refreshCloudSession();
    return cloudBlobRequest(path, options, false);
  }
  if (!response.ok) throw new Error(`附件服务返回 ${response.status}`);
  return response.blob();
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

function cloudAiSettingsToLocal(record) {
  const payload = record?.config && typeof record.config === 'object' && !Array.isArray(record.config) ? record.config : {};
  const { apiKey, ...rawConfig } = payload;
  const config = normalizeAiConfig({ ...rawConfig, updatedAt: record?.updated_at || rawConfig.updatedAt || '' });
  return { config, apiKey: typeof apiKey === 'string' ? apiKey : '' };
}

function applyCloudAiSettings(record) {
  const { config, apiKey } = cloudAiSettingsToLocal(record);
  if (!config.updatedAt) return false;
  runtimeAiApiKey = apiKey;
  writeAiConfigDraft(config);
  return true;
}

async function pullCloudAiSettings() {
  try {
    const records = await cloudRequest(`/rest/v1/${AI_SETTINGS_TABLE}?select=config,updated_at&limit=1`);
    state.cloud.aiConfigSupported = true;
    state.cloud.aiConfigError = '';
    return Array.isArray(records) && records.length ? records[0] : null;
  } catch (error) {
    state.cloud.aiConfigSupported = false;
    state.cloud.aiConfigError = error instanceof Error ? error.message : '模型配置同步失败';
    return null;
  }
}

function cloudAiSettingsPayload(config, apiKey) {
  const { apiKey: ignored, ...safeConfig } = normalizeAiConfig(config);
  return {
    user_id: state.cloud.session.user.id,
    config: { ...safeConfig, apiKey: String(apiKey || '') },
    updated_at: safeConfig.updatedAt || new Date().toISOString(),
  };
}

async function syncCloudAiSettings({ preferLocal = false, clearApiKey = false } = {}) {
  if (!isCloudConfigured() || !state.cloud.session) return false;
  const local = readAiConfigDraft();
  const remote = await pullCloudAiSettings();
  const remoteSettings = remote ? cloudAiSettingsToLocal(remote) : null;
  const localTime = cloudUpdatedAt(local);
  const remoteTime = cloudUpdatedAt(remote);

  if (remote && !preferLocal && (remoteTime >= localTime || !local.updatedAt)) {
    return applyCloudAiSettings(remote);
  }
  if (!local.updatedAt) return Boolean(remote);

  const apiKey = clearApiKey ? '' : (runtimeAiApiKey || remoteSettings?.apiKey || '');
  try {
    const saved = await cloudRequest(`/rest/v1/${AI_SETTINGS_TABLE}?on_conflict=user_id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify([cloudAiSettingsPayload(local, apiKey)]),
    });
    state.cloud.aiConfigSupported = true;
    state.cloud.aiConfigError = '';
    const record = Array.isArray(saved) ? saved[0] : null;
    if (record) applyCloudAiSettings(record);
    return true;
  } catch (error) {
    state.cloud.aiConfigSupported = false;
    state.cloud.aiConfigError = error instanceof Error ? error.message : '模型配置同步失败';
    return false;
  }
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

function conflictCopyTitle(entry) {
  const source = String(entry?.title || '').trim() || String(entry?.date || '').trim() || '未命名日记';
  return `同步冲突副本 · ${source}`.slice(0, MAX_ENTRY_TITLE_CHARS);
}

function createEntryConflictCopy(entry, now = new Date().toISOString(), id = crypto.randomUUID()) {
  return {
    ...entry,
    id,
    title: conflictCopyTitle(entry),
    createdAt: now,
    updatedAt: now,
    deletedAt: undefined,
  };
}

function shouldPreserveDirtyEntry(local, remote, dirtyEntryIds) {
  return Boolean(
    local
    && !local.deletedAt
    && Array.isArray(dirtyEntryIds)
    && dirtyEntryIds.includes(local.id)
    && incomingWins(local, remote)
  );
}

function remoteEntryToLocal(entry, localEntry = null) {
  const preserveLocalAttachmentMetadata = state.cloud.attachmentsSupported === false && localEntry;
  const payload = preserveLocalAttachmentMetadata
    ? { files: normalizeAttachments(localEntry.attachments), tags: normalizeTags(localEntry.tags), mood: normalizeMood(localEntry.mood), workContent: normalizeWorkContent(localEntry.workContent) }
    : attachmentPayload(entry.attachments);
  return {
    id: entry.id,
    date: entry.entry_date,
    title: entry.title || '',
    content: entry.content || '',
    originalContent: entry.original_content || '',
    attachments: normalizeAttachments(payload.files),
    tags: normalizeTags(payload.tags),
    mood: normalizeMood(payload.mood),
    workContent: normalizeWorkContent(payload.workContent),
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
    deletedAt: entry.deleted_at || undefined,
  };
}

function remoteTaskToLocal(task) {
  return normalizeJournalTask({
    id: task.id,
    entryId: task.entry_id,
    sourceKey: task.source_key,
    text: task.content,
    completed: task.completed,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    deletedAt: task.deleted_at || undefined,
  });
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

function mergeRemoteData({ entries = [], dailySummaries = [], periodSummaries = [], tasks = [] }, options = {}) {
  const preserveDirtyEntryConflicts = options.preserveDirtyEntryConflicts !== false;
  const dirtyEntryIds = [...cloudDirty('entries')];
  let conflictCount = 0;
  const entryMap = new Map(state.data.entries.map((entry) => [entry.id, entry]));
  entries.forEach((remoteRecord) => {
    const local = entryMap.get(remoteRecord.id);
    const remote = remoteEntryToLocal(remoteRecord, local);
    if (!local || !incomingWins(local, remote)) return;
    if (preserveDirtyEntryConflicts && shouldPreserveDirtyEntry(local, remote, dirtyEntryIds)) {
      const conflictCopy = createEntryConflictCopy(local);
      entryMap.set(conflictCopy.id, conflictCopy);
      clearCloudDirty('entries', [local.id]);
      markCloudDirty('entries', conflictCopy.id);
      conflictCount += 1;
    }
    entryMap.set(remote.id, remote);
  });
  state.data.entries = [...entryMap.values()];
  if (conflictCount) recordCloudActivity(`检测到 ${conflictCount} 条跨设备修改冲突，已保留为“同步冲突副本”`, 'info');

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

  const taskMap = new Map(state.data.tasks.map((task) => [task.id, task]));
  tasks.map(remoteTaskToLocal).filter(Boolean).forEach((remote) => {
    const local = taskMap.get(remote.id);
    if (!local || incomingWins(local, remote)) taskMap.set(remote.id, remote);
  });
  state.data.tasks = [...taskMap.values()];
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
  state.data.tasks.forEach((task) => {
    ensureCloudMetadata(task, now);
    markCloudDirty('tasks', task.id);
  });
}

async function pullCloudData() {
  const entryColumns = 'id,entry_date,title,content,original_content,attachments,created_at,updated_at,deleted_at';
  const legacyEntryColumns = 'id,entry_date,title,content,original_content,created_at,updated_at,deleted_at';
  const summaryColumns = 'id,entry_date,content,model,created_at,updated_at,deleted_at';
  const periodColumns = 'id,start_date,end_date,entry_ids,content,model,created_at,updated_at,deleted_at';
  const requestSupportingRecords = () => Promise.all([
    cloudRequest(`/rest/v1/daily_summaries?select=${encodeURIComponent(summaryColumns)}&order=updated_at.desc`),
    cloudRequest(`/rest/v1/period_summaries?select=${encodeURIComponent(periodColumns)}&order=updated_at.desc`),
  ]);
  let entries;
  let dailySummaries;
  let periodSummaries;
  try {
    [entries, [dailySummaries, periodSummaries]] = await Promise.all([
      cloudRequest(`/rest/v1/journal_entries?select=${encodeURIComponent(entryColumns)}&order=updated_at.desc`),
      requestSupportingRecords(),
    ]);
    state.cloud.attachmentsSupported = true;
  } catch (error) {
    if (!isMissingCloudAttachmentsColumn(error)) throw error;
    const firstCompatibilitySync = state.cloud.attachmentsSupported !== false;
    state.cloud.attachmentsSupported = false;
    [entries, [dailySummaries, periodSummaries]] = await Promise.all([
      cloudRequest(`/rest/v1/journal_entries?select=${encodeURIComponent(legacyEntryColumns)}&order=updated_at.desc`),
      requestSupportingRecords(),
    ]);
    if (firstCompatibilitySync) recordCloudActivity('云端日记表尚未迁移附件字段，已启用文本同步兼容模式', 'info');
  }
  let tasks = [];
  try {
    tasks = await cloudRequest('/rest/v1/journal_tasks?select=id,entry_id,source_key,content,completed,created_at,updated_at,deleted_at&order=updated_at.desc');
    state.cloud.tasksSupported = true;
  } catch {
    state.cloud.tasksSupported = false;
  }
  mergeRemoteData({ entries, dailySummaries, periodSummaries, tasks });
}

function isMissingCloudAttachmentsColumn(error) {
  const message = error instanceof Error ? error.message : '';
  return message.includes('column journal_entries.attachments does not exist');
}

function isMissingCloudBackupsTable(error) {
  const message = error instanceof Error ? error.message : '';
  return /journal_backups|PGRST205/i.test(message);
}

function entryToCloud(entry, userId) {
  const payload = {
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
  if (state.cloud.attachmentsSupported !== false) payload.attachments = cloudAttachmentPayload(entry);
  return payload;
}

function taskToCloud(task, userId) {
  return { id: task.id, user_id: userId, entry_id: task.entryId, source_key: task.sourceKey, content: task.text, completed: Boolean(task.completed), created_at: task.createdAt, updated_at: task.updatedAt, deleted_at: task.deletedAt || null };
}

function storageObjectName(entry, attachment, userId) {
  const extension = attachmentFileName(attachment.name).split('.').pop().replace(/[^a-z0-9]/gi, '').slice(0, 12);
  return `${userId}/${entry.id}/${attachment.id}/${attachment.id}${extension ? `.${extension.toLowerCase()}` : ''}`;
}

async function uploadAttachmentToCloud(entry, attachment, userId) {
  if (!attachmentDataUrlIsSafe(attachment.dataUrl, attachment.type)) return attachment;
  const blob = await (await fetch(attachment.dataUrl)).blob();
  const storagePath = storageObjectName(entry, attachment, userId);
  const config = readCloudConfig();
  const session = await activeCloudSession();
  const response = await fetch(cloudUrl(`/storage/v1/object/${JOURNAL_ATTACHMENT_BUCKET}/${storagePath}`), {
    method: 'POST',
    headers: { apikey: config.publishableKey, Authorization: `Bearer ${session.accessToken}`, 'Content-Type': attachment.type, 'x-upsert': 'false' },
    body: blob,
  });
  if (!response.ok && response.status !== 409) throw new Error(`附件上传失败：${response.status}`);
  return { id: attachment.id, name: attachment.name, type: attachment.type, size: attachment.size, storagePath };
}

async function promoteEntryAttachmentsToCloud(entry, userId) {
  if (state.cloud.attachmentsSupported === false) return false;
  const attachments = normalizeAttachments(entry.attachments);
  if (!attachments.some((attachment) => attachment.dataUrl && !attachment.storagePath)) return false;
  const promoted = [];
  let changed = false;
  for (const attachment of attachments) {
    try {
      const next = attachment.storagePath ? attachment : await uploadAttachmentToCloud(entry, attachment, userId);
      promoted.push(next);
      changed ||= next.storagePath && next.storagePath !== attachment.storagePath;
    } catch {
      promoted.push(attachment);
    }
  }
  if (changed) entry.attachments = promoted;
  return changed;
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
    await Promise.all(entries.map((entry) => promoteEntryAttachmentsToCloud(entry, userId)));
    const saved = await cloudRequest('/rest/v1/journal_entries?on_conflict=id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(entries.map((entry) => entryToCloud(entry, userId))),
    });
    mergeRemoteData({ entries: saved || [] }, { preserveDirtyEntryConflicts: false });
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

  if (state.cloud.tasksSupported !== false) {
    const taskIds = [...cloudDirty('tasks')];
    const tasks = taskIds.map((id) => state.data.tasks.find((task) => task.id === id)).filter(Boolean);
    if (tasks.length) {
      try {
        const saved = await cloudRequest('/rest/v1/journal_tasks?on_conflict=id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify(tasks.map((task) => taskToCloud(task, userId))),
        });
        state.cloud.tasksSupported = true;
        mergeRemoteData({ tasks: saved || [] });
        clearCloudDirty('tasks', taskIds);
      } catch {
        state.cloud.tasksSupported = false;
      }
    }
  }
}

async function syncCloud({ quiet = false } = {}) {
  if (!isCloudConfigured() || !state.cloud.session) return false;
  if (state.cloud.syncing) return state.cloud.syncPromise;
  state.cloud.syncing = true;
  const task = (async () => {
    let succeeded = false;
    renderCloudSyncDialog();
    try {
      const session = await activeCloudSession();
      const meta = state.data.cloudSync ?? (state.data.cloudSync = emptyCloudMeta());
      if (meta.accountId !== session.user.id) {
        if (meta.accountId) {
          throw new Error('检测到账号缓存不一致，已隔离本机数据；请退出后重新登录。');
        }
        meta.accountId = session.user.id;
        markAllCloudDirty();
        persistData({ queue: false });
      }
      await syncCloudAiSettings();
      await pullCloudData();
      await pushCloudChanges();
      await saveDailyCloudBackup(session.user.id);
      state.cloud.lastError = '';
      persistData({ queue: false });
      succeeded = true;
      if (!quiet) {
        recordCloudActivity('手动同步完成', 'success');
        showToast('云端内容已同步');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      const isNewError = state.cloud.lastError !== message;
      state.cloud.lastError = message;
      if (!quiet || isNewError) recordCloudActivity(`同步失败：${message}`, 'error');
      if (!quiet) {
        showToast(message.includes('stale update')
          ? '检测到另一台设备的较新版本：已停止上传以防覆盖，请先导出本机内容后刷新同步。'
          : `同步失败：${message}`);
      }
    } finally {
      state.cloud.syncing = false;
      render();
      renderCloudDialogs();
    }
    return succeeded;
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
    activateJournalAccount(session.user.id);
    startCloudAutoSync();
    render();
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
      activateJournalAccount(session.user.id);
      startCloudAutoSync();
      render();
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
    recordCloudActivity('已退出同步账号', 'info');
    storeCloudSession(null);
    stopCloudAutoSync();
    clearJournalAccount();
    render();
    renderCloudDialogs();
    showToast('已退出账号，请登录后查看日记');
  }
}

async function initializeCloudSync() {
  const restoredFromCallback = await restoreCloudSessionFromAuthCallback();
  if (!restoredFromCallback && state.cloud.session) activateJournalAccount(state.cloud.session.user.id);
  render();
  renderCloudDialogs();
  startCloudAutoSync();
  if (!restoredFromCallback && state.cloud.session && isCloudConfigured()) syncCloud({ quiet: true });
}

function isNativeMobileApp() {
  return Boolean(window.Capacitor?.isNativePlatform?.());
}

function nativeAppPlugin() {
  const capacitor = window.Capacitor;
  if (!isNativeMobileApp()) return null;
  return capacitor.Plugins?.App ?? capacitor.registerPlugin?.('App') ?? null;
}

async function installedNativeAppInfo() {
  const app = nativeAppPlugin();
  if (!app) return null;
  try {
    const info = await app.getInfo();
    const versionCode = Number(info?.build);
    return {
      versionName: typeof info?.version === 'string' ? info.version : '',
      versionCode: Number.isSafeInteger(versionCode) && versionCode > 0 ? versionCode : 0,
    };
  } catch {
    // Older native shells may not contain the App plugin. They can still open the installer link.
    return null;
  }
}

function isTrustedNativeInstallerUpdate(manifest) {
  if (!manifest || !Number.isSafeInteger(manifest.versionCode) || manifest.versionCode < 1
    || typeof manifest.versionName !== 'string' || !/^\d+\.\d+\.\d+$/.test(manifest.versionName)
    || typeof manifest.apkUrl !== 'string' || !/^[a-f0-9]{64}$/.test(manifest.checksum || '')) return false;
  try {
    const url = new URL(manifest.apkUrl);
    const base = new URL(NATIVE_APP_UPDATE_MANIFEST_URL);
    return url.origin === base.origin
      && url.pathname === `/suijian-journal/downloads/suijian-android-v${manifest.versionName}.apk`;
  } catch {
    return false;
  }
}

function hasNativeInstallerUpdate() {
  const manifest = state.nativeInstaller.manifest;
  if (!manifest) return false;
  const installedCode = state.nativeInstaller.installed?.versionCode || 0;
  return manifest.versionCode > installedCode;
}

function renderMobileAppUpdatePanel() {
  if (!elements.mobileUpdatePanel) return;
  const native = isNativeMobileApp();
  elements.mobileUpdatePanel.hidden = !native;
  if (!native) return;

  const { installed, manifest, status, checking } = state.nativeInstaller;
  elements.mobileAppVersion.textContent = installed?.versionName
    ? `当前 v${installed.versionName}`
    : '当前版本待确认';
  elements.downloadMobileUpdate.hidden = !hasNativeInstallerUpdate();
  elements.mobileAppUpdateStatus.textContent = checking
    ? '正在检查网页内容和 Android 安装包更新…'
    : (status || (manifest
      ? `网页内容会自动更新；Android 原生版本 v${manifest.versionName} 已是最新。`
      : '网页内容会在启动、回到前台、网络恢复和每 10 分钟自动检查更新。'));
}

async function checkNativeInstallerUpdate({ quiet = true } = {}) {
  if (!isNativeMobileApp() || state.nativeInstaller.checking) return null;
  state.nativeInstaller.checking = true;
  renderMobileAppUpdatePanel();
  try {
    const [installed, response] = await Promise.all([
      installedNativeAppInfo(),
      fetch(NATIVE_APP_UPDATE_MANIFEST_URL, { cache: 'no-store' }),
    ]);
    if (!response.ok) throw new Error(`安装包更新清单请求失败：${response.status}`);
    const manifest = await response.json();
    if (!isTrustedNativeInstallerUpdate(manifest)) throw new Error('安装包更新清单格式无效');
    state.nativeInstaller.installed = installed;
    state.nativeInstaller.manifest = manifest;
    state.nativeInstaller.status = hasNativeInstallerUpdate()
      ? `发现 Android v${manifest.versionName}。下载后由 Android 系统确认安装；日记先同步即可保留。`
      : `Android 原生版本已是最新（v${manifest.versionName}）。网页内容仍会自动更新。`;
    if (!quiet) showToast(hasNativeInstallerUpdate() ? `发现 Android v${manifest.versionName} 安装包` : 'Android App 已是最新版本');
    return manifest;
  } catch (error) {
    state.nativeInstaller.status = '安装包更新暂时无法检查；网页自动更新不受影响。';
    if (!quiet) showToast('安装包更新检查失败，请稍后重试');
    console.info('Native installer update check skipped', error instanceof Error ? error.message : error);
    return null;
  } finally {
    state.nativeInstaller.checking = false;
    renderMobileAppUpdatePanel();
  }
}

function openNativeInstallerDownload() {
  const manifest = state.nativeInstaller.manifest;
  if (!hasNativeInstallerUpdate() || !manifest) {
    showToast('请先检查 Android App 更新');
    return;
  }
  const link = document.createElement('a');
  link.href = manifest.apkUrl;
  link.target = '_blank';
  link.rel = 'noopener';
  document.body.append(link);
  link.click();
  link.remove();
  showToast('已打开安装包下载；下载完成后请按 Android 系统提示安装');
}

async function checkMobileUpdatesManually() {
  if (!isNativeMobileApp()) return;
  setBusy(elements.checkMobileUpdate, true, '检查中…');
  try {
    await Promise.all([
      checkNativeAppUpdate({ quiet: false }),
      checkNativeInstallerUpdate({ quiet: false }),
    ]);
  } finally {
    setBusy(elements.checkMobileUpdate, false);
  }
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

async function checkNativeAppUpdate({ quiet = true, applyImmediately = false } = {}) {
  const updater = nativeUpdater();
  if (!updater || state.nativeUpdate.checking) return null;
  state.nativeUpdate.checking = true;
  try {
    await notifyNativeBundleReady(updater);
    const response = await fetch(MOBILE_OTA_MANIFEST_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`更新清单请求失败：${response.status}`);
    const manifest = await response.json();
    if (!isTrustedMobileUpdate(manifest)) throw new Error('更新清单格式无效');

    const [current, pending] = await Promise.all([updater.current(), updater.getNextBundle()]);
    if ([current?.bundle?.version, pending?.version].includes(manifest.version)) {
      if (!quiet) showToast('网页内容已经是最新版');
      return { available: false };
    }

    const bundle = await updater.download({ url: manifest.url, version: manifest.version, checksum: manifest.checksum });
    await updater.next({ id: bundle.id });
    // Cold-start updates should become active before the user starts writing.
    if (applyImmediately) {
      await updater.reload();
      return { available: true, applying: true };
    }
    if (!quiet) showToast('网页更新已下载，退出或重开 App 后会自动启用');
    return { available: true };
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
  void checkNativeAppUpdate({ quiet: true, applyImmediately: true });
  void checkNativeInstallerUpdate({ quiet: true });
  clearInterval(state.nativeUpdate.timer);
  clearInterval(state.nativeInstaller.timer);
  state.nativeUpdate.timer = window.setInterval(() => void checkNativeAppUpdate({ quiet: true }), MOBILE_OTA_CHECK_INTERVAL_MS);
  state.nativeInstaller.timer = window.setInterval(() => void checkNativeInstallerUpdate({ quiet: true }), MOBILE_OTA_CHECK_INTERVAL_MS);
}

function bindEvents() {
  elements.navLinks.forEach((link) => link.addEventListener('click', () => {
    state.view = link.dataset.view;
    render();
  }));
  elements.toolPanelButton.addEventListener('click', openQuickToolsDialog);
  elements.closeQuickToolsDialog.addEventListener('click', closeQuickToolsDialog);
  closeDialogOnBackdrop(elements.quickToolsDialog, closeQuickToolsDialog);
  elements.summaryPanelButton.addEventListener('click', () => {
    closeQuickToolsDialog();
    openPeriodSummaryDialog();
  });
  elements.reviewPanelButton.addEventListener('click', () => {
    closeQuickToolsDialog();
    openReviewDialog();
  });
  elements.closeReviewDialog.addEventListener('click', closeReviewDialog);
  closeDialogOnBackdrop(elements.reviewDialog, closeReviewDialog);
  elements.reviewYear.addEventListener('change', () => {
    state.reviewYear = Number(elements.reviewYear.value) || new Date().getFullYear();
    renderReview();
  });
  elements.reviewRangeMode.addEventListener('change', () => {
    state.reviewMode = ['week', 'month', 'year'].includes(elements.reviewRangeMode.value) ? elements.reviewRangeMode.value : 'year';
    renderReview();
  });
  elements.reminderForm.addEventListener('submit', (event) => {
    event.preventDefault();
    void saveReminderSettings();
  });
  elements.reminderSnooze.addEventListener('click', () => void snoozeReminder());
  elements.reminderSkipToday.addEventListener('click', () => void skipReminderToday());
  elements.searchPanelButton.addEventListener('click', openSearchDialog);
  elements.backupPanelButton.addEventListener('click', () => {
    closeQuickToolsDialog();
    openBackupDialog();
  });
  elements.closeBackupDialog.addEventListener('click', closeBackupDialog);
  closeDialogOnBackdrop(elements.backupDialog, closeBackupDialog);
  elements.backupExportJson.addEventListener('click', exportData);
  elements.backupExportMarkdown.addEventListener('click', exportMarkdown);
  elements.backupExportZip.addEventListener('click', () => void exportZipBackup());
  elements.cloudSyncButton.addEventListener('click', handleCloudSyncButton);
  elements.cloudAccountButton.addEventListener('click', openCloudAccountDialog);
  elements.authGateLogin.addEventListener('click', openCloudAccountDialog);
  elements.closeAccountDialog.addEventListener('click', closeCloudAccountDialog);
  elements.copyDesktopAppUrl.addEventListener('click', copyDesktopAppUrl);
  elements.checkMobileUpdate.addEventListener('click', () => void checkMobileUpdatesManually());
  elements.downloadMobileUpdate.addEventListener('click', openNativeInstallerDownload);
  elements.closeSyncDialog.addEventListener('click', closeCloudSyncDialog);
  closeDialogOnBackdrop(elements.accountDialog, closeCloudAccountDialog);
  closeDialogOnBackdrop(elements.syncDialog, closeCloudSyncDialog);
  elements.syncAuthForm.addEventListener('submit', (event) => event.preventDefault());
  elements.toggleSyncPassword?.addEventListener('click', () => {
    setPasswordVisibility(elements.syncPassword, elements.toggleSyncPassword, elements.syncPassword.type === 'password');
  });
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
    void checkNativeInstallerUpdate({ quiet: true });
  });
  window.addEventListener('focus', () => {
    syncCloud({ quiet: true });
    void checkNativeAppUpdate({ quiet: true });
    void checkNativeInstallerUpdate({ quiet: true });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') syncBeforeLeaving();
    if (document.visibilityState === 'visible') {
      syncCloud({ quiet: true });
      void checkNativeAppUpdate({ quiet: true });
    void checkNativeInstallerUpdate({ quiet: true });
    }
  });
  window.addEventListener('pagehide', syncBeforeLeaving);
  elements.closePeriodSummaryDialog.addEventListener('click', closePeriodSummaryDialog);
  elements.closeSearchDialog.addEventListener('click', closeSearchDialog);
  elements.closeEntryDetail.addEventListener('click', closeEntryDetail);
  elements.cancelEntryDetail.addEventListener('click', closeEntryDetail);
  elements.entryDetailForm.addEventListener('submit', (event) => {
    event.preventDefault();
    saveEntryDetail();
  });
  elements.entryDetailMoodToggle.addEventListener('click', () => toggleMetadataPicker('detail', 'mood'));
  elements.entryDetailTagsToggle.addEventListener('click', () => toggleMetadataPicker('detail', 'tags'));
  elements.entryDetailMood.addEventListener('input', () => updateMetadataPicker('detail'));
  elements.clearEntryDetailMood.addEventListener('click', () => {
    elements.entryDetailMood.value = '';
    updateMetadataPicker('detail');
  });
  elements.entryDetailTags.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addTagFromInput(elements.entryDetailTags, elements.entryDetailTagList);
  });
  elements.entryDetailTags.addEventListener('change', () => addTagFromInput(elements.entryDetailTags, elements.entryDetailTagList));
  elements.addEntryDetailTag.addEventListener('click', () => addTagFromInput(elements.entryDetailTags, elements.entryDetailTagList));
  elements.deleteEntryDetail?.addEventListener('click', deleteEntryDetail);
  elements.draftLibraryButton.addEventListener('click', openDraftLibrary);
  elements.closeDraftLibraryDialog.addEventListener('click', closeDraftLibrary);
  elements.clearDraftLibrary.addEventListener('click', clearDraftLibrary);
  closeDialogOnBackdrop(elements.periodSummaryDialog, closePeriodSummaryDialog);
  closeDialogOnBackdrop(elements.searchDialog, closeSearchDialog);
  closeDialogOnBackdrop(elements.entryDetailDialog, closeEntryDetail);
  closeDialogOnBackdrop(elements.draftLibraryDialog, closeDraftLibrary);
  elements.goToday.addEventListener('click', () => {
    state.activeDate = localDateKey();
    state.archiveJumpDate = state.activeDate;
    state.visibleMonth = startOfMonth(new Date());
    render();
  });
  elements.entryTitle.addEventListener('input', scheduleDraftSave);
  elements.entryMoodToggle.addEventListener('click', () => toggleMetadataPicker('entry', 'mood'));
  elements.entryTagsToggle.addEventListener('click', () => toggleMetadataPicker('entry', 'tags'));
  elements.entryMood.addEventListener('input', () => {
    updateMetadataPicker('entry');
    scheduleDraftSave();
  });
  elements.clearEntryMood.addEventListener('click', () => {
    elements.entryMood.value = '';
    updateMetadataPicker('entry');
    scheduleDraftSave();
  });
  elements.entryTags.addEventListener('input', scheduleDraftSave);
  elements.entryTags.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (addTagFromInput(elements.entryTags, elements.entryTagList)) showToast('标签已添加');
  });
  elements.entryTags.addEventListener('change', () => addTagFromInput(elements.entryTags, elements.entryTagList));
  elements.addEntryTag.addEventListener('click', () => {
    if (addTagFromInput(elements.entryTags, elements.entryTagList)) showToast('标签已添加');
  });
  elements.entryContent.addEventListener('input', scheduleDraftSave);
  document.querySelectorAll('.mood-choice').forEach((choice) => choice.addEventListener('click', () => chooseMood(choice.dataset.moodTarget, choice.dataset.moodValue)));
  elements.addAttachment.addEventListener('click', () => elements.attachmentInput.click());
  elements.attachmentInput.addEventListener('change', async (event) => {
    await attachFiles(event.target.files);
    event.target.value = '';
  });
  elements.clearDraft.addEventListener('click', () => {
    clearTimeout(draftTimer);
    elements.entryTitle.value = '';
    elements.entryMood.value = '';
    elements.entryTags.value = '';
    renderTagEditor(elements.entryTagList, []);
    elements.entryContent.value = '';
    state.pastedDraft = null;
    localStorage.removeItem(draftKey());
    updateDraftLibraryButton();
    updateWordCount();
    renderDraftAttachments([]);
    renderEditorAiSuggestion({});
    closeMetadataPickers('entry');
    updateMetadataPicker('entry');
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
  [elements.searchStartDate, elements.searchEndDate, elements.searchTagFilter, elements.searchMoodFilter, elements.searchHasAttachment].forEach((input) => input.addEventListener(input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input', renderSearchResults));
  elements.clearSearchFilters.addEventListener('click', () => {
    elements.searchInput.value = ''; elements.searchStartDate.value = ''; elements.searchEndDate.value = ''; elements.searchTagFilter.value = ''; elements.searchMoodFilter.value = ''; elements.searchHasAttachment.checked = false; renderSearchResults();
  });
  elements.exportButton.addEventListener('click', () => {
    closeQuickToolsDialog();
    exportData();
  });
  elements.importButton?.addEventListener('click', () => elements.importInput.click());
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
  elements.aiInterfaceType.addEventListener('change', () => {
    const provider = elements.aiInterfaceType.value === 'deepseek'
      ? 'deepseek'
      : (elements.aiInterfaceType.value === 'openai' ? 'openai' : 'openai-compatible');
    applyAiProviderPreset(provider);
  });
  elements.aiPlatformPreset.addEventListener('change', () => applyAiProviderPreset(elements.aiPlatformPreset.value));
  elements.openOrganizePromptSettings.addEventListener('click', () => openPromptEditor('organize'));
  elements.openSummaryPromptSettings.addEventListener('click', () => openPromptEditor('summary'));
  elements.aiConfigForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const existing = readAiConfigDraft();
    const provider = selectedAiProvider();
    const preset = AI_PROVIDER_PRESETS[provider] || AI_PROVIDER_PRESETS['openai-compatible'];
    const config = {
      ...existing,
      provider,
      apiStyle: preset.apiStyle,
      endpoint: elements.aiEndpoint.value.trim(),
      model: elements.aiModel.value.trim(),
      updatedAt: new Date().toISOString(),
    };
    const apiKey = elements.aiApiKey.value.trim();
    if (!isAiConfigComplete(config) || !apiKey) {
      showToast('请填写有效的 API 地址、模型名称和 API Key');
      return;
    }
    runtimeAiApiKey = apiKey;
    if (!writeAiConfigDraft(config)) {
      showToast('请先登录账号后再保存模型配置');
      return;
    }
    closeAiConfig();
    void syncCloudAiSettings({ preferLocal: true });
    showToast(`模型配置已保存：${config.model}；会同步到同一账号的其他设备`);
  });
  elements.removeAiConfig.addEventListener('click', () => {
    const existing = readAiConfigDraft();
    const cleared = normalizeAiConfig({
      ...(existing.organizePrompt ? { organizePrompt: existing.organizePrompt } : {}),
      ...(existing.summaryPrompt ? { summaryPrompt: existing.summaryPrompt } : {}),
      provider: 'deepseek', endpoint: '', model: '', updatedAt: new Date().toISOString(),
    });
    runtimeAiApiKey = '';
    writeAiConfigDraft(cleared);
    void syncCloudAiSettings({ preferLocal: true, clearApiKey: true });
    elements.aiConfigForm.reset();
    applyAiProviderPreset('deepseek');
    showToast('模型连接已清除；提示词配置已保留并同步');
  });
}

bindEvents();
render();
void initializeNativeUpdates();
void initializeWritingReminders();
initializeCloudSync();

if ('serviceWorker' in navigator) {
window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js?release=20260825-prompt-workflow'));
}
