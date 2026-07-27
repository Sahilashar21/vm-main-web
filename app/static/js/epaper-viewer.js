/* ══════════════════════════════════════════════════
   Vidyarthi Mitra E-Paper Viewer JS
   ══════════════════════════════════════════════════ */

const EP = {
  // State
  currentDate: null,
  currentPage: 1,
  totalPages: 1,
  zoom: 1,
  minZoom: 0.5,
  maxZoom: 3,
  isDragging: false,
  dragStart: { x: 0, y: 0 },
  panOffset: { x: 0, y: 0 },
  editions: [],
  pages: [],
  articles: [],
  currentEdition: null,
  ttsUtterance: null,
  ttsPlaying: false,

  // DOM refs
  el: {},

  init() {
    this.cacheDOM();
    this.bindEvents();
    this.setDate(new Date());
<<<<<<< HEAD
    this.loadEditions();
  },

  // Optimize Cloudinary image URLs: auto format, auto quality, resize width
  optimizeCloudinaryUrl(url, width = 600) {
=======
    // Load editions list in background (for calendar) - don't await
    this.loadEditions();
  },

  // API response cache (5-minute TTL)
  _apiCache: {},
  _cacheTTL: 5 * 60 * 1000,
  async _cachedFetch(url) {
    const now = Date.now();
    const cached = this._apiCache[url];
    if (cached && (now - cached.ts) < this._cacheTTL) {
      return cached.data;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    this._apiCache[url] = { data, ts: now };
    return data;
  },

  // Optimize Cloudinary image URLs: auto format, auto quality, resize width
  optimizeCloudinaryUrl(url, width = 400) {
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
    if (!url || typeof url !== 'string') return url;
    // Only transform Cloudinary URLs (res.cloudinary.com)
    if (!url.includes('res.cloudinary.com')) return url;
    // Avoid double-transforming (if /upload/f_auto already present)
    if (url.includes('/f_auto')) return url;
<<<<<<< HEAD
    // Insert transforms after /upload/
=======
    // Insert transforms after /upload/ — f_auto picks WebP/AVIF, q_auto adjusts quality
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
  },

  cacheDOM() {
    this.el = {
      header: document.getElementById('epHeader'),
      collapseBtn: document.getElementById('epCollapseBtn'),
      nav: document.getElementById('epNav'),
      navList: document.getElementById('epNavList'),
      main: document.getElementById('epMain'),
      viewer: document.getElementById('epViewer'),
      pageContainer: document.getElementById('epPageContainer'),
      pageImg: document.getElementById('epPageImg'),
      hotspotsLayer: document.getElementById('epHotspots'),
      editionName: document.getElementById('epEditionName'),
      editionMeta: document.getElementById('epEditionMeta'),
      dateBtn: document.getElementById('epDateBtn'),
      dateBtnText: document.getElementById('epDateText'),
      calendarOverlay: document.getElementById('epCalendarOverlay'),
      calGrid: document.getElementById('epCalGrid'),
      calTitle: document.getElementById('epCalTitle'),
      prevPage: document.getElementById('epPrevPage'),
      nextPage: document.getElementById('epNextPage'),
      pageInfo: document.getElementById('epPageInfo'),
      zoomIn: document.getElementById('epZoomIn'),
      zoomOut: document.getElementById('epZoomOut'),
      fitPage: document.getElementById('epFitPage'),
      fullscreen: document.getElementById('epFullscreen'),
      articlePanel: document.getElementById('epArticlePanel'),
      articleCategory: document.getElementById('epArtCategory'),
      articleTitle: document.getElementById('epArtTitle'),
      articleDate: document.getElementById('epArtDate'),
      articleImg: document.getElementById('epArtImg'),
      articleText: document.getElementById('epArtText'),
      articleBack: document.getElementById('epArtBack'),
      aiTabs: document.querySelectorAll('.ep-ai-tab'),
      aiContents: document.querySelectorAll('.ep-ai-content'),
      // Voice bar elements
      voiceBar: document.getElementById('epVoiceBar'),
      voicePlayBtn: document.getElementById('epVoicePlayBtn'),
      voicePlayIcon: document.getElementById('epVoicePlayIcon'),
      voiceProgressBg: document.getElementById('epVoiceProgressBg'),
      voiceProgressFill: document.getElementById('epVoiceProgressFill'),
      voiceElapsed: document.getElementById('epVoiceElapsed'),
      voiceRemaining: document.getElementById('epVoiceRemaining'),
      voiceTitle: document.getElementById('epVoiceTitle'),
      voiceSpeedBtn: document.getElementById('epVoiceSpeedBtn'),
      voiceCloseBtn: document.getElementById('epVoiceCloseBtn'),
      voiceBack: document.getElementById('epVoiceBack'),
      voiceForward: document.getElementById('epVoiceForward'),
<<<<<<< HEAD
=======
      voiceDuration: document.getElementById('epVoiceDuration'),
      voiceVolBtn: document.getElementById('epVoiceVolBtn'),
      artBackFromPlayer: document.getElementById('epArtBackFromPlayer'),
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
      voiceSelect: document.getElementById('epVoiceSelect'),
      ttsStartBtn: document.getElementById('epTtsStartBtn'),
      ttsEstimate: document.getElementById('epTtsEstimate'),
      ttsPrompt: document.getElementById('epTtsPrompt'),
      readingTime: document.getElementById('epReadingTime'),
      readTimeText: document.getElementById('epReadTimeText'),
      translateSelect: document.getElementById('epTranslateSelect'),
      translateOutput: document.getElementById('epTranslateOutput'),
      summaryOutput: document.getElementById('epSummaryOutput'),
      toast: document.getElementById('epToast'),
<<<<<<< HEAD
=======
      // Thumbnail strip
      thumbStrip: document.getElementById('epThumbStrip'),
      thumbScroll: document.getElementById('epThumbScroll'),
      thumbToggle: document.getElementById('epThumbToggle'),
      thumbLeft: document.getElementById('epThumbLeft'),
      thumbRight: document.getElementById('epThumbRight'),
      // Edge arrows
      edgePrev: document.getElementById('epEdgePrev'),
      edgeNext: document.getElementById('epEdgeNext'),
      // Scroll buttons
      scrollUp: document.getElementById('epScrollUp'),
      scrollDown: document.getElementById('epScrollDown'),
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
    };
  },

  bindEvents() {
    // Header collapse
    this.el.collapseBtn?.addEventListener('click', () => this.toggleHeader());

    // Date picker
    this.el.dateBtn?.addEventListener('click', () => this.toggleCalendar());
    this.el.calendarOverlay?.addEventListener('click', (e) => {
      if (e.target === this.el.calendarOverlay) this.toggleCalendar(false);
    });

    // Page nav
    this.el.prevPage?.addEventListener('click', () => this.changePage(-1));
    this.el.nextPage?.addEventListener('click', () => this.changePage(1));

<<<<<<< HEAD
=======
    // Edge page arrows
    this.el.edgePrev?.addEventListener('click', () => this.changePage(-1));
    this.el.edgeNext?.addEventListener('click', () => this.changePage(1));

>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
    // Zoom
    this.el.zoomIn?.addEventListener('click', () => this.setZoom(this.zoom + 0.25));
    this.el.zoomOut?.addEventListener('click', () => this.setZoom(this.zoom - 0.25));
    this.el.fitPage?.addEventListener('click', () => this.setZoom(1));
    this.el.fullscreen?.addEventListener('click', () => this.toggleFullscreen());

<<<<<<< HEAD
    // Viewer pan/drag
    const v = this.el.viewer;
    if (v) {
      v.addEventListener('mousedown', (e) => this.startDrag(e));
      v.addEventListener('mousemove', (e) => this.onDrag(e));
      v.addEventListener('mouseup', () => this.endDrag());
      v.addEventListener('mouseleave', () => this.endDrag());
      v.addEventListener('wheel', (e) => { e.preventDefault(); this.setZoom(this.zoom + (e.deltaY < 0 ? 0.15 : -0.15)); }, { passive: false });
      v.addEventListener('touchstart', (e) => this.startDrag(e.touches[0]), { passive: true });
      v.addEventListener('touchmove', (e) => { e.preventDefault(); this.onDrag(e.touches[0]); }, { passive: false });
      v.addEventListener('touchend', () => this.endDrag());
=======
    // Scroll buttons
    this.el.scrollUp?.addEventListener('click', () => {
      const viewer = this.el.viewer;
      if (viewer) viewer.scrollBy({ top: -300, behavior: 'smooth' });
    });
    this.el.scrollDown?.addEventListener('click', () => {
      const viewer = this.el.viewer;
      if (viewer) viewer.scrollBy({ top: 300, behavior: 'smooth' });
    });

    // Thumbnail strip
    this.el.thumbToggle?.addEventListener('click', () => this.toggleThumbStrip());
    this.el.thumbLeft?.addEventListener('click', () => {
      this.el.thumbScroll?.scrollBy({ left: -200, behavior: 'smooth' });
    });
    this.el.thumbRight?.addEventListener('click', () => {
      this.el.thumbScroll?.scrollBy({ left: 200, behavior: 'smooth' });
    });

    // Fullscreen change listener
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        document.body.classList.remove('ep-fullscreen');
      }
    });

    // Viewer wheel zoom
    const v = this.el.viewer;
    if (v) {
      v.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
          e.preventDefault();
          this.setZoom(this.zoom + (e.deltaY < 0 ? 0.15 : -0.15));
        }
      }, { passive: false });
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
    }

    // Article panel back
    this.el.articleBack?.addEventListener('click', () => this.closeArticle());

    // AI tabs
    this.el.aiTabs?.forEach(tab => {
      tab.addEventListener('click', () => this.switchAiTab(tab.dataset.tab));
    });

