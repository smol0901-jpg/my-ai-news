/**
 * Local Notes with IndexedDB
 */

const Notes = {
  dbName: 'ai-news-notes',
  storeName: 'notes',
  db: null,
  currentId: null,

  async init() {
    this.listEl = document.getElementById('notesList');
    this.emptyEl = document.getElementById('notesEmpty');
    this.modal = document.getElementById('noteModal');
    this.modalTitle = document.getElementById('modalTitle');
    this.titleInput = document.getElementById('noteTitle');
    this.bodyInput = document.getElementById('noteBody');
    this.saveBtn = document.getElementById('saveNoteBtn');
    this.deleteBtn = document.getElementById('deleteNoteBtn');
    this.cancelBtn = document.getElementById('cancelNoteBtn');
    this.closeBtn = document.getElementById('closeModal');
    this.addBtn = document.getElementById('addNoteBtn');

    await this.openDB();
    await this.render();

    this.addBtn.addEventListener('click', () => this.openModal());
    this.saveBtn.addEventListener('click', () => this.save());
    this.deleteBtn.addEventListener('click', () => this.remove());
    this.cancelBtn.addEventListener('click', () => this.closeModal());
    this.closeBtn.addEventListener('click', () => this.closeModal());
    this.modal.querySelector('.modal-backdrop').addEventListener('click', () => this.closeModal());
  },

  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  },

  getAll() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();
      request.onsuccess = () => {
        const notes = request.result.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(notes);
      };
      request.onerror = () => reject(request.error);
    });
  },

  put(note) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.put(note);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  delete(id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async render() {
    const notes = await this.getAll();
    this.emptyEl.hidden = notes.length > 0;
    this.listEl.innerHTML = notes.map(note => `
      <div class="note-card" data-id="${note.id}">
        <div class="note-card-title">${this.escape(note.title || 'Без названия')}</div>
        <div class="note-card-preview">${this.escape(note.body || '')}</div>
        <div class="note-card-date">${this.formatDate(note.updatedAt)}</div>
      </div>
    `).join('');

    this.listEl.querySelectorAll('.note-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = Number(card.dataset.id);
        this.openModal(id);
      });
    });
  },

  async openModal(id = null) {
    this.currentId = id;
    this.deleteBtn.hidden = !id;

    if (id) {
      const notes = await this.getAll();
      const note = notes.find(n => n.id === id);
      if (!note) return;
      this.modalTitle.textContent = 'Редактировать заметку';
      this.titleInput.value = note.title || '';
      this.bodyInput.value = note.body || '';
    } else {
      this.modalTitle.textContent = 'Новая заметка';
      this.titleInput.value = '';
      this.bodyInput.value = '';
    }

    this.modal.hidden = false;
    this.titleInput.focus();
  },

  closeModal() {
    this.modal.hidden = true;
    this.currentId = null;
  },

  async save() {
    const title = this.titleInput.value.trim();
    const body = this.bodyInput.value.trim();

    if (!title && !body) {
      App.toast('Заметка пустая');
      return;
    }

    const note = {
      title,
      body,
      updatedAt: Date.now()
    };

    if (this.currentId) {
      note.id = this.currentId;
    }

    await this.put(note);
    this.closeModal();
    await this.render();
    App.toast(this.currentId ? 'Заметка обновлена' : 'Заметка сохранена');
  },

  async remove() {
    if (!this.currentId) return;
    if (!confirm('Удалить заметку?')) return;
    await this.delete(this.currentId);
    this.closeModal();
    await this.render();
    App.toast('Заметка удалена');
  },

  formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  escape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};
