/**
 * Live Search + Search History
 */

const Search = {
  historyKey: 'ai-news-search-history',
  maxHistory: 10,
  debounceMs: 180,
  debounceTimer: null,

  init() {
    this.input = document.getElementById('searchInput');
    this.clearBtn = document.getElementById('clearSearch');
    this.historyBox = document.getElementById('searchHistory');
    this.historyList = document.getElementById('historyList');
    this.stats = document.getElementById('searchStats');
    this.clearHistoryBtn = document.getElementById('clearHistory');

    this.input.addEventListener('input', () => this.onInput());
    this.input.addEventListener('focus', () => this.showHistory());
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.input.blur();
        this.hideHistory();
      }
    });

    this.clearBtn.addEventListener('click', () => this.clear());
    this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());

    // Close history on outside click
    document.addEventListener('click', (e) => {
      if (!this.input.contains(e.target) && !this.historyBox.contains(e.target)) {
        this.hideHistory();
      }
    });
  },

  onInput() {
    const query = this.input.value.trim();
    this.clearBtn.hidden = !query;

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if (query) {
        this.hideHistory();
        this.performSearch(query);
      } else {
        this.stats.hidden = true;
        App.renderFeed(App.allPosts);
      }
    }, this.debounceMs);
  },

  performSearch(query) {
    const q = query.toLowerCase();
    const results = App.allPosts.filter(post => {
      const title = (post.title || '').toLowerCase();
      const text = (post.text || post.content || '').toLowerCase();
      const date = (post.date || '').toLowerCase();
      return title.includes(q) || text.includes(q) || date.includes(q);
    });

    this.addToHistory(query);
    this.showStats(results.length, query);
    App.renderFeed(results, query);
  },

  showStats(count, query) {
    this.stats.hidden = false;
    this.stats.innerHTML = count === 0
      ? `Ничего не найдено по запросу «<strong>${this.escape(query)}</strong>»`
      : `Найдено: <strong>${count}</strong> ${this.pluralize(count)}`;
  },

  pluralize(n) {
    if (n % 10 === 1 && n % 100 !== 11) return 'пост';
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'поста';
    return 'постов';
  },

  // --- History ---
  getHistory() {
    try {
      return JSON.parse(localStorage.getItem(this.historyKey)) || [];
    } catch {
      return [];
    }
  },

  saveHistory(list) {
    localStorage.setItem(this.historyKey, JSON.stringify(list.slice(0, this.maxHistory)));
  },

  addToHistory(query) {
    let list = this.getHistory().filter(q => q.toLowerCase() !== query.toLowerCase());
    list.unshift(query);
    this.saveHistory(list);
  },

  showHistory() {
    const list = this.getHistory();
    if (!list.length || this.input.value.trim()) {
      this.hideHistory();
      return;
    }

    this.historyList.innerHTML = list.map(q => `
      <div class="history-item" data-query="${this.escape(q)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>${this.escape(q)}</span>
      </div>
    `).join('');

    this.historyList.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const q = el.dataset.query;
        this.input.value = q;
        this.clearBtn.hidden = false;
        this.hideHistory();
        this.performSearch(q);
      });
    });

    this.historyBox.hidden = false;
  },

  hideHistory() {
    this.historyBox.hidden = true;
  },

  clearHistory() {
    localStorage.removeItem(this.historyKey);
    this.hideHistory();
    App.toast('История поиска очищена');
  },

  clear() {
    this.input.value = '';
    this.clearBtn.hidden = true;
    this.stats.hidden = true;
    this.hideHistory();
    App.renderFeed(App.allPosts);
    this.input.focus();
  },

  escape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  highlight(text, query) {
    if (!query) return this.escape(text);
    const escaped = this.escape(text);
    const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${q})`, 'gi');
    return escaped.replace(regex, '<mark>$1</mark>');
  }
};
