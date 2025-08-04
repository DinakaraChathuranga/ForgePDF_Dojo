document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation & Notifications (Keep this part as it is) ---
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

    const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3500, timerProgressBar: true });
    function showLoading(title) { Swal.fire({ title, html: 'Processing your file, please wait...', timerProgressBar: true, allowOutsideClick: false, didOpen: () => Swal.showLoading() }); }
    function handleResponse(result) {
        Swal.close();
        if (result.success) {
            Toast.fire({ icon: 'success', title: 'Success!', text: result.message });
            return true;
        } else {
            Swal.fire({ icon: 'error', title: 'An Error Occurred', text: result.message, confirmButtonColor: 'var(--primary)' });
            return false;
        }
    }

    // --- (Keep your setup for Merge, Compress, Protect here) ---

    // --- NEW UNIFIED EDIT WORKSPACE ---
    const editState = {
        currentFile: null,
        mode: 'organize',
        pages: [], // { element, originalIndex, isDeleted, rotation }
        pageToMove: null, // For click-to-move
    };

    const editDropArea = document.getElementById('edit-drop-area');
    const editFileInput = document.getElementById('edit-file-input');
    const editorContainer = document.getElementById('editor-container');
    const editorContent = document.getElementById('edit-main-content');
    const editFilename = document.getElementById('edit-filename');
    const editModeControls = document.getElementById('editor-mode-controls');
    const editToolbar = document.getElementById('editor-toolbar');
    const editSaveBtn = document.getElementById('edit-save-btn');
    const editClearBtn = document.getElementById('edit-clear-btn');

    function resetEditWorkspace() {
        editState.currentFile = null;
        editState.pages = [];
        editState.pageToMove = null;
        editorContent.innerHTML = '';
        editorContainer.style.display = 'none';
        editDropArea.style.display = 'flex';
        editSaveBtn.disabled = true;
    }

    editDropArea.addEventListener('click', () => editFileInput.click());
    editFileInput.addEventListener('change', (e) => handleEditFile(e.target.files));
    editDropArea.addEventListener('dragover', (e) => e.preventDefault());
    editDropArea.addEventListener('drop', (e) => { e.preventDefault(); handleEditFile(e.dataTransfer.files); });
    editClearBtn.addEventListener('click', resetEditWorkspace);

    async function handleEditFile(files) {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (file.type !== 'application/pdf') {
            handleResponse({ success: false, message: "Please select a PDF file." });
            return;
        }

        resetEditWorkspace();
        editState.currentFile = file.path;
        editFilename.textContent = file.name;

        editDropArea.style.display = 'none';
        editorContainer.style.display = 'flex';
        editorContent.innerHTML = '';
        editorContent.classList.add('loading');

        const result = await window.electronAPI.getPdfPreview(editState.currentFile, -1);
        editorContent.classList.remove('loading');

        if (result.success) {
            result.filePaths.forEach((path, i) => {
                const thumb = createPageThumbnail(path, i + 1);
                editorContent.appendChild(thumb);
                editState.pages.push({ element: thumb, originalIndex: i + 1, isDeleted: false, rotation: 0 });
            });
            setEditMode('organize');
        } else {
            handleResponse(result);
            resetEditWorkspace();
        }
    }

    function createPageThumbnail(imagePath, pageNum) {
        const thumb = document.createElement('div');
        thumb.className = 'page-thumbnail';
        thumb.dataset.page = pageNum;
        thumb.innerHTML = `
            <img src="${imagePath.replace(/\\/g, '/')}?t=${Date.now()}" alt="Page ${pageNum}" draggable="false">
            <span class="page-number">${pageNum}</span>
            <button class="delete-btn" style="display: none;"><i data-lucide="x"></i></button>
        `;
        setTimeout(() => lucid.createIcons({ nodes: [thumb.querySelector('.delete-btn')] }), 0);
        return thumb;
    }

    editToolbar.addEventListener('click', (e) => {
        const toolBtn = e.target.closest('.tool-btn');
        if (toolBtn) setEditMode(toolBtn.dataset.mode);
    });

    function setEditMode(newMode) {
        editState.mode = newMode;
        editorContainer.dataset.mode = newMode;
        editToolbar.querySelectorAll('.tool-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === newMode));
        
        // Reset states
        editState.pages.forEach(p => p.element.classList.remove('selected', 'selected-for-move', 'marked-for-deletion'));
        editState.pageToMove = null;

        // Configure UI for the new mode
        editModeControls.innerHTML = '';
        editModeControls.classList.remove('visible');
        const deleteBtns = editorContent.querySelectorAll('.delete-btn');
        editSaveBtn.textContent = 'Save Changes';
        editSaveBtn.disabled = false;

        if (newMode === 'organize') {
            deleteBtns.forEach(btn => btn.style.display = 'flex');
        } else if (newMode === 'split') {
            deleteBtns.forEach(btn => btn.style.display = 'none');
            editSaveBtn.textContent = 'Split PDF';
            editSaveBtn.disabled = true;
        } else if (newMode === 'rotate') {
            deleteBtns.forEach(btn => btn.style.display = 'none');
            editModeControls.classList.add('visible');
            editModeControls.innerHTML = `
                <select id="rotate-angle-select" class="btn-sm">
                    <option value="90">90° Clockwise</option>
                    <option value="180">180°</option>
                    <option value="270">270° Clockwise</option>
                </select>
                <button id="apply-rotation-btn" class="btn btn-sm btn-primary">Apply to Selected</button>
            `;
            document.getElementById('apply-rotation-btn').addEventListener('click', applyRotationPreview);
            editSaveBtn.textContent = 'Save Rotated PDF';
        }
    }

    function applyRotationPreview() {
        const angle = parseInt(document.getElementById('rotate-angle-select').value, 10);
        editState.pages.forEach(p => {
            if (p.element.classList.contains('selected')) {
                p.rotation = (p.rotation + angle) % 360;
                p.element.querySelector('img').style.transform = `rotate(${p.rotation}deg)`;
            }
        });
    }

    // --- Main Event Handler for Page Clicks ---
    editorContent.addEventListener('click', (e) => {
        const thumb = e.target.closest('.page-thumbnail');
        if (!thumb) return;
        const pageNum = parseInt(thumb.dataset.page, 10);
        const pageState = editState.pages.find(p => p.originalIndex === pageNum);

        if (editState.mode === 'organize') {
            if (e.target.closest('.delete-btn')) {
                pageState.isDeleted = !pageState.isDeleted;
                thumb.classList.toggle('marked-for-deletion', pageState.isDeleted);
            } else if (editState.pageToMove === null) {
                editState.pageToMove = thumb;
                thumb.classList.add('selected-for-move');
            } else {
                if (editState.pageToMove !== thumb) {
                    // Move the page
                    editorContent.insertBefore(editState.pageToMove, thumb);
                }
                editState.pageToMove.classList.remove('selected-for-move');
                editState.pageToMove = null;
            }
        } else if (editState.mode === 'split' || editState.mode === 'rotate') {
            thumb.classList.toggle('selected');
            if(editState.mode === 'split') {
                editSaveBtn.disabled = editorContent.querySelectorAll('.selected').length === 0;
            }
        }
    });

    // --- Drag and Drop for Organize Mode ---
    let draggedItem = null;
    editorContent.addEventListener('dragstart', (e) => {
        if (editState.mode !== 'organize') return;
        draggedItem = e.target.closest('.page-thumbnail');
        setTimeout(() => { if (draggedItem) draggedItem.classList.add('ghost'); }, 0);
    });
    editorContent.addEventListener('dragend', () => { if (draggedItem) draggedItem.classList.remove('ghost'); draggedItem = null; });
    editorContent.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (editState.mode !== 'organize' || !draggedItem) return;
        const target = e.target.closest('.page-thumbnail');
        if (target && target !== draggedItem) {
            const rect = target.getBoundingClientRect();
            const next = (e.clientX - rect.left) / rect.width > 0.5;
            editorContent.insertBefore(draggedItem, next && target.nextSibling || target);
        }
    });

    // --- Save Button Logic ---
    editSaveBtn.addEventListener('click', async () => {
        let result;
        showLoading('Processing PDF...');
        
        if (editState.mode === 'organize') {
            const pageOrder = [...editorContent.querySelectorAll('.page-thumbnail')].map(t => t.dataset.page);
            const pagesToDelete = editState.pages.filter(p => p.isDeleted).map(p => p.originalIndex);
            result = await window.electronAPI.organizePDF(editState.currentFile, pageOrder, pagesToDelete);
        } 
        else if (editState.mode === 'split') {
            const pagesToSplit = [...editorContent.querySelectorAll('.selected')].map(t => t.dataset.page).join(',');
            result = await window.electronAPI.splitPDF(editState.currentFile, pagesToSplit);
        }
        else if (editState.mode === 'rotate') {
            const rotations = {};
            editState.pages.forEach(p => {
                if(p.rotation !== 0) {
                    rotations[p.originalIndex] = p.rotation;
                }
            });
            if (Object.keys(rotations).length === 0) {
                 handleResponse({success: false, message: "No pages were rotated. Apply a rotation to selected pages first."});
                 return;
            }
            result = await window.electronAPI.rotatePDF(editState.currentFile, JSON.stringify(rotations));
        }

        if (result && handleResponse(result)) {
            resetEditWorkspace();
        } else if (result) {
            Swal.close();
        }
    });
});