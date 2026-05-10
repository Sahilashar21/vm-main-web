/* ══════════════════════════════════════════════════
   E-Paper Admin — Free-form Drag & Drop Page Builder
   ══════════════════════════════════════════════════ */

const EPAdmin = {
  editions: [],
  currentEdition: null,
  pages: [],
  currentPageIdx: 0,
  activeBlockIdx: null,
  quill: null,

  // Drag state
  dragging: false,
  resizing: false,
  dragOffset: { x: 0, y: 0 },
  resizeStart: null,

  CANVAS_W: 800,
  CANVAS_H: 1000,

  init() {
    this.loadEditions();
    this.bindEvents();
    this.initQuill();
    this.updateEditionNamePreview();
  },

  initQuill() {
    this.quill = new Quill('#quillEditor', {
      theme: 'snow',
      placeholder: 'Write article content here...',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, 4, false] }, { size: ['small', false, 'large', 'huge'] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ script: 'super' }, { script: 'sub' }],
          [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
          [{ align: [] }, { direction: 'rtl' }],
          ['blockquote', 'code-block', 'link', 'image', 'video'],
          ['clean'],
        ],
        history: {
          delay: 500,
          maxStack: 100,
          userOnly: true,
        },
      },
    });
  },

  bindEvents() {
    document.getElementById('editionForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveEdition();
    });
    document.getElementById('blockForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveBlock();
    });
    document.getElementById('deleteEditionBtn')?.addEventListener('click', () => this.deleteEdition());

    document.getElementById('edName')?.addEventListener('input', () => this.updateEditionNamePreview());
    document.getElementById('edDate')?.addEventListener('change', () => this.updateEditionNamePreview());
    document.getElementById('edLang')?.addEventListener('change', () => this.updateEditionNamePreview());

    document.getElementById('blkType')?.addEventListener('change', () => this.onBlockTypeChange());
    document.getElementById('blkDividerOrientation')?.addEventListener('change', () => this.onDividerOrientationChange());
    document.getElementById('blkDividerStyle')?.addEventListener('change', () => this.updateDividerPreview());
    document.getElementById('blkDividerColor')?.addEventListener('change', () => this.updateDividerPreview());
    document.getElementById('blkDividerThickness')?.addEventListener('input', () => {
      const value = document.getElementById('blkDividerThickness').value || 6;
      const label = document.getElementById('dividerThicknessVal');
      if (label) label.textContent = `${value}px`;
      this.updateDividerPreview();
    });

    // Thumbnail upload
    const imgUpload = document.getElementById('blockImageUpload');
    const imgInput = document.getElementById('blockImageInput');
    if (imgUpload && imgInput) {
      imgUpload.addEventListener('click', () => imgInput.click());
      imgInput.addEventListener('change', () => {
        if (imgInput.files.length) this.handleBlockImage(imgInput.files[0]);
      });
    }

    // Gallery upload
    const galInput = document.getElementById('galleryInput');
    if (galInput) {
      galInput.addEventListener('change', () => {
        Array.from(galInput.files).forEach((file) => this.addGalleryImage(file));
        galInput.value = '';
      });
    }

    // Canvas drag events
    const canvas = document.getElementById('pageCanvas');
    if (canvas) {
      canvas.addEventListener('mousedown', (e) => this.onCanvasMouseDown(e));
      document.addEventListener('mousemove', (e) => this.onCanvasMouseMove(e));
      document.addEventListener('mouseup', () => this.onCanvasMouseUp());
    }
  },

  // ══════ HELPERS ══════

  updateEditionNamePreview() {
    const name = (document.getElementById('edName')?.value || '').trim();
    const date = document.getElementById('edDate')?.value || 'selected date';
    const lang = document.getElementById('edLang')?.value || 'Hindi';
    const preview = document.getElementById('edNamePreview');
    if (!preview) return;

    preview.value = name
      ? `${name} will appear in the viewer header for ${date} (${lang}).`
      : 'This title will appear in the e-paper viewer header.';
  },

  getActiveBlock() {
    return this.pages[this.currentPageIdx]?.blocks?.[this.activeBlockIdx] || null;
  },

  createArticleBlock(seed = 0) {
    return this.normalizeBlock({
      id: Date.now() + seed,
      type: 'article',
      headline: '',
      sub_headline: '',
      body_text: '',
      body_html: '',
      category_label: '',
      image_url: '',
      gallery: [],
      x: 24 + (seed % 2) * 272,
      y: 24 + Math.floor(seed / 2) * 184,
      w: 250,
      h: 170,
      border_width: 0,
      border_radius: 16,
      border_color: '#e41e26',
      border_style: 'solid',
    }, seed);
  },

  createDividerBlock(seed = 0, orientation = 'horizontal') {
    const base = {
      id: Date.now() + seed,
      type: 'divider',
      divider_orientation: orientation,
      divider_thickness: 6,
      divider_color: '#e41e26',
      divider_style: 'solid',
      x: 44 + (seed % 2) * 260,
      y: 70 + seed * 44,
      w: orientation === 'horizontal' ? 300 : 28,
      h: orientation === 'horizontal' ? 28 : 260,
      border_width: 0,
      border_radius: 0,
      border_color: '#e41e26',
      border_style: 'solid',
    };
    return this.normalizeBlock(base, seed);
  },

  normalizeBlock(block, index = 0) {
    const type = block?.type === 'divider' ? 'divider' : 'article';

    const normalized = {
      id: block?.id || Date.now() + index,
      type,
      headline: block?.headline || '',
      sub_headline: block?.sub_headline || '',
      body_text: block?.body_text || '',
      body_html: block?.body_html || '',
      category_label: block?.category_label || '',
      image_url: block?.article_image_url || block?.image_url || '',
      gallery: Array.isArray(block?.gallery) ? block.gallery : [],
      x: Number.isFinite(block?.x) ? block.x : 24 + (index % 2) * 272,
      y: Number.isFinite(block?.y) ? block.y : 24 + Math.floor(index / 2) * 184,
      w: Number.isFinite(block?.w) ? block.w : 250,
      h: Number.isFinite(block?.h) ? block.h : 170,
      border_width: Number.isFinite(block?.border_width) ? block.border_width : 0,
      border_radius: Number.isFinite(block?.border_radius) ? block.border_radius : 16,
      border_color: block?.border_color || '#e41e26',
      border_style: block?.border_style || 'solid',
      divider_orientation: block?.divider_orientation === 'vertical' ? 'vertical' : 'horizontal',
      divider_thickness: Number.isFinite(block?.divider_thickness) ? block.divider_thickness : 6,
      divider_color: block?.divider_color || block?.border_color || '#e41e26',
      divider_style: block?.divider_style || block?.border_style || 'solid',
    };

    if (type === 'divider') {
      if (!Number.isFinite(block?.w) || !Number.isFinite(block?.h)) {
        if (normalized.divider_orientation === 'vertical') {
          normalized.w = 28;
          normalized.h = 260;
        } else {
          normalized.w = 300;
          normalized.h = 28;
        }
      }
      normalized.border_width = 0;
      normalized.border_radius = Number.isFinite(block?.border_radius) ? block.border_radius : 0;
    }

    return this.clampBlock(normalized);
  },

  getMinimums(block) {
    if (block?.type === 'divider') return { minW: 8, minH: 8 };
    return { minW: 60, minH: 40 };
  },

  clampBlock(block) {
    if (!block) return block;

    const { minW, minH } = this.getMinimums(block);
    block.w = Math.max(minW, Math.min(block.w || minW, this.CANVAS_W));
    block.h = Math.max(minH, Math.min(block.h || minH, this.CANVAS_H));
    block.x = Math.max(0, Math.min(block.x || 0, this.CANVAS_W - block.w));
    block.y = Math.max(0, Math.min(block.y || 0, this.CANVAS_H - block.h));
    return block;
  },

  getBlockKindLabel(block) {
    return block?.type === 'divider' ? 'Divider' : 'Article';
  },

  getBlockTitle(block) {
    if (!block) return 'Block';
    if (block.type === 'divider') {
      const orientation = block.divider_orientation === 'vertical' ? 'Vertical' : 'Horizontal';
      return `${orientation} divider`;
    }
    return block.headline?.trim() || 'Untitled article';
  },

  updateBlockSummary(block = this.getActiveBlock()) {
    const typeLabel = document.getElementById('blkTypeLabel');
    const typeChip = document.getElementById('blkTypeChip');
    const positionLabel = document.getElementById('blkPositionLabel');
    const sizeLabel = document.getElementById('blkSizeLabel');
    if (!block) return;

    const kind = this.getBlockKindLabel(block);
    if (typeLabel) typeLabel.textContent = kind;
    if (typeChip) typeChip.textContent = kind;
    if (positionLabel) positionLabel.textContent = `${block.x || 0}, ${block.y || 0}`;
    if (sizeLabel) sizeLabel.textContent = `${block.w || 0} × ${block.h || 0}`;
  },

  updateEditorMode(block = this.getActiveBlock()) {
    const isDivider = block?.type === 'divider';

    document.querySelectorAll('.epb-mode-article').forEach((el) => {
      el.classList.toggle('epb-mode-hidden', isDivider);
    });
    document.querySelectorAll('.epb-mode-divider').forEach((el) => {
      el.classList.toggle('epb-mode-hidden', !isDivider);
    });

    const headline = document.getElementById('blkHeadline');
    const subHeadline = document.getElementById('blkSubheadline');
    const category = document.getElementById('blkCategory');
    if (headline) headline.required = !isDivider;
    if (headline) headline.disabled = isDivider;
    if (subHeadline) subHeadline.disabled = isDivider;
    if (category) category.disabled = isDivider;
  },

  buildDividerLineMarkup(orientation, thickness, color, style) {
    const safeThickness = Math.max(1, parseInt(thickness, 10) || 6);
    const safeColor = color || '#e41e26';
    const safeStyle = style || 'solid';
    if (orientation === 'vertical') {
      return `<div class="epc-divider-line vertical" style="height:100%;border-left:${safeThickness}px ${safeStyle} ${safeColor};"></div>`;
    }
    return `<div class="epc-divider-line horizontal" style="width:100%;border-top:${safeThickness}px ${safeStyle} ${safeColor};"></div>`;
  },

  applyDividerOrientationPreset(block, orientation) {
    if (!block) return;
    block.type = 'divider';
    block.divider_orientation = orientation;

    if (orientation === 'vertical') {
      block.w = Math.max(18, Math.min(block.w || 28, 48));
      block.h = Math.max(block.h || 260, 180);
    } else {
      block.h = Math.max(18, Math.min(block.h || 28, 48));
      block.w = Math.max(block.w || 300, 180);
    }

    this.clampBlock(block);
  },

  updateDividerPreview() {
    const preview = document.getElementById('dividerPreview');
    if (!preview) return;

    const orientation = document.getElementById('blkDividerOrientation')?.value || 'horizontal';
    const thickness = document.getElementById('blkDividerThickness')?.value || 6;
    const color = document.getElementById('blkDividerColor')?.value || '#e41e26';
    const style = document.getElementById('blkDividerStyle')?.value || 'solid';

    preview.innerHTML = `
      <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
        ${this.buildDividerLineMarkup(orientation, thickness, color, style)}
      </div>
    `;
  },

  onDividerOrientationChange() {
    const block = this.getActiveBlock();
    if (!block) return;

    const orientation = document.getElementById('blkDividerOrientation')?.value || 'horizontal';
    this.applyDividerOrientationPreset(block, orientation);
    this.updateSizeInputs();
    this.updateDividerPreview();
    this.updateBlockSummary(block);
    this.renderCanvas();
  },

  onBlockTypeChange() {
    const block = this.getActiveBlock();
    if (!block) return;

    const nextType = document.getElementById('blkType')?.value || 'article';
    const previousType = block.type || 'article';
    block.type = nextType;

    if (nextType === 'divider') {
      const orientation = document.getElementById('blkDividerOrientation')?.value || block.divider_orientation || 'horizontal';
      this.applyDividerOrientationPreset(block, orientation);
      block.border_width = 0;
      block.border_radius = 0;
    } else if (previousType === 'divider') {
      block.w = Math.max(block.w || 250, 180);
      block.h = Math.max(block.h || 170, 120);
      block.border_radius = block.border_radius || 16;
    }

    this.clampBlock(block);
    this.updateSizeInputs();
    this.updateBlockSummary(block);
    this.updateEditorMode(block);
    this.updateBorderPreview();
    this.updateDividerPreview();
    this.renderCanvas();
  },

  // ══════ CANVAS DRAG & DROP ══════

  onCanvasMouseDown(e) {
    const canvas = document.getElementById('pageCanvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const scale = rect.width / this.CANVAS_W;

    const page = this.pages[this.currentPageIdx];
    if (!page) return;
    const blocks = page.blocks || [];

    for (let i = blocks.length - 1; i >= 0; i--) {
      const block = blocks[i];
      const bx = (block.x || 0) * scale;
      const by = (block.y || 0) * scale;
      const bw = (block.w || 200) * scale;
      const bh = (block.h || 150) * scale;

      if (mx >= bx + bw - 14 && mx <= bx + bw + 4 && my >= by + bh - 14 && my <= by + bh + 4) {
        this.resizing = true;
        this.activeBlockIdx = i;
        this.resizeStart = { mx: e.clientX, my: e.clientY, w: block.w || 200, h: block.h || 150 };
        this.renderCanvas();
        this.showBlockEditor(i);
        e.preventDefault();
        return;
      }

      if (mx >= bx && mx <= bx + bw && my >= by && my <= by + bh) {
        this.dragging = true;
        this.activeBlockIdx = i;
        this.dragOffset = { x: mx / scale - (block.x || 0), y: my / scale - (block.y || 0) };
        this.renderCanvas();
        this.showBlockEditor(i);
        e.preventDefault();
        return;
      }
    }

    this.activeBlockIdx = null;
    this.renderCanvas();
    const editor = document.getElementById('blockEditor');
    const empty = document.getElementById('noBlockMsg');
    if (editor) editor.style.display = 'none';
    if (empty) empty.style.display = 'block';
  },

  onCanvasMouseMove(e) {
    if (!this.dragging && !this.resizing) return;

    const canvas = document.getElementById('pageCanvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = rect.width / this.CANVAS_W;
    const page = this.pages[this.currentPageIdx];
    const block = page?.blocks?.[this.activeBlockIdx];
    if (!block) return;

    if (this.dragging) {
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      block.x = Math.round(mx / scale - this.dragOffset.x);
      block.y = Math.round(my / scale - this.dragOffset.y);
      this.clampBlock(block);
      this.renderCanvas();
      this.updateSizeInputs();
      this.updateBlockSummary(block);
    }

    if (this.resizing) {
      const dx = (e.clientX - this.resizeStart.mx) / scale;
      const dy = (e.clientY - this.resizeStart.my) / scale;
      block.w = Math.round(this.resizeStart.w + dx);
      block.h = Math.round(this.resizeStart.h + dy);
      this.clampBlock(block);
      this.renderCanvas();
      this.updateSizeInputs();
      this.updateBlockSummary(block);
    }
  },

  onCanvasMouseUp() {
    this.dragging = false;
    this.resizing = false;
    this.resizeStart = null;
  },

  updateSizeInputs() {
    const block = this.getActiveBlock();
    if (!block) return;

    const xi = document.getElementById('blkX');
    const yi = document.getElementById('blkY');
    const wi = document.getElementById('blkW');
    const hi = document.getElementById('blkH');
    if (xi) xi.value = block.x || 0;
    if (yi) yi.value = block.y || 0;
    if (wi) wi.value = block.w || 200;
    if (hi) hi.value = block.h || 150;

    this.updateBlockSummary(block);
  },

  applySizeInputs() {
    const block = this.getActiveBlock();
    if (!block) return;

    block.x = parseInt(document.getElementById('blkX')?.value, 10) || 0;
    block.y = parseInt(document.getElementById('blkY')?.value, 10) || 0;
    block.w = parseInt(document.getElementById('blkW')?.value, 10) || 200;
    block.h = parseInt(document.getElementById('blkH')?.value, 10) || 150;

    this.clampBlock(block);
    this.updateSizeInputs();
    this.renderCanvas();
  },

  // ══════ CANVAS RENDERING ══════

  renderCanvas() {
    const container = document.getElementById('pageCanvas');
    if (!container) return;

    const page = this.pages[this.currentPageIdx];
    if (!page) return;
    const blocks = page.blocks || [];

    container.innerHTML = blocks.map((block, i) => {
      const x = block.x || 0;
      const y = block.y || 0;
      const w = block.w || 200;
      const h = block.h || 150;
      const isActive = i === this.activeBlockIdx;
      const isDivider = block.type === 'divider';
      const hasImg = block.image_url && block.image_url.length > 10;
      const bw = block.border_width ?? 0;
      const br = block.border_radius ?? (isDivider ? 0 : 16);
      const bc = block.border_color || '#e41e26';
      const bs = block.border_style || 'solid';
      const borderCSS = !isDivider && bw > 0 ? `border:${bw}px ${bs} ${bc};` : '';
      const kind = this.getBlockKindLabel(block);
      const title = this.getBlockTitle(block);

      const body = isDivider
        ? `
          <div class="epc-divider">
            ${this.buildDividerLineMarkup(block.divider_orientation, block.divider_thickness, block.divider_color, block.divider_style)}
            <span class="epc-divider-note">${block.divider_orientation === 'vertical' ? 'Vertical' : 'Horizontal'} line</span>
          </div>
        `
        : (
          hasImg
            ? `<img src="${block.image_url}" alt="" draggable="false">`
            : `<div class="epc-empty"><i class="fa fa-image"></i></div>`
        );

      const footer = isDivider
        ? ''
        : `
          <div class="epc-label">
            ${block.category_label ? `<span class="epc-cat">${block.category_label}</span>` : ''}
            <span class="epc-title">${block.headline || 'Untitled article'}</span>
          </div>
        `;

      return `
        <div class="epc-block ${isActive ? 'active' : ''}" data-idx="${i}"
             style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${br}px;${borderCSS}">
          ${body}
          ${footer}
          <span class="epc-num">${i + 1}</span>
          <span class="epc-kind">${kind}</span>
          <button class="epc-del" onmousedown="event.stopPropagation(); EPAdmin.removeBlock(${i})"><i class="fa fa-times"></i></button>
          ${isActive ? '<div class="epc-resize"></div>' : ''}
          <span class="epc-dims">${w}×${h}</span>
        </div>
      `;
    }).join('') + `
      <div class="epc-canvas-actions" style="position:absolute;right:16px;bottom:16px;display:flex;gap:8px;z-index:12;">
        <button class="epc-add-btn" onclick="EPAdmin.addBlock('article')"><i class="fa fa-plus"></i> Add Article</button>
        <button class="epc-add-btn" style="background:#0f172a;box-shadow:0 4px 12px rgba(15,23,42,.24)" onclick="EPAdmin.addBlock('divider')"><i class="fa fa-grip-lines"></i> Add Divider</button>
      </div>
    `;
  },

  // ══════ EDITIONS ══════

  async loadEditions() {
    try {
      const res = await fetch('/api/epaper/editions');
      const data = await res.json();
      this.editions = data.editions || [];
      this.renderEditionsList();
    } catch (error) {
      console.error(error);
    }
  },

  renderEditionsList() {
    const list = document.getElementById('editionsList');
    if (!list) return;

    if (!this.editions.length) {
      list.innerHTML = '<div class="epa-empty">No editions yet.</div>';
      return;
    }

    list.innerHTML = this.editions.map((edition) => `
      <div class="epa-edition-card">
        <div class="epa-edition-info">
          <strong>${edition.date}</strong>
          <span class="epa-edition-name">${edition.name || 'Untitled edition'}</span>
          <span class="epa-badge">${edition.language || 'Hindi'}</span>
          <span style="color:var(--muted);font-size:12px">${edition.total_pages || 0} pages</span>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="epa-btn epa-btn-sm epa-btn-primary" onclick="EPAdmin.editEdition('${edition.date}')">
            <i class="fa fa-edit"></i> Edit
          </button>
          <button class="epa-btn epa-btn-sm epa-btn-danger" onclick="EPAdmin.deleteEditionByDate('${edition.date}')">
            <i class="fa fa-trash"></i> Delete
          </button>
        </div>
      </div>
    `).join('');
  },

  async deleteEditionByDate(date) {
    if (!confirm(`Delete edition ${date}? This cannot be undone.`)) return;
    try {
      await fetch(`/api/epaper/admin/edition/${date}`, { method: 'DELETE' });
      // If we're currently editing this edition, close the builder
      if (this.currentEdition && this.currentEdition.date === date) {
        this.currentEdition = null;
        this.pages = [];
        this.activeBlockIdx = null;
        document.getElementById('builderSection').style.display = 'none';
      }
      this.loadEditions();
      this.showToast('Edition deleted.');
    } catch (error) {
      alert('Delete failed.');
    }
  },

  async editEdition(date) {
    try {
      const res = await fetch(`/api/epaper/edition/${date}`);
      if (!res.ok) {
        alert('Edition not found.');
        return;
      }

      const data = await res.json();
      this.currentEdition = data;
      this.pages = (data.pages || []).map((page, pageIndex) => {
        const sourceBlocks = Array.isArray(page.blocks) && page.blocks.length
          ? page.blocks
          : (page.articles || []).map((article, articleIndex) => ({
              id: article.id || Date.now() + articleIndex,
              type: 'article',
              headline: article.headline || '',
              sub_headline: article.sub_headline || '',
              body_text: article.body_text || '',
              body_html: article.body_html || '',
              category_label: article.category_label || '',
              image_url: article.article_image_url || article.image_url || '',
              gallery: article.gallery || [],
              x: Number.isFinite(article.x) ? article.x : (article.width_pct ? Math.round((article.width_pct / 100) * this.CANVAS_W) : articleIndex * 210),
              y: Number.isFinite(article.y) ? article.y : 0,
              w: Number.isFinite(article.w) ? article.w : (article.width_pct ? Math.round((article.width_pct / 100) * this.CANVAS_W) : 200),
              h: Number.isFinite(article.h) ? article.h : (article.height_px || 150),
              border_width: article.border_width ?? 0,
              border_radius: article.border_radius ?? 16,
              border_color: article.border_color || '#e41e26',
              border_style: article.border_style || 'solid',
            }));

        return {
          page_number: page.page_number || pageIndex + 1,
          category: page.category || 'मुख पृष्ठ',
          thumbnail_url: page.thumbnail_url || '',
          blocks: sourceBlocks.map((block, blockIndex) => this.normalizeBlock(block, blockIndex)),
        };
      });

      document.getElementById('edDate').value = data.date;
      document.getElementById('edName').value = data.name || '';
      document.getElementById('edLang').value = data.language || 'Hindi';
      this.updateEditionNamePreview();

      if (!this.pages.length) this.addPage();

      document.getElementById('builderSection').style.display = 'block';
      document.getElementById('deleteEditionBtn').style.display = 'inline-flex';
      this.renderPageTabs();
      this.openPage(0);
      document.getElementById('builderSection').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      alert('Error loading edition.');
    }
  },

  async saveEdition() {
    const date = document.getElementById('edDate')?.value;
    const name = (document.getElementById('edName')?.value || '').trim();
    const language = document.getElementById('edLang')?.value || 'Hindi';
    if (!date) {
      alert('Date required.');
      return;
    }

    const pages = this.pages.map((page) => {
      const normalizedBlocks = (page.blocks || []).map((block, index) => this.normalizeBlock(block, index));
      return {
        page_number: page.page_number,
        category: page.category || 'मुख पृष्ठ',
        thumbnail_url: page.thumbnail_url || '',
        blocks: normalizedBlocks.map((block) => ({
          id: block.id,
          type: block.type || 'article',
          headline: block.headline || '',
          sub_headline: block.sub_headline || '',
          body_text: block.body_text || '',
          body_html: block.body_html || '',
          category_label: block.category_label || '',
          image_url: block.image_url || '',
          gallery: block.gallery || [],
          x: block.x || 0,
          y: block.y || 0,
          w: block.w || 200,
          h: block.h || 150,
          border_width: block.border_width ?? 0,
          border_radius: block.border_radius ?? 16,
          border_color: block.border_color || '#e41e26',
          border_style: block.border_style || 'solid',
          divider_orientation: block.divider_orientation || 'horizontal',
          divider_thickness: block.divider_thickness ?? 6,
          divider_color: block.divider_color || '#e41e26',
          divider_style: block.divider_style || 'solid',
        })),
        articles: normalizedBlocks
          .filter((block) => block.type !== 'divider')
          .map((block) => ({
            id: block.id,
            headline: block.headline || '',
            sub_headline: block.sub_headline || '',
            body_text: block.body_text || '',
            body_html: block.body_html || '',
            category_label: block.category_label || '',
            article_image_url: block.image_url || '',
            image_url: block.image_url || '',
            gallery: block.gallery || [],
            x: block.x || 0,
            y: block.y || 0,
            w: block.w || 200,
            h: block.h || 150,
            border_width: block.border_width ?? 0,
            border_radius: block.border_radius ?? 16,
            border_color: block.border_color || '#e41e26',
            border_style: block.border_style || 'solid',
          })),
      };
    });

    const payload = {
      date,
      name: name || `Edition ${date}`,
      language,
      pages,
    };

    try {
      const res = await fetch('/api/epaper/admin/edition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Save failed.');
        return;
      }

      this.currentEdition = payload;
      this.showToast('Edition saved.');
      this.loadEditions();
    } catch (error) {
      alert('Network error.');
    }
  },

  async deleteEdition() {
    if (!this.currentEdition) return;
    if (!confirm(`Delete ${this.currentEdition.date}?`)) return;

    try {
      await fetch(`/api/epaper/admin/edition/${this.currentEdition.date}`, { method: 'DELETE' });
      this.currentEdition = null;
      this.pages = [];
      this.activeBlockIdx = null;
      document.getElementById('builderSection').style.display = 'none';
      this.loadEditions();
      this.showToast('Edition deleted.');
    } catch (error) {
      alert('Delete failed.');
    }
  },

  // ══════ PAGES ══════

  addPage() {
    this.pages.push({ page_number: this.pages.length + 1, category: 'मुख पृष्ठ', thumbnail_url: '', blocks: [] });
    this.renderPageTabs();
    this.openPage(this.pages.length - 1);
  },

  deletePage(idx) {
    if (this.pages.length <= 1) return;
    if (!confirm(`Delete page ${idx + 1}?`)) return;

    this.pages.splice(idx, 1);
    this.pages.forEach((page, index) => { page.page_number = index + 1; });
    this.renderPageTabs();
    this.openPage(Math.min(idx, this.pages.length - 1));
  },

  renderPageTabs() {
    const tabs = document.getElementById('pageTabs');
    if (!tabs) return;

    tabs.innerHTML = this.pages.map((page, index) => `
      <div class="epa-page-tab-wrap">
        <div class="epa-page-tab ${index === this.currentPageIdx ? 'active' : ''}" onclick="EPAdmin.openPage(${index})">
          <div class="epa-page-thumb">
            ${this.getPageThumbnailUrl(page)
              ? `<img src="${this.getPageThumbnailUrl(page)}" alt="Page ${index + 1} thumbnail">`
              : '<i class="fa fa-newspaper"></i>'
            }
          </div>
          <div class="epa-page-tab-title">
            <span>Page ${index + 1}</span>
            ${this.pages.length > 1 ? `<span onclick="event.stopPropagation(); EPAdmin.deletePage(${index})" style="margin-left:6px;cursor:pointer;opacity:.6">×</span>` : ''}
          </div>
        </div>
        <button type="button" class="epa-btn epa-btn-soft epa-btn-sm epa-page-replace-btn" onclick="EPAdmin.replacePageThumbnail(${index})">
          <i class="fa fa-image"></i> Replace thumbnail
        </button>
      </div>
    `).join('') + '<div class="epa-page-add" onclick="EPAdmin.addPage()"><i class="fa fa-plus"></i> Add Page</div>';
  },

  getPageThumbnailUrl(page) {
    if (page?.thumbnail_url && page.thumbnail_url.length > 10) return page.thumbnail_url;
    const firstImg = (page?.blocks || []).find((block) => block.image_url && block.image_url.length > 10);
    return firstImg ? firstImg.image_url : '';
  },

  replacePageThumbnail(pageIndex) {
    if (!this.currentEdition?.date) {
      this.showToast('Please save the current edition or open an existing edition first.');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) this.uploadPageThumbnail(pageIndex, file);
    };
    input.click();
  },

  async uploadPageThumbnail(pageIndex, file) {
    const page = this.pages[pageIndex];
    if (!page || !this.currentEdition?.date) return;
    if (file.size > (10 * 1024 * 1024)) {
      this.showToast('Please choose an image smaller than 10MB.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('edition_date', this.currentEdition.date);
    formData.append('page_number', String(page.page_number || (pageIndex + 1)));

    try {
      const res = await fetch('/api/epaper/admin/replace-thumbnail', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        this.showToast(data.error || 'Thumbnail upload failed.');
        return;
      }

      this.showToast('Thumbnail replaced successfully.');
      await this.editEdition(this.currentEdition.date);
      this.openPage(Math.min(pageIndex, this.pages.length - 1));
    } catch (error) {
      console.error(error);
      this.showToast(error?.message || 'Thumbnail upload failed.');
    }
  },

  openPage(idx) {
    this.currentPageIdx = idx;
    this.activeBlockIdx = null;
    this.renderPageTabs();
    this.renderCanvas();

    const editor = document.getElementById('blockEditor');
    const empty = document.getElementById('noBlockMsg');
    if (editor) editor.style.display = 'none';
    if (empty) empty.style.display = 'block';
  },

  // ══════ BLOCK CRUD ══════

  addBlock(type = 'article') {
    const page = this.pages[this.currentPageIdx];
    if (!page) return;

    if (!page.blocks) page.blocks = [];
    const count = page.blocks.length;
    const block = type === 'divider'
      ? this.createDividerBlock(count)
      : this.createArticleBlock(count);

    page.blocks.push(block);
    this.activeBlockIdx = page.blocks.length - 1;
    this.renderCanvas();
    this.showBlockEditor(this.activeBlockIdx);
  },

  removeBlock(idx) {
    if (!confirm('Delete this block?')) return;

    this.pages[this.currentPageIdx].blocks.splice(idx, 1);
    this.activeBlockIdx = null;
    this.renderCanvas();
    const editor = document.getElementById('blockEditor');
    const empty = document.getElementById('noBlockMsg');
    if (editor) editor.style.display = 'none';
    if (empty) empty.style.display = 'block';
  },

  deleteBlock() {
    if (this.activeBlockIdx !== null) this.removeBlock(this.activeBlockIdx);
  },

  // ══════ BLOCK EDITOR ══════

  showBlockEditor(idx) {
    const block = this.pages[this.currentPageIdx]?.blocks?.[idx];
    if (!block) return;

    const editor = document.getElementById('blockEditor');
    const empty = document.getElementById('noBlockMsg');
    if (editor) editor.style.display = 'block';
    if (empty) empty.style.display = 'none';

    const typeField = document.getElementById('blkType');
    if (typeField) typeField.value = block.type || 'article';

    const headline = document.getElementById('blkHeadline');
    const subHeadline = document.getElementById('blkSubheadline');
    const category = document.getElementById('blkCategory');

    if (headline) headline.value = block.headline || '';
    if (subHeadline) subHeadline.value = block.sub_headline || '';
    if (category) category.value = block.category_label || '';

    if (block.body_html) this.quill.root.innerHTML = block.body_html;
    else if (block.body_text) this.quill.setText(block.body_text);
    else this.quill.setText('');

    const label = document.getElementById('blockImageLabel');
    if (label) {
      if (block.image_url && block.image_url.length > 10) {
        label.innerHTML = `<img src="${block.image_url}" alt="">`;
      } else {
        label.innerHTML = '<i class="fa fa-cloud-upload-alt"></i>Upload image or replace the current one';
      }
    }

    document.getElementById('blkX').value = block.x || 0;
    document.getElementById('blkY').value = block.y || 0;
    document.getElementById('blkW').value = block.w || 200;
    document.getElementById('blkH').value = block.h || 150;

    document.getElementById('blkBorderWidth').value = block.border_width ?? 0;
    document.getElementById('blkBorderRadius').value = block.border_radius ?? 16;
    document.getElementById('blkBorderColor').value = block.border_color || '#e41e26';
    document.getElementById('blkBorderStyle').value = block.border_style || 'solid';
    document.getElementById('bwVal').textContent = `${block.border_width ?? 0}px`;
    document.getElementById('brVal').textContent = `${block.border_radius ?? 16}px`;

    document.getElementById('blkDividerOrientation').value = block.divider_orientation || 'horizontal';
    document.getElementById('blkDividerStyle').value = block.divider_style || 'solid';
    document.getElementById('blkDividerColor').value = block.divider_color || '#e41e26';
    document.getElementById('blkDividerThickness').value = block.divider_thickness ?? 6;
    document.getElementById('dividerThicknessVal').textContent = `${block.divider_thickness ?? 6}px`;

    this.updateEditorMode(block);
    this.updateBorderPreview();
    this.updateDividerPreview();
    this.renderGallery();
    this.updateBlockSummary(block);
  },

  saveBlock() {
    const block = this.getActiveBlock();
    if (!block) return;

    const type = document.getElementById('blkType')?.value || 'article';
    block.type = type;
    block.x = parseInt(document.getElementById('blkX')?.value, 10) || 0;
    block.y = parseInt(document.getElementById('blkY')?.value, 10) || 0;
    block.w = parseInt(document.getElementById('blkW')?.value, 10) || 200;
    block.h = parseInt(document.getElementById('blkH')?.value, 10) || 150;

    if (type === 'divider') {
      block.divider_orientation = document.getElementById('blkDividerOrientation')?.value || 'horizontal';
      block.divider_style = document.getElementById('blkDividerStyle')?.value || 'solid';
      block.divider_color = document.getElementById('blkDividerColor')?.value || '#e41e26';
      block.divider_thickness = parseInt(document.getElementById('blkDividerThickness')?.value, 10) || 6;
      block.border_width = 0;
      block.border_radius = 0;
    } else {
      block.headline = document.getElementById('blkHeadline')?.value || '';
      block.sub_headline = document.getElementById('blkSubheadline')?.value || '';
      block.category_label = document.getElementById('blkCategory')?.value || '';
      block.body_html = this.quill.root.innerHTML;
      block.body_text = this.quill.getText().trim();
      block.border_width = parseInt(document.getElementById('blkBorderWidth')?.value, 10) || 0;
      block.border_radius = parseInt(document.getElementById('blkBorderRadius')?.value, 10) || 16;
      block.border_color = document.getElementById('blkBorderColor')?.value || '#e41e26';
      block.border_style = document.getElementById('blkBorderStyle')?.value || 'solid';
    }

    this.clampBlock(block);
    this.updateSizeInputs();
    this.updateBlockSummary(block);
    this.updateBorderPreview();
    this.updateDividerPreview();
    this.renderCanvas();
    this.showToast('Block saved.');
  },

  handleBlockImage(file) {
    if (!file?.type.startsWith('image/')) return;

    const block = this.getActiveBlock();
    if (!block || block.type === 'divider') {
      this.showToast('Images can only be added to article blocks.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      block.image_url = event.target.result;
      this.renderCanvas();
      const label = document.getElementById('blockImageLabel');
      if (label) label.innerHTML = `<img src="${block.image_url}" alt="">`;
    };
    reader.readAsDataURL(file);
  },

  renderGallery() {
    const container = document.getElementById('articleGallery');
    const block = this.getActiveBlock();
    if (!container || !block) return;

    const gallery = Array.isArray(block.gallery) ? block.gallery : [];
    container.innerHTML = gallery.map((img, idx) => `
      <div class="epb-gallery-item">
        <img src="${img}" alt="">
        <button class="epb-gal-del" onclick="event.stopPropagation(); EPAdmin.removeGalleryImage(${idx})"><i class="fa fa-times"></i></button>
      </div>
    `).join('') + '<div class="epb-gal-add" onclick="document.getElementById(\'galleryInput\').click()"><i class="fa fa-plus"></i></div>';
  },

  addGalleryImage(file) {
    if (!file?.type.startsWith('image/')) return;

    const block = this.getActiveBlock();
    if (!block || block.type === 'divider') {
      this.showToast('Gallery images are only available for articles.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (!Array.isArray(block.gallery)) block.gallery = [];
      block.gallery.push(event.target.result);
      this.renderGallery();
    };
    reader.readAsDataURL(file);
  },

  removeGalleryImage(idx) {
    const block = this.getActiveBlock();
    if (!block?.gallery) return;
    block.gallery.splice(idx, 1);
    this.renderGallery();
  },

  updateBorderPreview() {
    const preview = document.getElementById('borderPreview');
    if (!preview) return;

    const width = document.getElementById('blkBorderWidth')?.value || 0;
    const style = document.getElementById('blkBorderStyle')?.value || 'solid';
    const color = document.getElementById('blkBorderColor')?.value || '#e41e26';
    const radius = document.getElementById('blkBorderRadius')?.value || 16;
    preview.style.border = `${width}px ${style} ${color}`;
    preview.style.borderRadius = `${radius}px`;
  },

  showToast(message) {
    const toast = document.getElementById('adminToast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  },
};

document.addEventListener('DOMContentLoaded', () => EPAdmin.init());
