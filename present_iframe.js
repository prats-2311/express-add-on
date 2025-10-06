import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

class PrecisionToolkit {
    constructor() {
        this.sandboxProxy = null;
        this.selectedElements = [];
        this.selectionMonitor = null;
        this.selectedPattern = 'geometric';
        this.patternCanvas = null;
        this.patternCtx = null;
        this.currentExtractedColors = [];
        this.currentColorVariations = [];
        
        // Phase 1 Features State
        this.gridEnabled = false;
        this.rulersEnabled = false;
        this.snapToGridEnabled = false;
        this.smartGuidesEnabled = false;
        this.centerGuidesEnabled = false;
        this.marginGuidesEnabled = false;
        this.gridSize = 20;
        this.gridOpacity = 0.3;
        this.guideColor = '#ff0066';
        this.snapTolerance = 10;
        this.layerList = [];
        this.selectedLayerId = null;
        this.currentGridElementIds = []; // Store grid element IDs for removal
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
        
        // Phase 1 Features
        this.setupRulersAndGrid();
        this.setupLayerManagement();
        this.setupSmartGuides();
        
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
            <div class="asset-item" data-id="${asset.id}" style="cursor: pointer; position: relative;">
                <button class="delete-asset-btn" onclick="window.toolkit.deleteAsset(${asset.id})" style="position: absolute; top: 4px; right: 4px; background: #dc3545; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
                <div>${asset.name}</div>
                <div class="asset-tags">
                    ${asset.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                ${asset.elementData ? '<div style="font-size: 10px; color: #666;">Click to recreate</div>' : ''}
            </div>
        `).join('');

        // Add click handlers to recreate assets
        container.querySelectorAll('.asset-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                // Don't recreate if delete button was clicked
                if (e.target.classList.contains('delete-asset-btn')) return;
                
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

    deleteAsset(assetId) {
        try {
            const assets = JSON.parse(localStorage.getItem('taggedAssets') || '[]');
            const filteredAssets = assets.filter(asset => asset.id !== assetId);
            localStorage.setItem('taggedAssets', JSON.stringify(filteredAssets));
            
            this.loadAssetLibrary();
            this.showStatusMessage('Asset deleted successfully');
        } catch (error) {
            console.error('Failed to delete asset:', error);
            this.showStatusMessage('Failed to delete asset', 'error');
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
        const mappingDiv = document.getElementById('column-mapping');

        // Show headers
        headersDiv.innerHTML = `<strong>Headers:</strong> ${headers.join(', ')}`;

        // Show preview data table
        const table = document.createElement('table');
        table.className = 'csv-table';

        // Header row
        const headerRow = table.insertRow();
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });

        // Data rows (first 3 for preview)
        previewData.slice(0, 3).forEach(row => {
            const dataRow = table.insertRow();
            row.forEach(cell => {
                const td = dataRow.insertCell();
                td.textContent = cell;
            });
        });

        dataDiv.innerHTML = '';
        dataDiv.appendChild(table);

        // Create column mapping controls
        mappingDiv.innerHTML = '<h4>Map CSV Columns to Element Properties:</h4>';
        
        headers.forEach(header => {
            const mappingRow = document.createElement('div');
            mappingRow.className = 'mapping-row';
            mappingRow.innerHTML = `
                <label>${header}:</label>
                <select data-column="${header}">
                    <option value="">-- Select Property --</option>
                    <option value="title">Title Text</option>
                    <option value="subtitle">Subtitle Text</option>
                    <option value="text">Text Content</option>
                    <option value="color">Text Color</option>
                    <option value="fontSize">Font Size</option>
                    <option value="x-position">X Position</option>
                    <option value="y-position">Y Position</option>
                    <option value="width">Width</option>
                    <option value="height">Height</option>
                </select>
            `;
            mappingDiv.appendChild(mappingRow);
        });

        // Show the mapping controls and preview
        document.getElementById('csv-preview').classList.remove('hidden');
        document.getElementById('mapping-controls').classList.remove('hidden');
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
            this.showStatusMessage('Please upload a CSV file first', 'error');
            return;
        }

        const mappings = {};
        document.querySelectorAll('#column-mapping select').forEach(select => {
            if (select.value) {
                mappings[select.dataset.column] = select.value;
            }
        });

        if (Object.keys(mappings).length === 0) {
            this.showStatusMessage('Please map at least one column to an element property', 'error');
            return;
        }

        // Clear existing elements first (optional - you can comment this out)
        try {
            const clearResult = await this.sandboxProxy.clearAllElements();
            if (clearResult.success) {
                console.log(`Cleared ${clearResult.clearedCount} existing elements`);
            }
        } catch (e) {
            console.log('Could not clear elements:', e);
        }

        const maxItems = Math.min(this.csvData.data.length, 12); // Limit to 12 items for 3x4 grid
        let createdElements = 0;

        console.log('Starting bulk generation with mappings:', mappings);
        console.log('CSV headers:', this.csvData.headers);
        console.log('CSV data rows:', this.csvData.data.length);

        this.showStatusMessage('Generating content from CSV data...', 'info');

        for (let i = 0; i < maxItems; i++) {
            const row = this.csvData.data[i];
            const elementData = {};

            // Process each mapped column
            this.csvData.headers.forEach((header, headerIndex) => {
                if (mappings[header] && row[headerIndex]) {
                    const value = row[headerIndex].trim();
                    elementData[mappings[header]] = value;
                    console.log(`Row ${i}: Mapping ${header} -> ${mappings[header]}: ${value}`);
                }
            });

            console.log(`Processing row ${i} with data:`, elementData);

            // Add a small delay between creations to avoid overlap
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 150));
            }

            // Create elements based on mapped data
            await this.createElementFromData(elementData, i);
            createdElements++;
        }

        this.showStatusMessage(`Successfully generated ${createdElements} content variations from CSV data!`);
    }

    async createElementFromData(data, index) {
        // Adobe Express canvas dimensions (typical social media format)
        const canvasWidth = 1080;
        const canvasHeight = 1080;
        
        // Calculate grid position within canvas bounds
        const margin = 80;
        const elementWidth = 200;
        const elementHeight = 60;
        const spacing = 220; // Horizontal spacing between elements
        const rowHeight = 120; // Vertical spacing between rows
        
        const columns = Math.floor((canvasWidth - 2 * margin) / spacing); // Calculate max columns
        const maxColumns = Math.min(columns, 4); // Limit to 4 columns max
        
        const col = index % maxColumns;
        const row = Math.floor(index / maxColumns);
        
        const xPosition = margin + col * spacing;
        const yPosition = margin + row * rowHeight;

        // Ensure we don't go outside canvas bounds
        const finalX = Math.min(xPosition, canvasWidth - elementWidth - margin);
        const finalY = Math.min(yPosition, canvasHeight - elementHeight - margin);

        console.log(`Creating element ${index} at grid position (${col}, ${row}) = (${finalX}, ${finalY})`);
        console.log('Element data:', data);

        try {
            // Use CSV coordinates if provided, otherwise use calculated grid position
            const useCSVPosition = data['x-position'] && data['y-position'];
            const x = useCSVPosition ? parseInt(data['x-position']) : finalX;
            const y = useCSVPosition ? parseInt(data['y-position']) : finalY;

            // Create main text element (title or main text)
            const mainText = data.title || data.text || `Item ${index + 1}`;
            
            const result = await this.sandboxProxy.createBulkTextElement({
                text: mainText,
                fontSize: parseInt(data.fontSize) || 18,
                x: x,
                y: y,
                width: parseInt(data.width) || elementWidth,
                height: parseInt(data.height) || elementHeight,
                color: data.color || 'black'
            });

            if (result.success) {
                console.log(`Successfully created main text: "${mainText}" at (${x}, ${y})`);
                
                // Create subtitle if it exists and is different from title
                if (data.subtitle && data.subtitle !== data.title) {
                    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
                    
                    const subtitleResult = await this.sandboxProxy.createBulkTextElement({
                        text: data.subtitle,
                        fontSize: (parseInt(data.fontSize) || 18) - 4,
                        x: x,
                        y: y + 35, // Position below main text
                        width: parseInt(data.width) || elementWidth,
                        height: parseInt(data.height) || 30,
                        color: 'gray'
                    });
                    
                    if (subtitleResult.success) {
                        console.log(`Successfully created subtitle: "${data.subtitle}"`);
                    }
                }
            } else {
                console.error('Failed to create text element:', result.message);
            }
        } catch (error) {
            console.error('Error creating element from data:', error);
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
        const paletteName = document.getElementById('palette-name')?.value?.trim();
        
        if (!paletteName) {
            this.showStatusMessage('Please enter a palette name', 'error');
            return;
        }

        // Check if we have color variations displayed, use those instead of extracted colors
        const variationsContainer = document.getElementById('color-variations');
        let colorsToSave = [];

        if (variationsContainer && variationsContainer.children.length > 0) {
            // Save the generated variations
            colorsToSave = this.currentColorVariations || [];
            console.log('Saving color variations:', colorsToSave);
        } else if (this.currentExtractedColors && this.currentExtractedColors.length > 0) {
            // Save the extracted colors
            colorsToSave = this.currentExtractedColors;
            console.log('Saving extracted colors:', colorsToSave);
        } else {
            this.showStatusMessage('No colors to save. Extract colors or generate variations first.', 'error');
            return;
        }

        try {
            const result = await this.sandboxProxy.saveBrandPalette(paletteName, colorsToSave);
            
            if (result.success) {
                // Save to localStorage
                const existingPalettes = JSON.parse(localStorage.getItem('brandPalettes') || '[]');
                existingPalettes.push(result.palette);
                localStorage.setItem('brandPalettes', JSON.stringify(existingPalettes));
                
                this.showStatusMessage(`Palette "${paletteName}" saved successfully`);
                document.getElementById('palette-name').value = '';
                this.loadBrandPalettes();
            } else {
                this.showStatusMessage(result.message, 'error');
            }
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
        try {
            // Handle palette deletion directly in iframe without confirm dialog
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
                // Store the variations for saving
                this.currentColorVariations = result.variations;
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

        variations.forEach((variation, index) => {
            const variationItem = document.createElement('div');
            variationItem.className = 'variation-item';
            variationItem.innerHTML = `
                <div class="color-swatch" style="background-color: ${variation.hex}"></div>
                <div class="variation-info">
                    <div class="variation-name">${variation.name}</div>
                    <div class="variation-hex">${variation.hex}</div>
                </div>
                <button class="save-single-color" data-index="${index}">Save</button>
            `;
            
            // Add click handler for individual color saving
            const saveBtn = variationItem.querySelector('.save-single-color');
            saveBtn.addEventListener('click', () => {
                this.saveSingleColorVariation(variation);
            });
            
            container.appendChild(variationItem);
        });
    }

    async saveSingleColorVariation(colorVariation) {
        const paletteName = colorVariation.hex; // Use hex as palette name
        
        try {
            const colorToSave = [{
                hex: colorVariation.hex,
                rgba: colorVariation.rgba,
                source: 'Color Variation',
                name: colorVariation.name
            }];

            const result = await this.sandboxProxy.saveBrandPalette(paletteName, colorToSave);
            
            if (result.success) {
                // Save to localStorage
                const existingPalettes = JSON.parse(localStorage.getItem('brandPalettes') || '[]');
                existingPalettes.push(result.palette);
                localStorage.setItem('brandPalettes', JSON.stringify(existingPalettes));
                
                this.showStatusMessage(`Color ${colorVariation.hex} saved as palette`);
                this.loadBrandPalettes();
            } else {
                this.showStatusMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('Failed to save single color:', error);
            this.showStatusMessage('Failed to save color', 'error');
        }
    }

    copyColorToClipboard(hex) {
        navigator.clipboard.writeText(hex).then(() => {
            this.showStatusMessage(`Copied ${hex} to clipboard`);
        }).catch(() => {
            this.showStatusMessage('Failed to copy color', 'error');
        });
    }

    // ==================== PHASE 1 FEATURES ====================
    
    // Visual Rulers & Grid System
    setupRulersAndGrid() {
        // Grid size control
        const gridSizeInput = document.getElementById('grid-size');
        const gridOpacitySlider = document.getElementById('grid-opacity');
        const gridOpacityValue = document.getElementById('grid-opacity-value');
        
        gridSizeInput?.addEventListener('input', async (e) => {
            this.gridSize = parseInt(e.target.value);
            await this.updateGridDisplay();
        });
        
        gridOpacitySlider?.addEventListener('input', async (e) => {
            this.gridOpacity = parseInt(e.target.value) / 100;
            gridOpacityValue.textContent = e.target.value + '%';
            await this.updateGridDisplay();
        });
        
        // Toggle buttons
        document.getElementById('toggle-grid')?.addEventListener('click', async () => {
            await this.toggleGrid();
        });
        
        document.getElementById('toggle-rulers')?.addEventListener('click', () => {
            this.toggleRulers();
        });
        
        document.getElementById('toggle-snap')?.addEventListener('click', () => {
            this.toggleSnapToGrid();
        });
        
        // Measurement tools
        document.getElementById('measure-distance')?.addEventListener('click', () => {
            this.activateMeasureTool();
        });
        
        document.getElementById('show-dimensions')?.addEventListener('click', () => {
            this.toggleDimensionDisplay();
        });
        
        // Debug button for canvas detection
        const debugBtn = document.createElement('button');
        debugBtn.textContent = '🔍 Debug Canvas';
        debugBtn.className = 'small-btn';
        debugBtn.style.marginTop = '8px';
        debugBtn.addEventListener('click', () => {
            this.debugCanvasDetection();
        });
        
        // API test button
        const apiTestBtn = document.createElement('button');
        apiTestBtn.textContent = '🧪 Test API';
        apiTestBtn.className = 'small-btn';
        apiTestBtn.style.marginTop = '8px';
        apiTestBtn.addEventListener('click', () => {
            this.testPhase1API();
        });
        
        const gridSection = document.querySelector('.section h3');
        if (gridSection && gridSection.textContent.includes('Visual Rulers')) {
            gridSection.parentNode.appendChild(debugBtn);
            gridSection.parentNode.appendChild(apiTestBtn);
        }
    }
    
    async toggleGrid() {
        this.gridEnabled = !this.gridEnabled;
        const btn = document.getElementById('toggle-grid');
        
        if (this.gridEnabled) {
            btn.classList.add('active');
            btn.textContent = '🔲 Hide Grid';
            this.showGrid();
        } else {
            btn.classList.remove('active');
            btn.textContent = '🔲 Show Grid';
            await this.hideGrid();
        }
        
        this.showStatusMessage(`Grid ${this.gridEnabled ? 'enabled' : 'disabled'}`);
    }
    
    toggleRulers() {
        this.rulersEnabled = !this.rulersEnabled;
        const btn = document.getElementById('toggle-rulers');
        
        if (this.rulersEnabled) {
            btn.classList.add('active');
            btn.textContent = '📏 Hide Rulers';
            this.showRulers();
        } else {
            btn.classList.remove('active');
            btn.textContent = '📏 Show Rulers';
            this.hideRulers();
        }
        
        this.showStatusMessage(`Rulers ${this.rulersEnabled ? 'enabled' : 'disabled'}`);
    }
    
    toggleSnapToGrid() {
        this.snapToGridEnabled = !this.snapToGridEnabled;
        const btn = document.getElementById('toggle-snap');
        
        if (this.snapToGridEnabled) {
            btn.classList.add('active');
            btn.textContent = '🧲 Snap Off';
        } else {
            btn.classList.remove('active');
            btn.textContent = '🧲 Snap to Grid';
        }
        
        this.showStatusMessage(`Snap to Grid ${this.snapToGridEnabled ? 'enabled' : 'disabled'}`);
    }
    
    showGrid() {
        // Remove existing grid
        this.hideGrid();
        
        // Since we're in an add-on iframe and can't overlay the main canvas directly,
        // we'll use the Adobe Express API to create a grid on the actual canvas
        this.createAPIBasedGrid();
    }
    
    async createAPIBasedGrid() {
        try {
            // Use the Adobe Express API to create grid elements on the actual canvas
            const result = await this.sandboxProxy.createGridOverlay(this.gridSize, this.gridOpacity);
            
            if (result && result.success) {
                // Store grid element IDs for later removal
                this.currentGridElementIds = result.gridElementIds || [];
                
                this.showStatusMessage(`Grid overlay created on canvas (${this.gridSize}px grid)`, 'success');
                
                // Update button state
                const gridBtn = document.getElementById('toggle-grid');
                if (gridBtn) {
                    gridBtn.textContent = '🔲 Hide Grid';
                    gridBtn.classList.add('active');
                }
            } else {
                // Fallback to iframe-based grid if API method doesn't exist
                this.createIframeGrid();
            }
        } catch (error) {
            console.log('API-based grid not available, using iframe grid:', error.message);
            this.createIframeGrid();
        }
    }
    
    createIframeGrid() {
        // Create grid overlay within our iframe (visible over add-on panel)
        const gridOverlay = document.createElement('div');
        gridOverlay.id = 'grid-overlay';
        gridOverlay.className = 'grid-overlay';
        
        // Use a more visible grid pattern
        const gridColor = `rgba(0, 100, 200, ${Math.max(0.3, this.gridOpacity)})`;
        const gridPattern = `
            linear-gradient(to right, ${gridColor} 1px, transparent 1px),
            linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
        `;
        
        // Apply styles for iframe grid
        Object.assign(gridOverlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            backgroundImage: gridPattern,
            backgroundSize: `${this.gridSize}px ${this.gridSize}px`,
            pointerEvents: 'none',
            zIndex: '9999'
        });
        
        document.body.appendChild(gridOverlay);
        
        this.showStatusMessage('Grid shown in add-on panel (demo mode)', 'warning');
        
        // Update button state
        const gridBtn = document.getElementById('toggle-grid');
        if (gridBtn) {
            gridBtn.textContent = '🔲 Hide Grid';
            gridBtn.classList.add('active');
        }
    }
    
    async hideGrid() {
        // Remove iframe-based grid overlay
        const existingGrid = document.getElementById('grid-overlay');
        if (existingGrid) {
            existingGrid.remove();
        }
        
        // Remove API-based grid elements from canvas
        if (this.currentGridElementIds.length > 0) {
            try {
                const result = await this.sandboxProxy.removeGridOverlay(this.currentGridElementIds);
                if (result && result.success) {
                    this.showStatusMessage(`Grid removed from canvas (${result.removedCount} elements)`, 'success');
                } else {
                    this.showStatusMessage('Failed to remove grid from canvas', 'error');
                }
            } catch (error) {
                console.log('Failed to remove grid elements:', error);
                this.showStatusMessage('Failed to remove grid from canvas', 'error');
            }
            
            // Clear the stored grid element IDs
            this.currentGridElementIds = [];
        }
        
        // Clean up event listeners
        if (this.gridResizeHandler) {
            window.removeEventListener('resize', this.gridResizeHandler);
            window.removeEventListener('scroll', this.gridResizeHandler);
            this.gridResizeHandler = null;
        }
    }
    
    findCanvasContainer() {
        // Since we're in an add-on iframe, we need to target the parent window's canvas
        // The grid should appear on the main Adobe Express canvas, not in our add-on panel
        
        try {
            // Try to access parent window (Adobe Express main window)
            if (window.parent && window.parent !== window) {
                const parentDoc = window.parent.document;
                
                // Adobe Express specific selectors
                const selectors = [
                    '[data-testid="canvas-container"]',
                    '[data-testid="canvas"]',
                    '[data-testid="artboard"]',
                    '.canvas-container',
                    '.artboard',
                    '.design-canvas',
                    '.workspace-canvas',
                    '[role="img"][aria-label*="canvas"]',
                    '[role="img"][aria-label*="artboard"]'
                ];
                
                for (const selector of selectors) {
                    const element = parentDoc.querySelector(selector);
                    if (element) {
                        const rect = element.getBoundingClientRect();
                        if (rect.width > 200 && rect.height > 200) {
                            console.log('Found parent canvas:', selector, rect);
                            return { element, isParent: true };
                        }
                    }
                }
                
                // Look for large elements in parent that could be canvas
                const parentElements = parentDoc.querySelectorAll('div, canvas, svg');
                let largestElement = null;
                let largestArea = 0;
                
                for (const element of parentElements) {
                    const rect = element.getBoundingClientRect();
                    const area = rect.width * rect.height;
                    
                    // Look for canvas-like elements
                    if (area > largestArea && 
                        rect.width > 400 && 
                        rect.height > 300 && 
                        rect.width < window.parent.innerWidth * 0.9 &&
                        rect.height < window.parent.innerHeight * 0.9) {
                        largestArea = area;
                        largestElement = element;
                    }
                }
                
                if (largestElement) {
                    console.log('Found parent canvas by size:', largestElement.getBoundingClientRect());
                    return { element: largestElement, isParent: true };
                }
            }
        } catch (error) {
            console.log('Cannot access parent window (cross-origin):', error.message);
        }
        
        // Fallback: return null to indicate we should use a different approach
        console.log('Canvas detection failed - will use alternative grid approach');
        return null;
    }
    
    async updateGridDisplay() {
        if (this.gridEnabled) {
            // Remove existing grid first
            await this.hideGrid();
            // Create new grid with updated settings
            this.showGrid();
        }
    }
    
    showRulers() {
        // Remove existing rulers
        this.hideRulers();
        
        // Create horizontal ruler
        const hRuler = document.createElement('div');
        hRuler.id = 'horizontal-ruler';
        hRuler.className = 'ruler-overlay ruler-horizontal';
        
        // Create vertical ruler
        const vRuler = document.createElement('div');
        vRuler.id = 'vertical-ruler';
        vRuler.className = 'ruler-overlay ruler-vertical';
        
        // Add ruler marks (simplified)
        for (let i = 0; i < window.innerWidth; i += 50) {
            const mark = document.createElement('div');
            mark.className = 'ruler-mark';
            mark.style.left = i + 'px';
            mark.style.top = '2px';
            mark.textContent = i;
            hRuler.appendChild(mark);
        }
        
        for (let i = 0; i < window.innerHeight; i += 50) {
            const mark = document.createElement('div');
            mark.className = 'ruler-mark';
            mark.style.top = i + 'px';
            mark.style.left = '2px';
            mark.textContent = i;
            vRuler.appendChild(mark);
        }
        
        document.body.appendChild(hRuler);
        document.body.appendChild(vRuler);
    }
    
    hideRulers() {
        const hRuler = document.getElementById('horizontal-ruler');
        const vRuler = document.getElementById('vertical-ruler');
        if (hRuler) hRuler.remove();
        if (vRuler) vRuler.remove();
    }
    
    activateMeasureTool() {
        this.showStatusMessage('Measurement tool activated - Click two points to measure distance', 'info');
        // This would require more complex implementation with canvas interaction
    }
    
    toggleDimensionDisplay() {
        this.showStatusMessage('Dimension display toggled', 'info');
        // This would show dimensions for selected elements
    }
    
    debugCanvasDetection() {
        console.log('=== CANVAS DEBUG INFO ===');
        
        // Show current window info
        console.log('Window size:', window.innerWidth, 'x', window.innerHeight);
        
        // Try to find canvas
        const canvas = this.findCanvasContainer();
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            console.log('Found canvas:', canvas);
            console.log('Canvas rect:', rect);
            console.log('Canvas classes:', canvas.className);
            console.log('Canvas id:', canvas.id);
            
            // Create a temporary highlight
            const highlight = document.createElement('div');
            highlight.style.cssText = `
                position: fixed;
                top: ${rect.top}px;
                left: ${rect.left}px;
                width: ${rect.width}px;
                height: ${rect.height}px;
                border: 3px solid red;
                background: rgba(255,0,0,0.1);
                pointer-events: none;
                z-index: 10000;
            `;
            document.body.appendChild(highlight);
            
            setTimeout(() => highlight.remove(), 3000);
            
            this.showStatusMessage(`Canvas found: ${rect.width}x${rect.height} at (${rect.left}, ${rect.top})`, 'success');
        } else {
            console.log('No canvas found');
            this.showStatusMessage('No canvas container detected', 'error');
            
            // Show all large elements for debugging
            const elements = document.querySelectorAll('div, canvas, svg');
            console.log('Large elements found:');
            elements.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.width > 200 && rect.height > 200) {
                    console.log('- Element:', el.tagName, el.className, rect);
                }
            });
        }
        
        // Force show grid for testing
        this.showTestGrid();
    }
    
    showTestGrid() {
        // Remove any existing test grid
        const existing = document.getElementById('test-grid-overlay');
        if (existing) existing.remove();
        
        // Create a highly visible test grid
        const testGrid = document.createElement('div');
        testGrid.id = 'test-grid-overlay';
        testGrid.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background-image: 
                linear-gradient(to right, rgba(255,0,0,0.5) 2px, transparent 2px),
                linear-gradient(to bottom, rgba(255,0,0,0.5) 2px, transparent 2px) !important;
            background-size: 50px 50px !important;
            pointer-events: none !important;
            z-index: 99999 !important;
        `;
        
        document.body.appendChild(testGrid);
        
        // Remove after 5 seconds
        setTimeout(() => {
            testGrid.remove();
            this.showStatusMessage('Test grid removed', 'info');
        }, 5000);
        
        this.showStatusMessage('Test grid shown for 5 seconds (red lines)', 'info');
    }
    
    async testPhase1API() {
        console.log('=== PHASE 1 API TEST ===');
        this.showStatusMessage('Testing Phase 1 API methods...', 'info');
        
        const results = [];
        
        // Test Layer Management APIs
        const layerMethods = [
            'getAllLayers',
            'selectLayerById',
            'selectElementById', // NEW method to bypass cache
            'deleteLayerById',
            'toggleLayerVisibility',
            'createBlankLayer',
            'duplicateSelectedElements'
        ];
        
        // Test Smart Alignment APIs
        const alignmentMethods = [
            'alignToCanvasCenter',
            'distributeElementsEvenly',
            'alignToMargins'
        ];
        
        // Check if methods exist
        console.log('Checking Layer Management methods:');
        layerMethods.forEach(method => {
            const exists = typeof this.sandboxProxy[method] === 'function';
            console.log(`- ${method}: ${exists ? '✅ Available' : '❌ Missing'}`);
            results.push(`${method}: ${exists ? '✅' : '❌'}`);
        });
        
        console.log('Checking Smart Alignment methods:');
        alignmentMethods.forEach(method => {
            const exists = typeof this.sandboxProxy[method] === 'function';
            console.log(`- ${method}: ${exists ? '✅ Available' : '❌ Missing'}`);
            results.push(`${method}: ${exists ? '✅' : '❌'}`);
        });
        
        // Test version check first
        try {
            console.log('Testing getPhase1Version...');
            if (this.sandboxProxy.getPhase1Version) {
                const version = await this.sandboxProxy.getPhase1Version();
                console.log('Version check result:', version);
                results.push(`Backend Version: ✅ ${version.version} (${new Date(version.timestamp).toLocaleTimeString()})`);
            } else {
                results.push('Backend Version: ❌ Old version - RELOAD NEEDED');
            }
        } catch (error) {
            console.error('Version check failed:', error);
            results.push(`Backend Version: ❌ Error - ${error.message}`);
        }

        // Test debug methods
        try {
            console.log('Testing debugAvailableMethods...');
            if (this.sandboxProxy.debugAvailableMethods) {
                const debug = await this.sandboxProxy.debugAvailableMethods();
                console.log('debugAvailableMethods result:', debug);
                results.push(`Available Methods: ✅ ${debug.count} methods found`);
                results.push(`Methods: ${debug.methods.join(', ')}`);
            } else {
                results.push('Debug Methods: ❌ Method not available');
            }
        } catch (error) {
            console.error('debugAvailableMethods test failed:', error);
            results.push(`Debug Methods: ❌ Error - ${error.message}`);
        }

        // Test canvas bounds detection
        try {
            console.log('Testing getCanvasBounds...');
            if (this.sandboxProxy.getCanvasBounds) {
                const bounds = await this.sandboxProxy.getCanvasBounds();
                console.log('getCanvasBounds result:', bounds);
                results.push(`Canvas Bounds: ✅ ${bounds.width}x${bounds.height}`);
            } else {
                results.push('Canvas Bounds: ❌ Method not available');
            }
        } catch (error) {
            console.error('getCanvasBounds test failed:', error);
            results.push(`Canvas Bounds: ❌ Error - ${error.message}`);
        }

        // Test a simple method call
        try {
            console.log('Testing getAllLayers...');
            if (this.sandboxProxy.getAllLayers) {
                const layers = await this.sandboxProxy.getAllLayers();
                console.log('getAllLayers result:', layers);
                results.push(`getAllLayers call: ✅ Success (${layers.length} layers)`);
            } else {
                results.push('getAllLayers call: ❌ Method not available');
            }
        } catch (error) {
            console.error('getAllLayers test failed:', error);
            results.push(`getAllLayers call: ❌ Error - ${error.message}`);
        }
        
        // Display results
        const resultText = results.join('\n');
        console.log('API Test Results:\n' + resultText);
        
        // Show summary
        const availableCount = results.filter(r => r.includes('✅')).length;
        const totalCount = layerMethods.length + alignmentMethods.length + 1; // +1 for the test call
        
        if (availableCount === totalCount) {
            this.showStatusMessage(`✅ All ${totalCount} Phase 1 API methods available!`, 'success');
        } else if (availableCount > 0) {
            this.showStatusMessage(`⚠️ ${availableCount}/${totalCount} Phase 1 API methods available`, 'warning');
        } else {
            this.showStatusMessage('❌ Phase 1 API methods not available - reload add-on', 'error');
        }
        
        // Create a temporary results display
        const resultsDiv = document.createElement('div');
        resultsDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #007acc;
            border-radius: 8px;
            padding: 20px;
            max-width: 400px;
            max-height: 300px;
            overflow-y: auto;
            z-index: 10000;
            font-family: monospace;
            font-size: 12px;
            white-space: pre-line;
        `;
        resultsDiv.innerHTML = `
            <h3>🧪 Phase 1 API Test Results</h3>
            <div style="margin: 10px 0;">${resultText}</div>
            <button onclick="this.parentElement.remove()" style="background: #007acc; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Close</button>
        `;
        
        document.body.appendChild(resultsDiv);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (resultsDiv.parentElement) {
                resultsDiv.remove();
            }
        }, 10000);
    }
    
    // Layer Management Panel
    setupLayerManagement() {
        // Refresh layers button
        document.getElementById('refresh-layers')?.addEventListener('click', async () => {
            await this.refreshLayerList();
        });
        
        // Create blank layer
        document.getElementById('create-blank-layer')?.addEventListener('click', async () => {
            await this.createBlankLayer();
        });
        
        // Layer actions
        document.getElementById('group-selected')?.addEventListener('click', async () => {
            await this.groupSelectedElements();
        });
        
        document.getElementById('ungroup-selected')?.addEventListener('click', async () => {
            await this.ungroupSelectedElements();
        });
        
        document.getElementById('duplicate-layer')?.addEventListener('click', async () => {
            await this.duplicateSelectedLayer();
        });
        
        // Initial layer refresh
        this.refreshLayerList();
    }
    
    async refreshLayerList() {
        try {
            // Check if the method exists
            if (!this.sandboxProxy.getAllLayers) {
                console.error('getAllLayers method not available in sandboxProxy');
                this.showStatusMessage('Layer management not available - please reload add-on', 'error');
                return;
            }
            
            console.log('Calling getAllLayers...');
            const layers = await this.sandboxProxy.getAllLayers();
            console.log('Received layers:', layers);
            
            this.layerList = layers;
            this.displayLayerList(layers);
            this.showStatusMessage(`Found ${layers.length} layers`);
        } catch (error) {
            console.error('Failed to refresh layers:', error);
            this.showStatusMessage('Failed to refresh layers - try reloading add-on', 'error');
        }
    }
    
    displayLayerList(layers) {
        const container = document.getElementById('layer-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (layers.length === 0) {
            container.innerHTML = '<div class="layer-placeholder">No layers detected</div>';
            return;
        }
        
        layers.forEach((layer, index) => {
            const layerItem = document.createElement('div');
            layerItem.className = 'layer-item';
            layerItem.dataset.layerId = layer.id;
            
            const icon = this.getLayerIcon(layer.type);
            
            layerItem.innerHTML = `
                <div class="layer-info">
                    <span class="layer-icon">${icon}</span>
                    <span class="layer-name">${layer.name || `Layer ${index + 1}`}</span>
                    <span class="layer-type">${layer.type}</span>
                </div>
                <div class="layer-actions">
                    <button class="layer-visibility-btn" data-layer-id="${layer.id}">👁️</button>
                    <button class="layer-action-btn" data-action="select" data-layer-id="${layer.id}">Select</button>
                    <button class="layer-action-btn" data-action="delete" data-layer-id="${layer.id}">🗑️</button>
                </div>
            `;
            
            // Add event listeners
            layerItem.addEventListener('click', async (e) => {
                if (!e.target.classList.contains('layer-action-btn') && !e.target.classList.contains('layer-visibility-btn')) {
                    await this.selectLayer(layer.id, e.ctrlKey || e.metaKey);
                }
            });
            
            // Layer action buttons
            const actionBtns = layerItem.querySelectorAll('.layer-action-btn');
            actionBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    const layerId = btn.dataset.layerId;
                    this.handleLayerAction(action, layerId);
                });
            });
            
            // Visibility toggle
            const visibilityBtn = layerItem.querySelector('.layer-visibility-btn');
            visibilityBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleLayerVisibility(layer.id);
            });
            
            container.appendChild(layerItem);
        });
    }
    
    getLayerIcon(type) {
        const icons = {
            'Text': '📝',
            'Rectangle': '🔲',
            'Ellipse': '⭕',
            'Image': '🖼️',
            'Group': '📁',
            'Path': '✏️',
            'default': '📄'
        };
        return icons[type] || icons.default;
    }
    
    async selectLayer(layerId, multiSelect = false) {
        try {
            // Adobe Express Document API does not support programmatic selection
            // We provide visual feedback and user guidance instead
            const selectMethod = this.sandboxProxy.selectElementById || this.sandboxProxy.selectLayerById;
            
            if (selectMethod) {
                console.log('Finding layer:', layerId, 'multiSelect:', multiSelect);
                const selectResult = await selectMethod(layerId, multiSelect);
                console.log('Find result:', selectResult);
                
                if (selectResult && selectResult.success) {
                    // Update UI selection for visual feedback only
                    if (!multiSelect) {
                        // Single selection - clear all other selections
                        document.querySelectorAll('.layer-item').forEach(item => {
                            item.classList.remove('selected');
                        });
                        this.selectedLayerId = layerId;
                    } else {
                        // Multi-selection - toggle this layer's selection
                        const layerItem = document.querySelector(`[data-layer-id="${layerId}"]`);
                        if (layerItem && layerItem.classList.contains('selected')) {
                            // Deselect if already selected
                            layerItem.classList.remove('selected');
                            if (this.selectedLayerId === layerId) {
                                this.selectedLayerId = null;
                            }
                        } else {
                            // Add to selection
                            this.selectedLayerId = layerId; // Keep track of last selected
                        }
                    }
                    
                    const layerItem = document.querySelector(`[data-layer-id="${layerId}"]`);
                    if (layerItem && (!multiSelect || !layerItem.classList.contains('selected'))) {
                        layerItem.classList.add('selected');
                    }
                    
                    const selectedCount = document.querySelectorAll('.layer-item.selected').length;
                    this.showStatusMessage(`${selectedCount} layer${selectedCount !== 1 ? 's' : ''} selected`);
                } else {
                    this.showStatusMessage('Failed to select layer', 'error');
                }
            } else {
                this.showStatusMessage('Layer selection not available - please reload add-on', 'error');
            }
        } catch (error) {
            console.error('Failed to select layer:', error);
            this.showStatusMessage('Failed to select layer: ' + error.message, 'error');
        }
    }
    
    async handleLayerAction(action, layerId) {
        try {
            switch (action) {
                case 'select':
                    await this.selectLayer(layerId);
                    break;
                case 'delete':
                    if (!this.sandboxProxy.deleteLayerById) {
                        this.showStatusMessage('Layer deletion not available - please reload add-on', 'error');
                        return;
                    }
                    console.log('Deleting layer:', layerId);
                    const deleteResult = await this.sandboxProxy.deleteLayerById(layerId);
                    console.log('Delete result:', deleteResult);
                    this.refreshLayerList();
                    this.showStatusMessage('Layer deleted');
                    break;
            }
        } catch (error) {
            console.error(`Failed to ${action} layer:`, error);
            this.showStatusMessage(`Failed to ${action} layer - try reloading add-on`, 'error');
        }
    }
    
    async toggleLayerVisibility(layerId) {
        try {
            const result = await this.sandboxProxy.toggleLayerVisibility(layerId);
            if (result.success) {
                const btn = document.querySelector(`[data-layer-id="${layerId}"] .layer-visibility-btn`);
                if (btn) {
                    btn.textContent = result.visible ? '👁️' : '🙈';
                    btn.classList.toggle('hidden', !result.visible);
                }
                this.showStatusMessage(`Layer ${result.visible ? 'shown' : 'hidden'}`);
            }
        } catch (error) {
            console.error('Failed to toggle layer visibility:', error);
            this.showStatusMessage('Layer visibility toggle not supported', 'error');
        }
    }
    
    async createBlankLayer() {
        try {
            const result = await this.sandboxProxy.createBlankLayer();
            if (result.success) {
                this.refreshLayerList();
                this.showStatusMessage('Blank layer created');
            } else {
                this.showStatusMessage('Failed to create blank layer', 'error');
            }
        } catch (error) {
            console.error('Failed to create blank layer:', error);
            this.showStatusMessage('Blank layer creation not supported', 'error');
        }
    }
    
    async groupSelectedElements() {
        try {
            const result = await this.sandboxProxy.groupSelectedElements();
            if (result.success) {
                this.refreshLayerList();
                this.showStatusMessage('Elements grouped successfully');
            } else {
                this.showStatusMessage(result.message || 'Failed to group elements', 'error');
            }
        } catch (error) {
            console.error('Failed to group elements:', error);
            this.showStatusMessage('Grouping failed', 'error');
        }
    }
    
    async ungroupSelectedElements() {
        try {
            const result = await this.sandboxProxy.ungroupSelectedElements();
            if (result.success) {
                this.refreshLayerList();
                this.showStatusMessage('Elements ungrouped successfully');
            } else {
                this.showStatusMessage(result.message || 'Failed to ungroup elements', 'error');
            }
        } catch (error) {
            console.error('Failed to ungroup elements:', error);
            this.showStatusMessage('Ungrouping failed', 'error');
        }
    }
    
    async duplicateSelectedLayer() {
        try {
            const result = await this.sandboxProxy.duplicateSelectedElements();
            if (result.success) {
                this.refreshLayerList();
                this.showStatusMessage('Layer duplicated successfully');
            } else {
                this.showStatusMessage('Failed to duplicate layer', 'error');
            }
        } catch (error) {
            console.error('Failed to duplicate layer:', error);
            this.showStatusMessage('Layer duplication failed', 'error');
        }
    }
    
    // Smart Alignment Guides
    setupSmartGuides() {
        // Guide color control
        const guideColorInput = document.getElementById('guide-color');
        const snapToleranceInput = document.getElementById('snap-tolerance');
        
        guideColorInput?.addEventListener('input', (e) => {
            this.guideColor = e.target.value;
            this.updateGuideStyles();
        });
        
        snapToleranceInput?.addEventListener('input', (e) => {
            this.snapTolerance = parseInt(e.target.value);
        });
        
        // Toggle buttons
        document.getElementById('toggle-smart-guides')?.addEventListener('click', () => {
            this.toggleSmartGuides();
        });
        
        document.getElementById('toggle-center-guides')?.addEventListener('click', () => {
            this.toggleCenterGuides();
        });
        
        document.getElementById('toggle-margin-guides')?.addEventListener('click', () => {
            this.toggleMarginGuides();
        });
        
        // Quick alignment actions
        document.getElementById('align-to-canvas-center')?.addEventListener('click', async () => {
            await this.alignToCanvasCenter();
        });
        
        document.getElementById('distribute-evenly')?.addEventListener('click', async () => {
            await this.distributeEvenly();
        });
        
        document.getElementById('align-to-margins')?.addEventListener('click', async () => {
            await this.alignToMargins();
        });
    }
    
    toggleSmartGuides() {
        this.smartGuidesEnabled = !this.smartGuidesEnabled;
        const btn = document.getElementById('toggle-smart-guides');
        
        if (this.smartGuidesEnabled) {
            btn.classList.add('active');
            btn.textContent = '✨ Hide Smart Guides';
            this.enableSmartGuides();
        } else {
            btn.classList.remove('active');
            btn.textContent = '✨ Smart Guides';
            this.disableSmartGuides();
        }
        
        this.showStatusMessage(`Smart Guides ${this.smartGuidesEnabled ? 'enabled' : 'disabled'}`);
    }
    
    toggleCenterGuides() {
        this.centerGuidesEnabled = !this.centerGuidesEnabled;
        const btn = document.getElementById('toggle-center-guides');
        
        if (this.centerGuidesEnabled) {
            btn.classList.add('active');
            btn.textContent = '🎯 Hide Center Guides';
            this.showCenterGuides();
        } else {
            btn.classList.remove('active');
            btn.textContent = '🎯 Center Guides';
            this.hideCenterGuides();
        }
        
        this.showStatusMessage(`Center Guides ${this.centerGuidesEnabled ? 'enabled' : 'disabled'}`);
    }
    
    toggleMarginGuides() {
        this.marginGuidesEnabled = !this.marginGuidesEnabled;
        const btn = document.getElementById('toggle-margin-guides');
        
        if (this.marginGuidesEnabled) {
            btn.classList.add('active');
            btn.textContent = '📏 Hide Margin Guides';
            this.showMarginGuides();
        } else {
            btn.classList.remove('active');
            btn.textContent = '📏 Margin Guides';
            this.hideMarginGuides();
        }
        
        this.showStatusMessage(`Margin Guides ${this.marginGuidesEnabled ? 'enabled' : 'disabled'}`);
    }
    
    enableSmartGuides() {
        // Create guide overlay container
        if (!document.getElementById('guide-overlay')) {
            const guideOverlay = document.createElement('div');
            guideOverlay.id = 'guide-overlay';
            guideOverlay.className = 'guide-overlay';
            document.body.appendChild(guideOverlay);
        }
    }
    
    disableSmartGuides() {
        const guideOverlay = document.getElementById('guide-overlay');
        if (guideOverlay) {
            guideOverlay.remove();
        }
    }
    
    showCenterGuides() {
        this.enableSmartGuides();
        const overlay = document.getElementById('guide-overlay');
        if (!overlay) return;
        
        // Remove existing center guides
        overlay.querySelectorAll('.guide-line.center').forEach(guide => guide.remove());
        
        // Add center guides
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // Vertical center line
        const vCenterLine = document.createElement('div');
        vCenterLine.className = 'guide-line vertical center';
        vCenterLine.style.left = centerX + 'px';
        vCenterLine.style.background = this.guideColor;
        overlay.appendChild(vCenterLine);
        
        // Horizontal center line
        const hCenterLine = document.createElement('div');
        hCenterLine.className = 'guide-line horizontal center';
        hCenterLine.style.top = centerY + 'px';
        hCenterLine.style.background = this.guideColor;
        overlay.appendChild(hCenterLine);
    }
    
    hideCenterGuides() {
        const overlay = document.getElementById('guide-overlay');
        if (overlay) {
            overlay.querySelectorAll('.guide-line.center').forEach(guide => guide.remove());
        }
    }
    
    showMarginGuides() {
        this.enableSmartGuides();
        const overlay = document.getElementById('guide-overlay');
        if (!overlay) return;
        
        // Remove existing margin guides
        overlay.querySelectorAll('.guide-line.margin').forEach(guide => guide.remove());
        
        const margin = 50; // 50px margin
        
        // Top margin
        const topMargin = document.createElement('div');
        topMargin.className = 'guide-line horizontal margin';
        topMargin.style.top = margin + 'px';
        overlay.appendChild(topMargin);
        
        // Bottom margin
        const bottomMargin = document.createElement('div');
        bottomMargin.className = 'guide-line horizontal margin';
        bottomMargin.style.top = (window.innerHeight - margin) + 'px';
        overlay.appendChild(bottomMargin);
        
        // Left margin
        const leftMargin = document.createElement('div');
        leftMargin.className = 'guide-line vertical margin';
        leftMargin.style.left = margin + 'px';
        overlay.appendChild(leftMargin);
        
        // Right margin
        const rightMargin = document.createElement('div');
        rightMargin.className = 'guide-line vertical margin';
        rightMargin.style.left = (window.innerWidth - margin) + 'px';
        overlay.appendChild(rightMargin);
    }
    
    hideMarginGuides() {
        const overlay = document.getElementById('guide-overlay');
        if (overlay) {
            overlay.querySelectorAll('.guide-line.margin').forEach(guide => guide.remove());
        }
    }
    
    updateGuideStyles() {
        const guides = document.querySelectorAll('.guide-line:not(.center):not(.margin)');
        guides.forEach(guide => {
            guide.style.background = this.guideColor;
        });
    }
    
    async alignToCanvasCenter() {
        try {
            const result = await this.sandboxProxy.alignToCanvasCenter();
            if (result.success) {
                this.showStatusMessage('Elements aligned to canvas center');
            } else {
                this.showStatusMessage(result.message || 'Failed to align to center', 'error');
            }
        } catch (error) {
            console.error('Failed to align to center:', error);
            this.showStatusMessage('Center alignment failed', 'error');
        }
    }
    
    async distributeEvenly() {
        try {
            const result = await this.sandboxProxy.distributeElementsEvenly();
            if (result.success) {
                this.showStatusMessage('Elements distributed evenly');
            } else {
                this.showStatusMessage(result.message || 'Failed to distribute evenly', 'error');
            }
        } catch (error) {
            console.error('Failed to distribute evenly:', error);
            this.showStatusMessage('Even distribution failed', 'error');
        }
    }
    
    async alignToMargins() {
        try {
            const result = await this.sandboxProxy.alignToMargins();
            if (result.success) {
                this.showStatusMessage('Elements aligned to margins');
            } else {
                this.showStatusMessage(result.message || 'Failed to align to margins', 'error');
            }
        } catch (error) {
            console.error('Failed to align to margins:', error);
            this.showStatusMessage('Margin alignment failed', 'error');
        }
    }
}

const toolkit = new PrecisionToolkit();
toolkit.init();

// Make toolkit available globally for onclick handlers
window.toolkit = toolkit;
