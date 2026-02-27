import { applySmartDetection } from '../canvas/core.js';
import { state } from '../state.js';

export function setupBatch() {
    const tabIndividual = document.getElementById('tabIndividual');
    const tabBatch = document.getElementById('tabBatch');
    const panelIndividual = document.getElementById('panelIndividual');
    const panelBatch = document.getElementById('panelBatch');

    const batchImageInput = document.getElementById('batchImageInput');
    const batchStats = document.getElementById('batchStats');
    const batchCount = document.getElementById('batchCount');
    const batchProgress = document.getElementById('batchProgress');
    const batchStatusText = document.getElementById('batchStatusText');
    const batchPreviewList = document.getElementById('batchPreviewList');

    const btnProcessBatch = document.getElementById('btnProcessBatch');
    const btnDownloadBatch = document.getElementById('btnDownloadBatch');

    let batchFiles = [];
    let processedImages = []; // { file, dataUrl }

    // Tab Switching
    tabIndividual.addEventListener('click', () => {
        tabIndividual.className = "flex-1 py-1.5 text-sm font-medium rounded-md bg-indigo-500 text-white shadow";
        tabBatch.className = "flex-1 py-1.5 text-sm font-medium rounded-md text-slate-400 hover:text-white transition";
        panelIndividual.classList.remove('hidden');
        panelBatch.classList.add('hidden');
        document.getElementById('canvasWrapper').parentElement.parentElement.classList.remove('hidden'); // Show canvas area if hidden
    });

    tabBatch.addEventListener('click', () => {
        tabBatch.className = "flex-1 py-1.5 text-sm font-medium rounded-md bg-indigo-500 text-white shadow";
        tabIndividual.className = "flex-1 py-1.5 text-sm font-medium rounded-md text-slate-400 hover:text-white transition";
        panelBatch.classList.remove('hidden');
        panelIndividual.classList.add('hidden');
    });

    // Handle batch file upload
    batchImageInput.addEventListener('change', (e) => {
        if (!e.target.files || e.target.files.length === 0) return;
        batchFiles = Array.from(e.target.files);
        processedImages = [];

        batchStats.classList.remove('hidden');
        batchCount.textContent = batchFiles.length;
        batchProgress.style.width = '0%';
        batchStatusText.textContent = "Listo para procesar";

        batchPreviewList.innerHTML = '';
        batchPreviewList.classList.add('hidden');
        btnDownloadBatch.classList.add('hidden');
    });

    btnProcessBatch.addEventListener('click', async () => {
        if (batchFiles.length === 0) return;

        btnProcessBatch.disabled = true;
        btnProcessBatch.innerHTML = `<div class="relative w-full bg-slate-600 text-white text-sm font-semibold py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2">Procesando...</div>`;

        batchPreviewList.innerHTML = '';
        batchPreviewList.classList.remove('hidden');
        batchProgress.style.width = '0%';

        processedImages = [];

        for (let i = 0; i < batchFiles.length; i++) {
            const file = batchFiles[i];
            batchStatusText.textContent = `Procesando ${i + 1} de ${batchFiles.length}...`;

            // Process image returns a Promise with the clean data URL
            const cleanDataUrl = await processSingleBatchImage(file);
            processedImages.push({ file: file, name: file.name, dataUrl: cleanDataUrl });

            // Update UI list
            addViewToList(file.name, cleanDataUrl);

            // Update bar
            const percent = Math.round(((i + 1) / batchFiles.length) * 100);
            batchProgress.style.width = `${percent}%`;
        }

        batchStatusText.textContent = "Proceso Completo";
        btnProcessBatch.disabled = false;
        btnProcessBatch.innerHTML = `
            <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-200"></div>
            <div class="relative w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white text-sm font-semibold py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2">
                PROCESAR MÁS IMÁGENES
            </div>`;
        btnDownloadBatch.classList.remove('hidden');
    });

    btnDownloadBatch.addEventListener('click', async () => {
        if (processedImages.length === 0) return;

        if (processedImages.length === 1) {
            // Un solo archivo se descarga directo
            downloadOne(processedImages[0]);
            return;
        }

        // Varios archivos, crear ZIP
        const btnOriginalState = btnDownloadBatch.innerHTML;
        btnDownloadBatch.innerHTML = `<div class="relative w-full bg-slate-600 text-white text-sm font-semibold py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center">Creando ZIP...</div>`;

        try {
            const zip = new JSZip();

            for (let i = 0; i < processedImages.length; i++) {
                const imgData = processedImages[i];
                // Quitar encabezado data:image/png;base64,
                const base64Data = imgData.dataUrl.split(',')[1];
                zip.file(`limpia_${imgData.name}`, base64Data, { base64: true });
            }

            const content = await zip.generateAsync({ type: "blob" });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `imagenes_limpias_${Date.now()}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        } catch (error) {
            console.error("Error creando zip:", error);
            alert("Hubo un error al empaquetar el ZIP.");
        } finally {
            btnDownloadBatch.innerHTML = btnOriginalState;
        }
    });

    function downloadOne(imageObj) {
        const link = document.createElement('a');
        link.href = imageObj.dataUrl;
        link.download = `limpia_${imageObj.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function addViewToList(filename, dataUrl) {
        const item = document.createElement('div');
        item.className = "flex items-center gap-3 p-3 border-b border-slate-700/50 bg-[#1b1c26] hover:bg-slate-800/50 transition relative group";

        item.innerHTML = `
            <img src="${dataUrl}" class="w-12 h-12 object-cover rounded-md bg-[#13141c] border border-slate-700/50">
            <span class="text-xs text-slate-300 truncate flex-1" title="${filename}">${filename}</span>
            <button class="bg-indigo-500/20 hover:bg-indigo-500 hover:text-white text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer z-10">
                Descargar
            </button>
        `;

        item.querySelector('button').addEventListener('click', (e) => {
            e.stopPropagation();
            downloadOne({ name: filename, dataUrl: dataUrl });
        });

        batchPreviewList.appendChild(item);
    }
}

function processSingleBatchImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const resultUrl = processBackground(img);
                resolve(resultUrl);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function processBackground(img) {
    // 1. Instanciar canvas virtuales
    const w = img.width;
    const h = img.height;

    // Configuración para el core de AI que extrae las proporciones
    // Guardamos estado anterior para no romper Individual panel
    const oldScale = state.currentScaleFactor;

    // Reutilizamos la función del core para medir ratios (nos modifica temporariamente sliders en el DOM oscuro pero funciona)
    applySmartDetection(img);

    // Recuperar métricas calculadas que se guardaron en los inputs de UI:
    const numInputs = {
        width: document.getElementById('numWidth'),
        height: document.getElementById('numHeight'),
        right: document.getElementById('numRight'),
        bottom: document.getElementById('numBottom')
    };

    // Obtener los valores escalados que se auto detectaron a resolución completa
    const cutW = Math.round(parseInt(numInputs.width.value) * state.currentScaleFactor);
    const cutH = Math.round(parseInt(numInputs.height.value) * state.currentScaleFactor);
    const mRight = Math.round(parseInt(numInputs.right.value) * state.currentScaleFactor);
    const mBottom = Math.round(parseInt(numInputs.bottom.value) * state.currentScaleFactor);

    const cutX = w - cutW - mRight;
    const cutY = h - cutH - mBottom;

    // Restauramos el estado si el usuario quiere seguir en Individual tab
    state.currentScaleFactor = oldScale;

    // --- PROCESO EN CANVAS VIRTUAL FUERA DE PANTALLA ---
    const workCanvas = document.createElement('canvas');
    workCanvas.width = w;
    workCanvas.height = h;
    const wCtx = workCanvas.getContext('2d');

    // a) Dibujar imagen original de fondo
    wCtx.drawImage(img, 0, 0);

    // b) Crear la máscara OVALO (circulo estirado)
    const blurMask = document.createElement('canvas');
    blurMask.width = w;
    blurMask.height = h;
    const bCtx = blurMask.getContext('2d');

    bCtx.fillStyle = '#ff0000';
    bCtx.beginPath();
    bCtx.ellipse(cutX + cutW / 2, cutY + cutH / 2, cutW / 2, cutH / 2, 0, 0, 2 * Math.PI);
    bCtx.fill();

    // Redondear la mascara para difuminarla
    const softMask = document.createElement('canvas');
    softMask.width = w;
    softMask.height = h;
    const softCtx = softMask.getContext('2d');
    softCtx.filter = 'blur(4px)';
    softCtx.drawImage(blurMask, 0, 0);
    softCtx.filter = 'none';

    // c) Preparar lienzo de parche
    const patchCanvas = document.createElement('canvas');
    patchCanvas.width = w;
    patchCanvas.height = h;
    const pCtx = patchCanvas.getContext('2d');

    const jumpX = Math.max(20, Math.floor(cutW * 0.8));
    const jumpY = Math.max(10, Math.floor(cutH * 0.3));

    pCtx.globalAlpha = 1.0;
    pCtx.drawImage(img, jumpX, -jumpY); // Aplicamos parche contiguo

    // d) Aplicar mascara de borrado sobre el parche
    pCtx.globalCompositeOperation = 'destination-in';
    pCtx.drawImage(softMask, 0, 0);

    // e) Pegar el parche final en el lienzo de trabajo
    wCtx.globalCompositeOperation = 'source-over';
    wCtx.drawImage(patchCanvas, 0, 0);

    return workCanvas.toDataURL('image/png', 0.95);
}
