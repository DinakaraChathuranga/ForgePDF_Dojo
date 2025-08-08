document.addEventListener('DOMContentLoaded', () => {
    // --- Global UI Elements & State ---
    const menuItems = document.querySelectorAll('.menu-item');
    const pages = document.querySelectorAll('.page');
    const toolCards = document.querySelectorAll('.tool-card');
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
        showCloseButton: true, // Allow closing success toasts
    });

    // --- Core Functions ---

    /**
     * Shows a loading popup.
     * @param {string} title - The title for the loading message.
     */
    function showLoading(title) {
        Swal.fire({
            title,
            html: 'Processing your file, please wait...',
            timerProgressBar: true,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    }

    /**
     * Handles the response from the main process, showing success or error popups.
     * @param {object} result - The result object from the backend {success: boolean, message: string}.
     * @param {object} handlerToReset - The file handler object to call .reset() on.
     */
    function handleResponse(result, handlerToReset) {
        Swal.close(); // Close the loading popup first
        if (result && result.success) {
            Toast.fire({ icon: 'success', title: 'Success!', text: result.message });
            if (handlerToReset) handlerToReset.reset();
        } else {
            const message = result ? result.message : 'An unknown error occurred.';
            Swal.fire({
                icon: 'error',
                title: 'An Error Occurred',
                text: message,
                showCloseButton: true, // Allow closing error popups
                confirmButtonText: 'OK',
                confirmButtonColor: 'var(--primary)',
            }).then(() => {
                // When the error alert is closed (by button or 'X'), reset the state.
                if (handlerToReset) handlerToReset.reset();
            });
        }
    }

    /**
     * Sets up navigation between pages.
     */
    function setupNavigation() {
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
                navigateTo(item.getAttribute('data-target'));
            });
        });

        toolCards.forEach(card => {
            card.addEventListener('click', () => navigateTo(card.getAttribute('data-target')));
        });
    }
    
    /**
     * Sets a dynamic greeting message based on the time of day.
     */
    function setGreeting() {
        const greetingEl = document.getElementById('greeting');
        if (!greetingEl) return;
        const hour = new Date().getHours();
        greetingEl.textContent = `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}! 👋`;
    }

    /**
     * Sets up the password visibility toggle functionality.
     */
    function setupPasswordToggle() {
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
    }
    
    /**
     * Sets up generic file handling for a tool page.
     * @param {string} pageId - The ID of the page (e.g., 'merge').
     * @param {object} options - Configuration options.
     * @param {boolean} options.isMultiple - Whether multiple files are allowed.
     * @param {boolean} options.isInteractive - Whether the file list is sortable.
     * @param {string} options.acceptedFiles - Comma-separated list of accepted file extensions.
     * @returns {{getFiles: function, reset: function}} - Object with methods to get files and reset the state.
     */
    function setupFileHandling(pageId, { isMultiple = false, isInteractive = false, acceptedFiles = '.pdf' } = {}) {
        const dropArea = document.getElementById(`${pageId}-drop-area`);
        const fileInput = document.getElementById(`${pageId}-file-input`);
        const fileListElem = document.getElementById(`${pageId}-file-list`);
        const actionBtn = document.getElementById(`${pageId}-btn`);
        const clearBtn = document.getElementById(`clear-${pageId}-btn`);
        const extraInputs = document.querySelectorAll(`#${pageId} .form-group input, #${pageId} .form-group select`);
        
        let files = []; // Array of {path: string, id: number}

        const reset = () => {
            files = [];
            if (fileInput) fileInput.value = '';
            updateUI();
        };

        const updateUI = () => {
            if (fileListElem) {
                fileListElem.innerHTML = '';
                files.forEach(file => {
                    const li = document.createElement('li');
                    li.dataset.id = file.id;
                    const fileName = file.path.split(/[/\\]/).pop();
                    if (isInteractive) {
                        li.setAttribute('draggable', true);
                        li.innerHTML = `<div class="file-list-item-content"><i data-lucide="grip-vertical" class="drag-handle"></i><span>${fileName}</span></div><button class="remove-file-btn" data-id="${file.id}"><i data-lucide="x"></i></button>`;
                    } else {
                        li.textContent = fileName;
                    }
                    fileListElem.appendChild(li);
                });
                if (isInteractive) lucide.createIcons();
            }
            
            const hasFiles = files.length > 0;
            const isReadyForAction = isMultiple ? files.length > 1 : hasFiles;

            if (actionBtn) actionBtn.disabled = !isReadyForAction;

            // **FIX**: This now correctly enables/disables the password field
            extraInputs.forEach(input => input.disabled = !hasFiles);

            if (pageId === 'protect') {
                const toggleBtn = document.getElementById('toggle-password-btn');
                if (toggleBtn) toggleBtn.disabled = !hasFiles;
            }
        };

        const handleFiles = (newFiles) => {
            const acceptedTypes = acceptedFiles.split(',').map(t => t.trim().toLowerCase());
            const filteredFiles = Array.from(newFiles).filter(f => acceptedTypes.some(type => f.name.toLowerCase().endsWith(type)));
            
            if (!isMultiple) {
                files = []; // Clear previous files for single-file uploads
            }

            filteredFiles.forEach(file => {
                if (!files.some(f => f.path === file.path)) {
                    files.push({ path: file.path, id: Date.now() + Math.random() });
                }
            });
            updateUI();
        };

        if (dropArea) dropArea.addEventListener('click', () => fileInput.click());
        if (dropArea) dropArea.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); document.getElementById(pageId).classList.add('highlight'); });
        if (dropArea) dropArea.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); document.getElementById(pageId).classList.remove('highlight'); });
        if (dropArea) dropArea.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); document.getElementById(pageId).classList.remove('highlight'); handleFiles(e.dataTransfer.files); });
        if (fileInput) fileInput.addEventListener('change', () => handleFiles(fileInput.files));
        if (clearBtn) clearBtn.addEventListener('click', reset);
        
        if (isInteractive && fileListElem) {
             fileListElem.addEventListener('click', (e) => {
                const removeBtn = e.target.closest('.remove-file-btn');
                if (removeBtn) {
                    const idToRemove = parseFloat(removeBtn.dataset.id);
                    files = files.filter(f => f.id !== idToRemove);
                    updateUI();
                }
            });
            let dragSrcEl = null;
            fileListElem.addEventListener('dragstart', (e) => { dragSrcEl = e.target; e.dataTransfer.effectAllowed = 'move'; e.target.classList.add('dragging'); });
            fileListElem.addEventListener('dragend', (e) => { e.target.classList.remove('dragging'); });
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
                const newOrderIds = [...fileListElem.querySelectorAll('li')].map(li => parseFloat(li.dataset.id));
                files.sort((a, b) => newOrderIds.indexOf(a.id) - newOrderIds.indexOf(b.id));
            });
        }
        
        return { getFiles: () => files.map(f => f.path), reset };
    }


    // --- Setup All Application Handlers ---

    const mergeHandler = setupFileHandling('merge', { isMultiple: true, isInteractive: true });
    const compressHandler = setupFileHandling('compress');
    const protectHandler = setupFileHandling('protect');

    const actionButtons = [
        { id: 'merge-btn', handler: mergeHandler, api: 'mergePDFs', loadingMsg: 'Merging PDFs...' },
        { id: 'compress-btn', handler: compressHandler, api: 'compressPDF', loadingMsg: 'Compressing PDF...' },
        { id: 'protect-btn', handler: protectHandler, api: 'protectPDF', loadingMsg: 'Protecting PDF...' }
    ];

    actionButtons.forEach(({ id, handler, api, loadingMsg }) => {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', async () => {
                try {
                    const files = handler.getFiles();
                    if (files.length === 0) return;
                    
                    let args = (api === 'mergePDFs') ? [files] : [files[0]];

                    if (api === 'protectPDF') {
                        const password = document.getElementById('password-input').value;
                        if (!password) {
                            return Swal.fire({ icon: 'warning', title: 'Password Required', text: 'Please enter a password to protect the PDF.' });
                        }
                        args.push(password);
                    }
                    
                    showLoading(loadingMsg);
                    const result = await window.electronAPI[api](...args);
                    
                    handleResponse(result, handler);

                    if (result && result.success && api === 'protectPDF') {
                        document.getElementById('password-input').value = '';
                    }

                } catch (e) {
                    handleResponse({ success: false, message: e.message }, handler);
                }
            });
        }
    });

    // --- Edit & Organize Workspace Logic ---
    const editWorkspace = {
        state: { currentFile: null, mode: 'organize', pages: [], pageToMove: null, draggedItem: null },
        elements: {
            dropArea: document.getElementById('edit-drop-area'),
            fileInput: document.getElementById('edit-file-input'),
            container: document.getElementById('editor-container'),
            content: document.getElementById('edit-main-content'),
            filename: document.getElementById('edit-filename'),
            modeControls: document.getElementById('editor-mode-controls'),
            modeInfo: document.getElementById('edit-mode-info'),
            toolbar: document.getElementById('editor-toolbar'),
            saveBtn: document.getElementById('edit-save-btn'),
            clearBtn: document.getElementById('edit-clear-btn'),
        },
        init() {
            const { dropArea, fileInput, clearBtn, toolbar, content, saveBtn } = this.elements;
            dropArea.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.handleFile(e.target.files));
            dropArea.addEventListener('dragover', (e) => e.preventDefault());
            dropArea.addEventListener('drop', (e) => { e.preventDefault(); this.handleFile(e.dataTransfer.files); });
            clearBtn.addEventListener('click', () => this.reset());
            toolbar.addEventListener('click', (e) => {
                const toolBtn = e.target.closest('.tool-btn');
                if (toolBtn) this.setMode(toolBtn.dataset.mode);
            });
            content.addEventListener('click', (e) => this.onPageClick(e));
            content.addEventListener('dragstart', (e) => this.onPageDragStart(e));
            content.addEventListener('dragend', () => this.onPageDragEnd());
            content.addEventListener('dragover', (e) => this.onPageDragOver(e));
            saveBtn.addEventListener('click', () => this.save());
        },
        reset() {
            this.state = { currentFile: null, mode: 'organize', pages: [], pageToMove: null, draggedItem: null };
            this.elements.content.innerHTML = '';
            this.elements.container.style.display = 'none';
            this.elements.dropArea.style.display = 'flex';
            this.elements.saveBtn.disabled = true;
        },
        async handleFile(files) {
            if (!files || files.length === 0) return;
            const file = files[0];
            if (file.type !== 'application/pdf') {
                return handleResponse({ success: false, message: "Please select a PDF file." });
            }
            this.reset();
            this.state.currentFile = file.path;
            this.elements.filename.textContent = file.name;
            this.elements.dropArea.style.display = 'none';
            this.elements.container.style.display = 'flex';
            this.elements.content.classList.add('loading');
            try {
                const result = await window.electronAPI.getPdfPreview(this.state.currentFile, -1);
                if (result.success) {
                    result.filePaths.forEach((path, i) => {
                        const thumb = this.createPageThumbnail(path, i + 1);
                        this.elements.content.appendChild(thumb);
                        this.state.pages.push({ element: thumb, originalIndex: i + 1, isDeleted: false, rotation: 0 });
                    });
                    this.setMode('organize');
                } else {
                    handleResponse(result);
                    this.reset();
                }
            } catch(e) {
                 handleResponse({ success: false, message: e.message });
                 this.reset();
            } finally {
                this.elements.content.classList.remove('loading');
            }
        },
        createPageThumbnail(imagePath, pageNum) {
            const thumb = document.createElement('div');
            thumb.className = 'page-thumbnail';
            thumb.dataset.page = pageNum;
            thumb.innerHTML = `
                <img src="${imagePath.replace(/\\/g, '/')}?t=${Date.now()}" alt="Page ${pageNum}" draggable="false">
                <span class="page-number">${pageNum}</span>
                <button class="delete-btn" style="display: none;"><i data-lucide="x"></i></button>`;
            setTimeout(() => lucid.createIcons({ nodes: [thumb.querySelector('.delete-btn')] }), 0);
            return thumb;
        },
        setMode(newMode) {
            this.state.mode = newMode;
            this.elements.container.dataset.mode = newMode;
            this.elements.toolbar.querySelectorAll('.tool-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === newMode));
            this.state.pages.forEach(p => p.element.classList.remove('selected', 'selected-for-move', 'marked-for-deletion'));
            this.state.pageToMove = null;
            this.elements.modeControls.innerHTML = '';
            this.elements.modeControls.classList.remove('visible');
            const deleteBtns = this.elements.content.querySelectorAll('.delete-btn');
            this.elements.saveBtn.disabled = false;
            
            if (newMode === 'organize') {
                this.elements.modeInfo.textContent = "Drag & drop or click pages to reorder. Use 'X' to mark for deletion.";
                deleteBtns.forEach(btn => btn.style.display = 'flex');
                this.elements.saveBtn.innerHTML = '<i data-lucide="save"></i><span>Save Changes</span>';
            } else if (newMode === 'split') {
                this.elements.modeInfo.textContent = "Click pages to select them for extraction.";
                deleteBtns.forEach(btn => btn.style.display = 'none');
                this.elements.saveBtn.innerHTML = '<i data-lucide="scissors"></i><span>Split PDF</span>';
                this.elements.saveBtn.disabled = true;
            } else if (newMode === 'rotate') {
                this.elements.modeInfo.textContent = "Select pages, choose an angle, and click 'Apply'.";
                deleteBtns.forEach(btn => btn.style.display = 'none');
                this.elements.modeControls.classList.add('visible');
                this.elements.modeControls.innerHTML = `
                    <select id="rotate-angle-select" class="btn-sm">
                        <option value="90">90° Clockwise</option>
                        <option value="180">180°</option>
                        <option value="270">270° Clockwise</option>
                    </select>
                    <button id="apply-rotation-btn" class="btn btn-sm btn-primary">Apply</button>`;
                document.getElementById('apply-rotation-btn').addEventListener('click', () => this.applyRotationPreview());
                this.elements.saveBtn.innerHTML = '<i data-lucide="save"></i><span>Save Rotated PDF</span>';
            }
            lucide.createIcons();
        },
        applyRotationPreview() {
            const angle = parseInt(document.getElementById('rotate-angle-select').value, 10);
            this.state.pages.forEach(p => {
                if (p.element.classList.contains('selected')) {
                    p.rotation = (p.rotation + angle) % 360;
                    p.element.style.transform = `rotate(${p.rotation}deg)`;
                }
            });
        },
        onPageClick(e) {
            const thumb = e.target.closest('.page-thumbnail');
            if (!thumb) return;
            const pageNum = parseInt(thumb.dataset.page, 10);
            const pageState = this.state.pages.find(p => p.originalIndex === pageNum);

            if (this.state.mode === 'organize') {
                if (e.target.closest('.delete-btn')) {
                    pageState.isDeleted = !pageState.isDeleted;
                    thumb.classList.toggle('marked-for-deletion', pageState.isDeleted);
                } else if (this.state.pageToMove === null) {
                    this.state.pageToMove = thumb;
                    thumb.classList.add('selected-for-move');
                    this.elements.modeInfo.textContent = "Now click the destination to move the page.";
                } else {
                    if (this.state.pageToMove !== thumb) {
                        this.elements.content.insertBefore(this.state.pageToMove, thumb);
                    }
                    this.state.pageToMove.classList.remove('selected-for-move');
                    this.state.pageToMove = null;
                    this.setMode('organize');
                }
            } else if (this.state.mode === 'split' || this.state.mode === 'rotate') {
                thumb.classList.toggle('selected');
                if (this.state.mode === 'split') {
                    const count = this.elements.content.querySelectorAll('.selected').length;
                    this.elements.saveBtn.disabled = count === 0;
                    this.elements.modeInfo.textContent = `${count} page(s) selected for extraction.`;
                }
            }
        },
        onPageDragStart(e) {
            if (this.state.mode !== 'organize' || !e.target.closest('.page-thumbnail')) return;
            this.state.draggedItem = e.target.closest('.page-thumbnail');
            setTimeout(() => { if (this.state.draggedItem) this.state.draggedItem.classList.add('ghost'); }, 0);
        },
        onPageDragEnd() {
            if (this.state.draggedItem) this.state.draggedItem.classList.remove('ghost');
            this.state.draggedItem = null;
        },
        onPageDragOver(e) {
            e.preventDefault();
            if (this.state.mode !== 'organize' || !this.state.draggedItem) return;
            const target = e.target.closest('.page-thumbnail');
            if (target && target !== this.state.draggedItem) {
                const rect = target.getBoundingClientRect();
                const next = (e.clientX - rect.left) / rect.width > 0.5;
                this.elements.content.insertBefore(this.state.draggedItem, next && target.nextSibling || target);
            }
        },
        async save() {
            let result;
            try {
                if (this.state.mode === 'organize') {
                    showLoading('Organizing PDF...');
                    const pageOrder = [...this.elements.content.querySelectorAll('.page-thumbnail')].map(t => t.dataset.page);
                    const pagesToDelete = this.state.pages.filter(p => p.isDeleted).map(p => p.originalIndex);
                    result = await window.electronAPI.organizePDF(this.state.currentFile, pageOrder, pagesToDelete);
                } else if (this.state.mode === 'split') {
                    showLoading('Splitting PDF...');
                    const pagesToSplit = [...this.elements.content.querySelectorAll('.selected')].map(t => t.dataset.page).join(',');
                    result = await window.electronAPI.splitPDF(this.state.currentFile, pagesToSplit);
                } else if (this.state.mode === 'rotate') {
                    showLoading('Rotating PDF...');
                    const rotations = {};
                    this.state.pages.forEach(p => { if (p.rotation !== 0) rotations[p.originalIndex] = p.rotation; });
                    if (Object.keys(rotations).length === 0) {
                        return handleResponse({ success: false, message: "No pages were rotated. Apply a rotation first." });
                    }
                    result = await window.electronAPI.rotatePDF(this.state.currentFile, JSON.stringify(rotations));
                }
                
                if (result && result.success) {
                    handleResponse(result);
                    this.reset();
                } else {
                    handleResponse(result); // Let handleResponse manage reset on failure
                }
            } catch (e) {
                handleResponse({ success: false, message: e.message });
            }
        },
    };
    
    // --- App Initialization ---
    setupNavigation();
    setGreeting();
    setupPasswordToggle();
    editWorkspace.init();
});