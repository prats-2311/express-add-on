import addOnSandboxSdk from "add-on-sdk-document-sandbox";
import { editor } from "express-document-sdk";

const { runtime } = addOnSandboxSdk.instance;

function start() {
    const sandboxApi = {
        // Selection Management
        getSelectedElements: () => {
            return Array.from(editor.context.selection);
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
            if (selection.length < 2) return false;

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
            return true;
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
        }
    };

    runtime.exposeApi(sandboxApi);
}

start();