<<<<<<< HEAD
    // TTS / Voice Player
    this.el.ttsStartBtn?.addEventListener('click', () => this.voicePlay());
=======
 // TTS / Voice Player
    this.el.ttsStartBtn?.addEventListener('click', () => this.voicePlay());
    this.el.voiceVolBtn?.addEventListener('click', () => this.voiceToggleMute());
    this.el.artBackFromPlayer?.addEventListener('click', () => this.closeArticle());
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
    this.el.voicePlayBtn?.addEventListener('click', () => this.voiceToggle());
    this.el.voiceSpeedBtn?.addEventListener('click', () => this.voiceCycleSpeed());
    this.el.voiceCloseBtn?.addEventListener('click', () => this.voiceStop());
    this.el.voiceBack?.addEventListener('click', () => this.voiceSkip(-10));
    this.el.voiceForward?.addEventListener('click', () => this.voiceSkip(10));

    // Seekable progress bar — click to jump
    this.el.voiceProgressBg?.addEventListener('click', (e) => {
      const audio = this._voice.audio;
      if (!audio || !audio.duration) return;
      const rect = this.el.voiceProgressBg.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audio.currentTime = pct * audio.duration;
      this._voiceUpdateUI();
    });

<<<<<<< HEAD
    // Voice selector — update selected voice
