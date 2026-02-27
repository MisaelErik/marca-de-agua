import { dom, ctx } from '../dom.js';
import { state } from '../state.js';
import { drawPreview } from '../canvas/core.js';

export function setupToolbar() {
    const toolsBtn = [
        { btn: dom.btnToolZoom, mode: 'zoomIn' },
        { btn: dom.btnToolZoomOut, mode: 'zoomOut' },
        { btn: dom.btnToolPan, mode: 'pan' }
    ];

    if (dom.btnToolZoom) {
        dom.btnToolZoom.addEventListener('dblclick', () => {
            if (dom.btnToolPan) dom.btnToolPan.click();
        });
    }

    if (dom.btnToolZoomOut) {
        dom.btnToolZoomOut.addEventListener('dblclick', () => {
            if (dom.btnToolPan) dom.btnToolPan.click();
        });
    }

    function updateToolbarVisibility() {
        toolsBtn.forEach(t => {
            if (!t.btn) return;
            if (t.mode === state.activeToolMode) {
                t.btn.classList.remove('text-slate-600', 'hover:bg-white');
                t.btn.classList.add('bg-slate-600', 'text-white', 'shadow-sm');
            } else {
                t.btn.classList.add('text-slate-600', 'hover:bg-white');
                t.btn.classList.remove('bg-slate-600', 'text-white', 'shadow-sm');
            }
        });

        if (state.activeToolMode === 'zoomIn') {
            dom.mainCanvas.style.cursor = 'zoom-in';
        } else if (state.activeToolMode === 'zoomOut') {
            dom.mainCanvas.style.cursor = 'zoom-out';
        } else if (state.activeToolMode === 'pan') {
            dom.mainCanvas.style.cursor = state.isPanning ? 'grabbing' : 'grab';
        } else if (state.activeToolMode === 'manual') {
            dom.mainCanvas.style.cursor = 'crosshair';
        } else {
            dom.mainCanvas.style.cursor = 'default';
        }
    }

    dom.shapeSelect.addEventListener('change', () => {
        if (state.activeToolMode !== 'zoomIn' && state.activeToolMode !== 'zoomOut' && state.activeToolMode !== 'pan') {
            state.activeToolMode = dom.shapeSelect.value;
        }
        updateToolbarVisibility();
    });

    toolsBtn.forEach(t => {
        if (t.btn) {
            t.btn.addEventListener('click', () => {
                state.activeToolMode = t.mode;

                if (t.mode !== 'zoomIn' && t.mode !== 'zoomOut' && t.mode !== 'pan') {
                    dom.shapeSelect.value = t.mode;
                    dom.shapeSelect.dispatchEvent(new Event('change'));
                }
                updateToolbarVisibility();
            });
        }
    });

    const btnToolResetView = document.getElementById('btnToolResetView');
    if (btnToolResetView) {
        btnToolResetView.addEventListener('click', () => {
            state.currentZoom = 1;
            state.panX = 0;
            state.panY = 0;
            dom.mainCanvas.style.transformOrigin = 'center center';
            dom.mainCanvas.style.transform = `translate(0px, 0px) scale(1)`;
            dom.mainCanvas.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        });
    }

    // Compare Tool logic
    function showRawImage() {
        if (!state.originalImage) return;
        ctx.clearRect(0, 0, dom.mainCanvas.width, dom.mainCanvas.height);
        ctx.drawImage(state.originalImage, 0, 0);

        if (dom.btnToolCompare) {
            dom.btnToolCompare.classList.remove('text-slate-600', 'hover:bg-white');
            dom.btnToolCompare.classList.add('bg-indigo-500', 'text-white', 'shadow-sm', 'border-transparent');
        }
    }

    function stopRawImage() {
        if (!state.originalImage) return;

        if (state.isCleaned && state.cleanedImageData) {
            ctx.putImageData(state.cleanedImageData, 0, 0);
        } else {
            drawPreview();
        }

        if (dom.btnToolCompare) {
            dom.btnToolCompare.classList.add('text-slate-600', 'hover:bg-white');
            dom.btnToolCompare.classList.remove('bg-indigo-500', 'text-white', 'shadow-sm', 'border-transparent');
        }
    }

    if (dom.btnToolCompare) {
        dom.btnToolCompare.addEventListener('mousedown', showRawImage);
        dom.btnToolCompare.addEventListener('mouseup', stopRawImage);
        dom.btnToolCompare.addEventListener('mouseleave', stopRawImage);
        dom.btnToolCompare.addEventListener('touchstart', (e) => { e.preventDefault(); showRawImage(); });
        dom.btnToolCompare.addEventListener('touchend', (e) => { e.preventDefault(); stopRawImage(); });
    }

    updateToolbarVisibility();
}
