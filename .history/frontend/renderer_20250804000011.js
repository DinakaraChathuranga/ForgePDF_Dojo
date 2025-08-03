document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    const pages = document.querySelectorAll('.page');
    const toolCards = document.querySelectorAll('.tool-card');
    const dragOverlay = document.getElementById('drag-overlay');

    function navigateTo(targetId) {
        pages.forEach(page => page.classList.remove('active'));
        menuItems.forEach(mi => mi.classList.remove('active'));
        const targetPage = document.getElementById(targetId);
        if (targetPage) targetPage.classList.add('active');
        const targetMenuItem = document.querySelector(`.menu-item[data-target="${targetId}"]`);
        if (targetMenuItem) targetMenuItem.classList.add('active');
    }

    menuItems.forEach(item => item.addEventListener('click', (e) => { e.preventDefault(); navigateTo(item.getAttribute('data-target')); }));
    toolCards.forEach(card => card.addEventListener('click', () => navigateTo(card.getAttribute('data-target'))));

    function setGreeting() {
        const greetingEl = document.getElementById('greeting');
        if (!greetingEl) return;
        const hour = new Date().getHours();
        greetingEl.textContent = `${hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'}! 👋`;
    }
    setGreeting();

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

    const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3500, timerProgressBar: true });
    function showLoading(title) { Swal.fire({ title, html: 'Processing your file, please wait...', timerProgressBar: true, allowOutsideClick: false, didOpen: () => Swal.showLoading() }); }
    function handleResponse(result) {
        Swal.close();
        if (result.success) Toast.fire({ icon: 'success', title: 'Success!', text: result.message });
        else Swal.fire({ icon: 'error', title: 'An Error Occurred', text: result.message, confirmButtonColor: 'var(--primary)' });
    }

    function setupFileHandling(pageId, isMultiple, onFileLoad) {
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
            if (onFileLoad) onFileLoad(null); // Signal file removal
            updateUI();
        };

        const updateUI = () => {
            if (fileListElem) {
                fileListElem.innerHTML = '';
                filePaths.forEach(path => { const li = document.createElement('li'); li.textContent = path.split(/[/\\]/).pop(); fileListElem.appendChild(li); });
            }
            const isReady = isMultiple ? filePaths.length > 1 : filePaths.length > 0;
            if (actionBtn) actionBtn.disabled = !isReady;
            extraInputs.forEach(input => input.disabled = !isReady);
        };

        const handleFiles = (files) => {
            filePaths = isMultiple ? files.map(f => f.path) : (files.length > 0 ? [files[0].path] : []);
            updateUI();
            if (onFileLoad && filePaths.length > 0) onFileLoad(filePaths[0]);
        };
        
        if (dropArea) dropArea.addEventListener('click', () => fileInput.click());
        dropArea.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); dropArea.classList.add('highlight'); });
        dropArea.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); dropArea.classList.remove('highlight'); });
        dropArea.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); dropArea.classList.remove('highlight'); handleFiles(Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf')); });
        dropArea.addEventListener('files-dropped', (e) => handleFiles(e.detail.paths.map(p => ({ path: p }))));
        fileInput.addEventListener('change', () => handleFiles(Array.from(fileInput.files)));
        if(clearBtn) clearBtn.addEventListener('click', reset);

        return { getFiles: () => filePaths, reset };
    }
    
    function setupPreview(pageId) {
        const previewContainer = document.getElementById(`${pageId}-preview-container`);
        const dropArea = document.getElementById(`${pageId}-drop-area`);
        const prevBtn = document.getElementById(`${pageId}-prev-page`);
        const nextBtn = document.getElementById(`${pageId}-next-page`);
        const pageInfo = document.getElementById(`${pageId}-page-info`);
        const imgWrapper = document.getElementById(`${pageId}-preview-image-wrapper`);
        const splitPagesInput = pageId === 'split' ? document.getElementById('split-pages-input') : null;

        let currentFile = null;
        let currentPage = 0;
        let totalPages = 0;
        let selectedPages = new Set();

        const renderPage = async (pageNum) => {
            imgWrapper.innerHTML = '';
            imgWrapper.classList.add('loading');
            const result = await window.electronAPI.getPdfPreview(currentFile, pageNum);
            imgWrapper.classList.remove('loading');

            if (result.success) {
                const img = document.createElement('img');
                img.src = `${result.filePath.replace(/\\/g, '/')}?t=${new Date().getTime()}`; // Cache bust
                if (pageId === 'split') {
                    if (selectedPages.has(pageNum + 1)) img.classList.add('selected');
                    img.addEventListener('click', () => {
                        if (selectedPages.has(pageNum + 1)) {
                            selectedPages.delete(pageNum + 1);
                            img.classList.remove('selected');
                        } else {
                            selectedPages.add(pageNum + 1);
                            img.classList.add('selected');
                        }
                        splitPagesInput.value = Array.from(selectedPages).sort((a, b) => a - b).join(',');
                    });
                }
                imgWrapper.appendChild(img);
                totalPages = result.pageCount;
                currentPage = pageNum;
                pageInfo.textContent = `Page ${currentPage + 1} of ${totalPages}`;
                prevBtn.disabled = currentPage === 0;
                nextBtn.disabled = currentPage >= totalPages - 1;
            } else {
                handleResponse(result);
            }
        };

        prevBtn.addEventListener('click', () => { if (currentPage > 0) renderPage(currentPage - 1); });
        nextBtn.addEventListener('click', () => { if (currentPage < totalPages - 1) renderPage(currentPage + 1); });

        return (filePath) => {
            if (filePath) {
                currentFile = filePath;
                selectedPages.clear();
                if(splitPagesInput) splitPagesInput.value = '';
                previewContainer.style.display = 'block';
                dropArea.style.display = 'none';
                renderPage(0);
            } else {
                currentFile = null;
                previewContainer.style.display = 'none';
                dropArea.style.display = 'block';
            }
        };
    }

    const mergeHandler = setupFileHandling('merge', true);
    document.getElementById('merge-btn').addEventListener('click', async () => { showLoading('Merging PDFs...'); const res = await window.electronAPI.mergePDFs(mergeHandler.getFiles()); handleResponse(res); if (res.success) mergeHandler.reset(); });

    const compressHandler = setupFileHandling('compress', false);
    document.getElementById('compress-btn').addEventListener('click', async () => { showLoading('Compressing PDF...'); const res = await window.electronAPI.compressPDF(compressHandler.getFiles()[0]); handleResponse(res); if (res.success) compressHandler.reset(); });

    const protectHandler = setupFileHandling('protect', false);
    document.getElementById('protect-btn').addEventListener('click', async () => { const pw = document.getElementById('password-input').value; if (!pw) { Swal.fire({ icon: 'warning', title: 'Password Required' }); return; } showLoading('Protecting PDF...'); const res = await window.electronAPI.protectPDF(protectHandler.getFiles()[0], pw); handleResponse(res); if (res.success) { protectHandler.reset(); document.getElementById('password-input').value = ''; } });

    const splitHandler = setupFileHandling('split', false, setupPreview('split'));
    document.getElementById('split-btn').addEventListener('click', async () => { const ranges = document.getElementById('split-pages-input').value; if (!ranges) { Swal.fire({ icon: 'warning', title: 'Page Selection Required' }); return; } showLoading('Splitting PDF...'); const res = await window.electronAPI.splitPDF(splitHandler.getFiles()[0], ranges); handleResponse(res); if (res.success) splitHandler.reset(); });

    const rotateHandler = setupFileHandling('rotate', false, setupPreview('rotate'));
    document.getElementById('rotate-btn').addEventListener('click', async () => { const angle = document.getElementById('rotate-angle-select').value; showLoading('Rotating PDF...'); const res = await window.electronAPI.rotatePDF(rotateHandler.getFiles()[0], angle); handleResponse(res); if (res.success) rotateHandler.reset(); });
});
