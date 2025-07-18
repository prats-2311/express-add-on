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

    setupPrecisionToolkit() {
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

        // Granular controls
        this.setupGranularControls();

        // Add these debug handlers
        document.getElementById('debug-selection')?.addEventListener('click', async () => {
            const selection = await this.sandboxProxy.getSelectedElements();
            // console.log('Manual selection check:', selection.length);
            alert(`Selected elements: ${selection.length}`);
        });

        document.getElementById('force-align-left')?.addEventListener('click', async () => {
            const result = await this.sandboxProxy.alignElements('horizontal', 'left');
            // console.log('Force align result:', result);
            alert(`Alignment result: ${result}`);
        });

        // Text Effects Generator
        this.setupTextEffects();
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
                // Refresh the page list to update current page indicator
                setTimeout(() => this.listProjectPages(), 500);
            } else {
                console.log('Page navigation not available or failed');
                alert('Page navigation is not currently supported in this version of Adobe Express');
            }
        } catch (error) {
            console.error('Failed to navigate to page:', error);
            alert('Failed to navigate to page');
        }
    }
}

const toolkit = new PrecisionToolkit();
toolkit.init();
