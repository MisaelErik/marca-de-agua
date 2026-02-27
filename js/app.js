import { setupControls } from './ui/controls.js';
import { setupToolbar } from './ui/toolbar.js';
import { setupTools } from './canvas/tools.js';
import { setupBatch } from './ui/batch.js';
import { setupThemeToggle } from './ui/theme.js';

// Inicializar el motor gráfico y de herramientas
setupTools();

// Inicializar eventos de la interfaz
setupThemeToggle();
setupToolbar();
setupControls();
setupBatch();
