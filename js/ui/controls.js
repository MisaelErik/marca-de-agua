import { dom, maskCtx, maskCanvas } from '../dom.js';
import { state } from '../state.js';
import { drawPreview, applySmartDetection } from '../canvas/core.js';
import { executeClean } from '../canvas/processing.js';
import { saveState } from '../canvas/history.js';

export function setupControls() {
    dom.shapeSelect.addEventListener('change', (e) => {
        const shape = e.target.value;
        if (shape === 'manual') {
            dom.autoControls.classList.add('hidden');
            dom.presetControls.classList.add('hidden');
            dom.manualControls.classList.remove('hidden');
            dom.mainCanvas.style.cursor = 'crosshair';
            maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
            saveState();
        } else {
            dom.autoControls.classList.remove('hidden');
            dom.presetControls.classList.remove('hidden');
            dom.manualControls.classList.add('hidden');
            dom.mainCanvas.style.cursor = 'default';
            dom.loupeCanvas.classList.add('hidden');
        }
        if (!state.isCleaned) drawPreview();
    });

    Object.keys(dom.sliders).forEach(key => {
        dom.sliders[key].addEventListener('input', (e) => {
            dom.numInputs[key].value = e.target.value;
            if (!state.isCleaned && (dom.shapeSelect.value !== 'manual' || key === 'brush')) drawPreview();
        });
        dom.numInputs[key].addEventListener('input', (e) => {
            dom.sliders[key].value = e.target.value;
            if (!state.isCleaned && (dom.shapeSelect.value !== 'manual' || key === 'brush')) drawPreview();
        });
    });

    loadPresets();

    dom.btnSavePreset.addEventListener('click', () => {
        const name = prompt("Nombre para este tamaño (ej. 'Firma Pequeña'):");
        if (!name || name.trim() === '') return;

        let maxDim = dom.mainCanvas.width > 0 ? Math.max(dom.mainCanvas.width, dom.mainCanvas.height) : 512;
        let presets = JSON.parse(localStorage.getItem('geminiPresets') || '{}');
        presets[name.trim()] = {
            wRef: dom.numInputs.width.value / maxDim,
            hRef: dom.numInputs.height.value / maxDim,
            rRef: dom.numInputs.right.value / maxDim,
            bRef: dom.numInputs.bottom.value / maxDim,
            w: dom.numInputs.width.value,
            h: dom.numInputs.height.value,
            r: dom.numInputs.right.value,
            b: dom.numInputs.bottom.value
        };
        localStorage.setItem('geminiPresets', JSON.stringify(presets));
        loadPresets();
        dom.presetSelect.value = name.trim();
    });

    dom.presetSelect.addEventListener('change', (e) => {
        const name = e.target.value;
        if (!name) return;
        let presets = JSON.parse(localStorage.getItem('geminiPresets') || '{}');
        const p = presets[name];
        if (p) {
            let maxDim = dom.mainCanvas.width > 0 ? Math.max(dom.mainCanvas.width, dom.mainCanvas.height) : 512;
            let newW = p.wRef !== undefined ? Math.round(p.wRef * maxDim) : p.w;
            let newH = p.hRef !== undefined ? Math.round(p.hRef * maxDim) : p.h;
            let newR = p.rRef !== undefined ? Math.round(p.rRef * maxDim) : p.r;
            let newB = p.bRef !== undefined ? Math.round(p.bRef * maxDim) : p.b;

            dom.sliders.width.value = dom.numInputs.width.value = newW;
            dom.sliders.height.value = dom.numInputs.height.value = newH;
            dom.sliders.right.value = dom.numInputs.right.value = newR;
            dom.sliders.bottom.value = dom.numInputs.bottom.value = newB;
            if (!state.isCleaned) drawPreview();
        }
    });

    dom.imageInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (event) {
            processImageSrc(event.target.result);
        }
        reader.readAsDataURL(file);
    });

    // Paste from Clipboard
    window.addEventListener('paste', (e) => {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (let index in items) {
            const item = items[index];
            if (item.kind === 'file' && item.type.startsWith('image/')) {
                const blob = item.getAsFile();
                const reader = new FileReader();
                reader.onload = function (event) {
                    // Switch to individual tab if pasting
                    document.getElementById('tabIndividual').click();
                    processImageSrc(event.target.result);
                };
                reader.readAsDataURL(blob);
            }
        }
    });

    dom.btnResetDefaults.addEventListener('click', () => {
        if (state.originalImage) applySmartDetection(state.originalImage);
    });

    dom.btnClean.addEventListener('click', executeClean);
    dom.btnReset.addEventListener('click', resetWorkspace);

    // Add format selector dynamically under download button if not exists
    const formatSelectHtml = `
        <select id="exportFormat" class="w-full mt-2 bg-[#2a2b36] text-slate-300 text-xs px-2 py-1.5 rounded border border-slate-700 outline-none hidden text-center">
            <option value="image/png">PNG Alta Calidad (Recomendado)</option>
            <option value="image/webp">WEBP Optimizado (Web)</option>
            <option value="image/jpeg">JPEG Estándar</option>
        </select>
    `;
    dom.btnDownload.insertAdjacentHTML('afterend', formatSelectHtml);
    const exportFormat = document.getElementById('exportFormat');

    dom.btnDownload.addEventListener('click', () => {
        const format = exportFormat.value;
        const quality = format === 'image/png' ? undefined : 0.85;
        const ext = format.split('/')[1];

        const dataUrl = dom.mainCanvas.toDataURL(format, quality);
        const link = document.createElement('a');
        link.download = `imagen-editada.${ext}`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Undo logic keybind
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            if (dom.shapeSelect.value === 'manual' && !dom.btnUndoMask.disabled) {
                dom.btnUndoMask.click();
            }
        }
    });

    document.querySelectorAll('.test-img').forEach(imgEl => {
        imgEl.addEventListener('click', () => {
            processImageSrc(imgEl.src);
        });
    });

    window.addEventListener('resize', () => {
        if (!state.isCleaned && state.originalImage) drawPreview();
    });

    // Check for ToolFullscreen existing logic
    const btnToolFullscreen = document.getElementById('btnToolFullscreen');
    if (btnToolFullscreen) {
        btnToolFullscreen.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                dom.canvasWrapper.requestFullscreen().catch(err => {
                    console.log(`Error intentando pantalla completa: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        });
    }
}

function loadPresets() {
    let presets = JSON.parse(localStorage.getItem('geminiPresets') || '{}');
    dom.presetSelect.innerHTML = '<option value="">Mis Tamaños</option>';
    for (let name in presets) {
        let opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        dom.presetSelect.appendChild(opt);
    }
}

export function processImageSrc(src) {
    const img = new Image();
    img.onload = function () {
        state.originalImage = img;
        dom.mainCanvas.width = maskCanvas.width = img.width;
        dom.mainCanvas.height = maskCanvas.height = img.height;

        dom.placeholder.classList.add('hidden');
        dom.canvasWrapper.classList.remove('hidden');
        dom.controlsArea.classList.remove('opacity-50', 'pointer-events-none');

        state.canvasStates = [];
        applySmartDetection(img);
        resetWorkspace();
    }
    img.src = src;
}

export function resetWorkspace() {
    state.isCleaned = false;
    state.previousImageState = null;
    state.cleanedImageData = null;
    if (dom.shapeSelect.value === 'manual') maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

    if (dom.shapeSelect.value === 'manual' && state.canvasStates.length === 0) saveState();

    drawPreview();

    dom.btnClean.classList.remove('hidden');
    dom.btnReset.classList.add('hidden');
    dom.btnDownload.classList.add('hidden');
    const exportFormat = document.getElementById('exportFormat');
    if (exportFormat) exportFormat.classList.add('hidden');

    Object.values(dom.sliders).forEach(slider => slider.disabled = false);
    dom.shapeSelect.disabled = false;
    dom.cleanMethod.disabled = false;
    dom.btnClearMask.disabled = false;
    dom.btnUndoMask.disabled = state.canvasStates.length <= 1;
}
