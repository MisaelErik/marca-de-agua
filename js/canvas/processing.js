import { dom, ctx, maskCanvas } from '../dom.js';
import { state } from '../state.js';
import { getAutoCoords } from '../utils.js';

export function executeClean() {
    if (!state.originalImage) return;

    state.previousImageState = state.originalImage;
    ctx.drawImage(state.originalImage, 0, 0);

    const method = dom.cleanMethod.value;
    const effectCanvas = document.createElement('canvas');
    effectCanvas.width = dom.mainCanvas.width;
    effectCanvas.height = dom.mainCanvas.height;
    const eCtx = effectCanvas.getContext('2d');

    if (method === 'clone') {
        const t = dom.shapeSelect.value !== 'manual' ? getAutoCoords() : null;

        if (t) {
            eCtx.clearRect(0, 0, effectCanvas.width, effectCanvas.height);
            const jumpX = Math.max(20, Math.floor(t.w * 0.8));
            const jumpY = Math.max(10, Math.floor(t.h * 0.3));
            eCtx.globalAlpha = 1.0;
            eCtx.drawImage(state.originalImage, jumpX, -jumpY);
        } else {
            const gap = Math.max(20, Math.round(state.originalImage.width * 0.03));
            eCtx.globalAlpha = 1.0;
            eCtx.drawImage(state.originalImage, gap, -gap);
        }

    } else if (method === 'blur') {
        eCtx.filter = 'blur(15px)';
        eCtx.drawImage(state.originalImage, 0, 0);
        eCtx.filter = 'none';

    } else if (method === 'color') {
        let pixel = [240, 240, 240];
        if (dom.shapeSelect.value !== 'manual') {
            const t = getAutoCoords();
            const tempCtx = effectCanvas.getContext('2d', { willReadFrequently: true });
            tempCtx.drawImage(state.originalImage, 0, 0);
            pixel = tempCtx.getImageData(Math.max(0, t.x - 5), t.y, 1, 1).data;
            eCtx.clearRect(0, 0, effectCanvas.width, effectCanvas.height);
        }
        eCtx.fillStyle = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
        eCtx.fillRect(0, 0, effectCanvas.width, effectCanvas.height);
    }

    const fuzzyMask = document.createElement('canvas');
    fuzzyMask.width = maskCanvas.width;
    fuzzyMask.height = maskCanvas.height;
    const fCtx = fuzzyMask.getContext('2d');
    fCtx.filter = 'blur(4px)';
    fCtx.drawImage(maskCanvas, 0, 0);
    fCtx.filter = 'none';

    eCtx.globalCompositeOperation = 'destination-in';
    eCtx.drawImage(fuzzyMask, 0, 0);

    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(effectCanvas, 0, 0);

    state.cleanedImageData = ctx.getImageData(0, 0, dom.mainCanvas.width, dom.mainCanvas.height);

    state.isCleaned = true;
    dom.btnClean.classList.add('hidden');
    dom.btnReset.classList.remove('hidden');
    dom.btnDownload.classList.remove('hidden');

    Object.values(dom.sliders).forEach(slider => slider.disabled = true);
    dom.shapeSelect.disabled = true;
    dom.cleanMethod.disabled = true;
    dom.btnClearMask.disabled = true;
    dom.btnUndoMask.disabled = true;
}
