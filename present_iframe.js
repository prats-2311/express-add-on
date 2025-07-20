import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

class PrecisionToolkit {
    constructor() {
        this.sandboxProxy = null;
        this.selectedElements = [];
        this.selectionMonitor = null;
    }

    async init() {
        await addOnUISdk.ready;
        const { runtime } = addOnUISdk.instance;
        this.sandboxProxy = await runtime.apiProxy("documentSandbox");

        this.setupNavigation();
        this.setupPrecisionToolkit();
        this.setupContentOrchestrator();
        this.setupCreativeEnhancer();
        this.refreshProjectInfo();
        this.startSelectionMonitoring();
    }

    setupNavigation() {
        // Toolkit selection
        document.querySelectorAll('.toolkit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.target.dataset.toolkit === 'precision') {
                    this.showPrecisionToolkit();
                } else if (e.target.dataset.toolkit === 'content') {
                    this.showContentToolkit();
                } else if (e.target.dataset.toolkit === 'ui-enhancer') {
                    this.showUIEnhancerToolkit();
                }
            });
        });

        // Back buttons
        document.getElementById('back-to-main')?.addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('back-to-main-content')?.addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('back-to-main-ui')?.addEventListener('click', () => {
            this.showMainMenu();
        });
    }

    showPrecisionToolkit() {
        document.getElementById('toolkit-selector').classList.add('hidden');
        document.getElementById('precision-toolkit').classList.remove('hidden');
    }

    showContentToolkit() {
        document.getElementById('toolkit-selector').classList.add('hidden');
        document.getElementById('content-toolkit').classList.remove('hidden');
        this.setupContentToolkit();
    }

    showMainMenu() {
        document.querySelectorAll('.toolkit').forEach(t => t.classList.add('hidden'));
        document.getElementById('toolkit-selector').classList.remove('hidden');
    }

    showUIEnhancerToolkit() {
        document.getElementById('toolkit-selector').classList.add('hidden');
        document.getElementById('ui-enhancer-toolkit').classList.remove('hidden');
        this.setupUIEnhancer();
    }

    setupPrecisionToolkit() {
        this.setupAlignment();
        this.setupTextEffects();
        this.setupGranularControls();
        this.setupColorPaletteManager();
        this.startSelectionMonitoring();
    }

    setupAlignment() {
        // Test element creation
        document.getElementById('create-test-rect')?.addEventListener('click', async () => {
            await this.sandboxProxy.createTestRectangle();
        });

        document.getElementById('create-test-text')?.addEventListener('click', async () => {
            await this.sandboxProxy.createTestText();
        });

        document.getElementById('create-test-circle')?.addEventListener('click', async () => {
            await this.sandboxProxy.createTestCircle();
        });

        // Alignment buttons
        document.querySelectorAll('.align-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const direction = e.target.dataset.direction;
                const alignment = e.target.dataset.align;
                await this.sandboxProxy.alignElements(direction, alignment);
            });
        });

        // Distribution buttons
        document.getElementById('distribute-horizontal')?.addEventListener('click', async () => {
            await this.sandboxProxy.distributeElements('horizontal');
        });

        document.getElementById('distribute-vertical')?.addEventListener('click', async () => {
            await this.sandboxProxy.distributeElements('vertical');
        });
    }

    setupGranularControls() {
        const posX = document.getElementById('pos-x');
        const posY = document.getElementById('pos-y');
        const sizeWidth = document.getElementById('size-width');
        const sizeHeight = document.getElementById('size-height');

        // Position controls - use 'input' for real-time updates
        posX?.addEventListener('input', async (e) => {
            const value = parseInt(e.target.value);
            if (!isNaN(value)) {
                await this.sandboxProxy.updateElementPosition(value, null);
            }
        });

        posY?.addEventListener('input', async (e) => {
            const value = parseInt(e.target.value);
            if (!isNaN(value)) {
                await this.sandboxProxy.updateElementPosition(null, value);
            }
        });

        // Size controls - use 'input' for real-time updates
        sizeWidth?.addEventListener('input', async (e) => {
            const value = parseInt(e.target.value);
            if (!isNaN(value) && value > 0) {
                await this.sandboxProxy.updateElementSize(value, null);
            }
        });

        sizeHeight?.addEventListener('input', async (e) => {
            const value = parseInt(e.target.value);
            if (!isNaN(value) && value > 0) {
                await this.sandboxProxy.updateElementSize(null, value);
            }
        });
    }

    async startSelectionMonitoring() {
        this.selectionMonitor = setInterval(async () => {
            try {
                const selection = await this.sandboxProxy.getSelectedElements();
                // console.log('UI: Selection detected:', selection.length);
                this.updateSelectionUI(selection);

                // Update granular controls for single selection
                if (selection.length === 1) {
                    const props = await this.sandboxProxy.getElementProperties();
                    this.updateGranularInputs(props);
                }
            } catch (error) {
                // console.log('Selection monitoring error:', error);
            }
        }, 500);
    }

    updateSelectionUI(selection) {
        const count = selection.length;
        const statusEl = document.getElementById('selection-count');

        if (count === 0) {
            statusEl.textContent = 'No elements selected';
        } else if (count === 1) {
            statusEl.textContent = '1 element selected';
        } else {
            statusEl.textContent = `${count} elements selected`;
        }

        // console.log('Updating UI for', count, 'selected elements');

        // Enable/disable alignment buttons
        const alignButtons = document.querySelectorAll('.align-btn');
        alignButtons.forEach(btn => {
            btn.disabled = count < 2;
            // console.log('Align button', btn.textContent, 'disabled:', btn.disabled);
        });

        // Enable/disable distribution buttons
        const distributeH = document.getElementById('distribute-horizontal');
        const distributeV = document.getElementById('distribute-vertical');
        if (distributeH) {
            distributeH.disabled = count < 3;
            // console.log('Distribute H disabled:', distributeH.disabled);
        }
        if (distributeV) {
            distributeV.disabled = count < 3;
            // console.log('Distribute V disabled:', distributeV.disabled);
        }

        // Enable/disable granular controls
        const granularInputs = document.querySelectorAll('#granular-section input');
        granularInputs.forEach(input => {
            input.disabled = count !== 1;
        });
    }

    updateGranularInputs(props) {
        if (props) {
            document.getElementById('pos-x').value = props.x;
            document.getElementById('pos-y').value = props.y;
            document.getElementById('size-width').value = props.width;
            document.getElementById('size-height').value = props.height;
        }
    }

    setupTextEffects() {
        let selectedEffect = 'neon';

        // Effect button selection
        document.querySelectorAll('.effect-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.effect-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                selectedEffect = e.target.dataset.effect;
                this.updateTextPreview(selectedEffect);
            });
        });

        // Set default active effect
        document.querySelector('.effect-btn[data-effect="neon"]')?.classList.add('active');

        // Text input changes
        document.getElementById('text-input')?.addEventListener('input', () => {
            this.updateTextPreview(selectedEffect);
        });

        // Preview button
        document.getElementById('preview-text-effect')?.addEventListener('click', () => {
            this.updateTextPreview(selectedEffect);
            document.getElementById('text-preview').classList.remove('hidden');
        });

        // Apply effect button
        document.getElementById('apply-text-effect')?.addEventListener('click', async () => {
            const text = document.getElementById('text-input').value || 'Sample Text';
            await this.sandboxProxy.createStyledText(text, selectedEffect);
        });

        // Initial preview
        this.updateTextPreview(selectedEffect);
    }

    updateTextPreview(effect) {
        const text = document.getElementById('text-input').value || 'Sample Text';
        const preview = document.getElementById('preview-canvas');

        if (preview) {
            preview.textContent = text;
            preview.className = `effect-${effect}`;
            document.getElementById('text-preview').classList.remove('hidden');
        }
    }

    setupContentToolkit() {
        this.setupAssetOrganizer();
        this.setupBulkGenerator();
        this.setupProjectNavigator();
    }

    setupAssetOrganizer() {
        // Load saved assets from localStorage
        this.loadAssetLibrary();

        // Add tag to selected asset
        document.getElementById('add-asset-tag')?.addEventListener('click', async () => {
            const tag = document.getElementById('asset-tag-input').value.trim();
            if (tag) {
                await this.addAssetTag(tag);
                document.getElementById('asset-tag-input').value = '';
            }
        });

        // Search assets
        document.getElementById('search-assets')?.addEventListener('click', () => {
            const query = document.getElementById('asset-search').value.trim();
            this.searchAssets(query);
        });

        // Real-time search
        document.getElementById('asset-search')?.addEventListener('input', (e) => {
            this.searchAssets(e.target.value.trim());
        });
    }

    setupBulkGenerator() {
        // CSV file upload
        document.getElementById('csv-upload')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type === 'text/csv') {
                this.processCsvFile(file);
            }
        });

        // Generate bulk content
        document.getElementById('generate-bulk-content')?.addEventListener('click', () => {
            this.generateBulkContent();
        });
    }

    setupProjectNavigator() {
        // Refresh projects
        document.getElementById('refresh-projects')?.addEventListener('click', async () => {
            await this.refreshProjectInfo();
        });

        // List pages
        document.getElementById('list-pages')?.addEventListener('click', async () => {
            await this.listProjectPages();
        });

        // Initial load
        this.refreshProjectInfo();
    }

    setupUIEnhancer() {
        this.setupQuickAccessToolbar();
        this.setupPatternGenerator();
        this.setupFilterCreator();
    }

    setupPatternGenerator() {
        this.selectedPattern = 'geometric';
        this.patternCanvas = document.getElementById('pattern-canvas');
        this.patternCtx = this.patternCanvas?.getContext('2d');

        // Pattern type selection
        document.querySelectorAll('.pattern-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.pattern-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedPattern = e.target.dataset.pattern;
                this.generatePatternPreview();
            });
        });

        // Set default active pattern
        document.querySelector('.pattern-btn[data-pattern="geometric"]')?.classList.add('active');

        // Pattern size control
        const sizeSlider = document.getElementById('pattern-size');
        const sizeValue = document.getElementById('pattern-size-value');
        if (sizeSlider && sizeValue) {
            sizeSlider.addEventListener('input', (e) => {
                sizeValue.textContent = e.target.value;
                this.generatePatternPreview();
            });
        }

        // Color controls
        document.getElementById('pattern-color1')?.addEventListener('change', () => {
            this.generatePatternPreview();
        });
        document.getElementById('pattern-color2')?.addEventListener('change', () => {
            this.generatePatternPreview();
        });

        // Action buttons
        document.getElementById('generate-pattern')?.addEventListener('click', () => {
            this.generatePatternPreview();
            this.showStatusMessage('Pattern regenerated!');
        });

        document.getElementById('apply-pattern')?.addEventListener('click', async () => {
            await this.applyPatternToSelected();
        });

        document.getElementById('create-pattern-element')?.addEventListener('click', async () => {
            await this.createPatternElement();
        });

        // Initial pattern generation
        this.generatePatternPreview();
    }

    generatePatternPreview() {
        if (!this.patternCtx) return;

        const canvas = this.patternCanvas;
        const ctx = this.patternCtx;
        const size = parseInt(document.getElementById('pattern-size')?.value || 30);
        const color1 = document.getElementById('pattern-color1')?.value || '#007acc';
        const color2 = document.getElementById('pattern-color2')?.value || '#ffffff';

        // Clear canvas
        ctx.fillStyle = color2;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Generate pattern based on type
        switch (this.selectedPattern) {
            case 'geometric':
                this.drawGeometricPattern(ctx, canvas.width, canvas.height, size, color1, color2);
                break;
            case 'dots':
                this.drawDotsPattern(ctx, canvas.width, canvas.height, size, color1, color2);
                break;
            case 'stripes':
                this.drawStripesPattern(ctx, canvas.width, canvas.height, size, color1, color2);
                break;
            case 'waves':
                this.drawWavesPattern(ctx, canvas.width, canvas.height, size, color1, color2);
                break;
            case 'hexagon':
                this.drawHexagonPattern(ctx, canvas.width, canvas.height, size, color1, color2);
                break;
            case 'noise':
                this.drawNoisePattern(ctx, canvas.width, canvas.height, size, color1, color2);
                break;
        }
    }

    drawGeometricPattern(ctx, width, height, size, color1, color2) {
        ctx.fillStyle = color1;
        for (let x = 0; x < width; x += size) {
            for (let y = 0; y < height; y += size) {
                if ((x / size + y / size) % 2 === 0) {
                    ctx.fillRect(x, y, size / 2, size / 2);
                    ctx.fillRect(x + size / 2, y + size / 2, size / 2, size / 2);
                }
            }
        }
    }

    drawDotsPattern(ctx, width, height, size, color1, color2) {
        ctx.fillStyle = color1;
        const radius = size / 6;
        for (let x = size / 2; x < width; x += size) {
            for (let y = size / 2; y < height; y += size) {
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    drawStripesPattern(ctx, width, height, size, color1, color2) {
        ctx.fillStyle = color1;
        for (let x = 0; x < width; x += size) {
            if (Math.floor(x / size) % 2 === 0) {
                ctx.fillRect(x, 0, size / 2, height);
            }
        }
    }

    drawWavesPattern(ctx, width, height, size, color1, color2) {
        ctx.strokeStyle = color1;
        ctx.lineWidth = 3;
        const amplitude = size / 4;
        const frequency = Math.PI * 2 / size;

        for (let y = 0; y < height; y += size / 2) {
            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                const waveY = y + Math.sin(x * frequency) * amplitude;
                if (x === 0) ctx.moveTo(x, waveY);
                else ctx.lineTo(x, waveY);
            }
            ctx.stroke();
        }
    }

    drawHexagonPattern(ctx, width, height, size, color1, color2) {
        ctx.fillStyle = color1;
        const hexSize = size / 3;
        const hexHeight = hexSize * Math.sqrt(3);

        for (let row = 0; row < height / hexHeight + 1; row++) {
            for (let col = 0; col < width / (hexSize * 1.5) + 1; col++) {
                const x = col * hexSize * 1.5;
                const y = row * hexHeight + (col % 2) * hexHeight / 2;
                this.drawHexagon(ctx, x, y, hexSize);
            }
        }
    }

    drawHexagon(ctx, x, y, size) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const hx = x + size * Math.cos(angle);
            const hy = y + size * Math.sin(angle);
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fill();
    }

    drawNoisePattern(ctx, width, height, size, color1, color2) {
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        const color1RGB = this.hexToRgb(color1);
        const color2RGB = this.hexToRgb(color2);

        for (let i = 0; i < data.length; i += 4) {
            const noise = Math.random();
            const useColor1 = noise > 0.5;
            const color = useColor1 ? color1RGB : color2RGB;

            data[i] = color.r;     // Red
            data[i + 1] = color.g; // Green
            data[i + 2] = color.b; // Blue
            data[i + 3] = 255;     // Alpha
        }

        ctx.putImageData(imageData, 0, 0);
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    async applyPatternToSelected() {
        try {
            const patternData = this.getPatternData();
            console.log('Applying pattern to selected elements:', patternData);

            const result = await this.sandboxProxy.applyPatternToElements(patternData);

            if (result) {
                this.showStatusMessage(`${patternData.type} pattern applied to selected elements!`);
            } else {
                this.showStatusMessage('No suitable elements selected for pattern application', 'error');
            }
        } catch (error) {
            console.error('Pattern application failed:', error);
            this.showStatusMessage('Pattern application failed', 'error');
        }
    }

    async createPatternElement() {
        try {
            const patternData = this.getPatternData();
            console.log('Creating pattern element with data:', patternData);

            const result = await this.sandboxProxy.createPatternElement(patternData);

            if (result) {
                this.showStatusMessage(`${patternData.type} pattern element created successfully!`);
            } else {
                this.showStatusMessage('Failed to create pattern element', 'error');
            }
        } catch (error) {
            console.error('Pattern element creation failed:', error);
            this.showStatusMessage('Pattern element creation failed', 'error');
        }
    }

    getPatternData() {
        const size = parseInt(document.getElementById('pattern-size')?.value || 30);
        const color1 = document.getElementById('pattern-color1')?.value || '#007acc';
        const color2 = document.getElementById('pattern-color2')?.value || '#ffffff';

        return {
            type: this.selectedPattern,
            size: size,
            color1: color1,
            color2: color2,
            canvas: this.patternCanvas ? this.patternCanvas.toDataURL() : null,
            // Add pattern-specific properties
            properties: {
                primaryColor: color1,
                secondaryColor: color2,
                scale: size,
                variant: this.selectedPattern
            }
        };
    }

    setupQuickAccessToolbar() {
        // Load saved toolbar
        this.loadCustomToolbar();

        // Action button selection
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.addToToolbar(e.currentTarget.dataset.action);
            });
        });

        // Toolbar management
        document.getElementById('save-toolbar')?.addEventListener('click', () => {
            this.saveCustomToolbar();
        });

        document.getElementById('reset-toolbar')?.addEventListener('click', () => {
            this.resetCustomToolbar();
        });

        // Setup drag and drop
        this.setupToolbarDragDrop();
    }

    addToToolbar(actionType) {
        const toolbar = document.getElementById('custom-toolbar');
        const placeholder = toolbar.querySelector('.toolbar-placeholder');

        // Remove placeholder if it exists
        if (placeholder) {
            placeholder.remove();
        }

        // Check if action already exists
        if (toolbar.querySelector(`[data-action="${actionType}"]`)) {
            return;
        }

        // Get action details
        const actionBtn = document.querySelector(`.action-btn[data-action="${actionType}"]`);
        const icon = actionBtn.querySelector('.action-icon').textContent;
        const label = actionBtn.querySelector('.action-label').textContent;

        // Create toolbar action
        const toolbarAction = document.createElement('div');
        toolbarAction.className = 'toolbar-action';
        toolbarAction.dataset.action = actionType;
        toolbarAction.innerHTML = `
            <span>${icon}</span>
            <span>${label}</span>
            <button class="remove-btn">×</button>
        `;

        // Add click handler for the action
        toolbarAction.addEventListener('click', (e) => {
            if (!e.target.classList.contains('remove-btn')) {
                this.executeToolbarAction(actionType);
            }
        });

        // Add remove handler
        toolbarAction.querySelector('.remove-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toolbarAction.remove();
            this.updateActionButtonStates();

            // Add placeholder back if toolbar is empty
            if (toolbar.children.length === 0) {
                toolbar.innerHTML = '<div class="toolbar-placeholder">Drag actions here to build your toolbar</div>';
            }
        });

        toolbar.appendChild(toolbarAction);
        this.updateActionButtonStates();
    }

    async executeToolbarAction(actionType) {
        try {
            switch (actionType) {
                case 'duplicate':
                    await this.sandboxProxy.duplicateSelectedElement();
                    break;
                case 'remove-bg':
                    await this.sandboxProxy.removeBackground();
                    break;
                case 'add-text':
                    await this.sandboxProxy.createTestText();
                    break;
                case 'add-shape':
                    await this.sandboxProxy.createTestRectangle();
                    break;
                case 'crop-image':
                    await this.sandboxProxy.cropSelectedImage();
                    break;
                case 'flip-horizontal':
                    await this.sandboxProxy.flipElement('horizontal');
                    break;
                case 'flip-vertical':
                    await this.sandboxProxy.flipElement('vertical');
                    break;
            }
            console.log(`✅ Executed action: ${actionType}`);
            this.showStatusMessage(`Action "${actionType}" completed successfully`);
        } catch (error) {
            console.error(`❌ Failed to execute action ${actionType}:`, error);
            this.showStatusMessage(`Action "${actionType}" failed: ${error.message}`, 'error');
        }
    }

    updateActionButtonStates() {
        const toolbarActions = document.querySelectorAll('#custom-toolbar .toolbar-action');
        const usedActions = Array.from(toolbarActions).map(action => action.dataset.action);

        document.querySelectorAll('.action-btn').forEach(btn => {
            if (usedActions.includes(btn.dataset.action)) {
                btn.classList.add('in-toolbar');
            } else {
                btn.classList.remove('in-toolbar');
            }
        });
    }

    saveCustomToolbar() {
        const toolbarActions = Array.from(document.querySelectorAll('#custom-toolbar .toolbar-action'));
        const savedToolbar = toolbarActions.map(action => action.dataset.action);

        localStorage.setItem('customToolbar', JSON.stringify(savedToolbar));
        console.log('✅ Toolbar saved successfully!');
        this.showStatusMessage('Toolbar saved successfully!');
    }

    loadCustomToolbar() {
        const savedToolbar = JSON.parse(localStorage.getItem('customToolbar') || '[]');

        if (savedToolbar.length > 0) {
            // Clear current toolbar
            document.getElementById('custom-toolbar').innerHTML = '';

            // Add saved actions
            savedToolbar.forEach(actionType => {
                this.addToToolbar(actionType);
            });
        }
    }

    resetCustomToolbar() {
        document.getElementById('custom-toolbar').innerHTML =
            '<div class="toolbar-placeholder">Drag actions here to build your toolbar</div>';
        this.updateActionButtonStates();
        localStorage.removeItem('customToolbar');
    }

    setupToolbarDragDrop() {
        const toolbar = document.getElementById('custom-toolbar');

        // Make action buttons draggable
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.draggable = true;

            btn.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', btn.dataset.action);
            });
        });

        // Setup drop zone
        toolbar.addEventListener('dragover', (e) => {
            e.preventDefault();
            toolbar.classList.add('drag-over');
        });

        toolbar.addEventListener('dragleave', () => {
            toolbar.classList.remove('drag-over');
        });

        toolbar.addEventListener('drop', (e) => {
            e.preventDefault();
            toolbar.classList.remove('drag-over');

            const actionType = e.dataTransfer.getData('text/plain');
            this.addToToolbar(actionType);
        });
    }

    // Asset Organizer Methods
    async addAssetTag(tag) {
        // Try to capture selected element first
        const selectedAsset = await this.sandboxProxy.captureSelectedAsset();

        const assets = JSON.parse(localStorage.getItem('taggedAssets') || '[]');
        const newAsset = {
            id: Date.now(),
            name: selectedAsset ? `${selectedAsset.type} Element` : `Asset ${assets.length + 1}`,
            tags: [tag],
            timestamp: new Date().toISOString(),
            elementData: selectedAsset // Store the actual element data
        };

        assets.push(newAsset);
        localStorage.setItem('taggedAssets', JSON.stringify(assets));
        this.loadAssetLibrary();

        if (selectedAsset) {
            console.log('Captured asset:', selectedAsset);
        } else {
            console.log('No element selected, created placeholder asset');
        }
    }

    loadAssetLibrary() {
        const assets = JSON.parse(localStorage.getItem('taggedAssets') || '[]');
        const container = document.getElementById('asset-library');

        container.innerHTML = assets.map(asset => `
            <div class="asset-item" data-id="${asset.id}" style="cursor: pointer;">
                <div>${asset.name}</div>
                <div class="asset-tags">
                    ${asset.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                ${asset.elementData ? '<div style="font-size: 10px; color: #666;">Click to recreate</div>' : ''}
            </div>
        `).join('');

        // Add click handlers to recreate assets
        container.querySelectorAll('.asset-item').forEach(item => {
            item.addEventListener('click', async () => {
                const assetId = parseInt(item.dataset.id);
                await this.recreateAsset(assetId);
            });
        });
    }

    searchAssets(query) {
        const assets = JSON.parse(localStorage.getItem('taggedAssets') || '[]');
        const filtered = query ? assets.filter(asset =>
            asset.name.toLowerCase().includes(query.toLowerCase()) ||
            asset.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        ) : assets;

        const container = document.getElementById('asset-library');
        container.innerHTML = filtered.map(asset => `
            <div class="asset-item" data-id="${asset.id}">
                <div>${asset.name}</div>
                <div class="asset-tags">
                    ${asset.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        `).join('');
    }

    async recreateAsset(assetId) {
        const assets = JSON.parse(localStorage.getItem('taggedAssets') || '[]');
        const asset = assets.find(a => a.id === assetId);

        if (asset && asset.elementData) {
            const result = await this.sandboxProxy.recreateAssetFromTemplate(asset.elementData);
            if (result) {
                console.log('Asset recreated successfully');
            } else {
                console.log('Failed to recreate asset');
            }
        } else {
            console.log('No element data found for this asset');
        }
    }

    // CSV Bulk Generator Methods
    processCsvFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const csv = e.target.result;
            const lines = csv.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim());
            const allData = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));
            const previewData = allData.slice(0, 5); // First 5 rows for preview

            // Set csvData BEFORE calling displayCsvPreview
            this.csvData = { headers, data: allData };

            this.displayCsvPreview(headers, previewData);
        };
        reader.readAsText(file);
    }

    displayCsvPreview(headers, previewData) {
        const headersDiv = document.getElementById('csv-headers');
        const dataDiv = document.getElementById('csv-data');

        // Show headers
        headersDiv.innerHTML = `<strong>Headers:</strong> ${headers.join(', ')}`;

        // Show preview data
        const table = document.createElement('table');
        table.className = 'csv-table';

        // Header row
        const headerRow = table.insertRow();
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });

        // Data rows
        previewData.forEach(row => {
            const dataRow = table.insertRow();
            row.forEach(cell => {
                const td = dataRow.insertCell();
                td.textContent = cell;
            });
        });

        dataDiv.innerHTML = '';
        dataDiv.appendChild(table);

        // Show mapping controls
        this.showColumnMapping(headers);
    }

    showColumnMapping(headers) {
        const mappingDiv = document.getElementById('column-mapping');
        const mappingControls = document.getElementById('mapping-controls');

        mappingDiv.innerHTML = headers.map(header => `
            <div class="column-mapping-item">
                <label>${header}:</label>
                <select data-column="${header}">
                    <option value="">Skip</option>
                    <option value="text" ${header.toLowerCase().includes('title') || header.toLowerCase().includes('text') ? 'selected' : ''}>Text Content</option>
                    <option value="title" ${header.toLowerCase() === 'title' ? 'selected' : ''}>Title Text</option>
                    <option value="subtitle" ${header.toLowerCase() === 'subtitle' ? 'selected' : ''}>Subtitle Text</option>
                    <option value="color" ${header.toLowerCase() === 'color' || header.toLowerCase() === 'background' ? 'selected' : ''}>Fill Color</option>
                    <option value="background" ${header.toLowerCase() === 'background' ? 'selected' : ''}>Background Color</option>
                    <option value="width" ${header.toLowerCase().includes('width') ? 'selected' : ''}>Element Width</option>
                    <option value="height" ${header.toLowerCase().includes('height') ? 'selected' : ''}>Element Height</option>
                    <option value="x-position" ${header.toLowerCase().includes('x') || header.toLowerCase().includes('position') ? 'selected' : ''}>X Position</option>
                    <option value="y-position" ${header.toLowerCase().includes('y') || header.toLowerCase().includes('position') ? 'selected' : ''}>Y Position</option>
                </select>
            </div>
        `).join('');

        mappingControls.classList.remove('hidden');
        document.getElementById('csv-preview').classList.remove('hidden');
    }

    async generateBulkContent() {
        if (!this.csvData) {
            console.error('Please upload a CSV file first');
            return;
        }

        const mappings = {};
        document.querySelectorAll('#column-mapping select').forEach(select => {
            if (select.value) {
                mappings[select.dataset.column] = select.value;
            }
        });

        if (Object.keys(mappings).length === 0) {
            console.error('Please map at least one column to an element property');
            return;
        }

        const maxItems = Math.min(this.csvData.data.length, 10);
        let createdElements = 0;
        let startY = 50;

        console.log('Starting bulk generation with mappings:', mappings);

        for (let i = 0; i < maxItems; i++) {
            const row = this.csvData.data[i];
            const elementData = {};

            // Process each mapped column
            this.csvData.headers.forEach((header, index) => {
                if (mappings[header] && row[index]) {
                    elementData[mappings[header]] = row[index].trim();
                }
            });

            console.log('Processing row', i, 'with data:', elementData);

            // Create elements based on mapped data
            await this.createElementFromData(elementData, i, startY + (i * 80));
            createdElements++;
        }

        console.log(`Generated ${createdElements} content variations from CSV data!`);
    }

    async createElementFromData(data, index, yPosition) {
        const xPosition = 50 + (index % 3) * 200;

        // Debug: log the actual data being processed
        console.log('Processing row', index, 'with data:', data);

        // Create text elements - ensure we have valid text content
        if (data.text || data.title || data.subtitle) {
            const textContent = (data.text || data.title || data.subtitle || '').trim();

            if (textContent) {
                // Use either 'color' or 'background' field for color
                const colorValue = data.color || data.background;
                console.log('Creating text element with content:', textContent, 'color:', colorValue);

                const elementId = await this.sandboxProxy.createBulkTextElement({
                    text: textContent,
                    x: parseInt(data['x-position']) || xPosition,
                    y: parseInt(data['y-position']) || yPosition,
                    fontSize: data.title ? 24 : 16,
                    width: parseInt(data.width) || 150,
                    height: parseInt(data.height) || 40,
                    color: colorValue // Pass the color value
                });

                console.log('Element created with ID:', elementId);

                // Additional attempt to apply color if element was created
                if (colorValue && elementId) {
                    console.log('Attempting to apply color', colorValue, 'to element', elementId);
                    const colorResult = await this.sandboxProxy.applyColorToElement(elementId, colorValue);
                    console.log('Color application result:', colorResult);
                }
            }
        }
        // Create rectangle if we have size/position data but no text
        else if (data.width || data.height || data['x-position'] || data['y-position']) {
            const colorValue = data.color || data.background;
            const elementId = await this.sandboxProxy.createBulkRectangle({
                x: parseInt(data['x-position']) || xPosition,
                y: parseInt(data['y-position']) || yPosition,
                width: parseInt(data.width) || 100,
                height: parseInt(data.height) || 80,
                color: colorValue
            });
            console.log('Rectangle created with ID:', elementId);
        }
    }

    // Project Navigator Methods
    async refreshProjectInfo() {
        try {
            const projectInfo = await this.sandboxProxy.getProjectInfo();
            const stats = await this.sandboxProxy.getDocumentStats();

            const projectInfoDiv = document.getElementById('current-project');
            projectInfoDiv.innerHTML = `
                <div class="project-details">
                    <h4>📄 ${projectInfo.name}</h4>
                    <div class="project-stats">
                        <span>📊 ${stats.totalElements} elements</span>
                        <span>📝 ${stats.textElements} text</span>
                        <span>🔷 ${stats.shapeElements} shapes</span>
                        <span>🖼️ ${stats.imageElements} images</span>
                    </div>
                    <div class="project-meta">
                        <span>📑 ${projectInfo.pageCount} page(s)</span>
                        <span>📍 Page ${projectInfo.currentPageIndex + 1} active</span>
                    </div>
                </div>
            `;

            console.log('Project info refreshed:', projectInfo);
        } catch (error) {
            console.error('Failed to refresh project info:', error);
            document.getElementById('current-project').innerHTML = `
                <div class="project-details">
                    <h4>📄 Adobe Express Document</h4>
                    <div class="project-stats">
                        <span>❌ Unable to load project details</span>
                    </div>
                </div>
            `;
        }
    }

    async listProjectPages() {
        try {
            const pages = await this.sandboxProxy.getProjectPages();
            const pagesDiv = document.getElementById('project-pages');

            pagesDiv.innerHTML = `
                <div class="pages-header">
                    <h4>📑 Pages in Project</h4>
                    <button id="refresh-pages" class="small-btn">🔄 Refresh</button>
                </div>
                <div class="page-list">
                    ${pages.map(page => `
                        <div class="page-item ${page.isCurrent ? 'current-page' : ''}" data-page-index="${page.index}">
                            <div class="page-info">
                                <span class="page-name">${page.name}</span>
                                <span class="page-elements">${page.elementCount} elements</span>
                            </div>
                            ${page.isCurrent ? '<span class="current-indicator">📍 Current</span>' : '<button class="navigate-btn">Go to Page</button>'}
                        </div>
                    `).join('')}
                </div>
            `;

            // Add navigation handlers
            pagesDiv.querySelectorAll('.navigate-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const pageIndex = parseInt(e.target.closest('.page-item').dataset.pageIndex);
                    await this.navigateToPage(pageIndex);
                });
            });

            // Add refresh handler
            document.getElementById('refresh-pages')?.addEventListener('click', async () => {
                await this.listProjectPages();
            });

            console.log('Pages listed:', pages.length);
        } catch (error) {
            console.error('Failed to list pages:', error);
            document.getElementById('project-pages').innerHTML = `
                <div class="pages-header">
                    <h4>📑 Pages in Project</h4>
                </div>
                <div class="page-list">
                    <div class="page-item error">
                        <span>❌ Unable to load pages</span>
                    </div>
                </div>
            `;
        }
    }

    async navigateToPage(pageIndex) {
        try {
            const success = await this.sandboxProxy.navigateToPage(pageIndex);
            if (success) {
                console.log('Navigated to page:', pageIndex);
                this.showStatusMessage(`Navigated to page ${pageIndex + 1}`);
                // Refresh the page list to update current page indicator
                setTimeout(() => this.listProjectPages(), 500);
            } else {
                console.log('Page navigation not available or failed');
                this.showStatusMessage('Page navigation is not currently supported in this version of Adobe Express', 'error');
            }
        } catch (error) {
            console.error('Failed to navigate to page:', error);
            this.showStatusMessage('Failed to navigate to page', 'error');
        }
    }

    showStatusMessage(message, type = 'success') {
        // Create or update status message element
        let statusEl = document.getElementById('status-message');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = 'status-message';
            statusEl.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 12px 16px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                z-index: 1000;
                max-width: 300px;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(statusEl);
        }

        // Set message and style
        statusEl.textContent = message;
        statusEl.style.backgroundColor = type === 'error' ? '#ffebee' : '#e8f5e8';
        statusEl.style.color = type === 'error' ? '#c62828' : '#2e7d32';
        statusEl.style.border = type === 'error' ? '1px solid #ef5350' : '1px solid #66bb6a';
        statusEl.style.display = 'block';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 3000);
    }

    setupFilterCreator() {
        // Load saved filters
        this.loadFilterLibrary();

        // Filter control sliders
        const sliders = ['brightness', 'contrast', 'saturation', 'blur'];
        sliders.forEach(filter => {
            const slider = document.getElementById(`${filter}-slider`);
            const valueDisplay = document.getElementById(`${filter}-value`);

            if (slider && valueDisplay) {
                slider.addEventListener('input', (e) => {
                    const value = e.target.value;
                    valueDisplay.textContent = value;
                    this.updateFilterPreview();
                });
            }
        });

        // Save filter
        document.getElementById('save-filter')?.addEventListener('click', () => {
            this.saveCurrentFilter();
        });

        // Apply filter to selected elements
        document.getElementById('apply-filter')?.addEventListener('click', async () => {
            await this.applyFilterToSelected();
        });

        // Reset all filters
        document.getElementById('reset-filters')?.addEventListener('click', () => {
            this.resetAllFilters();
        });

        // Initial preview update
        this.updateFilterPreview();
    }

    updateFilterPreview() {
        const brightness = document.getElementById('brightness-slider')?.value || 0;
        const contrast = document.getElementById('contrast-slider')?.value || 0;
        const saturation = document.getElementById('saturation-slider')?.value || 0;
        const blur = document.getElementById('blur-slider')?.value || 0;

        const previewElement = document.querySelector('.preview-element');
        if (previewElement) {
            const filters = [];

            if (brightness != 0) filters.push(`brightness(${100 + parseInt(brightness)}%)`);
            if (contrast != 0) filters.push(`contrast(${100 + parseInt(contrast)}%)`);
            if (saturation != 0) filters.push(`saturate(${100 + parseInt(saturation)}%)`);
            if (blur != 0) filters.push(`blur(${blur}px)`);

            previewElement.style.filter = filters.join(' ');
        }
    }

    saveCurrentFilter() {
        const name = document.getElementById('filter-name')?.value.trim();
        if (!name) {
            this.showStatusMessage('Please enter a filter name', 'error');
            return;
        }

        const filterData = {
            name: name,
            brightness: parseInt(document.getElementById('brightness-slider')?.value || 0),
            contrast: parseInt(document.getElementById('contrast-slider')?.value || 0),
            saturation: parseInt(document.getElementById('saturation-slider')?.value || 0),
            blur: parseInt(document.getElementById('blur-slider')?.value || 0),
            timestamp: new Date().toISOString()
        };

        const savedFilters = JSON.parse(localStorage.getItem('customFilters') || '[]');
        savedFilters.push(filterData);
        localStorage.setItem('customFilters', JSON.stringify(savedFilters));

        document.getElementById('filter-name').value = '';
        this.loadFilterLibrary();
        this.showStatusMessage(`Filter "${name}" saved successfully!`);
    }

    loadFilterLibrary() {
        const savedFilters = JSON.parse(localStorage.getItem('customFilters') || '[]');
        const container = document.getElementById('filter-library');

        if (!container) return;

        container.innerHTML = savedFilters.map((filter, index) => `
            <div class="filter-item" data-index="${index}">
                <button class="delete-filter" onclick="this.parentElement.remove(); window.toolkit.deleteFilter(${index})">×</button>
                <div class="filter-name">${filter.name}</div>
                <div class="filter-values">
                    B:${filter.brightness} C:${filter.contrast}<br>
                    S:${filter.saturation} Bl:${filter.blur}
                </div>
            </div>
        `).join('');

        // Add click handlers to apply filters
        container.querySelectorAll('.filter-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-filter')) return;

                const index = parseInt(item.dataset.index);
                this.applyFilterFromLibrary(index);
            });
        });
    }

    applyFilterFromLibrary(index) {
        const savedFilters = JSON.parse(localStorage.getItem('customFilters') || '[]');
        const filter = savedFilters[index];

        if (filter) {
            // Update sliders
            document.getElementById('brightness-slider').value = filter.brightness;
            document.getElementById('brightness-value').textContent = filter.brightness;
            document.getElementById('contrast-slider').value = filter.contrast;
            document.getElementById('contrast-value').textContent = filter.contrast;
            document.getElementById('saturation-slider').value = filter.saturation;
            document.getElementById('saturation-value').textContent = filter.saturation;
            document.getElementById('blur-slider').value = filter.blur;
            document.getElementById('blur-value').textContent = filter.blur;

            // Update preview
            this.updateFilterPreview();

            // Highlight selected filter
            document.querySelectorAll('.filter-item').forEach(item => item.classList.remove('active'));
            document.querySelector(`[data-index="${index}"]`)?.classList.add('active');

            this.showStatusMessage(`Applied filter: ${filter.name}`);
        }
    }

    async applyFilterToSelected() {
        const brightness = parseInt(document.getElementById('brightness-slider')?.value || 0);
        const contrast = parseInt(document.getElementById('contrast-slider')?.value || 0);
        const saturation = parseInt(document.getElementById('saturation-slider')?.value || 0);
        const blur = parseInt(document.getElementById('blur-slider')?.value || 0);

        try {
            const result = await this.sandboxProxy.applyImageFilter({
                brightness,
                contrast,
                saturation,
                blur
            });

            if (result) {
                this.showStatusMessage('Filter applied successfully!');
            } else {
                this.showStatusMessage('No suitable elements selected for filtering', 'error');
            }
        } catch (error) {
            console.error('Filter application failed:', error);
            this.showStatusMessage('Filter application failed - feature requires image elements', 'error');
        }
    }

    resetAllFilters() {
        document.getElementById('brightness-slider').value = 0;
        document.getElementById('brightness-value').textContent = 0;
        document.getElementById('contrast-slider').value = 0;
        document.getElementById('contrast-value').textContent = 0;
        document.getElementById('saturation-slider').value = 0;
        document.getElementById('saturation-value').textContent = 0;
        document.getElementById('blur-slider').value = 0;
        document.getElementById('blur-value').textContent = 0;

        this.updateFilterPreview();

        // Remove active state from filter items
        document.querySelectorAll('.filter-item').forEach(item => item.classList.remove('active'));

        this.showStatusMessage('All filters reset to default values');
    }

    deleteFilter(index) {
        const savedFilters = JSON.parse(localStorage.getItem('customFilters') || '[]');
        savedFilters.splice(index, 1);
        localStorage.setItem('customFilters', JSON.stringify(savedFilters));
        this.loadFilterLibrary();
        this.showStatusMessage('Filter deleted');
    }

    setupColorPaletteManager() {
        // Extract colors from selected elements
        document.getElementById('extract-colors')?.addEventListener('click', async () => {
            await this.extractColorsFromSelected();
        });

        // Save current palette
        document.getElementById('save-palette')?.addEventListener('click', async () => {
            await this.saveBrandPalette();
        });

        // Generate color variations
        document.getElementById('generate-variations')?.addEventListener('click', async () => {
            await this.generateColorVariations();
        });

        // Apply palette to selected elements - this was missing
        document.getElementById('apply-palette')?.addEventListener('click', async () => {
            this.showStatusMessage('Please use the Apply button on individual palettes below', 'error');
        });

        // Load existing palettes
        this.loadBrandPalettes();
    }

    async extractColorsFromSelected() {
        try {
            const result = await this.sandboxProxy.extractColorsFromSelected();
            
            if (result.success) {
                this.currentExtractedColors = result.colors;
                this.displayExtractedColors(result.colors);
                this.showStatusMessage(result.message);
            } else {
                this.showStatusMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('Color extraction failed:', error);
            this.showStatusMessage('Color extraction failed', 'error');
        }
    }

    displayExtractedColors(colors) {
        const container = document.getElementById('extracted-colors');
        if (!container) return;

        container.innerHTML = '';
        
        if (colors.length === 0) {
            container.innerHTML = '<p class="no-colors">No colors found in selected elements</p>';
            return;
        }

        colors.forEach((color, index) => {
            const colorItem = document.createElement('div');
            colorItem.className = 'color-item';
            colorItem.innerHTML = `
                <div class="color-swatch" style="background-color: ${color.hex}"></div>
                <div class="color-info">
                    <div class="color-hex">${color.hex}</div>
                    <div class="color-source">${color.source}</div>
                </div>
                <button class="color-action" data-color="${color.hex}">Copy</button>
            `;
            
            // Add event listener for copy button
            const copyBtn = colorItem.querySelector('.color-action');
            copyBtn.addEventListener('click', () => {
                this.copyColorToClipboard(color.hex);
            });
            
            container.appendChild(colorItem);
        });
    }

    async saveBrandPalette() {
        const paletteName = document.getElementById('palette-name')?.value.trim();
        
        if (!paletteName) {
            this.showStatusMessage('Please enter a palette name', 'error');
            return;
        }

        if (!this.currentExtractedColors || this.currentExtractedColors.length === 0) {
            this.showStatusMessage('No colors to save. Extract colors first.', 'error');
            return;
        }

        try {
            // Handle palette saving directly in iframe
            const existingPalettes = JSON.parse(localStorage.getItem('brandPalettes') || '[]');
            
            const newPalette = {
                id: Date.now(),
                name: paletteName,
                colors: this.currentExtractedColors,
                createdAt: new Date().toISOString(),
                elementCount: this.currentExtractedColors.length
            };

            existingPalettes.push(newPalette);
            localStorage.setItem('brandPalettes', JSON.stringify(existingPalettes));

            this.showStatusMessage(`Palette "${paletteName}" saved successfully!`);
            document.getElementById('palette-name').value = '';
            this.loadBrandPalettes();
        } catch (error) {
            console.error('Failed to save palette:', error);
            this.showStatusMessage('Failed to save palette', 'error');
        }
    }

    async loadBrandPalettes() {
        try {
            // Handle palette loading directly in iframe
            const palettes = JSON.parse(localStorage.getItem('brandPalettes') || '[]');
            this.displayBrandPalettes(palettes);
        } catch (error) {
            console.error('Failed to load palettes:', error);
        }
    }

    displayBrandPalettes(palettes) {
        const container = document.getElementById('saved-palettes');
        if (!container) return;

        container.innerHTML = '';

        if (palettes.length === 0) {
            container.innerHTML = '<p class="no-palettes">No saved palettes</p>';
            return;
        }

        palettes.forEach(palette => {
            const paletteItem = document.createElement('div');
            paletteItem.className = 'palette-item';
            paletteItem.innerHTML = `
                <div class="palette-header">
                    <h4>${palette.name}</h4>
                    <span class="palette-count">${palette.colors.length} colors</span>
                </div>
                <div class="palette-colors">
                    ${palette.colors.map(color => 
                        `<div class="mini-swatch" style="background-color: ${color.hex}" title="${color.hex}"></div>`
                    ).join('')}
                </div>
                <div class="palette-actions">
                    <button class="apply-palette-btn" data-palette-id="${palette.id}">Apply</button>
                    <button class="delete-palette-btn delete-btn" data-palette-id="${palette.id}">Delete</button>
                </div>
            `;
            
            // Add event listeners for palette actions
            const applyBtn = paletteItem.querySelector('.apply-palette-btn');
            const deleteBtn = paletteItem.querySelector('.delete-palette-btn');
            
            applyBtn.addEventListener('click', () => {
                this.applyPalette(palette.id);
            });
            
            deleteBtn.addEventListener('click', () => {
                this.deletePalette(palette.id);
            });
            
            container.appendChild(paletteItem);
        });
    }

    async applyPalette(paletteId) {
        try {
            // Get palette from local storage
            const palettes = JSON.parse(localStorage.getItem('brandPalettes') || '[]');
            const palette = palettes.find(p => p.id === paletteId);
            
            if (!palette) {
                this.showStatusMessage('Palette not found', 'error');
                return;
            }

            const applyResult = await this.sandboxProxy.applyBrandPaletteToSelected(palette);
            
            if (applyResult.success) {
                this.showStatusMessage(applyResult.message);
            } else {
                this.showStatusMessage(applyResult.message, 'error');
            }
        } catch (error) {
            console.error('Failed to apply palette:', error);
            this.showStatusMessage('Failed to apply palette', 'error');
        }
    }

    async deletePalette(paletteId) {
        if (!confirm('Are you sure you want to delete this palette?')) {
            return;
        }

        try {
            // Handle palette deletion directly in iframe
            const palettes = JSON.parse(localStorage.getItem('brandPalettes') || '[]');
            const filteredPalettes = palettes.filter(p => p.id !== paletteId);
            localStorage.setItem('brandPalettes', JSON.stringify(filteredPalettes));
            
            this.showStatusMessage('Palette deleted successfully');
            this.loadBrandPalettes();
        } catch (error) {
            console.error('Failed to delete palette:', error);
            this.showStatusMessage('Failed to delete palette', 'error');
        }
    }

    async generateColorVariations() {
        if (!this.currentExtractedColors || this.currentExtractedColors.length === 0) {
            this.showStatusMessage('Extract colors first to generate variations', 'error');
            return;
        }

        const baseColor = this.currentExtractedColors[0]; // Use first extracted color
        const variationType = document.getElementById('variation-type')?.value || 'tints';

        try {
            const result = await this.sandboxProxy.generateColorVariations(baseColor.rgba, variationType);
            
            if (result.success) {
                this.displayColorVariations(result.variations);
                this.showStatusMessage(`Generated ${result.variations.length} color variations`);
            } else {
                this.showStatusMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('Failed to generate variations:', error);
            this.showStatusMessage('Failed to generate variations', 'error');
        }
    }

    displayColorVariations(variations) {
        const container = document.getElementById('color-variations');
        if (!container) return;

        container.innerHTML = '';

        variations.forEach(variation => {
            const variationItem = document.createElement('div');
            variationItem.className = 'variation-item';
            variationItem.innerHTML = `
                <div class="color-swatch" style="background-color: ${variation.hex}"></div>
                <div class="variation-info">
                    <div class="variation-name">${variation.name}</div>
                    <div class="variation-hex">${variation.hex}</div>
                </div>
            `;
            container.appendChild(variationItem);
        });
    }

    copyColorToClipboard(hex) {
        navigator.clipboard.writeText(hex).then(() => {
            this.showStatusMessage(`Copied ${hex} to clipboard`);
        }).catch(() => {
            this.showStatusMessage('Failed to copy color', 'error');
        });
    }
}

const toolkit = new PrecisionToolkit();
toolkit.init();
