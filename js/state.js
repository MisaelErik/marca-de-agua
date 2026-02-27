export const state = {
    originalImage: null,
    isCleaned: false,
    isDrawing: false,
    lastPos: null,
    currentScaleFactor: 1,

    canvasStates: [],
    MAX_UNDO: 15,

    activeToolMode: 'manual',
    currentZoom: 1,
    panX: 0,
    panY: 0,
    isPanning: false,
    startPanX: 0,
    startPanY: 0,

    previousImageState: null,
    cleanedImageData: null
};
