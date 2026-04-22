// ===== Rich Text Editor =====

const editor = document.getElementById('editor');
const hiddenContent = document.getElementById('content');
const form = document.getElementById('article-form');

// Sync editor content to hidden textarea before submit
if (form) {
    form.addEventListener('submit', function () {
        hiddenContent.value = editor.innerHTML;
    });
}

// Execute a document command
function execCmd(command, value) {
    if (command === 'formatBlock') {
        document.execCommand('formatBlock', false, '<' + value + '>');
    } else {
        document.execCommand(command, false, value || null);
    }
    editor.focus();
}

// Insert a link
function insertLink() {
    const url = prompt('Enter URL:', 'https://');
    if (url) {
        document.execCommand('createLink', false, url);
    }
    editor.focus();
}

// Insert a code block
function insertCodeBlock() {
    const code = prompt('Paste your code:');
    if (code) {
        const pre = document.createElement('pre');
        pre.textContent = code;
        const selection = window.getSelection();
        if (selection.rangeCount) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(pre);
            // Move cursor after the pre block
            range.setStartAfter(pre);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
    editor.focus();
}

// Trigger the hidden file input for image upload
function triggerImageUpload() {
    document.getElementById('image-upload').click();
}

// Upload image to server and insert into editor
async function uploadImage(input) {
    const file = input.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const resp = await fetch('/api/uploads/image', {
            method: 'POST',
            body: formData,
        });
        const data = await resp.json();

        if (data.url) {
            const img = document.createElement('img');
            img.src = data.url;
            img.alt = file.name;
            img.style.width = '40%';
            img.style.maxWidth = '40%';

            const selection = window.getSelection();
            if (selection.rangeCount) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(img);
                range.setStartAfter(img);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                editor.appendChild(img);
            }
        } else {
            alert('Upload failed: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        alert('Upload failed: ' + err.message);
    }

    // Reset input so the same file can be uploaded again
    input.value = '';
    editor.focus();
}

// ===== Image controls panel =====
let activeImg = null;
const imgControls = document.getElementById('img-controls');

function selectImg(img) {
    // Deselect previous
    if (activeImg && activeImg !== img) {
        activeImg.style.outline = '';
    }
    activeImg = img;
    img.style.outline = '3px solid var(--primary)';
    img.style.outlineOffset = '2px';
    if (imgControls) imgControls.style.display = 'flex';
}

function deselectImg() {
    if (activeImg) {
        activeImg.style.outline = '';
        activeImg = null;
    }
    if (imgControls) imgControls.style.display = 'none';
}

function imgSize(w) {
    if (!activeImg) return;
    activeImg.style.width = w;
    activeImg.style.maxWidth = w;
    activeImg.removeAttribute('width');
}

function imgAlign(dir) {
    if (!activeImg) return;
    if (dir === 'left') {
        activeImg.style.float = 'left';
        activeImg.style.margin = '0.25rem 1rem 0.5rem 0';
        activeImg.style.display = '';
    } else if (dir === 'right') {
        activeImg.style.float = 'right';
        activeImg.style.margin = '0.25rem 0 0.5rem 1rem';
        activeImg.style.display = '';
    } else {
        activeImg.style.float = 'none';
        activeImg.style.display = 'block';
        activeImg.style.margin = '0.75rem auto';
    }
}

function imgRemove() {
    if (!activeImg) return;
    activeImg.remove();
    deselectImg();
}

// Select image on click inside editor
if (editor) {
    editor.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG') {
            selectImg(e.target);
        } else {
            deselectImg();
        }
    });
}

// Deselect when clicking outside editor
document.addEventListener('click', (e) => {
    if (editor && !editor.contains(e.target) && imgControls && !imgControls.contains(e.target)) {
        deselectImg();
    }
});

// Handle paste of images directly into the editor
if (editor) {
    editor.addEventListener('paste', async function (e) {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                const formData = new FormData();
                formData.append('file', file);

                try {
                    const resp = await fetch('/api/uploads/image', {
                        method: 'POST',
                        body: formData,
                    });
                    const data = await resp.json();
                    if (data.url) {
                        document.execCommand(
                            'insertHTML',
                            false,
                            `<img src="${data.url}" alt="pasted image" style="max-width:100%">`
                        );
                    }
                } catch (err) {
                    console.error('Paste upload failed:', err);
                }
                break;
            }
        }
    });
}
