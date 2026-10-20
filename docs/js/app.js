/**
 * Main App
 */

const App = {
  allPosts: [],
  feedEl: null,
  emptyEl: null,
  loadingEl: null,

  async init() {
    this.feedEl = document.getElementById('feed');
    this.emptyEl = document.getElementById('emptyState');
    this.loadingEl = document.getElementById('loadingState');

    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    Search.init();
    await Notes.init();
    PWA.init();
    Settings.init();

    // Auto-check for updates on launch
    await this.loadFeed(true);
  },

  switchTab(name) {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    document.querySelectorAll('.tab-content').forEach(c => {
      c.classList.toggle('active', c.id === name + 'Tab');
    });
  },

  async loadFeed(isAuto = false) {
    this.loadingEl.hidden = false;
    this.feedEl.innerHTML = '';
    this.emptyEl.hidden = true;

    try {
      // On GitHub Pages /docs is the site root, so data lives at ./data/feed.json
      const res = await fetch('./data/feed.json?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        this.allPosts = Array.isArray(data) ? data : (data.posts || []);
      } else {
        throw new Error('No feed');
      }
    } catch (e) {
      console.warn('Feed load failed, using demo', e);
      this.allPosts = this.getDemoPosts();
    }

    this.loadingEl.hidden = true;
    this.renderFeed(this.allPosts);

    if (!isAuto) {
      this.toast('Лента обновлена');
    }
  },

  async refreshFeed() {
    this.toast('Обновляю…');
    await this.loadFeed(false);
  },

  renderFeed(posts, highlightQuery = '') {
    this.emptyEl.hidden = posts.length > 0;
    this.feedEl.innerHTML = '';

    posts.forEach(post => {
      const card = this.createPostCard(post, highlightQuery);
      this.feedEl.appendChild(card);
    });
  },

  createPostCard(post, query = '') {
    const card = document.createElement('article');
    card.className = 'post-card';

    const date = post.date || post.createdAt || '';
    const title = Search.highlight(post.title || 'Без названия', query);
    let text = post.text || post.content || post.excerpt || post.lead || '';
    const fullText = text;
    const isLong = text.length > 320;
    if (isLong) text = text.slice(0, 320) + '…';

    const highlightedText = Search.highlight(text, query);

    let imageHtml = '';
    if (post.image) {
      imageHtml = `<img class="post-image" src="${post.image}" alt="" loading="lazy" />`;
    }

    card.innerHTML = `
      ${imageHtml}
      <div class="post-body">
        <div class="post-meta">
          <span class="post-date">${this.formatDate(date)}</span>
        </div>
        <h2 class="post-title">${title}</h2>
        <div class="post-text ${isLong ? 'clamped' : ''}">${highlightedText.replace(/\n/g, '<br>')}</div>
        ${isLong ? '<span class="read-more">Читать полностью</span>' : ''}
        <div class="post-footer">
          <div class="post-author">
            Александр · 
            <a href="https://vk.com/smolyAninovchef" target="_blank" rel="noopener">ВК</a> · 
            <a href="https://dzen.ru/asv_prod" target="_blank" rel="noopener">Дзен</a> · 
            <a href="https://t.me/asv_prod" target="_blank" rel="noopener">TG</a>
          </div>
          <button class="post-share" title="Поделиться" aria-label="Поделиться">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    const readMore = card.querySelector('.read-more');
    if (readMore) {
      readMore.addEventListener('click', () => {
        const textEl = card.querySelector('.post-text');
        textEl.classList.remove('clamped');
        textEl.innerHTML = Search.highlight(fullText, query).replace(/\n/g, '<br>');
        readMore.remove();
      });
    }

    card.querySelector('.post-share').addEventListener('click', () => {
      PWA.share(post);
    });

    return card;
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  },

  toast(message, duration = 2400) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.hidden = false;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      el.hidden = true;
    }, duration);
  },

  getDemoPosts() {
    return [
      {
        id: 'demo-1',
        date: '2026-10-19',
        title: 'OpenAI представила новую модель с улучшенным рассуждением',
        text: 'Компания OpenAI анонсировала следующее поколение моделей, которые значительно лучше справляются с многошаговыми задачами и логическим рассуждением.\n\nПо заявлениям разработчиков, новая архитектура позволяет модели дольше «думать» перед ответом, что особенно полезно в научных и инженерных задачах.\n\nЭксперты отмечают, что это может стать важным шагом к более надёжным AI-ассистентам.',
        image: null
      },
      {
        id: 'demo-2',
        date: '2026-10-18',
        title: 'Китайские исследователи показали эффективный метод сжатия нейросетей',
        text: 'Учёные из нескольких китайских университетов опубликовали работу о новом подходе к квантизации больших языковых моделей.\n\nМетод позволяет уменьшить размер модели почти в 4 раза при минимальной потере качества. Это делает мощные модели доступнее для запуска на обычных устройствах.',
        image: null
      },
      {
        id: 'demo-3',
        date: '2026-10-17',
        title: 'Google углубляет интеграцию Gemini в Android',
        text: 'На конференции для разработчиков Google показала новые возможности Gemini, встроенные прямо в операционную систему Android.\n\nТеперь ассистент может выполнять сложные действия между приложениями и лучше понимать контекст пользователя.',
        image: null
      }
    ];
  }
};

// Start
document.addEventListener('DOMContentLoaded', () => App.init());
