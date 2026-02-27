export function setupThemeToggle() {
    const themeToggleBtn = document.getElementById('themeToggle');
    const themeToggleDarkIcon = document.getElementById('themeToggleDarkIcon');
    const themeToggleLightIcon = document.getElementById('themeToggleLightIcon');

    // Muestra u oculta el icono dependiendo del tema actual
    function updateIcon() {
        if (document.documentElement.classList.contains('dark')) {
            themeToggleLightIcon.classList.remove('hidden');
            themeToggleDarkIcon.classList.add('hidden');
        } else {
            themeToggleLightIcon.classList.add('hidden');
            themeToggleDarkIcon.classList.remove('hidden');
        }
    }

    updateIcon();

    themeToggleBtn.addEventListener('click', function () {
        // Intercambiar estado oscuro
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        }
        updateIcon();
    });
}
