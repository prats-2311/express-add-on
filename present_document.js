import addOnSandboxSdk from "add-on-sdk-document-sandbox";
import { editor } from "express-document-sdk";

const { runtime } = addOnSandboxSdk.instance;

function start() {
    const sandboxApi = {
        // Selection Management
        getSelectedElements: () => {
            const selection = Array.from(editor.context.selection);
            // console.log('Selection count:', selection.length);
            // Return just the count and basic info, not the full objects
            return selection.map(el => ({
                id: el.id,
                type: el.constructor.name,
                x: el.translation.x,
                y: el.translation.y,
                width: el.width || 0,
                height: el.height || 0
            }));
        },

        // Test Element Creation
        createTestRectangle: () => {
            const rectangle = editor.createRectangle();
            rectangle.width = 100;
            rectangle.height = 80;
            rectangle.translation = { x: Math.random() * 200, y: Math.random() * 200 };

            const color = { red: 0.2 + Math.random() * 0.6, green: 0.2 + Math.random() * 0.6, blue: 0.8, alpha: 1 };
            rectangle.fill = editor.makeColorFill(color);

            editor.context.insertionParent.children.append(rectangle);
            return rectangle.id;
        },

        createTestText: (text = "Sample Text") => {
            const textElement = editor.createText();
            textElement.text = text;
            textElement.translation = { x: Math.random() * 200, y: Math.random() * 200 };

            editor.context.insertionParent.children.append(textElement);
            return textElement.id;
        },

        createTestCircle: () => {
            const ellipse = editor.createEllipse();
            ellipse.width = 80;
            ellipse.height = 80;
            ellipse.translation = { x: Math.random() * 200, y: Math.random() * 200 };

            const color = { red: 0.8, green: 0.2 + Math.random() * 0.6, blue: 0.2 + Math.random() * 0.6, alpha: 1 };
            ellipse.fill = editor.makeColorFill(color);

            editor.context.insertionParent.children.append(ellipse);
            return ellipse.id;
        },

        // Alignment Functions
        alignElements: (direction, alignment) => {
            const selection = Array.from(editor.context.selection);
            // console.log('Aligning elements:', selection.length, 'direction:', direction, 'alignment:', alignment);

            if (selection.length < 2) {
                // console.log('Not enough elements selected for alignment');
                return false;
            }

            try {
                if (direction === 'horizontal') {
                    const referenceX = alignment === 'left' ? Math.min(...selection.map(el => el.translation.x)) :
                        alignment === 'right' ? Math.max(...selection.map(el => el.translation.x + (el.width || 0))) :
                            selection.reduce((sum, el) => sum + el.translation.x + (el.width || 0) / 2, 0) / selection.length;

                    selection.forEach(element => {
                        const width = element.width || 0;
                        const newX = alignment === 'right' ? referenceX - width :
                            alignment === 'center' ? referenceX - width / 2 : referenceX;
                        element.translation = { x: newX, y: element.translation.y };
                    });
                } else {
                    const referenceY = alignment === 'top' ? Math.min(...selection.map(el => el.translation.y)) :
                        alignment === 'bottom' ? Math.max(...selection.map(el => el.translation.y + (el.height || 0))) :
                            selection.reduce((sum, el) => sum + el.translation.y + (el.height || 0) / 2, 0) / selection.length;

                    selection.forEach(element => {
                        const height = element.height || 0;
                        const newY = alignment === 'bottom' ? referenceY - height :
                            alignment === 'middle' ? referenceY - height / 2 : referenceY;
                        element.translation = { x: element.translation.x, y: newY };
                    });
                }
                console.log('Alignment completed successfully');
                return true;
            } catch (error) {
                console.error('Alignment error:', error);
                return false;
            }
        },

        // Distribution Functions
        distributeElements: (direction) => {
            const selection = Array.from(editor.context.selection);
            if (selection.length < 3) return false;

            if (direction === 'horizontal') {
                // Sort by X position
                const sorted = selection.sort((a, b) => a.translation.x - b.translation.x);
                const first = sorted[0];
                const last = sorted[sorted.length - 1];
                const totalSpace = (last.translation.x + (last.width || 0)) - first.translation.x;
                const elementSpace = sorted.reduce((sum, el) => sum + (el.width || 0), 0);
                const gap = (totalSpace - elementSpace) / (sorted.length - 1);

                let currentX = first.translation.x + (first.width || 0) + gap;
                for (let i = 1; i < sorted.length - 1; i++) {
                    sorted[i].translation = { x: currentX, y: sorted[i].translation.y };
                    currentX += (sorted[i].width || 0) + gap;
                }
            } else {
                // Sort by Y position
                const sorted = selection.sort((a, b) => a.translation.y - b.translation.y);
                const first = sorted[0];
                const last = sorted[sorted.length - 1];
                const totalSpace = (last.translation.y + (last.height || 0)) - first.translation.y;
                const elementSpace = sorted.reduce((sum, el) => sum + (el.height || 0), 0);
                const gap = (totalSpace - elementSpace) / (sorted.length - 1);

                let currentY = first.translation.y + (first.height || 0) + gap;
                for (let i = 1; i < sorted.length - 1; i++) {
                    sorted[i].translation = { x: sorted[i].translation.x, y: currentY };
                    currentY += (sorted[i].height || 0) + gap;
                }
            }
            return true;
        },

        // Element Property Updates
        updateElementPosition: (x, y) => {
            const selection = Array.from(editor.context.selection);
            if (selection.length === 1) {
                const current = selection[0].translation;
                selection[0].translation = {
                    x: x !== null ? x : current.x,
                    y: y !== null ? y : current.y
                };
                return true;
            }
            return false;
        },

        updateElementSize: (width, height) => {
            const selection = Array.from(editor.context.selection);
            if (selection.length === 1) {
                if (width !== null) selection[0].width = width;
                if (height !== null) selection[0].height = height;
                return true;
            }
            return false;
        },

        getElementProperties: () => {
            const selection = Array.from(editor.context.selection);
            if (selection.length === 1) {
                const el = selection[0];
                return {
                    x: Math.round(el.translation.x),
                    y: Math.round(el.translation.y),
                    width: Math.round(el.width || 0),
                    height: Math.round(el.height || 0)
                };
            }
            return null;
        },

        createStyledText: (text, effect) => {
            const textElement = editor.createText();
            textElement.text = text;
            textElement.translation = { x: Math.random() * 200, y: Math.random() * 200 };

            // Apply effect-specific styling
            switch (effect) {
                case 'neon':
                    textElement.fontSize = 32;
                    textElement.fill = editor.makeColorFill({ red: 0, green: 1, blue: 1, alpha: 1 });
                    break;
                case 'shadow3d':
                    textElement.fontSize = 28;
                    textElement.fill = editor.makeColorFill({ red: 0.2, green: 0.2, blue: 0.2, alpha: 1 });
                    break;
                case 'vintage':
                    textElement.fontSize = 30;
                    textElement.fill = editor.makeColorFill({ red: 0.55, green: 0.27, blue: 0.07, alpha: 1 });
                    break;
                case 'gradient':
                case 'metallic':
                    textElement.fontSize = 32;
                    textElement.fill = editor.makeColorFill({ red: 0.4, green: 0.6, blue: 0.8, alpha: 1 });
                    break;
                case 'outline':
                    textElement.fontSize = 32;
                    textElement.fill = editor.makeColorFill({ red: 0, green: 0, blue: 0, alpha: 1 });
                    break;
                default:
                    textElement.fontSize = 24;
            }

            editor.context.insertionParent.children.append(textElement);
            return textElement.id;
        },

        captureSelectedAsset: () => {
            const selection = Array.from(editor.context.selection);
            console.log('Capturing asset, selection length:', selection.length);

            if (selection.length === 1) {
                const element = selection[0];
                console.log('Selected element constructor name:', element.constructor.name);

                // Determine element type more reliably
                let elementType = 'Unknown';
                if (element.text !== undefined) {
                    elementType = 'Text';
                } else if (element.width !== undefined && element.height !== undefined) {
                    // Check if it's a circle/ellipse (width === height for circles)
                    if (element.width === element.height) {
                        elementType = 'Ellipse';
                    } else {
                        elementType = 'Rectangle';
                    }
                }

                console.log('Detected element type:', elementType);

                // Capture more detailed element data
                const assetData = {
                    id: element.id,
                    type: elementType,
                    properties: {
                        x: element.translation ? element.translation.x : 0,
                        y: element.translation ? element.translation.y : 0,
                        width: element.width || 0,
                        height: element.height || 0
                    }
                };

                // Add type-specific properties
                if (elementType === 'Text') {
                    assetData.properties.text = element.text || 'Sample Text';
                    assetData.properties.fontSize = element.fontSize || 16;
                    console.log('Captured text:', assetData.properties.text);
                }

                // Try to capture fill color
                if (element.fill) {
                    try {
                        assetData.properties.fillColor = {
                            red: element.fill.color?.red || 0,
                            green: element.fill.color?.green || 0,
                            blue: element.fill.color?.blue || 0,
                            alpha: element.fill.color?.alpha || 1
                        };
                        console.log('Captured fill color:', assetData.properties.fillColor);
                    } catch (e) {
                        console.log('Could not capture fill color:', e);
                    }
                }

                console.log('Final captured asset data:', assetData);
                return assetData;
            }

            console.log('No single element selected');
            return null;
        },

        recreateAssetFromTemplate: (assetData) => {
            console.log('Attempting to recreate asset:', assetData);

            try {
                if (!assetData || !assetData.type) {
                    console.error('Invalid asset data:', assetData);
                    return null;
                }

                let newElement;

                switch (assetData.type) {
                    case 'Text':
                        console.log('Creating text element...');
                        newElement = editor.createText();

                        if (assetData.properties && assetData.properties.text) {
                            newElement.text = assetData.properties.text;
                            console.log('Set text:', assetData.properties.text);
                        }

                        if (assetData.properties && assetData.properties.fontSize) {
                            newElement.fontSize = assetData.properties.fontSize;
                            console.log('Set fontSize:', assetData.properties.fontSize);
                        }
                        break;

                    case 'Rectangle':
                        console.log('Creating rectangle element...');
                        newElement = editor.createRectangle();
                        break;

                    case 'Ellipse':
                        console.log('Creating ellipse element...');
                        newElement = editor.createEllipse();
                        break;

                    default:
                        console.error('Unknown element type:', assetData.type);
                        return null;
                }

                if (newElement) {
                    console.log('Element created successfully, setting properties...');

                    // Set size
                    if (assetData.properties && assetData.properties.width) {
                        newElement.width = assetData.properties.width;
                        console.log('Set width:', assetData.properties.width);
                    }
                    if (assetData.properties && assetData.properties.height) {
                        newElement.height = assetData.properties.height;
                        console.log('Set height:', assetData.properties.height);
                    }

                    // Set position (with slight offset so it doesn't overlap exactly)
                    const x = (assetData.properties && assetData.properties.x) ? assetData.properties.x + 20 : 50;
                    const y = (assetData.properties && assetData.properties.y) ? assetData.properties.y + 20 : 50;

                    newElement.translation = { x, y };
                    console.log('Set position:', x, y);

                    // Try to restore fill color
                    if (assetData.properties && assetData.properties.fillColor) {
                        try {
                            newElement.fill = editor.makeColorFill(assetData.properties.fillColor);
                            console.log('Set fill color:', assetData.properties.fillColor);
                        } catch (e) {
                            console.log('Could not restore fill color:', e);
                        }
                    }

                    editor.context.insertionParent.children.append(newElement);
                    console.log('Element added to document successfully');
                    return newElement.id;
                } else {
                    console.error('Failed to create element');
                    return null;
                }
            } catch (error) {
                console.error('Failed to recreate asset - detailed error:', error);
                console.error('Asset data that caused error:', JSON.stringify(assetData, null, 2));
                return null;
            }
        },

        createBulkTextElement: (config) => {
            try {
                const textElement = editor.createText();
                textElement.text = config.text || 'Sample Text';
                textElement.fontSize = config.fontSize || 16;

                if (config.width) textElement.width = config.width;
                if (config.height) textElement.height = config.height;

                textElement.translation = {
                    x: config.x || 50,
                    y: config.y || 50
                };

                editor.context.insertionParent.children.append(textElement);
                return textElement.id;
            } catch (error) {
                console.error('Failed to create bulk text element:', error);
                return null;
            }
        },

        createBulkRectangle: (config) => {
            try {
                const rectangle = editor.createRectangle();
                rectangle.width = config.width || 100;
                rectangle.height = config.height || 80;
                rectangle.translation = {
                    x: config.x || 50,
                    y: config.y || 50
                };

                // Apply color if provided
                if (config.color) {
                    const color = this.parseColor(config.color);
                    if (color) {
                        rectangle.fill = editor.makeColorFill(color);
                    }
                }

                editor.context.insertionParent.children.append(rectangle);
                return rectangle.id;
            } catch (error) {
                console.error('Failed to create bulk rectangle:', error);
                return null;
            }
        },

        applyColorToElement: (elementId, colorString) => {
            try {
                const elements = Array.from(editor.context.insertionParent.children);
                const element = elements.find(el => el.id === elementId);

                if (element) {
                    const color = this.parseColor(colorString);
                    if (color) {
                        element.fill = editor.makeColorFill(color);
                        return true;
                    }
                }
                return false;
            } catch (error) {
                console.error('Failed to apply color:', error);
                return false;
            }
        },

        parseColor: (colorString) => {
            // Handle common color formats
            const colorMap = {
                'red': { red: 1, green: 0, blue: 0, alpha: 1 },
                'blue': { red: 0, green: 0, blue: 1, alpha: 1 },
                'green': { red: 0, green: 1, blue: 0, alpha: 1 },
                'yellow': { red: 1, green: 1, blue: 0, alpha: 1 },
                'purple': { red: 0.5, green: 0, blue: 0.5, alpha: 1 },
                'orange': { red: 1, green: 0.5, blue: 0, alpha: 1 },
                'pink': { red: 1, green: 0.75, blue: 0.8, alpha: 1 }
            };

            const lowerColor = colorString.toLowerCase();
            if (colorMap[lowerColor]) {
                return colorMap[lowerColor];
            }

            // Handle hex colors
            if (colorString.startsWith('#')) {
                const hex = colorString.slice(1);
                if (hex.length === 6) {
                    return {
                        red: parseInt(hex.slice(0, 2), 16) / 255,
                        green: parseInt(hex.slice(2, 4), 16) / 255,
                        blue: parseInt(hex.slice(4, 6), 16) / 255,
                        alpha: 1
                    };
                }
            }

            return null;
        }
    };

    runtime.exposeApi(sandboxApi);
}

start();
