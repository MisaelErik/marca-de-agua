import { setupControls } from './ui/controls.js';
import { setupToolbar } from './ui/toolbar.js';
import { setupTools } from './canvas/tools.js';

// Inicializar el motor gráfico y de herramientas
setupTools();

// Inicializar eventos de la interfaz
setupToolbar();
setupControls();
