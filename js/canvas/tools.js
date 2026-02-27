import { dom, ctx, loupeCtx, maskCtx } from '../dom.js';
import { state } from '../state.js';
import { getMousePos } from '../utils.js';
import { drawPreview } from './core.js';
import { saveState } from './history.js';

export function setupTools() {
    dom.mainCanvas.addEventListener('mousedown', (e) => {
        if (state.activeToolMode === 'pan') {
            if (!state.originalImage) return;
            state.isPanning = true;
            state.startPanX = e.clientX - state.panX;
            state.startPanY = e.clientY - state.panY;
            dom.mainCanvas.style.transition = 'none';
            return;
        }

        if (state.activeToolMode === 'zoomIn' || state.activeToolMode === 'zoomOut') {
            if (!state.originalImage) return;
            const rect = dom.mainCanvas.getBoundingClientRect();

            const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
            const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

            if (state.activeToolMode === 'zoomIn') {
                state.currentZoom = Math.min(state.currentZoom + 0.5, 5);
            } else {
                state.currentZoom = Math.max(state.currentZoom - 0.5, 1);
                if (state.currentZoom === 1) {
                    state.panX = 0; state.panY = 0;
                }
            }

            dom.mainCanvas.style.transformOrigin = `${xPercent}% ${yPercent}%`;
            dom.mainCanvas.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.currentZoom})`;
            dom.mainCanvas.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            return;
        }

        if (dom.shapeSelect.value !== 'manual' || !state.originalImage || state.isCleaned) return;
        state.isDrawing = true;
        state.lastPos = getMousePos(e);
        drawBrush(state.lastPos);
    });

    dom.mainCanvas.addEventListener('mousemove', (e) => {
        if (state.isPanning && state.activeToolMode === 'pan') {
            state.panX = e.clientX - state.startPanX;
            state.panY = e.clientY - state.startPanY;
            dom.mainCanvas.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.currentZoom})`;
            return;
        }

        if (dom.shapeSelect.value === 'manual' && !state.isCleaned && state.activeToolMode === 'manual') {
            dom.loupeCanvas.classList.remove('hidden');
            updateLoupe(e);
        } else {
            dom.loupeCanvas.classList.add('hidden');
        }

        if (!state.isDrawing) return;
        drawBrush(getMousePos(e));
    });

    window.addEventListener('mouseup', () => {
        if (state.isPanning) {
            state.isPanning = false;
            if (state.activeToolMode === 'pan') dom.mainCanvas.style.cursor = 'grab';
            dom.mainCanvas.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }

        if (state.isDrawing) {
            state.isDrawing = false;
            saveState();
        }
    });

    dom.mainCanvas.addEventListener('mouseleave', () => {
        dom.loupeCanvas.classList.add('hidden');
    });

    // Wheel Zoom
    dom.mainCanvas.addEventListener('wheel', (e) => {
        if (!state.originalImage) return;
        e.preventDefault();

        const rect = dom.mainCanvas.getBoundingClientRect();
        const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

        if (e.deltaY < 0) {
            state.currentZoom = Math.min(state.currentZoom + 0.2, 5);
        } else {
            state.currentZoom = Math.max(state.currentZoom - 0.2, 1);
            if (state.currentZoom === 1) {
                state.panX = 0; state.panY = 0;
            }
        }

        dom.mainCanvas.style.transformOrigin = `${xPercent}% ${yPercent}%`;
        dom.mainCanvas.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.currentZoom})`;
        dom.mainCanvas.style.transition = 'none'; // Instant for wheel
    });

    // Spacebar Pan Toggle
    let isSpaceDown = false;
    let previousToolMode = null;

    window.addEventListener('keydown', (e) => {
        if (!state.originalImage) return;

        // Spacebar for Panning
        if (e.code === 'Space' && !isSpaceDown && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            isSpaceDown = true;
            previousToolMode = state.activeToolMode;
            state.activeToolMode = 'pan';
            dom.mainCanvas.style.cursor = 'grab';
        }

        // Bracket keys for brush size
        if (e.key === '[' || e.key === ']') {
            let currentBrush = parseInt(dom.sliders.brush.value);
            if (e.key === '[') currentBrush = Math.max(5, currentBrush - 5);
            if (e.key === ']') currentBrush = Math.min(200, currentBrush + 5);

            dom.sliders.brush.value = currentBrush;
            dom.numInputs.brush.value = currentBrush;
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            isSpaceDown = false;
            if (previousToolMode) {
                state.activeToolMode = previousToolMode;
                // Update cursor back
                if (state.activeToolMode === 'zoomIn') dom.mainCanvas.style.cursor = 'zoom-in';
                else if (state.activeToolMode === 'zoomOut') dom.mainCanvas.style.cursor = 'zoom-out';
                else if (state.activeToolMode === 'manual') dom.mainCanvas.style.cursor = 'crosshair';
                else dom.mainCanvas.style.cursor = 'default';
            }
        }
    });
}

export function updateLoupe(e) {
    if (!state.originalImage) return;

    const rect = dom.mainCanvas.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    dom.loupeCanvas.style.left = `${cursorX - 20}px`;
    dom.loupeCanvas.style.top = `${cursorY - 20}px`;

    const pos = getMousePos(e);
    const zoom = 4;

    const lWidth = dom.loupeCanvas.width;
    const lHeight = dom.loupeCanvas.height;

    const srcX = pos.x - (lWidth / (2 * zoom));
    const srcY = pos.y - (lHeight / (2 * zoom));
    const srcW = lWidth / zoom;
    const srcH = lHeight / zoom;

    loupeCtx.clearRect(0, 0, lWidth, lHeight);
    loupeCtx.imageSmoothingEnabled = false;

    loupeCtx.drawImage(
        ctx.canvas,
        srcX, srcY, srcW, srcH,
        0, 0, lWidth, lHeight
    );

    loupeCtx.beginPath();
    loupeCtx.arc(lWidth / 2, lHeight / 2, 4, 0, 2 * Math.PI);
    loupeCtx.fillStyle = '#10b981';
    loupeCtx.fill();
}

export function drawBrush(pos) {
    maskCtx.strokeStyle = '#ef4444';
    maskCtx.fillStyle = '#ef4444';
    maskCtx.lineWidth = Math.max(5, parseInt(dom.sliders.brush.value) * state.currentScaleFactor);
    maskCtx.lineCap = 'round';
    maskCtx.lineJoin = 'round';

    maskCtx.beginPath();
    maskCtx.moveTo(state.lastPos.x, state.lastPos.y);
    maskCtx.lineTo(pos.x, pos.y);
    maskCtx.stroke();

    state.lastPos = pos;
    drawPreview();
}
