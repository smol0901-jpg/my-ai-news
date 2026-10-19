/**
 * PWA: Install + Share + Service Worker
 */

const PWA = {
  deferredPrompt: null,

  init() {
    this.installBtn = document.getElementById('installBtn');
    this.shareBtn = document.getElementById('shareBtn');

    // Install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.installBtn.hidden = false;
    });

    this.installBtn.addEventListener('click', async () => {
      if (!this.deferredPrompt) return;
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        App.toast('Приложение установлено');
      }
      this.deferredPrompt = null;
      this.installBtn.hidden = true;
    });

    window.addEventListener('appinstalled', () => {
      this.installBtn.hidden = true;
      this.deferredPrompt = null;
    });

    // Share
    this.shareBtn.addEventListener('click', () => this.share());

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(console.warn);
    }
  },

  async share(post = null) {
    const data = post ? {
      title: post.title,
      text: post.title + '\n\n' + (post.text || '').slice(0, 200),
      url: window.location.href
    } : {
      title: 'AI News — Лента об ИИ и нейросетях',
      text: 'Актуальные новости об искусственном интеллекте и нейросетях',
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          this.fallbackShare(data.url);
        }
      }
    } else {
      this.fallbackShare(data.url);
    }
  },

  fallbackShare(url) {
    navigator.clipboard.writeText(url).then(() => {
      App.toast('Ссылка скопирована');
    }).catch(() => {
      App.toast('Не удалось поделиться');
    });
  }
};
