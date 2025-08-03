document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    const pages = document.querySelectorAll('.page');
    const toolCards = document.querySelectorAll('.tool-card');

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

    const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3500, timerProgressBar: true });
    function showLoading(title) { Swal.fire({ title, html: 'Processing your file, please wait...', timerProgressBar: true, allowOutsideClick: false, didOpen: () => Swal.showLoading() }); }
    function handleResponse(result) {
        Swal.close();
        if (result.success) Toast.fire({ icon: 'success', title: 'Success!', text: result.message });
        else Swal.fire({ icon: 'error', title: 'An Error Occurred', text: result.message, confirmButtonColor: 'var(--primary)' });
    }

    // --- File Handling for pages with previews (Split, Rotate) ---
    function setupPreviewFileHandling(pageId, onFileLoad) {
        const dropArea = document.getElementById(`${pageId}-drop-area`);
        const fileInput = document.getElementById(`${pageId}-file-input`);
        const actionBtn = document.getElementById(`${pageId}-btn`);
        const clearBtn = document.getElementById(`clear-${pageId}-btn`);
        const extraInputs = document.querySelectorAll(`#${pageId} .form-group input, #${pageId} .form-group select`);
        let filePath = null;

        const reset = () => {
            filePath = null;
            fileInput.value = '';
            if (onFileLoad) onFileLoad(null);
            updateUI();
        };

        const updateUI = () => {
            const isReady = !!filePath;
            if (actionBtn) actionBtn.disabled = !isReady;
            extraInputs.forEach(input => input.disabled = !isReady);
        };

        const handleFiles = (files) => {
            filePath = files.length > 0 ? files[0].path : null;
            updateUI();
            if (onFileLoad && filePath) onFileLoad(filePath);
        };

        if (dropArea) dropArea.addEventListener('click', () => fileInput.click());
        dropArea.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); dropArea.classList.add('highlight'); });
        dropArea.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); dropArea.classList.remove('highlight'); });
        dropArea.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); dropArea.classList.remove('highlight'); handleFiles(Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf')); });
        fileInput.addEventListener('change', () => handleFiles(Array.from(fileInput.files)));
        if (clearBtn) clearBtn.addEventListener('click', reset);

        return { getFiles: () => [filePath], reset };
    }
    
    // --- File Handling for Interactive Merge List ---
    function setupMergeFileHandling() {
        const pageId = 'merge';
        const dropArea = document.getElementById(`${pageId}-drop-area`);
        const fileInput = document.getElementById(`${pageId}-file-input`);
        const fileListElem = document.getElementById(`${pageId}-file-list`);
        const actionBtn = document.getElementById(`${pageId}-btn`);
        const clearBtn = document.getElementById(`clear-${pageId}-btn`);
        let files = []; // Array of objects: { path: string, id: number }

        const reset = () => {
            files = [];
            fileInput.value = '';
            updateUI();
        };

        const updateUI = () => {
            fileListElem.innerHTML = '';
            files.forEach(file => {
                const li = document.createElement('li');
                li.setAttribute('draggable', true);
                li.dataset.id = file.id;
                li.innerHTML = `
                    <div class="file-list-item-content">
                        <i data-lucide="grip-vertical" class="drag-handle"></i>
                        <span>${file.path.split(/[/\\]/).pop()}</span>
                    </div>
                    <button class="remove-file-btn" data-id="${file.id}"><i data-lucide="x"></i></button>
                `;
                fileListElem.appendChild(li);
            });
            lucide.createIcons(); // Re-render icons
            actionBtn.disabled = files.length < 2;
        };

        const handleFiles = (newFiles) => {
            newFiles.forEach(file => files.push({ path: file.path, id: Date.now() + Math.random() }));
            updateUI();
        };

        fileListElem.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.remove-file-btn');
            if (removeBtn) {
                const idToRemove = Number(removeBtn.dataset.id);
                files = files.filter(f => f.id !== idToRemove);
                updateUI();
            }
        });

        let dragSrcEl = null;
        fileListElem.addEventListener('dragstart', (e) => {
            dragSrcEl = e.target;
            e.dataTransfer.effectAllowed = 'move';
            e.target.classList.add('dragging');
        });
        fileListElem.addEventListener('dragend', (e) => e.target.classList.remove('dragging'));
        fileListElem.addEventListener('dragover', (e) => {
            e.preventDefault();
            const target = e.target.closest('li');
            if (target && target !== dragSrcEl) {
                const rect = target.getBoundingClientRect();
                const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > .5;
                fileListElem.insertBefore(dragSrcEl, next && target.nextSibling || target);
            }
        });
        fileListElem.addEventListener('drop', (e) => {
            e.preventDefault();
            const newOrder = [...fileListElem.querySelectorAll('li')].map(li => Number(li.dataset.id));
            files.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
            updateUI();
        });

        if (dropArea) dropArea.addEventListener('click', () => fileInput.click());
        dropArea.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); dropArea.classList.add('highlight'); });
        dropArea.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); dropArea.classList.remove('highlight'); });
        dropArea.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); dropArea.classList.remove('highlight'); handleFiles(Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf')); });
        fileInput.addEventListener('change', () => handleFiles(Array.from(fileInput.files)));
        if(clearBtn) clearBtn.addEventListener('click', reset);

        return { getFiles: () => files.map(f => f.path), reset };
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

    // --- Setup for pages ---
    const mergeHandler = setupMergeFileHandling();
    const compressHandler = setupSimpleFileHandling('compress');
    const protectHandler = setupSimpleFileHandling('protect');
    const splitHandler = setupPreviewFileHandling('split', setupPreview('split'));
    const rotateHandler = setupPreviewFileHandling('rotate', setupPreview('rotate'));

    // --- Event Listeners for Buttons ---
    document.getElementById('merge-btn').addEventListener('click', async () => { showLoading('Merging PDFs...'); const res = await window.electronAPI.mergePDFs(mergeHandler.getFiles()); handleResponse(res); if (res.success) mergeHandler.reset(); });
    document.getElementById('compress-btn').addEventListener('click', async () => { showLoading('Compressing PDF...'); const res = await window.electronAPI.compressPDF(compressHandler.getFiles()[0]); handleResponse(res); if (res.success) compressHandler.reset(); });
    document.getElementById('protect-btn').addEventListener('click', async () => { const pw = document.getElementById('password-input').value; if (!pw) { Swal.fire({ icon: 'warning', title: 'Password Required' }); return; } showLoading('Protecting PDF...'); const res = await window.electronAPI.protectPDF(protectHandler.getFiles()[0], pw); handleResponse(res); if (res.success) { protectHandler.reset(); document.getElementById('password-input').value = ''; } });
    document.getElementById('split-btn').addEventListener('click', async () => { const ranges = document.getElementById('split-pages-input').value; if (!ranges) { Swal.fire({ icon: 'warning', title: 'Page Selection Required' }); return; } showLoading('Splitting PDF...'); const res = await window.electronAPI.splitPDF(splitHandler.getFiles()[0], ranges); handleResponse(res); if (res.success) splitHandler.reset(); });
    document.getElementById('rotate-btn').addEventListener('click', async () => { const angle = document.getElementById('rotate-angle-select').value; showLoading('Rotating PDF...'); const res = await window.electronAPI.rotatePDF(rotateHandler.getFiles()[0], angle); handleResponse(res); if (res.success) rotateHandler.reset(); });
});