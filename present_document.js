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

                // Capture comprehensive element data
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

                // Add type-specific properties with comprehensive styling
                if (elementType === 'Text') {
                    assetData.properties.text = element.text || 'Sample Text';
                    assetData.properties.fontSize = element.fontSize || 16;
                    
                    // Capture text styling
                    if (element.fontFamily) assetData.properties.fontFamily = element.fontFamily;
                    if (element.fontWeight) assetData.properties.fontWeight = element.fontWeight;
                    if (element.fontStyle) assetData.properties.fontStyle = element.fontStyle;
                    if (element.textAlign) assetData.properties.textAlign = element.textAlign;
                    if (element.lineHeight) assetData.properties.lineHeight = element.lineHeight;
                    
                    console.log('Captured text:', assetData.properties.text, 'fontSize:', assetData.properties.fontSize);
                }

                // Try to capture fill color and other visual properties
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

                // Capture stroke properties
                if (element.stroke) {
                    try {
                        assetData.properties.stroke = {
                            color: {
                                red: element.stroke.color?.red || 0,
                                green: element.stroke.color?.green || 0,
                                blue: element.stroke.color?.blue || 0,
                                alpha: element.stroke.color?.alpha || 1
                            },
                            width: element.stroke.width || 1
                        };
                        console.log('Captured stroke:', assetData.properties.stroke);
                    } catch (e) {
                        console.log('Could not capture stroke:', e);
                    }
                }

                // Capture opacity
                if (element.opacity !== undefined) {
                    assetData.properties.opacity = element.opacity;
                }

                // Capture rotation
                if (element.rotation !== undefined) {
                    assetData.properties.rotation = element.rotation;
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

                        // Apply comprehensive text styling
                        if (assetData.properties && assetData.properties.fontSize) {
                            newElement.fontSize = assetData.properties.fontSize;
                            console.log('Set fontSize:', assetData.properties.fontSize);
                        }
                        
                        // Only set text properties that exist
                        if (assetData.properties && assetData.properties.fontFamily) {
                            try {
                                newElement.fontFamily = assetData.properties.fontFamily;
                            } catch (e) {
                                console.log('Could not set fontFamily:', e);
                            }
                        }
                        break;

                    case 'Rectangle':
                        console.log('Creating rectangle element...');
                        newElement = editor.createRectangle();
                        
                        // Set size for rectangles
                        if (assetData.properties && assetData.properties.width) {
                            newElement.width = assetData.properties.width;
                            console.log('Set width:', assetData.properties.width);
                        }
                        if (assetData.properties && assetData.properties.height) {
                            newElement.height = assetData.properties.height;
                            console.log('Set height:', assetData.properties.height);
                        }
                        break;

                    case 'Ellipse':
                        console.log('Creating ellipse element...');
                        newElement = editor.createEllipse();
                        
                        // Set size for ellipses
                        if (assetData.properties && assetData.properties.width) {
                            newElement.width = assetData.properties.width;
                            console.log('Set width:', assetData.properties.width);
                        }
                        if (assetData.properties && assetData.properties.height) {
                            newElement.height = assetData.properties.height;
                            console.log('Set height:', assetData.properties.height);
                        }
                        break;

                    default:
                        console.error('Unknown element type:', assetData.type);
                        return null;
                }

                if (newElement) {
                    console.log('Element created successfully, setting position...');

                    // Set position (with slight offset so it doesn't overlap exactly)
                    const x = (assetData.properties && assetData.properties.x) ? assetData.properties.x + 20 : 50;
                    const y = (assetData.properties && assetData.properties.y) ? assetData.properties.y + 20 : 50;

                    newElement.translation = { x, y };
                    console.log('Set position:', x, y);

                    // Apply fill color
                    if (assetData.properties && assetData.properties.fillColor) {
                        try {
                            newElement.fill = editor.makeColorFill(assetData.properties.fillColor);
                            console.log('Set fill color:', assetData.properties.fillColor);
                        } catch (e) {
                            console.log('Could not restore fill color:', e);
                        }
                    }

                    // Apply stroke (only for shapes, not text)
                    if (assetData.type !== 'Text' && assetData.properties && assetData.properties.stroke) {
                        try {
                            newElement.stroke = editor.makeStroke(assetData.properties.stroke);
                            console.log('Set stroke:', assetData.properties.stroke);
                        } catch (e) {
                            console.log('Could not restore stroke:', e);
                        }
                    }

                    // Apply opacity
                    if (assetData.properties && assetData.properties.opacity !== undefined) {
                        try {
                            newElement.opacity = assetData.properties.opacity;
                            console.log('Set opacity:', assetData.properties.opacity);
                        } catch (e) {
                            console.log('Could not set opacity:', e);
                        }
                    }

                    // Apply rotation
                    if (assetData.properties && assetData.properties.rotation !== undefined) {
                        try {
                            newElement.rotation = assetData.properties.rotation;
                            console.log('Set rotation:', assetData.properties.rotation);
                        } catch (e) {
                            console.log('Could not set rotation:', e);
                        }
                    }

                    editor.context.insertionParent.children.append(newElement);
                    console.log('Element added to document successfully with styling');
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
                console.log('Creating bulk text element with config:', config);
                
                const textElement = editor.createText();
                textElement.text = config.text || 'Sample Text';
                textElement.fontSize = config.fontSize || 16;

                // Adobe Express canvas is typically 1080x1080 for social media
                // Keep elements within safe bounds: 50-1000 for x, 50-1000 for y
                const canvasWidth = 1080;
                const canvasHeight = 1080;
                const margin = 50;
                
                const x = Math.max(margin, Math.min(canvasWidth - 200, config.x || 50));
                const y = Math.max(margin, Math.min(canvasHeight - 100, config.y || 50));
                
                textElement.translation = { x, y };
                console.log(`Positioned text "${config.text}" at (${x}, ${y})`);

                // Set color if provided
                if (config.color && config.color !== 'black') {
                    try {
                        const colorMap = {
                            'red': { red: 1, green: 0, blue: 0, alpha: 1 },
                            'blue': { red: 0, green: 0, blue: 1, alpha: 1 },
                            'green': { red: 0, green: 1, blue: 0, alpha: 1 },
                            'purple': { red: 0.5, green: 0, blue: 0.5, alpha: 1 },
                            'orange': { red: 1, green: 0.5, blue: 0, alpha: 1 },
                            'pink': { red: 1, green: 0.75, blue: 0.8, alpha: 1 },
                            'yellow': { red: 1, green: 1, blue: 0, alpha: 1 },
                            'gray': { red: 0.5, green: 0.5, blue: 0.5, alpha: 1 }
                        };

                        const colorValue = colorMap[config.color.toLowerCase()] || { red: 0, green: 0, blue: 0, alpha: 1 };
                        textElement.fill = editor.makeColorFill(colorValue);
                        console.log('Applied color:', config.color, colorValue);
                    } catch (colorError) {
                        console.log('Could not apply color:', colorError);
                    }
                }

                // Add to document
                editor.context.insertionParent.children.append(textElement);
                console.log('Bulk text element created successfully:', textElement.text);
                
                return { success: true, elementId: textElement.id };
            } catch (error) {
                console.error('Failed to create bulk text element:', error);
                return { success: false, message: error.message };
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

                // Apply color if provided using the parseColor method
                if (config.color) {
                    const color = sandboxApi.parseColor(config.color);
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
                    const color = sandboxApi.parseColor(colorString);
                    if (color) {
                        try {
                            // For text elements, try multiple approaches
                            if (element.text !== undefined) {
                                // Text element - try both fill and textColor
                                element.fill = editor.makeColorFill(color);

                                if (element.textColor !== undefined) {
                                    element.textColor = color;
                                }

                                // Try setting color on text ranges if available
                                if (element.textRanges && element.textRanges.length > 0) {
                                    element.textRanges.forEach(range => {
                                        if (range.fill !== undefined) {
                                            range.fill = editor.makeColorFill(color);
                                        }
                                    });
                                }
                            } else {
                                // Shape element
                                element.fill = editor.makeColorFill(color);
                            }

                            console.log('Successfully applied color', colorString, 'to element', elementId);
                            return true;
                        } catch (e) {
                            console.log('Error in color application:', e);
                        }
                    } else {
                        console.log('Failed to parse color:', colorString);
                    }
                } else {
                    console.log('Element not found with ID:', elementId);
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
        },

        // Project Navigator Methods
        getProjectInfo: async () => {
            try {
                // Use insertionParent instead of page.children
                const insertionParent = editor.context.insertionParent;
                let elementCount = 0;

                try {
                    elementCount = insertionParent.children ? insertionParent.children.length : 0;
                } catch (e) {
                    console.log('Could not access insertionParent.children');
                    elementCount = 0;
                }

                return {
                    name: 'Adobe Express Document',
                    id: 'current-document',
                    pageCount: 1,
                    currentPageIndex: 0,
                    elementCount: elementCount
                };
            } catch (error) {
                console.error('Failed to get project info:', error);
                return {
                    name: 'Adobe Express Document',
                    id: 'current',
                    pageCount: 1,
                    currentPageIndex: 0,
                    elementCount: 0
                };
            }
        },

        getProjectPages: async () => {
            try {
                // Use insertionParent instead of page.children
                const insertionParent = editor.context.insertionParent;
                let elementCount = 0;

                try {
                    elementCount = insertionParent.children ? insertionParent.children.length : 0;
                } catch (e) {
                    console.log('Could not access insertionParent.children');
                    elementCount = 0;
                }

                return [{
                    id: 'current-page',
                    name: 'Current Page',
                    index: 0,
                    isCurrent: true,
                    elementCount: elementCount
                }];
            } catch (error) {
                console.error('Failed to get pages:', error);
                return [{
                    id: 'page-1',
                    name: 'Page 1',
                    index: 0,
                    isCurrent: true,
                    elementCount: 0
                }];
            }
        },

        navigateToPage: async (pageIndex) => {
            try {
                // Page navigation not available in current SDK
                console.log('Page navigation not supported in current Adobe Express SDK');
                return false;
            } catch (error) {
                console.error('Failed to navigate to page:', error);
                return false;
            }
        },

        getDocumentStats: async () => {
            try {
                // Use insertionParent instead of page.children
                const insertionParent = editor.context.insertionParent;
                let elements = [];

                try {
                    elements = insertionParent.children ? Array.from(insertionParent.children) : [];
                } catch (e) {
                    console.log('Could not access insertionParent.children, using empty array');
                    elements = [];
                }

                const stats = {
                    totalElements: elements.length,
                    textElements: elements.filter(el => el.text !== undefined).length,
                    shapeElements: elements.filter(el => el.text === undefined && el.fill !== undefined).length,
                    imageElements: elements.filter(el => el.mediaRectangle !== undefined).length
                };

                return stats;
            } catch (error) {
                console.error('Failed to get document stats:', error);
                return {
                    totalElements: 0,
                    textElements: 0,
                    shapeElements: 0,
                    imageElements: 0
                };
            }
        },

        // Quick Access Toolbar Actions
        duplicateSelectedElement: async () => {
            const selection = Array.from(editor.context.selection);
            if (selection.length === 0) {
                throw new Error('No element selected');
            }

            const element = selection[0];

            try {
                // Instead of clone(), create a new element with similar properties
                let duplicate;

                if (element.text !== undefined) {
                    // Text element
                    duplicate = editor.createText();
                    duplicate.text = element.text;
                    duplicate.fontSize = element.fontSize || 16;
                    if (element.fill) {
                        duplicate.fill = element.fill;
                    }
                } else if (element.fill !== undefined) {
                    // Shape element
                    duplicate = editor.createRectangle();
                    duplicate.width = element.width || 100;
                    duplicate.height = element.height || 100;
                    if (element.fill) {
                        duplicate.fill = element.fill;
                    }
                } else {
                    // Fallback: create a simple rectangle
                    duplicate = editor.createRectangle();
                    duplicate.width = element.width || 100;
                    duplicate.height = element.height || 100;
                }

                // Position the duplicate with offset
                duplicate.translation = {
                    x: element.translation.x + 20,
                    y: element.translation.y + 20
                };

                editor.context.insertionParent.children.append(duplicate);
                console.log('Element duplicated successfully');
                return duplicate.id;

            } catch (error) {
                console.error('Duplication failed, trying simple approach:', error);

                // Fallback: create a basic rectangle as a "duplicate"
                const duplicate = editor.createRectangle();
                duplicate.width = element.width || 100;
                duplicate.height = element.height || 100;
                duplicate.translation = {
                    x: element.translation.x + 20,
                    y: element.translation.y + 20
                };

                editor.context.insertionParent.children.append(duplicate);
                return duplicate.id;
            }
        },

        // Filter application
        applyImageFilter: async (filterData) => {
            const selection = Array.from(editor.context.selection);
            if (selection.length === 0) {
                return false;
            }

            let appliedCount = 0;

            for (const element of selection) {
                try {
                    // Check if element supports filters (images, shapes with fills)
                    if (element.fill || element.src) {
                        // Note: Actual filter application would require advanced image processing
                        // For now, we'll simulate by adjusting opacity and other available properties

                        if (filterData.brightness !== 0) {
                            // Simulate brightness by adjusting opacity
                            const brightnessEffect = 1 + (filterData.brightness / 200);
                            element.opacity = Math.max(0.1, Math.min(1, element.opacity * brightnessEffect));
                        }

                        // Log the filter application
                        console.log('Applied filter to element:', element.id, filterData);
                        appliedCount++;
                    }
                } catch (error) {
                    console.error('Failed to apply filter to element:', error);
                }
            }

            return appliedCount > 0;
        },

        // Pattern application
        applyPatternToElements: async (patternData) => {
            const selection = Array.from(editor.context.selection);
            if (selection.length === 0) {
                return false;
            }

            let appliedCount = 0;

            for (const element of selection) {
                try {
                    // Apply pattern based on type
                    if (element.fill !== undefined) {
                        const patternColor = sandboxApi.createPatternFill(patternData);
                        if (patternColor) {
                            element.fill = patternColor;
                            appliedCount++;
                        }
                    }
                } catch (error) {
                    console.error('Failed to apply pattern to element:', error);
                }
            }

            return appliedCount > 0;
        },

        createPatternElement: async (patternData) => {
            try {
                console.log('Creating pattern element with data:', patternData);

                const rectangle = editor.createRectangle();
                rectangle.width = 150;
                rectangle.height = 100;
                rectangle.translation = {
                    x: Math.random() * 200,
                    y: Math.random() * 200
                };

                console.log('Rectangle created, applying pattern fill...');

                // Apply pattern fill
                const patternFill = sandboxApi.createPatternFill(patternData);
                if (patternFill) {
                    console.log('Pattern fill created successfully, applying to rectangle...');
                    rectangle.fill = patternFill;
                    console.log('Pattern fill applied to rectangle');
                } else {
                    console.log('Pattern fill creation failed, using fallback color');
                    // Fallback to solid color
                    const color = sandboxApi.parseColor(patternData.color1);
                    if (color) {
                        rectangle.fill = editor.makeColorFill(color);
                        console.log('Fallback color applied');
                    }
                }

                editor.context.insertionParent.children.append(rectangle);
                console.log('Pattern element added to document');
                return rectangle.id;
            } catch (error) {
                console.error('Failed to create pattern element:', error);
                console.error('Error details:', error.message, error.stack);
                return null;
            }
        },

        // Enhanced pattern fill creation
        createPatternFill: (patternData) => {
            try {
                const color1 = sandboxApi.parseColor(patternData.color1);
                const color2 = sandboxApi.parseColor(patternData.color2);

                if (!color1 || !color2) {
                    return null;
                }

                console.log('Creating pattern fill for:', patternData.type, 'with colors:', color1, color2);

                // Create more sophisticated patterns using available SDK features
                switch (patternData.type) {
                    case 'geometric':
                        // Create a multi-stop gradient for geometric effect
                        try {
                            return editor.makeLinearGradientFill([
                                { color: color1, position: 0 },
                                { color: color2, position: 0.25 },
                                { color: color1, position: 0.5 },
                                { color: color2, position: 0.75 },
                                { color: color1, position: 1 }
                            ], { x: 0, y: 0 }, { x: 1, y: 1 });
                        } catch (e) {
                            console.log('Gradient failed, using solid color');
                            return editor.makeColorFill(color1);
                        }

                    case 'stripes':
                        // Vertical stripes using gradient
                        try {
                            return editor.makeLinearGradientFill([
                                { color: color1, position: 0 },
                                { color: color1, position: 0.2 },
                                { color: color2, position: 0.2 },
                                { color: color2, position: 0.4 },
                                { color: color1, position: 0.4 },
                                { color: color1, position: 0.6 },
                                { color: color2, position: 0.6 },
                                { color: color2, position: 0.8 },
                                { color: color1, position: 0.8 },
                                { color: color1, position: 1 }
                            ], { x: 0, y: 0 }, { x: 1, y: 0 });
                        } catch (e) {
                            return editor.makeColorFill(color1);
                        }

                    case 'dots':
                        // Radial gradient for dot-like effect
                        try {
                            return editor.makeRadialGradientFill([
                                { color: color1, position: 0 },
                                { color: color2, position: 0.3 },
                                { color: color1, position: 0.6 },
                                { color: color2, position: 1 }
                            ], { x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }, 0.8);
                        } catch (e) {
                            return editor.makeColorFill(color1);
                        }

                    case 'waves':
                        // Diagonal wave-like gradient
                        try {
                            return editor.makeLinearGradientFill([
                                { color: color1, position: 0 },
                                { color: color2, position: 0.15 },
                                { color: color1, position: 0.3 },
                                { color: color2, position: 0.45 },
                                { color: color1, position: 0.6 },
                                { color: color2, position: 0.75 },
                                { color: color1, position: 1 }
                            ], { x: 0, y: 0 }, { x: 1, y: 0.3 });
                        } catch (e) {
                            return editor.makeColorFill(color1);
                        }

                    case 'hexagon':
                        // Hexagonal radial gradient
                        try {
                            return editor.makeRadialGradientFill([
                                { color: color2, position: 0 },
                                { color: color1, position: 0.4 },
                                { color: color2, position: 0.7 },
                                { color: color1, position: 1 }
                            ], { x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }, 0.6);
                        } catch (e) {
                            return editor.makeColorFill(color1);
                        }

                    case 'noise':
                        // Random gradient for noise effect
                        const positions = [0, 0.2, 0.4, 0.6, 0.8, 1];
                        const gradientStops = positions.map(pos => ({
                            color: Math.random() > 0.5 ? color1 : color2,
                            position: pos
                        }));

                        try {
                            return editor.makeLinearGradientFill(
                                gradientStops,
                                { x: Math.random(), y: Math.random() },
                                { x: Math.random(), y: Math.random() }
                            );
                        } catch (e) {
                            return editor.makeColorFill(Math.random() > 0.5 ? color1 : color2);
                        }

                    default:
                        return editor.makeColorFill(color1);
                }
            } catch (error) {
                console.error('Failed to create pattern fill:', error);
                // Fallback to solid color
                const color1 = sandboxApi.parseColor(patternData.color1);
                return color1 ? editor.makeColorFill(color1) : null;
            }
        },

        // Color Palette Extractor & Manager
        extractColorsFromSelected: async () => {
            const selection = Array.from(editor.context.selection);
            if (selection.length === 0) {
                return { success: false, message: 'No element selected' };
            }

            const extractedColors = [];
            
            for (const element of selection) {
                try {
                    // Extract color from fill
                    if (element.fill && element.fill.color) {
                        const color = element.fill.color;
                        const hexColor = sandboxApi.rgbaToHex(color);
                        
                        if (!extractedColors.some(c => c.hex === hexColor)) {
                            extractedColors.push({
                                hex: hexColor,
                                rgba: color,
                                source: element.text ? 'Text Element' : 'Shape Element',
                                elementId: element.id
                            });
                        }
                    }

                    // For text elements, also check text color if available
                    if (element.text && element.textColor) {
                        const color = element.textColor;
                        const hexColor = sandboxApi.rgbaToHex(color);
                        
                        if (!extractedColors.some(c => c.hex === hexColor)) {
                            extractedColors.push({
                                hex: hexColor,
                                rgba: color,
                                source: 'Text Color',
                                elementId: element.id
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error extracting color from element:', error);
                }
            }

            return {
                success: true,
                colors: extractedColors,
                message: `Extracted ${extractedColors.length} unique colors`
            };
        },

        saveBrandPalette: async (paletteName, colors) => {
            try {
                // Send palette data to iframe for storage
                runtime.apiProxy("documentSandbox").then(proxy => {
                    proxy.sendPaletteToIframe(paletteName, colors);
                });

                return { 
                    success: true, 
                    palette: {
                        id: Date.now(),
                        name: paletteName,
                        colors: colors,
                        createdAt: new Date().toISOString(),
                        elementCount: colors.length
                    }
                };
            } catch (error) {
                console.error('Failed to save brand palette:', error);
                return { success: false, message: 'Failed to save palette' };
            }
        },

        getBrandPalettes: async () => {
            // This will be handled by the iframe
            return { success: true, palettes: [] };
        },

        deleteBrandPalette: async (paletteId) => {
            // This will be handled by the iframe
            return { success: true };
        },

        applyBrandPaletteToSelected: async (palette) => {
            const selection = Array.from(editor.context.selection);
            if (selection.length === 0) {
                return { success: false, message: 'No elements selected' };
            }

            if (!palette.colors || palette.colors.length === 0) {
                return { success: false, message: 'Palette has no colors' };
            }

            let appliedCount = 0;

            for (let i = 0; i < selection.length; i++) {
                const element = selection[i];
                // Cycle through palette colors
                const colorIndex = i % palette.colors.length;
                const color = palette.colors[colorIndex];

                try {
                    if (element.fill !== undefined) {
                        element.fill = editor.makeColorFill(color.rgba);
                        appliedCount++;
                    }
                } catch (error) {
                    console.error('Failed to apply color to element:', error);
                }
            }

            return {
                success: appliedCount > 0,
                message: `Applied palette colors to ${appliedCount} elements`,
                appliedCount: appliedCount
            };
        },

        generateColorVariations: async (baseColor, variationType = 'tints') => {
            try {
                const variations = [];
                const baseRgba = typeof baseColor === 'string' ? 
                    sandboxApi.parseColor(baseColor) : baseColor;

                if (!baseRgba) {
                    return { success: false, message: 'Invalid base color' };
                }

                switch (variationType) {
                    case 'tints':
                        // Lighter variations (adding white)
                        for (let i = 1; i <= 5; i++) {
                            const factor = i * 0.15;
                            variations.push({
                                hex: sandboxApi.rgbaToHex({
                                    red: Math.min(1, baseRgba.red + (1 - baseRgba.red) * factor),
                                    green: Math.min(1, baseRgba.green + (1 - baseRgba.green) * factor),
                                    blue: Math.min(1, baseRgba.blue + (1 - baseRgba.blue) * factor),
                                    alpha: baseRgba.alpha
                                }),
                                rgba: {
                                    red: Math.min(1, baseRgba.red + (1 - baseRgba.red) * factor),
                                    green: Math.min(1, baseRgba.green + (1 - baseRgba.green) * factor),
                                    blue: Math.min(1, baseRgba.blue + (1 - baseRgba.blue) * factor),
                                    alpha: baseRgba.alpha
                                },
                                name: `Tint ${i}`
                            });
                        }
                        break;

                    case 'shades':
                        // Darker variations (adding black)
                        for (let i = 1; i <= 5; i++) {
                            const factor = i * 0.15;
                            variations.push({
                                hex: sandboxApi.rgbaToHex({
                                    red: Math.max(0, baseRgba.red * (1 - factor)),
                                    green: Math.max(0, baseRgba.green * (1 - factor)),
                                    blue: Math.max(0, baseRgba.blue * (1 - factor)),
                                    alpha: baseRgba.alpha
                                }),
                                rgba: {
                                    red: Math.max(0, baseRgba.red * (1 - factor)),
                                    green: Math.max(0, baseRgba.green * (1 - factor)),
                                    blue: Math.max(0, baseRgba.blue * (1 - factor)),
                                    alpha: baseRgba.alpha
                                },
                                name: `Shade ${i}`
                            });
                        }
                        break;

                    case 'complementary':
                        // Complementary and analogous colors
                        const hsl = sandboxApi.rgbaToHsl(baseRgba);
                        const complementaryHue = (hsl.h + 180) % 360;
                        const analogous1 = (hsl.h + 30) % 360;
                        const analogous2 = (hsl.h - 30 + 360) % 360;

                        [complementaryHue, analogous1, analogous2].forEach((hue, index) => {
                            const rgba = sandboxApi.hslToRgba({ h: hue, s: hsl.s, l: hsl.l });
                            variations.push({
                                hex: sandboxApi.rgbaToHex(rgba),
                                rgba: rgba,
                                name: index === 0 ? 'Complementary' : `Analogous ${index}`
                            });
                        });
                        break;
                }

                return { success: true, variations: variations };
            } catch (error) {
                console.error('Failed to generate color variations:', error);
                return { success: false, message: 'Failed to generate variations' };
            }
        },

        // Color utility functions
        rgbaToHex: (rgba) => {
            const toHex = (value) => {
                const hex = Math.round(value * 255).toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            };
            
            return `#${toHex(rgba.red)}${toHex(rgba.green)}${toHex(rgba.blue)}`;
        },

        rgbaToHsl: (rgba) => {
            const r = rgba.red;
            const g = rgba.green;
            const b = rgba.blue;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;

            if (max === min) {
                h = s = 0; // achromatic
            } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }

            return { h: h * 360, s: s, l: l };
        },

        hslToRgba: (hsl) => {
            const h = hsl.h / 360;
            const s = hsl.s;
            const l = hsl.l;

            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            let r, g, b;

            if (s === 0) {
                r = g = b = l; // achromatic
            } else {
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r = hue2rgb(p, q, h + 1/3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1/3);
            }

            return { red: r, green: g, blue: b, alpha: 1 };
        },

        clearAllElements: () => {
            try {
                const insertionParent = editor.context.insertionParent;
                const elements = Array.from(insertionParent.children);
                
                elements.forEach(element => {
                    try {
                        insertionParent.children.remove(element);
                    } catch (e) {
                        console.log('Could not remove element:', e);
                    }
                });
                
                console.log(`Cleared ${elements.length} elements from canvas`);
                return { success: true, clearedCount: elements.length };
            } catch (error) {
                console.error('Failed to clear elements:', error);
                return { success: false, message: error.message };
            }
        },

        // ==================== PHASE 1 FEATURES ====================
        
        // Layer Management
        getAllLayers: () => {
            try {
                const insertionParent = editor.context.insertionParent;
                const elements = Array.from(insertionParent.children);
                
                return elements.map((element, index) => ({
                    id: element.id,
                    name: element.name || `Layer ${index + 1}`,
                    type: element.constructor.name,
                    visible: true, // Adobe Express doesn't have visibility API yet
                    x: element.translation?.x || 0,
                    y: element.translation?.y || 0,
                    width: element.width || 0,
                    height: element.height || 0
                }));
            } catch (error) {
                console.error('Failed to get layers:', error);
                return [];
            }
        },

        selectLayerById: (layerId) => {
            try {
                const insertionParent = editor.context.insertionParent;
                const elements = Array.from(insertionParent.children);
                const element = elements.find(el => el.id === layerId);
                
                if (element) {
                    // Clear current selection
                    editor.context.selection.clear();
                    // Add element to selection
                    editor.context.selection.add(element);
                    return { success: true };
                }
                
                return { success: false, message: 'Layer not found' };
            } catch (error) {
                console.error('Failed to select layer:', error);
                return { success: false, message: error.message };
            }
        },

        deleteLayerById: (layerId) => {
            try {
                const insertionParent = editor.context.insertionParent;
                const elements = Array.from(insertionParent.children);
                const element = elements.find(el => el.id === layerId);
                
                if (element) {
                    insertionParent.children.remove(element);
                    return { success: true };
                }
                
                return { success: false, message: 'Layer not found' };
            } catch (error) {
                console.error('Failed to delete layer:', error);
                return { success: false, message: error.message };
            }
        },

        toggleLayerVisibility: (layerId) => {
            // Adobe Express doesn't have layer visibility API yet
            // This is a placeholder for future implementation
            return { 
                success: false, 
                message: 'Layer visibility control not available in Adobe Express API',
                visible: true 
            };
        },

        createBlankLayer: () => {
            try {
                // Create a transparent rectangle as a "blank layer"
                const rectangle = editor.createRectangle();
                rectangle.width = 100;
                rectangle.height = 100;
                rectangle.translation = { x: 50, y: 50 };
                
                // Make it transparent
                const transparentColor = { red: 0, green: 0, blue: 0, alpha: 0.1 };
                rectangle.fill = editor.makeColorFill(transparentColor);
                
                editor.context.insertionParent.children.append(rectangle);
                
                return { 
                    success: true, 
                    layerId: rectangle.id,
                    message: 'Blank layer created as transparent rectangle'
                };
            } catch (error) {
                console.error('Failed to create blank layer:', error);
                return { success: false, message: error.message };
            }
        },

        groupSelectedElements: () => {
            try {
                const selection = Array.from(editor.context.selection);
                
                if (selection.length < 2) {
                    return { success: false, message: 'Select at least 2 elements to group' };
                }

                // Adobe Express doesn't have native grouping API yet
                // This is a placeholder for future implementation
                return { 
                    success: false, 
                    message: 'Element grouping not available in Adobe Express API yet'
                };
            } catch (error) {
                console.error('Failed to group elements:', error);
                return { success: false, message: error.message };
            }
        },

        ungroupSelectedElements: () => {
            try {
                const selection = Array.from(editor.context.selection);
                
                if (selection.length === 0) {
                    return { success: false, message: 'No elements selected' };
                }

                // Adobe Express doesn't have native ungrouping API yet
                // This is a placeholder for future implementation
                return { 
                    success: false, 
                    message: 'Element ungrouping not available in Adobe Express API yet'
                };
            } catch (error) {
                console.error('Failed to ungroup elements:', error);
                return { success: false, message: error.message };
            }
        },

        duplicateSelectedElements: () => {
            try {
                const selection = Array.from(editor.context.selection);
                
                if (selection.length === 0) {
                    return { success: false, message: 'No elements selected' };
                }

                let duplicatedCount = 0;
                const insertionParent = editor.context.insertionParent;

                selection.forEach(element => {
                    try {
                        let duplicate;
                        
                        // Create duplicate based on element type
                        if (element.text !== undefined) {
                            // Text element
                            duplicate = editor.createText();
                            duplicate.text = element.text;
                            if (element.fontSize) duplicate.fontSize = element.fontSize;
                            if (element.fill) duplicate.fill = element.fill;
                        } else if (element.constructor.name === 'Rectangle') {
                            // Rectangle
                            duplicate = editor.createRectangle();
                            duplicate.width = element.width;
                            duplicate.height = element.height;
                            if (element.fill) duplicate.fill = element.fill;
                        } else if (element.constructor.name === 'Ellipse') {
                            // Ellipse
                            duplicate = editor.createEllipse();
                            duplicate.width = element.width;
                            duplicate.height = element.height;
                            if (element.fill) duplicate.fill = element.fill;
                        } else {
                            // Generic element - try to copy basic properties
                            console.log('Unsupported element type for duplication:', element.constructor.name);
                            return;
                        }

                        // Position the duplicate slightly offset
                        duplicate.translation = {
                            x: element.translation.x + 20,
                            y: element.translation.y + 20
                        };

                        insertionParent.children.append(duplicate);
                        duplicatedCount++;
                    } catch (error) {
                        console.error('Failed to duplicate element:', error);
                    }
                });

                return { 
                    success: duplicatedCount > 0, 
                    message: `Duplicated ${duplicatedCount} elements`,
                    duplicatedCount 
                };
            } catch (error) {
                console.error('Failed to duplicate elements:', error);
                return { success: false, message: error.message };
            }
        },

        // Smart Alignment Guides
        alignToCanvasCenter: () => {
            try {
                const selection = Array.from(editor.context.selection);
                
                if (selection.length === 0) {
                    return { success: false, message: 'No elements selected' };
                }

                // Get canvas dimensions (approximate)
                const canvasWidth = 1080; // Standard Adobe Express canvas
                const canvasHeight = 1080;
                const centerX = canvasWidth / 2;
                const centerY = canvasHeight / 2;

                let alignedCount = 0;

                selection.forEach(element => {
                    try {
                        const elementCenterX = element.width ? element.width / 2 : 0;
                        const elementCenterY = element.height ? element.height / 2 : 0;

                        element.translation = {
                            x: centerX - elementCenterX,
                            y: centerY - elementCenterY
                        };
                        alignedCount++;
                    } catch (error) {
                        console.error('Failed to center element:', error);
                    }
                });

                return { 
                    success: alignedCount > 0, 
                    message: `Centered ${alignedCount} elements to canvas`,
                    alignedCount 
                };
            } catch (error) {
                console.error('Failed to align to canvas center:', error);
                return { success: false, message: error.message };
            }
        },

        distributeElementsEvenly: () => {
            try {
                const selection = Array.from(editor.context.selection);
                
                if (selection.length < 3) {
                    return { success: false, message: 'Select at least 3 elements to distribute evenly' };
                }

                // Sort elements by X position
                const sortedElements = selection.sort((a, b) => a.translation.x - b.translation.x);
                
                const firstElement = sortedElements[0];
                const lastElement = sortedElements[sortedElements.length - 1];
                
                const totalDistance = lastElement.translation.x - firstElement.translation.x;
                const spacing = totalDistance / (sortedElements.length - 1);

                let distributedCount = 0;

                sortedElements.forEach((element, index) => {
                    if (index > 0 && index < sortedElements.length - 1) {
                        try {
                            element.translation = {
                                x: firstElement.translation.x + (spacing * index),
                                y: element.translation.y // Keep original Y position
                            };
                            distributedCount++;
                        } catch (error) {
                            console.error('Failed to distribute element:', error);
                        }
                    }
                });

                return { 
                    success: distributedCount > 0, 
                    message: `Distributed ${distributedCount + 2} elements evenly`,
                    distributedCount: distributedCount + 2 
                };
            } catch (error) {
                console.error('Failed to distribute elements evenly:', error);
                return { success: false, message: error.message };
            }
        },

        alignToMargins: () => {
            try {
                const selection = Array.from(editor.context.selection);
                
                if (selection.length === 0) {
                    return { success: false, message: 'No elements selected' };
                }

                const margin = 50; // 50px margin from edges
                let alignedCount = 0;

                selection.forEach((element, index) => {
                    try {
                        // Align first element to left margin, others distributed
                        const x = margin + (index * 100); // 100px spacing between elements
                        
                        element.translation = {
                            x: x,
                            y: margin // Align to top margin
                        };
                        alignedCount++;
                    } catch (error) {
                        console.error('Failed to align element to margins:', error);
                    }
                });

                return { 
                    success: alignedCount > 0, 
                    message: `Aligned ${alignedCount} elements to margins`,
                    alignedCount 
                };
            } catch (error) {
                console.error('Failed to align to margins:', error);
                return { success: false, message: error.message };
            }
        },

        // Version check method to verify backend is updated
        getPhase1Version: () => {
            return { 
                version: '1.0.0', 
                timestamp: Date.now(),
                message: 'Phase 1 backend methods loaded successfully',
                methods: [
                    'getAllLayers', 'selectLayerById', 'deleteLayerById', 
                    'toggleLayerVisibility', 'createBlankLayer', 'duplicateSelectedElements',
                    'alignToCanvasCenter', 'distributeElementsEvenly', 'alignToMargins'
                ]
            };
        },

        // Helper method to get canvas bounds
        getCanvasBounds: () => {
            try {
                // Create a generous grid that covers most common canvas sizes
                // Adobe Express supports various sizes: 1080x1080, 1920x1080, 1080x1920, etc.
                let canvasWidth = 2000;   // Large enough for most designs
                let canvasHeight = 2000;  // Large enough for most designs
                
                console.log('Using generous canvas dimensions for grid:', canvasWidth, 'x', canvasHeight);
                return { width: canvasWidth, height: canvasHeight };
                
            } catch (error) {
                console.error('Error getting canvas bounds:', error);
                return { width: 2000, height: 2000 };
            }
        },

        // Grid Overlay System for Phase 1 Features
        createGridOverlay: async (gridSize, gridOpacity) => {
            try {
                console.log('Creating grid overlay on canvas with size:', gridSize, 'opacity:', gridOpacity);
                
                // Create a grid pattern using thin rectangles on the actual canvas
                const gridElements = [];
                
                // Get canvas dimensions using our helper method
                const canvasBounds = sandboxApi.getCanvasBounds();
                const canvasWidth = canvasBounds.width;
                const canvasHeight = canvasBounds.height;
                
                console.log('Using canvas dimensions for grid:', canvasWidth, 'x', canvasHeight);
                
                // Create vertical grid lines using thin rectangles
                for (let x = 0; x <= canvasWidth; x += gridSize) {
                    const verticalLine = editor.createRectangle();
                    verticalLine.width = 1;
                    verticalLine.height = canvasHeight;
                    verticalLine.translation = { x: x, y: 0 };
                    
                    // Set line color
                    const gridColor = { red: 0, green: 0.4, blue: 0.8, alpha: Math.max(0.2, gridOpacity) };
                    verticalLine.fill = editor.makeColorFill(gridColor);
                    
                    editor.context.insertionParent.children.append(verticalLine);
                    gridElements.push(verticalLine.id);
                }
                
                // Create horizontal grid lines using thin rectangles
                for (let y = 0; y <= canvasHeight; y += gridSize) {
                    const horizontalLine = editor.createRectangle();
                    horizontalLine.width = canvasWidth;
                    horizontalLine.height = 1;
                    horizontalLine.translation = { x: 0, y: y };
                    
                    // Set line color
                    const gridColor = { red: 0, green: 0.4, blue: 0.8, alpha: Math.max(0.2, gridOpacity) };
                    horizontalLine.fill = editor.makeColorFill(gridColor);
                    
                    editor.context.insertionParent.children.append(horizontalLine);
                    gridElements.push(horizontalLine.id);
                }
                
                console.log('Grid overlay created successfully with', gridElements.length, 'lines');
                
                return {
                    success: true,
                    gridElementIds: gridElements,
                    message: `Grid overlay created with ${gridElements.length} lines`
                };
                
            } catch (error) {
                console.error('Failed to create grid overlay:', error);
                
                // Fallback: Create a simpler grid with fewer lines
                try {
                    const gridElements = [];
                    // Use the same canvas dimensions as determined above
                    const canvasBounds = sandboxApi.getCanvasBounds();
                    const canvasWidth = canvasBounds.width;
                    const canvasHeight = canvasBounds.height;
                    
                    // Create fewer grid lines for better performance
                    for (let x = 0; x <= canvasWidth; x += gridSize * 2) {
                        const verticalLine = editor.createRectangle();
                        verticalLine.width = 1;
                        verticalLine.height = canvasHeight;
                        verticalLine.translation = { x: x, y: 0 };
                        
                        const gridColor = { red: 0, green: 0.4, blue: 0.8, alpha: Math.max(0.3, gridOpacity) };
                        verticalLine.fill = editor.makeColorFill(gridColor);
                        
                        editor.context.insertionParent.children.append(verticalLine);
                        gridElements.push(verticalLine.id);
                    }
                    
                    for (let y = 0; y <= canvasHeight; y += gridSize * 2) {
                        const horizontalLine = editor.createRectangle();
                        horizontalLine.width = canvasWidth;
                        horizontalLine.height = 1;
                        horizontalLine.translation = { x: 0, y: y };
                        
                        const gridColor = { red: 0, green: 0.4, blue: 0.8, alpha: Math.max(0.3, gridOpacity) };
                        horizontalLine.fill = editor.makeColorFill(gridColor);
                        
                        editor.context.insertionParent.children.append(horizontalLine);
                        gridElements.push(horizontalLine.id);
                    }
                    
                    console.log('Fallback grid created with', gridElements.length, 'rectangle lines');
                    
                    return {
                        success: true,
                        gridElementIds: gridElements,
                        message: `Fallback grid created with ${gridElements.length} lines`
                    };
                    
                } catch (fallbackError) {
                    console.error('Fallback grid creation also failed:', fallbackError);
                    return {
                        success: false,
                        message: 'Failed to create grid overlay: ' + error.message
                    };
                }
            }
        },

        removeGridOverlay: async (gridElementIds) => {
            try {
                if (!gridElementIds || gridElementIds.length === 0) {
                    return { success: true, message: 'No grid elements to remove' };
                }
                
                const elements = Array.from(editor.context.insertionParent.children);
                let removedCount = 0;
                
                for (const elementId of gridElementIds) {
                    const element = elements.find(el => el.id === elementId);
                    if (element) {
                        element.removeFromParent();
                        removedCount++;
                    }
                }
                
                console.log('Removed', removedCount, 'grid elements');
                
                return {
                    success: true,
                    removedCount: removedCount,
                    message: `Removed ${removedCount} grid elements`
                };
                
            } catch (error) {
                console.error('Failed to remove grid overlay:', error);
                return {
                    success: false,
                    message: 'Failed to remove grid overlay: ' + error.message
                };
            }
        }
    };

    runtime.exposeApi(sandboxApi);
}

start();
