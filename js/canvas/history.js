import { dom, maskCanvas, maskCtx } from '../dom.js';
import { state } from '../state.js';
import { drawPreview } from './core.js';

export function saveState() {
    state.canvasStates.push(maskCanvas.toDataURL());
    if (state.canvasStates.length > state.MAX_UNDO) state.canvasStates.shift();
    dom.btnUndoMask.disabled = state.canvasStates.length <= 1;
}

export function undoState() {
    if (state.canvasStates.length > 1) {
        state.canvasStates.pop(); // Borra el actual
        const previousState = state.canvasStates[state.canvasStates.length - 1];
        const img = new Image();
        img.onload = () => {
            maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
            maskCtx.drawImage(img, 0, 0);
            drawPreview();
            dom.btnUndoMask.disabled = state.canvasStates.length <= 1;
        };
        img.src = previousState;
    }
}
