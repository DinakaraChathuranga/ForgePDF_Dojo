document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    const pages = document.querySelectorAll('.page');
    const toolCards = document.querySelectorAll('.tool-card');
    const dragOverlay = document.getElementById('drag-overlay');

    // --- Navigation ---
    function navigateTo(targetId) {
        pages.forEach(page => page.classList.remove('active'));
        menuItems.forEach(mi => mi.classList.remove('active'));

        const targetPage = document.getElementById(targetId);
        if (targetPage) targetPage.classList.add('active');

        const targetMenuItem = document.querySelector(`.menu-item[data-target="${targetId}"]`);
        if (targetMenuItem) targetMenuItem.classList.add('active');
    }

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            if (!item.classList.contains('sub-item') && !item.parentElement.classList.contains('menu-group')) {
                 navigateTo(item.getAttribute('data-target'));
            } else {
                 navigateTo(item.getAttribute('data-target'));
            }
        });
    });
    
    toolCards.forEach(card => card.addEventListener('click', () => navigateTo(card.getAttribute('data-target'))));

    // --- Home Page Logic ---
    function setGreeting() {
        const greetingEl = document.getElementById('greeting');
        if (!greetingEl) return;
        const hour = new Date().getHours();
        let greetingText = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        greetingEl.textContent = `${greetingText}! 👋`;
    }
    setGreeting();

    // --- Full-page Drag & Drop ---
    window.addEventListener('dragenter', (e) => { e.preventDefault(); dragOverlay.classList.add('visible'); });
    dragOverlay.addEventListener('dragleave', (e) => { if (e.relatedTarget === null || e.relatedTarget.nodeName === "HTML") dragOverlay.classList.remove('visible'); });
    dragOverlay.addEventListener('dragover', (e) => e.preventDefault());
    dragOverlay.addEventListener('drop', (e) => {
        e.preventDefault();
        dragOverlay.classList.remove('visible');
        const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
        if (files.length === 0) return;
        const targetPage = files.length > 1 ? 'merge' : 'compress';
        navigateTo(targetPage);
        const dropEvent = new CustomEvent('files-dropped', { detail: { paths: files.map(f => f.path) } });
        document.getElementById(`${targetPage}-drop-area`).dispatchEvent(dropEvent);
    });

    // --- Notifications ---
    const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3500, timerProgressBar: true });
    
    function showLoading(title) {
        Swal.fire({
            title: title,
            html: 'Processing your file, please wait...',
            timer: 10000, // Max wait time
            timerProgressBar: true,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });
    }

    function handleResponse(result) {
        Swal.close();
        if (result.success) {
            Toast.fire({ icon: 'success', title: 'Success!', text: result.message });
        } else {
            Swal.fire({ icon: 'error', title: 'An Error Occurred', text: result.message, confirmButtonColor: 'var(--primary)' });
        }
    }

    // --- Generic File Handling Logic ---
    function setupFileHandling(pageId, isMultiple) {
        const dropArea = document.getElementById(`${pageId}-drop-area`);
        const fileInput = document.getElementById(`${pageId}-file-input`);
        const fileListElem = document.getElementById(`${pageId}-file-list`);
        const actionBtn = document.getElementById(`${pageId}-btn`);
        const clearBtn = document.getElementById(`clear-${pageId}-btn`);
        const extraInputs = document.querySelectorAll(`#${pageId} .form-group input, #${pageId} .form-group select`);
        let filePaths = [];

        const reset = () => {
            filePaths = [];
            fileInput.value = '';
            updateUI();
        };

        const updateUI = () => {
            fileListElem.innerHTML = '';
            filePaths.forEach(path => {
                const li = document.createElement('li');
                li.textContent = path.split(/[/\\]/).pop();
                fileListElem.appendChild(li);
            });
            const isReady = isMultiple ? filePaths.length > 1 : filePaths.length > 0;
            if (actionBtn) actionBtn.disabled = !isReady;
            extraInputs.forEach(input => input.disabled = !isReady);
        };
        
        if (dropArea) dropArea.addEventListener('click', () => fileInput.click());
        dropArea.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); dropArea.parentElement.classList.add('highlight'); });
        dropArea.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); dropArea.parentElement.classList.remove('highlight'); });
        const handleFiles = (files) => {
            filePaths = isMultiple ? files.map(f => f.path) : (files.length > 0 ? [files[0].path] : []);
            updateUI();
        };
        dropArea.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); dropArea.parentElement.classList.remove('highlight'); handleFiles(Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf')); });
        dropArea.addEventListener('files-dropped', (e) => handleFiles(e.detail.paths.map(p => ({ path: p }))));
        fileInput.addEventListener('change', () => handleFiles(Array.from(fileInput.files)));
        if(clearBtn) clearBtn.addEventListener('click', reset);

        return { getFiles: () => filePaths, reset };
    }

    // --- Feature Implementations ---
    const mergeHandler = setupFileHandling('merge', true);
    document.getElementById('merge-btn').addEventListener('click', async () => {
        showLoading('Merging PDFs...');
        const result = await window.electronAPI.mergePDFs(mergeHandler.getFiles());
        handleResponse(result);
        if (result.success) mergeHandler.reset();
    });

    const compressHandler = setupFileHandling('compress', false);
    document.getElementById('compress-btn').addEventListener('click', async () => {
        showLoading('Compressing PDF...');
        const result = await window.electronAPI.compressPDF(compressHandler.getFiles()[0]);
        handleResponse(result);
        if (result.success) compressHandler.reset();
    });

    const protectHandler = setupFileHandling('protect', false);
    document.getElementById('protect-btn').addEventListener('click', async () => {
        const password = document.getElementById('password-input').value;
        if (!password) { Swal.fire({ icon: 'warning', title: 'Password Required' }); return; }
        showLoading('Protecting PDF...');
        const result = await window.electronAPI.protectPDF(protectHandler.getFiles()[0], password);
        handleResponse(result);
        if (result.success) { protectHandler.reset(); document.getElementById('password-input').value = ''; }
    });

    const splitHandler = setupFileHandling('split', false);
    document.getElementById('split-btn').addEventListener('click', async () => {
        const pageRanges = document.getElementById('split-pages-input').value;
        if (!pageRanges) { Swal.fire({ icon: 'warning', title: 'Page Range Required' }); return; }
        showLoading('Splitting PDF...');
        const result = await window.electronAPI.splitPDF(splitHandler.getFiles()[0], pageRanges);
        handleResponse(result);
        if (result.success) { splitHandler.reset(); document.getElementById('split-pages-input').value = ''; }
    });

    const rotateHandler = setupFileHandling('rotate', false);
    document.getElementById('rotate-btn').addEventListener('click', async () => {
        const angle = document.getElementById('rotate-angle-select').value;
        showLoading('Rotating PDF...');
        const result = await window.electronAPI.rotatePDF(rotateHandler.getFiles()[0], angle);
        handleResponse(result);
        if (result.success) rotateHandler.reset();
    });
});
