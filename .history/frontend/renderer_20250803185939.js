document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    const pages = document.querySelectorAll('.page');
    const toolCards = document.querySelectorAll('.tool-card');
    const dragOverlay = document.getElementById('drag-overlay');

    // --- Navigation ---
    function navigateTo(targetId) {
        // Hide all pages and remove active state from menu items
        pages.forEach(page => page.classList.remove('active'));
        menuItems.forEach(mi => mi.classList.remove('active'));

        // Show the target page
        const targetPage = document.getElementById(targetId);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Highlight the corresponding menu item
        const targetMenuItem = document.querySelector(`.menu-item[data-target="${targetId}"]`);
        if (targetMenuItem) {
            targetMenuItem.classList.add('active');
        }
    }

    // Menu item click listeners
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            navigateTo(targetId);
        });
    });
    
    // Tool card click listeners
    toolCards.forEach(card => {
        card.addEventListener('click', () => {
             const targetId = card.getAttribute('data-target');
             navigateTo(targetId);
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
            }
        }
    });
    
    // --- Home Page Logic ---
    function setGreeting() {
        const greetingEl = document.getElementById('greeting');
        if (!greetingEl) return;
        
        const hour = new Date().getHours();
        let greetingText = 'Good evening';
        if (hour < 12) {
            greetingText = 'Good morning';
        } else if (hour < 17) {
            greetingText = 'Good afternoon';
        }
        greetingEl.textContent = `${greetingText}! 👋`;
    }
    
    // Set initial greeting
    setGreeting();


    // --- Full-page Drag & Drop ---
    window.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dragOverlay.classList.add('visible');
    });

    dragOverlay.addEventListener('dragleave', (e) => {
        // This is tricky because dragleave fires when moving over child elements.
        // A simple check to see if the related target is outside the window works well.
        if (e.relatedTarget === null || e.relatedTarget.nodeName === "HTML") {
            dragOverlay.classList.remove('visible');
        }
    });
    
    dragOverlay.addEventListener('dragover', (e) => {
        e.preventDefault(); // Necessary to allow drop
    });

    dragOverlay.addEventListener('drop', (e) => {
        e.preventDefault();
        dragOverlay.classList.remove('visible');
        
        const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
        if (files.length === 0) return;

        // Simple logic: if more than one file, go to merge. Otherwise, compress.
        const targetPage = files.length > 1 ? 'merge' : 'compress';
        navigateTo(targetPage);
        
        // Pass files to the target page's handler
        const filePaths = files.map(f => f.path);
        const fileInput = document.getElementById(`${targetPage}-file-input`);
        const dropArea = document.getElementById(`${targetPage}-drop-area`);
        
        // To pass the files, we can't directly set the file input's files property.
        // Instead, we'll trigger a custom event with the file paths.
        const dropEvent = new CustomEvent('files-dropped', { detail: { paths: filePaths } });
        dropArea.dispatchEvent(dropEvent);
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
        const dropArea = document.getElementById(`${pageId}-drop-area`);
        const fileInput = document.getElementById(`${pageId}-file-input`);
        const fileListElem = document.getElementById(`${pageId}-file-list`);
        const actionBtn = document.getElementById(`${pageId}-btn`);
        let filePaths = [];

        const updateUI = () => {
            fileListElem.innerHTML = '';
            filePaths.forEach(path => {
                const li = document.createElement('li');
                li.textContent = path.split(/[/\\]/).pop(); // Works for both Windows and Unix paths
                fileListElem.appendChild(li);
            });
            const isReady = isMultiple ? filePaths.length > 1 : filePaths.length > 0;
            if(actionBtn) actionBtn.disabled = !isReady;
            if(pageId === 'protect') document.getElementById('password-input').disabled = !isReady;
        };
        
        if (dropArea) dropArea.addEventListener('click', () => fileInput.click());
        
        dropArea.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); dropArea.parentElement.classList.add('highlight'); });
        dropArea.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); dropArea.parentElement.classList.remove('highlight'); });
        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropArea.parentElement.classList.remove('highlight');
            const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
            filePaths = isMultiple ? files.map(f => f.path) : (files.length > 0 ? [files[0].path] : []);
            updateUI();
        });
        
        // Listen for the custom drop event from the overlay
        dropArea.addEventListener('files-dropped', (e) => {
            filePaths = e.detail.paths;
            updateUI();
        });

        fileInput.addEventListener('change', () => {
            const files = Array.from(fileInput.files);
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
        if (!password) { Swal.fire({ icon: 'warning', title: 'Password Required', text: 'Please enter a password to protect the file.' }); return; }
        showLoading('Protecting PDF...', e.currentTarget);
        const result = await window.electronAPI.protectPDF(protectHandler.getFiles()[0], password);
        handleResponse(result, e.currentTarget);
        if (result.success) { protectHandler.reset(); document.getElementById('password-input').value = ''; }
    });
    
    // --- Update Check ---
    async function checkForUpdates() {
        try {
            const result = await window.electronAPI.checkForUpdate();
            if (result && result.isNewVersion) {
                Swal.fire({ 
                    title: `Update Available: v${result.latestVersion}`, 
                    text: result.message, 
                    icon: 'info', 
                    showCancelButton: true, 
                    confirmButtonText: 'Download',
                    confirmButtonColor: 'var(--primary)'
                });
            }
        } catch (error) {
            console.error("Update check failed:", error);
        }
    }
    setTimeout(checkForUpdates, 5000); // Check for updates 5 seconds after launch
});