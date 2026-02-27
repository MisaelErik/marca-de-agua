import { dom } from './dom.js';
import { state } from './state.js';

export function getMousePos(evt) {
    const rect = dom.mainCanvas.getBoundingClientRect();
    const scaleX = dom.mainCanvas.width / rect.width;
    const scaleY = dom.mainCanvas.height / rect.height;
    return {
        x: (evt.clientX - rect.left) * scaleX,
        y: (evt.clientY - rect.top) * scaleY
    };
}

export function getAutoCoords() {
    // Calculamos las coordenadas basándonos en los píxeles literales escalados de la imagen
    const w = Math.round(parseInt(dom.sliders.width.value) * state.currentScaleFactor);
    const h = Math.round(parseInt(dom.sliders.height.value) * state.currentScaleFactor);
    const mRight = Math.round(parseInt(dom.sliders.right.value) * state.currentScaleFactor);
    const mBottom = Math.round(parseInt(dom.sliders.bottom.value) * state.currentScaleFactor);

    const x = dom.mainCanvas.width - w - mRight;
    const y = dom.mainCanvas.height - h - mBottom;
    return { x, y, w, h };
}

export function getScaleX() {
    const rect = dom.mainCanvas.getBoundingClientRect();
    return dom.mainCanvas.width / rect.width;
}