=======
    // Voice selector
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
    this.el.voiceSelect?.addEventListener('change', () => {
      this._voice.selectedVoice = this.el.voiceSelect.value;
    });

    // Translate
    this.el.translateSelect?.addEventListener('change', () => this.translateArticle());

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.changePage(-1);
      if (e.key === 'ArrowRight') this.changePage(1);
      if (e.key === 'Escape') this.closeArticle();
      if (e.key === '+' || e.key === '=') this.setZoom(this.zoom + 0.25);
      if (e.key === '-') this.setZoom(this.zoom - 0.25);
    });

    // Category nav scroll
    document.getElementById('epNavLeft')?.addEventListener('click', () => {
      this.el.navList.scrollBy({ left: -200, behavior: 'smooth' });
    });
    document.getElementById('epNavRight')?.addEventListener('click', () => {
      this.el.navList.scrollBy({ left: 200, behavior: 'smooth' });
    });

    // Calendar nav
    document.getElementById('epCalPrev')?.addEventListener('click', () => this.calendarNav(-1));
    document.getElementById('epCalNext')?.addEventListener('click', () => this.calendarNav(1));
  },

  // ── Header ──
  toggleHeader() {
    const hidden = this.el.header.classList.toggle('collapsed');
    this.el.collapseBtn.classList.toggle('header-hidden', hidden);
    this.el.nav.classList.toggle('header-hidden', hidden);
    this.el.main.classList.toggle('header-hidden', hidden);
    this.el.collapseBtn.innerHTML = hidden
      ? '<i class="fa fa-chevron-down"></i>'
      : '<i class="fa fa-chevron-up"></i>';
  },

  // ── Date ──
  setDate(d) {
    this.currentDate = d;
    const opts = { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' };
    if (this.el.dateBtnText) {
      this.el.dateBtnText.textContent = d.toLocaleDateString('hi-IN', opts);
    }
    this.currentPage = 1;
<<<<<<< HEAD
=======
    // Clear API cache when switching dates so fresh data loads
    const iso = this.formatDateISO(d);
    delete this._apiCache[`/api/epaper/edition/${iso}`];
    delete this._apiCache['/api/epaper/editions'];
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
    this.loadEditionForDate(d);
  },

  updateEditionBrand(edition = null) {
    const name = edition?.name?.trim() || 'e-Paper';
    const language = edition?.language?.trim() || 'Vidyarthi Mitra';
    const dateText = edition?.date ? edition.date : '';

    if (this.el.editionName) this.el.editionName.textContent = name;
    if (this.el.editionMeta) {
      this.el.editionMeta.textContent = dateText ? `${language} • ${dateText}` : language;
    }
    document.title = edition?.name?.trim()
      ? `${edition.name} | Vidyarthi Mitra E-Paper`
      : 'Vidyarthi Mitra — E-Paper Reader';
  },

  formatDateISO(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  // ── Calendar ──
  calendarMonth: null,
  calendarYear: null,

  toggleCalendar(show) {
    const overlay = this.el.calendarOverlay;
    if (!overlay) return;
    const isOpen = overlay.classList.contains('open');
    if (show === false || (show === undefined && isOpen)) {
      overlay.classList.remove('open');
    } else {
      this.calendarMonth = this.currentDate.getMonth();
      this.calendarYear = this.currentDate.getFullYear();
      this.renderCalendar();
      overlay.classList.add('open');
    }
  },

  calendarNav(dir) {
    this.calendarMonth += dir;
    if (this.calendarMonth < 0) { this.calendarMonth = 11; this.calendarYear--; }
    if (this.calendarMonth > 11) { this.calendarMonth = 0; this.calendarYear++; }
    this.renderCalendar();
  },

  renderCalendar() {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    if (this.el.calTitle) this.el.calTitle.textContent = `${months[this.calendarMonth]} ${this.calendarYear}`;

    const grid = this.el.calGrid;
    if (!grid) return;
    grid.innerHTML = '';

    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    dayNames.forEach(d => {
      const el = document.createElement('div');
      el.className = 'ep-cal-day-name';
      el.textContent = d;
      grid.appendChild(el);
    });

    const firstDay = new Date(this.calendarYear, this.calendarMonth, 1).getDay();
    const daysInMonth = new Date(this.calendarYear, this.calendarMonth + 1, 0).getDate();
    const today = new Date();

    for (let i = 0; i < firstDay; i++) {
      const el = document.createElement('div');
      grid.appendChild(el);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const el = document.createElement('div');
      el.className = 'ep-cal-day';
      el.textContent = day;

      const d = new Date(this.calendarYear, this.calendarMonth, day);
      if (d > today) el.classList.add('disabled');
      if (d.toDateString() === today.toDateString()) el.classList.add('today');
      if (d.toDateString() === this.currentDate.toDateString()) el.classList.add('selected');

      // Check if edition exists
      const iso = this.formatDateISO(d);
      if (this.editions.some(e => e.date === iso)) el.classList.add('has-edition');

      if (!el.classList.contains('disabled')) {
        el.addEventListener('click', () => {
          this.setDate(new Date(this.calendarYear, this.calendarMonth, day));
          this.toggleCalendar(false);
        });
      }
      grid.appendChild(el);
    }
  },

  // ── Data Loading ──
  async loadEditions() {
    try {
<<<<<<< HEAD
      const res = await fetch('/api/epaper/editions');
      if (res.ok) {
        const data = await res.json();
        this.editions = Array.isArray(data) ? data : (data.editions || data.results || []);
      }
=======
      const data = await this._cachedFetch('/api/epaper/editions');
      this.editions = Array.isArray(data) ? data : (data.editions || data.results || []);
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
    } catch (e) { console.warn('Could not load editions:', e); }
  },

  async loadEditionForDate(d) {
    const iso = this.formatDateISO(d);
<<<<<<< HEAD
    try {
      const res = await fetch(`/api/epaper/edition/${iso}`);
      if (!res.ok) {
        this.showDemoPage();
        return;
      }
      const data = await res.json();
=======

    // Show loading skeleton immediately
    this.showLoadingSkeleton();

    try {
      const data = await this._cachedFetch(`/api/epaper/edition/${iso}`);
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
      this.currentEdition = data;
      this.pages = data.pages || [];
      this.totalPages = this.pages.length || 1;
      this.updateEditionBrand(data);
      document.getElementById('epEmptyState')?.style.setProperty('display', 'none');
      this.renderCategories(this.pages);
<<<<<<< HEAD
=======
      this.renderThumbnails();
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
      this.showPage(1);
    } catch (e) {
      console.warn('Edition load error:', e);
      this.showDemoPage();
    }
  },

<<<<<<< HEAD
=======
  showLoadingSkeleton() {
    const viewer = this.el.viewer || document.getElementById('epViewer');
    if (!viewer) return;

    // Remove existing block grid to show skeleton
    let grid = document.getElementById('epBlockGrid');
    if (!grid) {
      grid = document.createElement('div');
      grid.id = 'epBlockGrid';
      grid.className = 'ep-block-grid';
      viewer.appendChild(grid);
    }
    grid.style.display = 'block';
    if (this.el.pageContainer) this.el.pageContainer.style.display = 'none';

    grid.innerHTML = `
      <div class="ep-canvas-viewer" style="position:relative;width:100%;padding-bottom:141.25%;">
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
          <div style="text-align:center;">
            <div style="width:48px;height:48px;border:3px solid #e0e0e0;border-top:3px solid #e41e26;border-radius:50%;animation:epSpin .8s linear infinite;margin:0 auto 16px;"></div>
            <p style="color:#6b7280;font-size:14px;font-weight:500;">Loading edition...</p>
          </div>
        </div>
      </div>
    `;
  },

>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
  showDemoPage() {
    // Show a placeholder when no real data
    this.currentEdition = null;
    this.totalPages = 1;
    this.pages = [];
    this.updateEditionBrand(null);
    if (this.el.pageImg) {
      this.el.pageImg.src = '';
      this.el.pageImg.alt = 'No edition available';
    }
    if (this.el.hotspotsLayer) this.el.hotspotsLayer.innerHTML = '';
    const grid = document.getElementById('epBlockGrid');
    if (grid) grid.style.display = 'none';
    if (this.el.pageContainer) this.el.pageContainer.style.display = 'none';
    document.getElementById('epEmptyState')?.style.setProperty('display', 'block');
    this.updatePager();
    this.showToast('इस तारीख का संस्करण उपलब्ध नहीं है');
  },

  // ── Categories ──
  renderCategories(pages) {
    if (!this.el.navList) return;
    const cats = ['मुख पृष्ठ'];
    pages.forEach(p => {
      if (p.category && !cats.includes(p.category)) cats.push(p.category);
    });

    this.el.navList.innerHTML = cats.map((c, i) =>
      `<a class="ep-nav-item ${i === 0 ? 'active' : ''}" data-cat="${c}" data-page="${i + 1}">${c}</a>`
    ).join('');

    this.el.navList.querySelectorAll('.ep-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        this.el.navList.querySelectorAll('.ep-nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        const pg = parseInt(item.dataset.page) || 1;
        this.showPage(pg);
      });
    });
  },

  // ── Page Display ──
  showPage(num) {
    this.currentPage = Math.max(1, Math.min(num, this.totalPages));
    this.setZoom(1);
    this.panOffset = { x: 0, y: 0 };
    this.applyTransform();
    this.updatePager();

<<<<<<< HEAD
    const page = this.pages[this.currentPage - 1];
=======
     const page = this.pages[this.currentPage - 1];
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
    if (!page) return;

    const viewer = this.el.viewer || document.getElementById('epViewer');
    document.getElementById('epEmptyState')?.style.setProperty('display', 'none');

    // Check if page uses new block format
    if (page.blocks && page.blocks.length > 0) {
      // Hide legacy elements
      if (this.el.pageContainer) this.el.pageContainer.style.display = 'none';
      this.renderBlockGrid(page.blocks, viewer);
    } else if (page.page_image_url) {
      // Legacy: single image with hotspots
      if (this.el.pageContainer) this.el.pageContainer.style.display = '';
      if (this.el.pageImg) {
        this.el.pageImg.style.display = 'block';
        this.el.pageImg.src = page.page_image_url;
      }
      if (this.el.hotspotsLayer) this.el.hotspotsLayer.style.display = 'block';
      this.renderHotspots(page.articles || []);
      const grid = document.getElementById('epBlockGrid');
      if (grid) grid.style.display = 'none';
    }
<<<<<<< HEAD
=======

    // Scroll viewer to top when switching pages
    if (this.el.viewer) this.el.viewer.scrollTop = 0;

    // Update thumbnail active state
    this.updateThumbActive();
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
  },

  changePage(dir) {
    this.showPage(this.currentPage + dir);
  },

  updatePager() {
    if (this.el.pageInfo) this.el.pageInfo.textContent = `${this.currentPage} / ${this.totalPages}`;
    if (this.el.prevPage) this.el.prevPage.disabled = this.currentPage <= 1;
    if (this.el.nextPage) this.el.nextPage.disabled = this.currentPage >= this.totalPages;
<<<<<<< HEAD
=======
    // Update edge arrows
    if (this.el.edgePrev) this.el.edgePrev.disabled = this.currentPage <= 1;
    if (this.el.edgeNext) this.el.edgeNext.disabled = this.currentPage >= this.totalPages;
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
  },

  getBlockType(block) {
    return block?.type === 'divider' ? 'divider' : 'article';
  },

  buildDividerMarkup(block) {
    const orientation = block?.divider_orientation === 'vertical' ? 'vertical' : 'horizontal';
    const thickness = Math.max(1, parseInt(block?.divider_thickness, 10) || 6);
    const color = block?.divider_color || '#e41e26';
    const style = block?.divider_style || 'solid';

    const lineStyle = orientation === 'vertical'
      ? `height:100%;border-left:${thickness}px ${style} ${color};`
      : `width:100%;border-top:${thickness}px ${style} ${color};`;

    return `
      <div class="ep-block-divider ${orientation}">
        <div class="ep-divider-line-preview ${orientation}" style="${lineStyle}"></div>
      </div>
    `;
  },

  // ── Block Grid (NEW) ──
  renderBlockGrid(blocks, viewer) {
    let grid = document.getElementById('epBlockGrid');
    if (!grid) {
      grid = document.createElement('div');
      grid.id = 'epBlockGrid';
      grid.className = 'ep-block-grid';
      (viewer || document.getElementById('epViewer'))?.appendChild(grid);
    }
    grid.style.display = 'block';
    if (this.el.hotspotsLayer) this.el.hotspotsLayer.style.display = 'none';

    this.articles = [];

<<<<<<< HEAD
    // Canvas is 800x1000 in admin — use percentage-based positioning
=======
    // Canvas is 800×1130 in admin — use percentage-based positioning
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
    const CANVAS_W = 800;
    let maxY = 400;
    blocks.forEach((block) => {
      const bottom = (block.y || 0) + (block.h || 150);
      if (bottom > maxY) maxY = bottom;
    });
<<<<<<< HEAD
    const canvasH = Math.max(maxY + 20, 500);
=======
    const canvasH = Math.max(maxY + 20, 1130);
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
    const aspectRatio = (canvasH / CANVAS_W * 100).toFixed(2);

    grid.innerHTML = `
      <div class="ep-canvas-viewer" style="position:relative;width:100%;padding-bottom:${aspectRatio}%;">
        ${blocks.map((block) => {
          const type = this.getBlockType(block);
          const hasImg = block.image_url && block.image_url.length > 10;
          const x = ((block.x || 0) / CANVAS_W * 100).toFixed(2);
          const y = ((block.y || 0) / canvasH * 100).toFixed(2);
          const w = ((block.w || 200) / CANVAS_W * 100).toFixed(2);
          const h = ((block.h || 150) / canvasH * 100).toFixed(2);
          const bw = block.border_width ?? 0;
          const br = block.border_radius ?? 10;
          const bc = block.border_color || '#e41e26';
          const bs = block.border_style || 'solid';
          const borderCSS = type === 'article' && bw > 0 ? `border:${bw}px ${bs} ${bc};` : '';
          const baseStyle = `position:absolute;left:${x}%;top:${y}%;width:${w}%;height:${h}%;border-radius:${br}px;${borderCSS}overflow:hidden;`;

          if (type === 'divider') {
            return `
              <div class="ep-block-divider-card" style="${baseStyle}">
                ${this.buildDividerMarkup(block)}
              </div>
            `;
          }

          const articleIndex = this.articles.push({
            ...block,
            headline: block.headline,
            sub_headline: block.sub_headline,
            body_text: block.body_text,
            body_html: block.body_html || '',
            category_label: block.category_label,
            article_image_url: block.image_url,
            gallery: block.gallery || [],
          }) - 1;

<<<<<<< HEAD
          // Optimize Cloudinary images: add auto format/quality and width transform
          const imgSrc = hasImg ? this.optimizeCloudinaryUrl(block.image_url, 600) : '';
=======
          // Optimize Cloudinary images: smaller width for card thumbnails
          const imgSrc = hasImg ? this.optimizeCloudinaryUrl(block.image_url, 400) : '';
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a

          return `
            <div class="ep-block-card" onclick="EP.openArticle(${articleIndex})" title="${block.headline || ''}" style="${baseStyle}cursor:pointer;">
              ${hasImg ? `<img class="ep-block-img" src="${imgSrc}" alt="${block.headline || ''}" draggable="false" loading="lazy" onload="this.classList.add('loaded')" style="width:100%;height:100%;object-fit:cover;display:block;">` : `
                <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f3f4f6,#e5e7eb);color:#d1d5db;font-size:28px;">
                  <i class="fa fa-newspaper"></i>
                </div>
              `}
              <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,.85));padding:12px 10px 8px;color:#fff;">
                ${block.category_label ? `<span style="font-size:9px;font-weight:700;text-transform:uppercase;color:rgba(255,255,255,.7);display:block;margin-bottom:2px;">${block.category_label}</span>` : ''}
                <strong style="font-size:13px;line-height:1.3;display:block;">${block.headline || 'Untitled'}</strong>
                ${block.sub_headline ? `<span style="font-size:10px;color:rgba(255,255,255,.6);display:block;margin-top:2px;">${block.sub_headline}</span>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // ── Hotspots (Legacy) ──
  renderHotspots(articles) {
    if (!this.el.hotspotsLayer) return;
    this.el.hotspotsLayer.innerHTML = '';
    this.articles = articles;

    articles.forEach((art, i) => {
      const hs = document.createElement('div');
      hs.className = 'ep-hotspot';
      hs.style.left = (art.click_region_x || 0) + '%';
      hs.style.top = (art.click_region_y || 0) + '%';
      hs.style.width = (art.click_region_w || 20) + '%';
      hs.style.height = (art.click_region_h || 15) + '%';
      hs.title = art.headline || 'Read article';
      hs.addEventListener('click', () => this.openArticle(i));
      this.el.hotspotsLayer.appendChild(hs);
    });
  },

<<<<<<< HEAD
  // ── Zoom / Pan ──
=======
  // ── Zoom ──
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
  setZoom(level) {
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, level));
    this.applyTransform();
  },

  applyTransform() {
<<<<<<< HEAD
    if (!this.el.pageContainer) return;
    this.el.pageContainer.style.transform = `translate(${this.panOffset.x}px, ${this.panOffset.y}px) scale(${this.zoom})`;
  },

  startDrag(e) {
    if (this.zoom <= 1) return;
    this.isDragging = true;
    this.dragStart = { x: e.clientX - this.panOffset.x, y: e.clientY - this.panOffset.y };
  },

  onDrag(e) {
    if (!this.isDragging) return;
    this.panOffset.x = e.clientX - this.dragStart.x;
    this.panOffset.y = e.clientY - this.dragStart.y;
    this.applyTransform();
  },

  endDrag() { this.isDragging = false; },

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      (this.el.viewer || document.body).requestFullscreen?.();
    } else {
=======
    // Apply zoom to the block grid or page container
    const grid = document.getElementById('epBlockGrid');
    if (grid) {
      grid.style.transform = `scale(${this.zoom})`;
      grid.style.transformOrigin = 'top center';
    }
    if (this.el.pageContainer) {
      this.el.pageContainer.style.transform = `scale(${this.zoom})`;
    }
  },

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.body.classList.add('ep-fullscreen');
      (this.el.viewer || document.body).requestFullscreen?.();
    } else {
      document.body.classList.remove('ep-fullscreen');
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
      document.exitFullscreen?.();
    }
  },

<<<<<<< HEAD
=======
  // ── Thumbnail Strip ──
  toggleThumbStrip() {
    const strip = this.el.thumbStrip;
    const toggle = this.el.thumbToggle;
    if (!strip) return;
    strip.classList.toggle('collapsed');
    if (toggle) {
      toggle.innerHTML = strip.classList.contains('collapsed')
        ? '<i class="fa fa-chevron-down"></i>'
        : '<i class="fa fa-chevron-up"></i>';
    }
  },

  renderThumbnails() {
    const container = this.el.thumbScroll;
    if (!container || !this.pages.length) {
      if (container) container.innerHTML = '';
      return;
    }

    container.innerHTML = this.pages.map((page, i) => {
      const cat = page.category || `Page ${i + 1}`;
      const blocks = page.blocks || [];
      // Find the first block with an image for the thumbnail
      const firstImg = blocks.find(b => b.image_url && b.image_url.length > 10);
      const thumbSource = (page.thumbnail_url && page.thumbnail_url.length > 10)
        ? page.thumbnail_url
        : (firstImg ? firstImg.image_url : '');
      const thumbUrl = thumbSource ? this.optimizeCloudinaryUrl(thumbSource, 120) : '';
      const isActive = (i + 1) === this.currentPage;

      return `
        <div class="ep-thumb-card ${isActive ? 'active' : ''}" onclick="EP.showPage(${i + 1})">
          <div class="ep-thumb-label">${cat}</div>
          ${thumbUrl
            ? `<img class="ep-thumb-img" src="${thumbUrl}" alt="${cat}" loading="lazy">`
            : `<div class="ep-thumb-placeholder"><i class="fa fa-newspaper"></i></div>`
          }
        </div>
      `;
    }).join('');
  },

  updateThumbActive() {
    const container = this.el.thumbScroll;
    if (!container) return;
    container.querySelectorAll('.ep-thumb-card').forEach((card, i) => {
      card.classList.toggle('active', (i + 1) === this.currentPage);
    });
    // Scroll active thumbnail into view
    const activeCard = container.querySelector('.ep-thumb-card.active');
    if (activeCard) {
      activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  },

>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
  // ── Article Panel ──
  currentArticle: null,

  openArticle(index) {
    const art = this.articles[index];
    if (!art) return;
    this.currentArticle = art;

    if (this.el.articleCategory) this.el.articleCategory.textContent = art.category_label || 'News';
    if (this.el.articleTitle) this.el.articleTitle.textContent = art.headline || '';
    if (this.el.articleDate) this.el.articleDate.textContent = art.created_at || this.formatDateISO(this.currentDate);
<<<<<<< HEAD
    if (this.el.articleImg) {
      if (art.article_image_url || art.image_url) {
        const imgUrl = art.article_image_url || art.image_url;
        const optimizedUrl = this.optimizeCloudinaryUrl(imgUrl, 720);
        this.el.articleImg.classList.remove('loaded');
        this.el.articleImg.onload = () => this.el.articleImg.classList.add('loaded');
        this.el.articleImg.src = optimizedUrl;
        this.el.articleImg.style.display = 'block';
        // Click on cover image opens gallery lightbox
        this.el.articleImg.onclick = () => {
          // Build image list: cover image + gallery images
          const allImages = [imgUrl, ...(art.gallery || [])];
          this._galImgs = allImages;
          this._galIdx = 0;
          this._openLightbox();
        };
      } else {
        this.el.articleImg.style.display = 'none';
        this.el.articleImg.onclick = null;
      }
=======
    // Always hide cover image — gallery images are used instead
    if (this.el.articleImg) {
      this.el.articleImg.style.display = 'none';
      this.el.articleImg.classList.remove('wide');
      this.el.articleImg.onclick = null;
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
    }

    // Rich HTML content or plain text
    if (this.el.articleText) {
<<<<<<< HEAD
      if (art.body_html && art.body_html.length > 10) {
        this.el.articleText.innerHTML = art.body_html;
      } else {
        this.el.articleText.innerHTML = (art.body_text || '').split('\n').map(p => `<p>${p}</p>`).join('');
      }

      // Append gallery images with lazy loading
      const gallery = art.gallery || [];
      if (gallery.length > 0) {
        let galHTML = '<div class="ep-article-gallery">';
        gallery.forEach((img, i) => {
          const thumbUrl = this.optimizeCloudinaryUrl(img, 300);
          galHTML += `<img src="${thumbUrl}" alt="Image ${i+1}" class="ep-gallery-img" loading="lazy" onload="this.classList.add('loaded')" onclick="EP.openGalleryViewer(${index}, ${i})">`;
        });
        galHTML += '</div>';
        this.el.articleText.innerHTML += galHTML;
=======
      // Show gallery images at original size BEFORE the article text
      const gallery = art.gallery || [];
      let galHTML = '';
      if (gallery.length > 0) {
        galHTML = '<div class="ep-article-gallery-full">';
        gallery.forEach((img, i) => {
          galHTML += `<img src="${img}" alt="Image ${i+1}" class="ep-gallery-full-img" loading="lazy" onload="this.classList.add('loaded')" onclick="EP.openGalleryViewer(${index}, ${i})">`;
        });
        galHTML += '</div>';
      }

      if (art.body_html && art.body_html.length > 10) {
        this.el.articleText.innerHTML = galHTML + art.body_html;
      } else {
        this.el.articleText.innerHTML = galHTML + (art.body_text || '').split('\n').map(p => `<p>${p}</p>`).join('');
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
      }
    }

    // Reset AI tabs
    this.switchAiTab(null);
    this.stopTTS();
    this.updateReadingTime();

    this.el.articlePanel?.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Show video button if article has video
    const vidBtn = document.getElementById('epVideoBtn');
    if (vidBtn) vidBtn.style.display = art.has_video && art.video_url ? 'inline-flex' : 'none';

    this.trackEvent('article_read', { headline: art.headline, category: art.category_label });
  },

  // Gallery lightbox viewer
  openGalleryViewer(artIndex, imgIndex) {
    const art = this.articles[artIndex];
    if (!art || !art.gallery) return;
    const imgs = art.gallery;
    this._galImgs = imgs;
    this._galIdx = imgIndex;
    this._openLightbox();
  },

  _openLightbox() {
    let overlay = document.getElementById('epGalleryOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'epGalleryOverlay';
      overlay.className = 'ep-gallery-overlay';
      overlay.innerHTML = `
        <button class="ep-gal-close" onclick="EP.closeGalleryViewer()"><i class="fa fa-times"></i></button>
        <button class="ep-gal-prev" onclick="EP.galleryNav(-1)"><i class="fa fa-chevron-left"></i></button>
        <img class="ep-gal-img" id="epGalImg" src="" alt="">
        <button class="ep-gal-next" onclick="EP.galleryNav(1)"><i class="fa fa-chevron-right"></i></button>
        <div class="ep-gal-counter" id="epGalCounter"></div>
      `;
      // Click overlay background to close
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) EP.closeGalleryViewer();
      });
      document.body.appendChild(overlay);
    }

    this._showGalImg();
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  _showGalImg() {
    const img = document.getElementById('epGalImg');
    const counter = document.getElementById('epGalCounter');
    if (img) img.src = this._galImgs[this._galIdx];
    if (counter) counter.textContent = `${this._galIdx + 1} / ${this._galImgs.length}`;
  },

  galleryNav(dir) {
    this._galIdx = (this._galIdx + dir + this._galImgs.length) % this._galImgs.length;
    this._showGalImg();
  },

  closeGalleryViewer() {
    document.getElementById('epGalleryOverlay')?.classList.remove('open');
    document.body.style.overflow = '';
  },

  closeArticle() {
    this.el.articlePanel?.classList.remove('open');
    document.body.style.overflow = '';
    this.stopTTS();
    this.currentArticle = null;
  },

  // ── AI Tabs ──
  switchAiTab(tab) {
    this.el.aiTabs?.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    this.el.aiContents?.forEach(c => c.classList.toggle('active', c.dataset.tab === tab));

    if (tab === 'summarize') this.summarizeArticle();
    if (tab === 'translate') this.translateArticle();
  },

  // ══════════════════════════════════════════════
  //  PREMIUM VOICE BAR SYSTEM — Edge Neural TTS
  //  Real Indian news anchor voice (server-side)
  // ══════════════════════════════════════════════
  _voice: {
    rate: 1,
    playing: false,
    paused: false,
    text: '',
    audio: null,        // HTML5 Audio element
    selectedVoice: '',  // Edge TTS voice ID (auto-detect if empty)
    loading: false,
    abortController: null,
  },

  detectLang(text) {
    const hindi = (text.match(/[\u0900-\u097F]/g) || []).length;
    const total = text.length;
    if (hindi / total > 0.3) return 'hi-IN';
    return 'en-US';
  },

  // Get article plain text
  _getArticleText() {
    const art = this.currentArticle;
    if (!art) return '';
    let text = '';
    if (art.headline) text += art.headline + '। ';
    if (art.sub_headline) text += art.sub_headline + '। ';
    if (art.body_text && art.body_text.trim()) {
      text += art.body_text;
    } else if (art.body_html) {
      const tmp = document.createElement('div');
      tmp.innerHTML = art.body_html;
      text += tmp.textContent || tmp.innerText || '';
    }
    return text.trim();
  },

  // Calculate reading time in minutes
  _calcReadingTime(text) {
    if (!text) return 0;
    const lang = this.detectLang(text);
    const words = text.split(/\s+/).filter(Boolean).length;
    const wpm = lang === 'hi-IN' ? 150 : 180;
    return Math.max(1, Math.ceil(words / wpm));
  },

  // Format seconds to M:SS
  _formatTime(seconds) {
    const s = Math.max(0, Math.round(seconds));
    const m = Math.floor(s / 60);
    const ss = String(s % 60).padStart(2, '0');
    return `${m}:${ss}`;
  },

  // Update reading time display when article opens
  updateReadingTime() {
    const text = this._getArticleText();
    const mins = this._calcReadingTime(text);
    const label = mins <= 1 ? '1 min listen' : `${mins} min listen`;

    if (this.el.readingTime) {
      this.el.readingTime.style.display = 'inline-flex';
      if (this.el.readTimeText) this.el.readTimeText.textContent = label;
    }
    if (this.el.ttsEstimate) {
      const langLabel = this.detectLang(text) === 'hi-IN' ? 'Hindi' : 'English';
      this.el.ttsEstimate.textContent = `Estimated: ${label} • ${langLabel} • AI Voice`;
    }
  },

<<<<<<< HEAD
=======
  // Fast inline text preprocessing for TTS (no LLM needed)
  _preprocessTTSText(text) {
    if (!text) return text;
    let t = text;

    // Expand common Hindi abbreviations
    const hindiAbbr = {
      'JEE': 'जे ई ई', 'NEET': 'नीट', 'IIT': 'आई आई टी',
      'IIM': 'आई आई एम', 'NIT': 'एन आई टी',
      'UP': 'उत्तर प्रदेश', 'MP': 'मध्य प्रदेश', 'MH': 'महाराष्ट्र',
      'CM': 'मुख्यमंत्री', 'PM': 'प्रधानमंत्री',
      'BJP': 'बी जे पी', 'RSS': 'आर एस एस', 'AAP': 'आम आदमी पार्टी',
      'CBSE': 'सी बी एस ई', 'ICSE': 'आई सी एस ई',
      'SSC': 'एस एस सी', 'HSC': 'एच एस सी',
      'CET': 'सी ई टी', 'MHT-CET': 'एम एच टी सी ई टी',
      'DTE': 'डी टी ई', 'NGO': 'एन जी ओ',
    };

    // Only replace standalone abbreviations (word boundaries)
    for (const [abbr, expansion] of Object.entries(hindiAbbr)) {
      const regex = new RegExp(`\\b${abbr}\\b`, 'g');
      t = t.replace(regex, expansion);
    }

    // Convert ₹ amounts to Hindi words
    t = t.replace(/₹\s?(\d[\d,]*)/g, (_, num) => {
      const n = parseInt(num.replace(/,/g, ''));
      if (n >= 10000000) return `${(n/10000000).toFixed(1)} करोड़ रुपये`;
      if (n >= 100000) return `${(n/100000).toFixed(1)} लाख रुपये`;
      if (n >= 1000) return `${(n/1000).toFixed(0)} हज़ार रुपये`;
      return `${n} रुपये`;
    });

    // Convert percentage symbols
    t = t.replace(/(\d+)%/g, '$1 प्रतिशत');

    // Add natural pauses after sentences
    t = t.replace(/।\s*/g, '। ... ');
    t = t.replace(/\.\s+/g, '. ... ');

    // Clean up excessive whitespace
    t = t.replace(/\s{3,}/g, '  ');

    return t.trim();
  },

>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
  // ── Start playing (fetch audio from Edge TTS API) ──
  async voicePlay() {
    if (!this.currentArticle) return;

    const rawText = this._getArticleText();
    if (!rawText) { this.showToast('No text to read'); return; }

    // Stop any existing playback
    this.voiceStop();
    this._voice.loading = true;

<<<<<<< HEAD
    // Read voice selection from selector if not already set
    if (this.el.voiceSelect && !this._voice.selectedVoice) {
      this._voice.selectedVoice = this.el.voiceSelect.value || '';
    }

    // Show inline player, hide prompt
    if (this.el.ttsPrompt) this.el.ttsPrompt.style.display = 'none';
    if (this.el.voiceBar) {
      this.el.voiceBar.classList.add('active', 'loading');
    }
=======
    // Show inline player, hide prompt
    if (this.el.ttsPrompt) this.el.ttsPrompt.style.display = 'none';
    if (this.el.voiceBar) this.el.voiceBar.classList.add('active', 'loading');
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
    if (this.el.voiceTitle) this.el.voiceTitle.textContent = this.currentArticle.headline || 'Article';
    this._voiceUpdatePlayIcon();
    
    let textToRead = rawText;
    let rateStr = '+0%';
    let pitchStr = '+0Hz';

<<<<<<< HEAD
    try {
      // Step 1: LLM Script Optimization
      this.showToast('📝 Optimizing news script...');
      const scriptRes = await fetch('/api/epaper/tts-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText })
      });

      if (scriptRes.ok) {
        const scriptData = await scriptRes.json();
        if (scriptData && (scriptData.title_script || scriptData.body_script)) {
          textToRead = `${scriptData.title_script || ''}\n\n${scriptData.body_script || ''}`.trim();
          
          if (scriptData.voice_style) {
            // Map LLM speed output to edge-tts rate format
            if (scriptData.voice_style.speed) {
              const parsedSpeed = parseFloat(scriptData.voice_style.speed);
              if (!isNaN(parsedSpeed)) {
                // Base user rate * LLM recommended rate
                const finalRate = this._voice.rate * parsedSpeed;
                const pct = Math.round((finalRate - 1) * 100);
                rateStr = pct >= 0 ? `+${pct}%` : `${pct}%`;
              }
            }
            if (scriptData.voice_style.pitch) {
              pitchStr = scriptData.voice_style.pitch;
            }
          }
        }
      }
    } catch (e) {
      console.warn('LLM script optimization failed, falling back to raw text', e);
    }

    // Step 2: Generate TTS Audio
    this.showToast('🎙️ Generating natural voice...');
=======
    // Inline text preprocessing (fast, no LLM needed)
    textToRead = this._preprocessTTSText(textToRead);

    // Step: Generate TTS Audio directly (skip LLM for speed)
    this.showToast('🎙️ Generating voice...');
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
    
    // If rate wasn't set by LLM, set it by user default
    if (rateStr === '+0%' && this._voice.rate !== 1) {
      const pct = Math.round((this._voice.rate - 1) * 100);
      rateStr = pct >= 0 ? `+${pct}%` : `${pct}%`;
    }

    this._voice.text = textToRead; // Store what we are actually reading

    try {
      const res = await fetch('/api/epaper/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToRead,
          voice: this._voice.selectedVoice || '',
          rate: rateStr,
          pitch: pitchStr
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'TTS request failed');
      }

      // Get audio as blob
      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create HTML5 Audio
      const audio = new Audio(audioUrl);
      this._voice.audio = audio;

      // Wire up audio events
      audio.addEventListener('loadedmetadata', () => {
        this._voice.loading = false;
<<<<<<< HEAD
=======
        if (this.el.voiceDuration) this.el.voiceDuration.textContent = this._formatTime(audio.duration || 0);
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
        this._voiceUpdatePlayIcon();
      });

      audio.addEventListener('timeupdate', () => this._voiceUpdateUI());

      audio.addEventListener('ended', () => {
        this._voiceFinished();
      });

      audio.addEventListener('error', (e) => {
        console.warn('Audio error:', e);
        this.showToast('Audio playback error');
        this._voiceFinished();
      });

      // Start playback
      await audio.play();
      this._voice.playing = true;
      this._voice.paused = false;
      this._voice.loading = false;
      if (this.el.voiceBar) this.el.voiceBar.classList.remove('loading');
      this._voiceUpdatePlayIcon();

      this.showToast('🔊 Now playing — AI News Voice');
      this.trackEvent('voice_play', {
        article: this.currentArticle?.headline,
        lang: this.detectLang(textToRead),
        voice: this._voice.selectedVoice || 'auto',
      });

    } catch (err) {
      console.error('TTS Error:', err);
      this._voice.loading = false;
      this.showToast('Voice generation failed. Try again.');
<<<<<<< HEAD
      // Hide player, restore prompt
=======
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
      if (this.el.voiceBar) this.el.voiceBar.classList.remove('active', 'loading');
      if (this.el.ttsPrompt) this.el.ttsPrompt.style.display = '';
      this._voiceUpdatePlayIcon();
    }
  },

  _voiceFinished() {
    this._voice.playing = false;
    this._voice.paused = false;
    this._voice.loading = false;
    if (this.el.voiceProgressFill) this.el.voiceProgressFill.style.width = '100%';
    if (this._voice.audio) {
      const dur = this._voice.audio.duration || 0;
      if (this.el.voiceElapsed) this.el.voiceElapsed.textContent = this._formatTime(dur);
    }
    if (this.el.voiceRemaining) this.el.voiceRemaining.textContent = '0:00';
    this._voiceUpdatePlayIcon();
<<<<<<< HEAD
    if (this.el.voiceBar) this.el.voiceBar.classList.remove('playing', 'loading');
    // After a short pause show the prompt again
=======
   if (this.el.voiceBar) this.el.voiceBar.classList.remove('playing', 'loading');
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
    setTimeout(() => {
      if (this.el.voiceBar) this.el.voiceBar.classList.remove('active');
      if (this.el.ttsPrompt) this.el.ttsPrompt.style.display = '';
    }, 1800);
    this.showToast('✅ Finished reading');
  },

  // Toggle play/pause
  voiceToggle() {
    const audio = this._voice.audio;

    if (this._voice.loading) return; // Still generating

    if (!audio || (!this._voice.playing && !this._voice.paused)) {
      // Not started yet, start fresh
      this.voicePlay();
      return;
    }

    if (this._voice.paused) {
      // Resume
      audio.play();
      this._voice.paused = false;
      this._voice.playing = true;
    } else if (this._voice.playing) {
      // Pause
      audio.pause();
      this._voice.paused = true;
      this._voice.playing = false;
    }
    this._voiceUpdatePlayIcon();
  },

<<<<<<< HEAD
  // Stop and hide inline player — restore the prompt
=======
  // Stop and hide voice bar
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
  voiceStop() {
    const audio = this._voice.audio;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
<<<<<<< HEAD
      if (audio.src && audio.src.startsWith('blob:')) URL.revokeObjectURL(audio.src);
=======
      // Revoke blob URL to free memory
      if (audio.src && audio.src.startsWith('blob:')) {
        URL.revokeObjectURL(audio.src);
      }
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
      this._voice.audio = null;
    }
    this._voice.playing = false;
    this._voice.paused = false;
    this._voice.loading = false;
    if (this.el.voiceBar) {
      this.el.voiceBar.classList.remove('active', 'playing', 'loading');
    }
<<<<<<< HEAD
    // Restore the play prompt
=======
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
    if (this.el.ttsPrompt) this.el.ttsPrompt.style.display = '';
    if (this.el.voiceProgressFill) this.el.voiceProgressFill.style.width = '0%';
    this._voiceUpdatePlayIcon();
  },

  // Skip forward/backward by seconds
  voiceSkip(seconds) {
    const audio = this._voice.audio;
    if (!audio || (!this._voice.playing && !this._voice.paused)) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + seconds));
    this._voiceUpdateUI();
  },

  // Cycle speed — regenerate audio at new speed
  voiceCycleSpeed() {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const idx = speeds.indexOf(this._voice.rate);
    this._voice.rate = speeds[(idx + 1) % speeds.length];
    if (this.el.voiceSpeedBtn) this.el.voiceSpeedBtn.textContent = this._voice.rate + 'x';

    // If playing, we need to regenerate audio with new rate
    if (this._voice.playing || this._voice.paused) {
      const audio = this._voice.audio;
      if (audio) {
        // Use HTML5 Audio playbackRate for instant speed change (no re-fetch needed!)
        audio.playbackRate = this._voice.rate;
      }
    }
    this.showToast(`Speed: ${this._voice.rate}x`);
  },

<<<<<<< HEAD
=======
  // Mute / unmute
  voiceToggleMute() {
    const audio = this._voice.audio;
    if (!audio) return;
    audio.muted = !audio.muted;
    if (this.el.voiceVolBtn) {
      this.el.voiceVolBtn.innerHTML = audio.muted
        ? '<i class="fa fa-volume-xmark"></i>'
        : '<i class="fa fa-volume-high"></i>';
    }
  },

>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
  // Update play/pause icon + waveform state
  _voiceUpdatePlayIcon() {
    if (this.el.voicePlayIcon) {
      if (this._voice.loading) {
        this.el.voicePlayIcon.className = 'fa fa-spinner fa-spin';
      } else {
        this.el.voicePlayIcon.className = this._voice.playing
          ? 'fa fa-pause' : 'fa fa-play';
      }
    }
    if (this.el.voiceBar) {
      this.el.voiceBar.classList.toggle('playing', this._voice.playing);
    }
  },

  // Real-time UI update using actual audio position
  _voiceUpdateUI() {
    const audio = this._voice.audio;
    if (!audio) return;

    const duration = audio.duration || 0;
    const current = audio.currentTime || 0;
    const pct = duration > 0 ? (current / duration) * 100 : 0;
    const remaining = Math.max(0, duration - current);

    if (this.el.voiceProgressFill) this.el.voiceProgressFill.style.width = pct + '%';
    if (this.el.voiceElapsed) this.el.voiceElapsed.textContent = this._formatTime(current);
    if (this.el.voiceRemaining) this.el.voiceRemaining.textContent = '-' + this._formatTime(remaining);
<<<<<<< HEAD
=======
    if (this.el.voiceDuration) this.el.voiceDuration.textContent = this._formatTime(duration);
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
  },

  // Legacy compat — called by closeArticle
  stopTTS() {
    this.voiceStop();
  },


  // ── Translate ──
  async translateArticle() {
    if (!this.currentArticle || !this.el.translateOutput) return;
    const lang = this.el.translateSelect?.value || 'en';
    const text = this.currentArticle.body_text || this.currentArticle.headline || '';
    if (!text) return;

    this.el.translateOutput.innerHTML = '<div class="ep-summary-loading"><div class="spinner"></div>Translating...</div>';

    try {
      const res = await fetch('/api/epaper/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target_lang: lang })
      });
      if (res.ok) {
        const data = await res.json();
        this.el.translateOutput.textContent = data.translated_text || text;
      } else {
        this.el.translateOutput.textContent = text;
        this.showToast('Translation failed');
      }
    } catch (e) {
      this.el.translateOutput.textContent = text;
      this.showToast('Translation service unavailable');
    }
  },

  // ── Summarize ──
  async summarizeArticle() {
    if (!this.currentArticle || !this.el.summaryOutput) return;
    const text = this.currentArticle.body_text || '';
    if (!text) { this.el.summaryOutput.innerHTML = '<p>No content to summarize.</p>'; return; }

    this.el.summaryOutput.innerHTML = '<div class="ep-summary-loading"><div class="spinner"></div>AI is summarizing...</div>';
    this.trackEvent('ai_summarize', { article: this.currentArticle?.headline });

    try {
      const res = await fetch('/api/epaper/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        const data = await res.json();
        const points = data.summary || [];
        this.el.summaryOutput.innerHTML = `<h4>✨ AI Summary</h4><ul>${points.map(p => `<li>${p}</li>`).join('')}</ul>`;
      } else {
        this.el.summaryOutput.innerHTML = '<p>Summary unavailable.</p>';
      }
    } catch (e) {
      this.el.summaryOutput.innerHTML = '<p>Summarization service unavailable.</p>';
    }
  },

  // ── Share ──
  shareArticle(platform) {
    if (!this.currentArticle) return;
    const title = this.currentArticle.headline || 'Vidyarthi Mitra E-Paper';
    const url = window.location.href;
    const text = encodeURIComponent(title + ' - ' + url);

    const urls = {
      whatsapp: `https://wa.me/?text=${text}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    };

    if (urls[platform]) window.open(urls[platform], '_blank', 'width=600,height=400');
    else { navigator.clipboard?.writeText(url); this.showToast('Link copied!'); }
    this.trackEvent('share', { platform, article: title });
  },

  // ── GA4 Analytics ──
  trackEvent(action, params = {}) {
    if (typeof gtag === 'function') {
      gtag('event', action, { event_category: 'epaper', ...params });
    }
    // Also log for debug
    console.debug('[EP Analytics]', action, params);
  },

  // ── Video Player ──
  playArticleVideo(videoUrl) {
    if (!videoUrl) return;
    const panel = document.getElementById('epVideoOverlay');
    const player = document.getElementById('epVideoPlayer');
    if (!panel || !player) return;

    player.src = videoUrl;
    panel.classList.add('open');
    player.play();
    this.trackEvent('video_play', { url: videoUrl });
  },

  closeVideo() {
    const panel = document.getElementById('epVideoOverlay');
    const player = document.getElementById('epVideoPlayer');
    if (panel) panel.classList.remove('open');
    if (player) { player.pause(); player.src = ''; }
  },

  // ── Toast ──
  showToast(msg) {
    if (!this.el.toast) return;
    this.el.toast.textContent = msg;
    this.el.toast.classList.add('show');
    setTimeout(() => this.el.toast.classList.remove('show'), 2500);
  },
};

// Initialize on DOM ready
<<<<<<< HEAD
document.addEventListener('DOMContentLoaded', () => EP.init());
=======
document.addEventListener('DOMContentLoaded', () => EP.init());
>>>>>>> 5c6d32cc9d6a384996ee6732afc75a888006c84a
