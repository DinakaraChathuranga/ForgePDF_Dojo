document.addEventListener('DOMContentLoaded', () => {
    // Utility functions
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3500,
        timerProgressBar: true
    });
    function showLoading(title) {
        Swal.fire({
            title,
            html: 'Processing your file, please wait...',
            timerProgressBar: true,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });
    }
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

    // Greeting
    const greetingEl = document.getElementById('greeting');
    if (greetingEl) {
        const hour = new Date().getHours();
        greetingEl.textContent = `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}! 👋`;
    }

    // Password toggle
    const togglePasswordBtn = document.getElementById('toggle-password-btn');
    const passwordInput = document.getElementById('password-input');
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            togglePasswordBtn.innerHTML = `<i data-lucide="${type === 'password' ? 'eye' : 'eye-off'}"></i>`;
            lucide.createIcons();
        });
    }

    // File handlers
    const setupHandler = (id, multiple = false, accepted = '.pdf') => {
        const drop = document.getElementById(`${id}-drop-area`);
        const input = document.getElementById(`${id}-file-input`);
        const list = document.getElementById(`${id}-file-list`);
        const clear = document.getElementById(`clear-${id}-btn`);
        const button = document.getElementById(`${id}-btn`);
        let files = [];

        const updateList = () => {
            list.innerHTML = '';
            files.forEach(f => {
                const li = document.createElement('li');
                li.textContent = f.name;
                list.appendChild(li);
            });
            button.disabled = files.length === 0 || (!multiple && files.length > 1);
            if (id === 'protect') {
                passwordInput.disabled = files.length === 0;
                togglePasswordBtn.disabled = files.length === 0;
            }
        };

        const processFiles = (selected) => {
            const acceptedTypes = accepted.split(',').map(a => a.trim());
            files = Array.from(selected).filter(f =>
                acceptedTypes.some(type => f.name.toLowerCase().endsWith(type.trim().toLowerCase()))
            );
            updateList();
        };

        if (drop) {
            drop.addEventListener('click', () => input.click());
            drop.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); });
            drop.addEventListener('drop', e => {
                e.preventDefault();
                processFiles(e.dataTransfer.files);
            });
        }
        if (input) input.addEventListener('change', () => processFiles(input.files));
        if (clear) clear.addEventListener('click', () => { files = []; updateList(); });

        return { getFiles: () => files, clearAll: () => { files = []; updateList(); } };
    };

    const mergeHandler = setupHandler('merge', true);
    const compressHandler = setupHandler('compress');
    const protectHandler = setupHandler('protect');
    const imageToPdfHandler = setupHandler('image-to-pdf', true, '.jpg,.jpeg,.png');
    const pdfToImageHandler = setupHandler('pdf-to-image');

    // Button listeners
    document.getElementById('merge-btn').addEventListener('click', async () => {
        const paths = mergeHandler.getFiles().map(f => f.path);
        if (paths.length < 2) return handleResponse({ success: false, message: 'Select at least 2 PDFs.' });
        showLoading('Merging...');
        const res = await window.electronAPI.mergePDFs(paths);
        if (handleResponse(res)) mergeHandler.clearAll();
    });

    document.getElementById('compress-btn').addEventListener('click', async () => {
        const file = compressHandler.getFiles()[0];
        if (!file) return handleResponse({ success: false, message: 'Select a PDF to compress.' });
        showLoading('Compressing...');
        const res = await window.electronAPI.compressPDF(file.path);
        if (handleResponse(res)) compressHandler.clearAll();
    });

    document.getElementById('protect-btn').addEventListener('click', async () => {
        const file = protectHandler.getFiles()[0];
        const pw = passwordInput.value;
        if (!file || !pw) return handleResponse({ success: false, message: 'File and password required.' });
        showLoading('Protecting...');
        const res = await window.electronAPI.protectPDF(file.path, pw);
        if (handleResponse(res)) {
            protectHandler.clearAll();
            passwordInput.value = '';
        }
    });

    document.getElementById('image-to-pdf-btn').addEventListener('click', async () => {
        const files = imageToPdfHandler.getFiles();
        if (!files || files.length === 0)
            return handleResponse({ success: false, message: 'Please select at least one image.' });

        const paths = files.map(f => f.path);
        showLoading('Converting Images...');
        const res = await window.electronAPI.imageToPdf(paths);
        if (handleResponse(res)) imageToPdfHandler.clearAll();
    });

    document.getElementById('pdf-to-image-btn').addEventListener('click', async () => {
        const file = pdfToImageHandler.getFiles()[0];
        if (!file) return handleResponse({ success: false, message: 'Select a PDF to convert.' });
        showLoading('Converting PDF...');
        const res = await window.electronAPI.pdfToImage(file.path);
        if (handleResponse(res)) pdfToImageHandler.clearAll();
    });

    // Navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            const target = item.dataset.target;
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.querySelector(`#${target}`).classList.add('active');
            document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Initial icon rendering
    lucide.createIcons();
});
