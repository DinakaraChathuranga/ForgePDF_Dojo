document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation ---
    const menuItems = document.querySelectorAll('.menu-item');
    const pages = document.querySelectorAll('.page');

    function navigateTo(targetId) {
        menuItems.forEach(mi => mi.classList.remove('active'));
        pages.forEach(page => page.classList.remove('active'));

        const targetPage = document.getElementById(targetId);
        const targetMenuItem = document.querySelector(`.menu-item[data-target="${targetId}"]`);

        if (targetPage) targetPage.classList.add('active');
        if (targetMenuItem) targetMenuItem.classList.add('active');
    }

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(item.getAttribute('data-target'));
        });
    });

    // --- Keyboard Shortcuts ---
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey) {
            switch (e.key) {
                case '1': navigateTo('home'); break;
                case '2': navigateTo('merge'); break;
                case '3': navigateTo('compress'); break;
                case '4': navigateTo('protect'); break;
                // case '5': navigateTo('watermark'); break; // Removed
            }
        }
    });

    // --- Notifications ---
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    function showLoading(title, button) {
        if (button) button.classList.add('loading');
        Swal.fire({
            title: title,
            text: 'Please wait...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });
    }

    function handleResponse(result, button) {
        if (button) button.classList.remove('loading');
        Swal.close();
        if (result.success) {
            Toast.fire({ icon: 'success', title: result.message, background: 'var(--success-tint)', color: 'var(--success)' });
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: result.message, confirmButtonColor: 'var(--primary)' });
        }
    }

    // --- Generic File Handling Logic ---
    function setupFileHandling(pageId, isMultiple) {
        const dropZone = document.getElementById(pageId);
        const fileInput = document.getElementById(`${pageId}-file-input`);
        const fileListElem = document.getElementById(`${pageId}-file-list`);
        const actionBtn = document.getElementById(`${pageId}-btn`);
        const clickArea = document.getElementById(`${pageId}-drop-area`);
        let filePaths = [];

        const updateUI = () => {
            fileListElem.innerHTML = '';
            filePaths.forEach(path => {
                const li = document.createElement('li');
                li.textContent = path.split(/[\/\\]/).pop();
                fileListElem.appendChild(li);
            });
            const isReady = isMultiple ? filePaths.length > 1 : filePaths.length > 0;
            if(actionBtn) actionBtn.disabled = !isReady;
            if(pageId === 'protect') document.getElementById('password-input').disabled = !isReady;
            // Watermark UI logic is no longer needed
        };
        
        if (clickArea) clickArea.addEventListener('click', () => fileInput.click());
        
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('highlight'); });
        dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('highlight'); });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('highlight');
            const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
            filePaths = isMultiple ? files.map(f => f.path) : (files.length > 0 ? [files[0].path] : []);
            updateUI();
        });
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            filePaths = isMultiple ? files.map(f => f.path) : (files.length > 0 ? [files[0].path] : []);
            updateUI();
        });

        return {
            getFiles: () => filePaths,
            reset: () => { filePaths = []; fileInput.value = ''; updateUI(); }
        };
    }

    // --- Feature Implementations ---
    const mergeHandler = setupFileHandling('merge', true);
    document.getElementById('merge-btn').addEventListener('click', async (e) => {
        showLoading('Merging PDFs...', e.currentTarget);
        const result = await window.electronAPI.mergePDFs(mergeHandler.getFiles());
        handleResponse(result, e.currentTarget);
        if (result.success) mergeHandler.reset();
    });

    const compressHandler = setupFileHandling('compress', false);
    document.getElementById('compress-btn').addEventListener('click', async (e) => {
        showLoading('Compressing PDF...', e.currentTarget);
        const result = await window.electronAPI.compressPDF(compressHandler.getFiles()[0]);
        handleResponse(result, e.currentTarget);
        if (result.success) compressHandler.reset();
    });

    const protectHandler = setupFileHandling('protect', false);
    document.getElementById('protect-btn').addEventListener('click', async (e) => {
        const password = document.getElementById('password-input').value;
        if (!password) { Swal.fire({ icon: 'warning', title: 'Password Required' }); return; }
        showLoading('Protecting PDF...', e.currentTarget);
        const result = await window.electronAPI.protectPDF(protectHandler.getFiles()[0], password);
        handleResponse(result, e.currentTarget);
        if (result.success) { protectHandler.reset(); document.getElementById('password-input').value = ''; }
    });
    
    // Watermark handler is now removed

    // --- Update Check ---
    async function checkForUpdates() {
        const result = await window.electronAPI.checkForUpdate();
        if (result && result.isNewVersion) {
            Swal.fire({ title: `Update Available: v${result.latestVersion}`, text: result.message, icon: 'info', showCancelButton: true, confirmButtonText: 'Download' });
        }
    }
    setTimeout(checkForUpdates, 3000);
});
