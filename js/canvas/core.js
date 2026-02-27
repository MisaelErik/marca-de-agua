import { dom, ctx, maskCanvas, maskCtx } from '../dom.js';
import { state } from '../state.js';
import { getAutoCoords, getScaleX } from '../utils.js';

export function applySmartDetection(img) {
    const width = img.width;
    const height = img.height;
    const ratio = width / height;

    let formatName = "Desconocido";
    let w = 58, h = 58, r = 27, b = 27;

    const aspectRatios = [
        { name: "21:9 (Panorámico)", expected: 1536 / 672, w: 55, h: 55, r: 23, b: 23, refW: 1536 },
        { name: "16:9 (Panorámico)", expected: 1344 / 768, w: 58, h: 58, r: 27, b: 27, refW: 1344 },
        { name: "3:2 (Paisaje)", expected: 1248 / 832, w: 55, h: 55, r: 28, b: 28, refW: 1248 },
        { name: "4:3 (Paisaje)", expected: 1184 / 864, w: 58, h: 58, r: 28, b: 28, refW: 1184 },
        { name: "5:4 (Paisaje)", expected: 1152 / 896, w: 55, h: 55, r: 28, b: 28, refW: 1152 },
        { name: "1:1 (Cuadrado)", expected: 1, w: 58, h: 58, r: 27, b: 27, refW: 1024 },
        { name: "4:5 (Retrato)", expected: 896 / 1152, w: 57, h: 57, r: 27, b: 27, refW: 896 },
        { name: "3:4 (Retrato)", expected: 864 / 1184, w: 58, h: 58, r: 27, b: 27, refW: 864 },
        { name: "2:3 (Retrato)", expected: 832 / 1248, w: 55, h: 55, r: 29, b: 29, refW: 832 },
        { name: "9:16 (Vertical)", expected: 768 / 1344, w: 58, h: 58, r: 27, b: 27, refW: 768 }
    ];

    let closestInfo = null;
    let minDiff = Infinity;

    for (let info of aspectRatios) {
        let diff = Math.abs(ratio - info.expected);
        if (diff < minDiff) {
            minDiff = diff;
            closestInfo = info;
        }
    }

    if (minDiff < 0.2) {
        formatName = closestInfo.name;
        w = closestInfo.w;
        h = closestInfo.h;
        r = closestInfo.r;
        b = closestInfo.b;
        state.currentScaleFactor = width / closestInfo.refW;
    } else {
        formatName = ratio >= 1 ? "Paisaje (Genérico)" : "Retrato (Genérico)";
        w = 58; h = 58; r = 28; b = 28;
        state.currentScaleFactor = Math.max(width, height) / 1024;
    }

    dom.sliders.width.max = 500;
    dom.sliders.height.max = 500;
    dom.sliders.right.max = 500;
    dom.sliders.bottom.max = 500;
    dom.sliders.brush.max = 200;

    dom.sliders.width.value = dom.numInputs.width.value = Math.round(w);
    dom.sliders.height.value = dom.numInputs.height.value = Math.round(h);
    dom.sliders.right.value = dom.numInputs.right.value = Math.round(r);
    dom.sliders.bottom.value = dom.numInputs.bottom.value = Math.round(b);
    dom.sliders.brush.value = dom.numInputs.brush.value = 30;

    dom.formatBadge.innerHTML = `<span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded border border-blue-200">Auto-detectado: ${formatName}</span>`;
    dom.formatBadge.classList.remove('hidden');
}

export function buildAutoMask() {
    if (dom.shapeSelect.value === 'manual') return;

    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    maskCtx.fillStyle = '#ef4444';

    const shape = dom.shapeSelect.value;
    const t = getAutoCoords();

    maskCtx.beginPath();
    if (shape === 'rect') {
        maskCtx.rect(t.x, t.y, t.w, t.h);
    } else if (shape === 'circle') {
        maskCtx.ellipse(t.x + t.w / 2, t.y + t.h / 2, t.w / 2, t.h / 2, 0, 0, 2 * Math.PI);
    } else if (shape === 'star') {
        const cx = t.x + t.w / 2;
        const cy = t.y + t.h / 2;
        const rx = t.w / 2;
        const ry = t.h / 2;
        maskCtx.moveTo(cx, cy - ry);
        maskCtx.quadraticCurveTo(cx, cy, cx + rx, cy);
        maskCtx.quadraticCurveTo(cx, cy, cx, cy + ry);
        maskCtx.quadraticCurveTo(cx, cy, cx - rx, cy);
        maskCtx.quadraticCurveTo(cx, cy, cx, cy - ry);
    }
    maskCtx.fill();
}

export function drawPreview() {
    if (!state.originalImage) return;

    ctx.clearRect(0, 0, dom.mainCanvas.width, dom.mainCanvas.height);
    ctx.drawImage(state.originalImage, 0, 0);

    if (dom.shapeSelect.value !== 'manual') {
        buildAutoMask();
    }

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.drawImage(maskCanvas, 0, 0);
    ctx.restore();

    if (dom.shapeSelect.value !== 'manual') {
        const t = getAutoCoords();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.lineWidth = 2 * getScaleX();
        ctx.strokeRect(t.x, t.y, t.w, t.h);
    }
}
