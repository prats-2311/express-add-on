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
                }
            });
        });

        // Back button
        document.getElementById('back-to-main')?.addEventListener('click', () => {
            this.showMainMenu();
        });
    }

    showPrecisionToolkit() {
        document.getElementById('toolkit-selector').classList.add('hidden');
        document.getElementById('precision-toolkit').classList.remove('hidden');
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
    }

    setupGranularControls() {
        const posX = document.getElementById('pos-x');
        const posY = document.getElementById('pos-y');
        const sizeWidth = document.getElementById('size-width');
        const sizeHeight = document.getElementById('size-height');

        // Position controls
        posX?.addEventListener('change', async (e) => {
            await this.sandboxProxy.updateElementPosition(parseInt(e.target.value), null);
        });

        posY?.addEventListener('change', async (e) => {
            await this.sandboxProxy.updateElementPosition(null, parseInt(e.target.value));
        });

        // Size controls
        sizeWidth?.addEventListener('change', async (e) => {
            await this.sandboxProxy.updateElementSize(parseInt(e.target.value), null);
        });

        sizeHeight?.addEventListener('change', async (e) => {
            await this.sandboxProxy.updateElementSize(null, parseInt(e.target.value));
        });
    }

    async startSelectionMonitoring() {
        this.selectionMonitor = setInterval(async () => {
            try {
                const selection = await this.sandboxProxy.getSelectedElements();
                this.updateSelectionUI(selection);

                // Update granular controls for single selection
                if (selection.length === 1) {
                    const props = await this.sandboxProxy.getElementProperties();
                    this.updateGranularInputs(props);
                }
            } catch (error) {
                console.log('Selection monitoring error:', error);
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

        // Enable/disable alignment buttons
        const alignButtons = document.querySelectorAll('.align-btn');
        alignButtons.forEach(btn => {
            btn.disabled = count < 2;
        });

        // Enable/disable distribution buttons
        document.getElementById('distribute-horizontal').disabled = count < 3;
        document.getElementById('distribute-vertical').disabled = count < 3;

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
}

const toolkit = new PrecisionToolkit();
toolkit.init();
