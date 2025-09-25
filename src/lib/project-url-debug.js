import settings from '../settings.json';

const ProjectUrlDebugChain = Object.freeze({
    MENU: 'menu',
    QUERY: 'query',
    OTHER: 'other'
});

let cachedDebugFlag;

const normalizeChain = chain => {
    if (!chain) return ProjectUrlDebugChain.OTHER;
    const lower = String(chain).toLowerCase();
    if (lower === ProjectUrlDebugChain.MENU) return ProjectUrlDebugChain.MENU;
    if (lower === ProjectUrlDebugChain.QUERY) return ProjectUrlDebugChain.QUERY;
    return ProjectUrlDebugChain.OTHER;
};

const fallbackStore = {
    [ProjectUrlDebugChain.MENU]: [],
    [ProjectUrlDebugChain.QUERY]: [],
    [ProjectUrlDebugChain.OTHER]: []
};

const ensureStore = () => {
    if (typeof window === 'undefined') {
        return fallbackStore;
    }
    if (!window.__projectUrlDebugLog) {
        window.__projectUrlDebugLog = {
            [ProjectUrlDebugChain.MENU]: [],
            [ProjectUrlDebugChain.QUERY]: [],
            [ProjectUrlDebugChain.OTHER]: []
        };
    }
    return window.__projectUrlDebugLog;
};

const resolveDebugFlagFromSettings = () => {
    try {
        if (Object.prototype.hasOwnProperty.call(settings, 'projectUrlDebugEnabled')) {
            return Boolean(settings.projectUrlDebugEnabled);
        }
    } catch (err) {
        // fall through to default
    }
    return true;
};

const resolveDebugFlag = () => {
    if (typeof cachedDebugFlag !== 'undefined') {
        return cachedDebugFlag;
    }
    cachedDebugFlag = resolveDebugFlagFromSettings();
    return cachedDebugFlag;
};

const isProjectUrlDebugEnabled = () => resolveDebugFlag();

const appendEntry = (chain, entry) => {
    const store = ensureStore();
    store[chain].push(entry);
};

const logProjectUrlDebug = (source, message, payload = {}, chain = ProjectUrlDebugChain.OTHER) => {
    if (!isProjectUrlDebugEnabled()) {
        return;
    }
    const normalizedChain = normalizeChain(chain);
    const timestamp = new Date().toISOString();
    const entry = {timestamp, source, message, payload};
    appendEntry(normalizedChain, entry);
    // eslint-disable-next-line no-console
    console.debug(`[ProjectUrlDebug][${normalizedChain}][${source}] ${message}`, payload);
};

const buildMarkdownLines = () => {
    const store = ensureStore();
    const lines = ['# Project URL Debug Log'];
    const appendSection = (title, chain) => {
        const sectionEntries = store[chain];
        lines.push('', `## ${title}`);
        if (!sectionEntries.length) {
            lines.push('- (no entries)');
            return;
        }
        sectionEntries.forEach(item => {
            const payload = item.payload && Object.keys(item.payload).length ? ` ${JSON.stringify(item.payload)}` : '';
            lines.push(`- [${item.timestamp}] ${item.source}: ${item.message}${payload}`);
        });
    };
    appendSection('Menu "Load from URL" Chain', ProjectUrlDebugChain.MENU);
    appendSection('URL Parameter Auto-load Chain', ProjectUrlDebugChain.QUERY);
    appendSection('Other Entries', ProjectUrlDebugChain.OTHER);
    return lines;
};

const downloadProjectUrlDebugLog = (filename = 'log.md') => {
    if (!isProjectUrlDebugEnabled()) {
        return;
    }
    const lines = buildMarkdownLines();
    const newlineSeparator = String.fromCharCode(10);
    const blob = new Blob([lines.join(newlineSeparator)], {type: 'text/markdown'});
    const url = URL.createObjectURL(blob);
};

const resetProjectUrlDebugLog = () => {
    const store = ensureStore();
    store[ProjectUrlDebugChain.MENU] = [];
    store[ProjectUrlDebugChain.QUERY] = [];
    store[ProjectUrlDebugChain.OTHER] = [];
};

export {
    ProjectUrlDebugChain,
    downloadProjectUrlDebugLog,
    isProjectUrlDebugEnabled,
    logProjectUrlDebug,
    resetProjectUrlDebugLog
};

if (typeof window !== 'undefined') {
    window.downloadProjectUrlDebugLog = downloadProjectUrlDebugLog;
    window.resetProjectUrlDebugLog = resetProjectUrlDebugLog;
    window.getProjectUrlDebugLog = () => ensureStore();
}
