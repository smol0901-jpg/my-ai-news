/**
 * Settings: theme, contrast, reading mode
 */

const Settings = {
  storageKey: 'ai-news-settings',

  defaults: {
    theme: 'dark',
    contrast: false,
    reading: false
  },

  init() {
    this.load();
    this.apply();

    // Theme buttons
    document.querySelectorAll('[data-theme]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.set('theme', btn.dataset.theme);
        document.querySelectorAll('[data-theme]').forEach(b => b.classList.toggle('active', b.dataset.theme === this.current.theme));
      });
    });

    // Contrast
    const contrastToggle = document.getElementById('contrastToggle');
    contrastToggle.checked = this.current.contrast;
    contrastToggle.addEventListener('change', () => {
      this.set('contrast', contrastToggle.checked);
    });

    // Reading mode
    const readingToggle = document.getElementById('readingToggle');
    readingToggle.checked = this.current.reading;
    readingToggle.addEventListener('change', () => {
      this.set('reading', readingToggle.checked);
    });

    // Refresh buttons
    document.getElementById('refreshBtn')?.addEventListener('click', () => App.refreshFeed());
    document.getElementById('settingsRefreshBtn')?.addEventListener('click', () => App.refreshFeed());

    // Sync theme buttons state
    document.querySelectorAll('[data-theme]').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === this.current.theme);
    });
  },

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.storageKey));
      this.current = { ...this.defaults, ...saved };
    } catch {
      this.current = { ...this.defaults };
    }
  },

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.current));
  },

  set(key, value) {
    this.current[key] = value;
    this.save();
    this.apply();
  },

  apply() {
    const root = document.documentElement;

    // Theme
    root.setAttribute('data-theme', this.current.theme);

    // Contrast
    root.classList.toggle('high-contrast', this.current.contrast);

    // Reading mode
    root.classList.toggle('reading-mode', this.current.reading);

    // Update theme-color meta
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.content = this.current.theme === 'light' ? '#f6f8fa' : '#0f1117';
    }
  }
};
