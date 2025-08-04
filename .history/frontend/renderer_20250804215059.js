document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation ---
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

    // --- Real-time Greeting ---
    function setGreeting() {
        const greetingEl = document.getElementById('greeting');
        if (!greetingEl) return;
        const hour = new Date().getHours();
        greetingEl.textContent = `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}! 👋`;
    }
    setGreeting();

    // --- Password Toggle ---
    const togglePasswordBtn = document.getElementById('toggle-password-btn');
    const passwordInput = document.getElementById('password-input');
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePasswordBtn.innerHTML = `<i data-lucide="${type === 'password' ? 'eye' : 'eye-off'}"></i>`;
            lucide.createIcons();
        });
    }

    // --- Notifications ---
    const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3500, timerProgressBar: true });
    function showLoading(title) { Swal.fire({ title, html: 'Processing your file, please wait...', timerProgressBar: true, allowOutsideClick: false, didOpen: () => Swal.showLoading() }); }
    function handleResponse(result) {
        Swal.close();
        if (result && result.success) {
            Toast.fire({ icon: 'success', title: 'Success!', text: result.message });
            return true;
        } else {
            const message = result ? result.message : 'An unknown error occurred.';
            Swal.fire({ icon: 'error', title: 'An Error Occurred', text: message, confirmButtonColor: 'var(--primary)' });
            return false;
        }
    }

    // --- File Handling Logic ---
    function setupFileHandling(pageId, { isMultiple = false, isInteractive = false, acceptedFiles = '.pdf' } = {}) {
        const dropArea = document.getElementById(`${pageId}-drop-area`);
        const fileInput = document.getElementById(`${pageId}-file-input`);
        const fileListElem = document.getElementById(`${pageId}-file-list`);
        const actionBtn = document.getElementById(`${pageId}-btn`);
        const clearBtn = document.getElementById(`clear-${pageId}-btn`);
        const extraInputs = document.querySelectorAll(`#${pageId} .form-group input, #${pageId} .form-group select`);

        let files = [];

        const reset = () => {
            files = [];
            if(fileInput) fileInput.value = '';
            updateUI();
        };

        const updateUI = () => {
            if (fileListElem) {
                fileListElem.innerHTML = '';
                files.forEach(file => {
                    const li = document.createElement('li');
                    li.dataset.id = file.id;
                    if (isInteractive) {
                        li.setAttribute('draggable', true);
                        li.innerHTML = `<div class="file-list-item-content"><i data-lucide="grip-vertical" class="drag-handle"></i><span>${file.path.split(/[/\\]/).pop()}</span></div><button class="remove-file-btn" data-id="${file.id}"><i data-lucide="x"></i></button>`;
                    } else {
                        li.textContent = file.path.split(/[/\\]/).pop();
                    }
                    fileListElem.appendChild(li);
                });
                if (isInteractive) lucide.createIcons();
            }

            const isReady = isMultiple ? files.length > 1 : files.length > 0;
            if (actionBtn) actionBtn.disabled = !isReady;
            extraInputs.forEach(input => input.disabled = !isReady);
            if (pageId === 'protect') {
                const toggleBtn = document.getElementById('toggle-password-btn');
                if (toggleBtn) toggleBtn.disabled = !isReady;
            }
        };

        const handleFiles = (newFiles) => {
            const acceptedTypes = acceptedFiles.split(',').map(t => t.trim().toLowerCase());
            const filteredFiles = Array.from(newFiles).filter(f => acceptedTypes.some(type => f.name.toLowerCase().endsWith(type)));

            if (isMultiple) {
                filteredFiles.forEach(file => files.push({ path: file.path, id: Date.now() + Math.random() }));
            } else {
                files = filteredFiles.length > 0 ? [{ path: filteredFiles[0].path, id: Date.now() }] : [];
            }
            updateUI();
        };
        
        if (dropArea) dropArea.addEventListener('click', () => fileInput.click());
        if (dropArea) dropArea.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });
        if (dropArea) dropArea.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); handleFiles(e.dataTransfer.files); });
        if (fileInput) fileInput.addEventListener('change', () => handleFiles(fileInput.files));
        if (clearBtn) clearBtn.addEventListener('click', reset);
        
        return { getFiles: () => files.map(f => f.path), reset };
    }

    // --- Setup for all pages ---
    const mergeHandler = setupFileHandling('merge', { isMultiple: true, isInteractive: true });
    const compressHandler = setupFileHandling('compress');
    const protectHandler = setupFileHandling('protect');
    const imageToPdfHandler = setupFileHandling('image-to-pdf', { isMultiple: true, acceptedFiles: '.jpg, .jpeg, .png' });
    const pdfToImageHandler = setupFileHandling('pdf-to-image');

    // --- Button Event Listeners with Improved Error Handling ---
    document.getElementById('merge-btn')?.addEventListener('click', async () => { try { showLoading('Merging PDFs...'); const res = await window.electronAPI.mergePDFs(mergeHandler.getFiles()); if (handleResponse(res)) mergeHandler.reset(); } catch (e) { handleResponse({ success: false, message: e.message }); } });
    document.getElementById('compress-btn')?.addEventListener('click', async () => { try { showLoading('Compressing PDF...'); const res = await window.electronAPI.compressPDF(compressHandler.getFiles()[0]); if (handleResponse(res)) compressHandler.reset(); } catch (e) { handleResponse({ success: false, message: e.message }); } });
    document.getElementById('protect-btn')?.addEventListener('click', async () => { try { const pw = document.getElementById('password-input').value; if (!pw) { Swal.fire({ icon: 'warning', title: 'Password Required' }); return; } showLoading('Protecting PDF...'); const res = await window.electronAPI.protectPDF(protectHandler.getFiles()[0], pw); if (handleResponse(res)) { protectHandler.reset(); document.getElementById('password-input').value = ''; } } catch (e) { handleResponse({ success: false, message: e.message }); } });
    
    // CORRECTED EVENT LISTENERS
    document.getElementById('image-to-pdf-btn')?.addEventListener('click', async () => { try { showLoading('Converting to PDF...'); const res = await window.electronAPI.imageToPdf(imageToPdfHandler.getFiles()); if (handleResponse(res)) imageToPdfHandler.reset(); } catch (e) { handleResponse({ success: false, message: e.message }); } });
    document.getElementById('pdf-to-image-btn')?.addEventListener('click', async () => { try { showLoading('Converting to Images...'); const res = await window.electronAPI.pdfToImage(pdfToImageHandler.getFiles()[0]); if (handleResponse(res)) pdfToImageHandler.reset(); } catch (e) { handleResponse({ success: false, message: e.message }); } });

    // --- UNIFIED EDIT WORKSPACE (No changes here, remains the same) ---
    // (Your existing code for the Edit & Organize workspace goes here)
});