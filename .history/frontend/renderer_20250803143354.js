document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    const pages = document.querySelectorAll('.page');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');
            pages.forEach(page => {
                page.classList.remove('active');
                if (page.id === targetId) page.classList.add('active');
            });
        });
    });

    const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });
    function showLoading(title) { Swal.fire({ title: title, text: 'Please wait...', allowOutsideClick: false, didOpen: () => Swal.showLoading() }); }
    function handleResponse(result) { Swal.close(); if (result.success) { Toast.fire({ icon: 'success', title: result.message }); } else { Swal.fire({ icon: 'error', title: 'Error', text: result.message }); } }

    function setupFileHandling(pageId, isMultiple) {
        const dropArea = document.getElementById(`${pageId}-drop-area`);
        const fileInput = document.getElementById(`${pageId}-file-input`);
        const fileListElem = document.getElementById(`${pageId}-file-list`);
        const actionBtn = document.getElementById(`${pageId}-btn`);
        let filePaths = [];
        const updateUI = () => {
            fileListElem.innerHTML = '';
            filePaths.forEach(path => {
                const li = document.createElement('li');
                li.textContent = path.split(/[\/\\]/).pop();
                fileListElem.appendChild(li);
            });
            const isReady = isMultiple ? filePaths.length > 1 : filePaths.length > 0;
            actionBtn.disabled = !isReady;
            if(pageId === 'protect') document.getElementById('password-input').disabled = !isReady;
            // The watermark-specific UI logic is no longer needed
        };
        dropArea.addEventListener('click', () => fileInput.click());
        dropArea.addEventListener('dragover', (e) => { e.preventDefault(); dropArea.classList.add('highlight'); });
        dropArea.addEventListener('dragleave', () => dropArea.classList.remove('highlight'));
        dropArea.addEventListener('drop', (e) => { e.preventDefault(); dropArea.classList.remove('highlight'); handleFileSelection(e.dataTransfer.files); });
        fileInput.addEventListener('change', (e) => handleFileSelection(e.target.files));
        const handleFileSelection = (files) => {
            const pdfs = Array.from(files).filter(f => f.type === 'application/pdf');
            filePaths = isMultiple ? pdfs.map(f => f.path) : (pdfs.length > 0 ? [pdfs[0].path] : []);
            updateUI();
        };
        return { getFiles: () => filePaths, reset: () => { filePaths = []; fileInput.value = ''; updateUI(); } };
    }

    const mergeHandler = setupFileHandling('merge', true);
    document.getElementById('merge-btn').addEventListener('click', async () => { showLoading('Merging PDFs...'); const result = await window.electronAPI.mergePDFs(mergeHandler.getFiles()); handleResponse(result); if (result.success) mergeHandler.reset(); });

    const compressHandler = setupFileHandling('compress', false);
    document.getElementById('compress-btn').addEventListener('click', async () => { showLoading('Compressing PDF...'); const result = await window.electronAPI.compressPDF(compressHandler.getFiles()[0]); handleResponse(result); if (result.success) compressHandler.reset(); });

    const protectHandler = setupFileHandling('protect', false);
    document.getElementById('protect-btn').addEventListener('click', async () => {
        const password = document.getElementById('password-input').value;
        if (!password) { Swal.fire({ icon: 'warning', title: 'Password Required' }); return; }
        showLoading('Protecting PDF...');
        const result = await window.electronAPI.protectPDF(protectHandler.getFiles()[0], password);
        handleResponse(result);
        if (result.success) { protectHandler.reset(); document.getElementById('password-input').value = ''; }
    });
    
    // Watermark handler is now removed
    
    async function checkForUpdates() {
        const result = await window.electronAPI.checkForUpdate();
        if (result && result.isNewVersion) {
            Swal.fire({ title: `Update Available: v${result.latestVersion}`, text: result.message, icon: 'info', showCancelButton: true, confirmButtonText: 'Download', cancelButtonText: 'Later' });
        }
    }
    setTimeout(checkForUpdates, 2000);
});