document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation ---
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
                if (page.id === targetId) {
                    page.classList.add('active');
                }
            });
        });
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

    function showLoading(title) {
        Swal.fire({
            title: title,
            text: 'Please wait...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    }

    function handleResponse(result) {
        Swal.close();
        if (result.success) {
            Toast.fire({ icon: 'success', title: result.message });
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: result.message });
        }
    }


    // --- Generic File Handling Logic ---
    function setupFileHandling(pageId, isMultiple) {
        // The entire page is now the drop target
        const dropZone = document.getElementById(pageId);
        const fileInput = document.getElementById(`${pageId}-file-input`);
        const fileListElem = document.getElementById(`${pageId}-file-list`);
        const actionBtn = document.getElementById(`${pageId}-btn`);
        // The inner box is still used for clicking
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
            actionBtn.disabled = !isReady;

            if(pageId === 'protect') document.getElementById('password-input').disabled = !isReady;
        };
        
        clickArea.addEventListener('click', () => fileInput.click());
        
        // Attach drag-and-drop listeners to the whole page section
        dropZone.addEventListener('dragover', (e) => { 
            e.preventDefault(); 
            e.stopPropagation();
            dropZone.classList.add('highlight'); 
        });
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('highlight');
        });
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
            reset: () => {
                filePaths = [];
                fileInput.value = '';
                updateUI();
            }
        };
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
        if (!password) {
            Swal.fire({ icon: 'warning', title: 'Password Required', text: 'Please enter a password.' });
            return;
        }
        showLoading('Protecting PDF...');
        const result = await window.electronAPI.protectPDF(protectHandler.getFiles()[0], password);
        handleResponse(result);
        if (result.success) {
            protectHandler.reset();
            document.getElementById('password-input').value = '';
        }
    });
    
    // --- Update Check ---
    async function checkForUpdates() {
        const result = await window.electronAPI.checkForUpdate();
        if (result && result.isNewVersion) {
            Swal.fire({
                title: `Update Available: v${result.latestVersion}`,
                text: result.message,
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Download',
                cancelButtonText: 'Later'
            });
        }
    }
    
    setTimeout(checkForUpdates, 2000);
});