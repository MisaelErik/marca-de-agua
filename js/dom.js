export const dom = {
    imageInput: document.getElementById('imageInput'),
    mainCanvas: document.getElementById('mainCanvas'),
    canvasWrapper: document.getElementById('canvasWrapper'),
    placeholder: document.getElementById('placeholder'),
    controlsArea: document.getElementById('controlsArea'),
    formatBadge: document.getElementById('formatBadge'),

    shapeSelect: document.getElementById('shapeSelect'),
    autoControls: document.getElementById('autoControls'),
    presetControls: document.getElementById('presetControls'),
    manualControls: document.getElementById('manualControls'),
    cleanMethod: document.getElementById('cleanMethod'),
    btnClearMask: document.getElementById('btnClearMask'),
    btnSavePreset: document.getElementById('btnSavePreset'),
    presetSelect: document.getElementById('presetSelect'),

    sliders: {
        width: document.getElementById('markWidth'),
        height: document.getElementById('markHeight'),
        right: document.getElementById('markRight'),
        bottom: document.getElementById('markBottom'),
        brush: document.getElementById('brushSize')
    },
    numInputs: {
        width: document.getElementById('numWidth'),
        height: document.getElementById('numHeight'),
        right: document.getElementById('numRight'),
        bottom: document.getElementById('numBottom'),
        brush: document.getElementById('numBrush')
    },

    btnClean: document.getElementById('btnClean'),
    btnReset: document.getElementById('btnReset'),
    btnToolCompare: document.getElementById('btnToolCompare'),
    btnDownload: document.getElementById('btnDownload'),
    btnResetDefaults: document.getElementById('btnResetDefaults'),
    btnUndoMask: document.getElementById('btnUndoMask'),

    loupeCanvas: document.getElementById('loupeCanvas'),

    btnToolZoom: document.getElementById('btnToolZoom'),
    btnToolZoomOut: document.getElementById('btnToolZoomOut'),
    btnToolPan: document.getElementById('btnToolPan')
};

export const ctx = dom.mainCanvas.getContext('2d');
export const loupeCtx = dom.loupeCanvas.getContext('2d', { willReadFrequently: true });

// Canvas oculto exportado
export const maskCanvas = document.createElement('canvas');
export const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
