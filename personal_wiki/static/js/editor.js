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

// ===== Image click toolbar =====
const imgToolbar = document.createElement('div');
imgToolbar.id = 'img-toolbar';
imgToolbar.style.cssText = `
  display:none; position:fixed; z-index:9999;
  background:#1c1917; border:2px solid #f5f5f4; border-radius:6px;
  padding:4px 6px; gap:4px; align-items:center; flex-wrap:wrap;
  box-shadow:3px 3px 0 #f5f5f4; font-family:'Patrick Hand',cursive; font-size:0.85rem;
`;
document.body.appendChild(imgToolbar);

function makeToolbarBtn(label, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.style.cssText = 'background:transparent;border:1px solid rgba(255,255,255,0.2);color:#fafaf9;padding:2px 8px;border-radius:4px;cursor:pointer;white-space:nowrap;';
    b.onmouseenter = () => b.style.background = 'rgba(255,255,255,0.1)';
    b.onmouseleave = () => b.style.background = 'transparent';
    b.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); onClick(); });
    return b;
}

function makeSep() {
    const s = document.createElement('span');
    s.style.cssText = 'width:1px;height:18px;background:rgba(255,255,255,0.2);margin:0 2px;';
    return s;
}

let activeImg = null;
let hideTimer = null;

function showImgToolbar(img) {
    clearTimeout(hideTimer);
    activeImg = img;
    imgToolbar.innerHTML = '';
    imgToolbar.style.display = 'flex';

    // Size buttons
    [['XS','20%'],['S','35%'],['M','55%'],['L','75%'],['Full','100%']].forEach(([label, w]) => {
        imgToolbar.appendChild(makeToolbarBtn(label, () => {
            img.style.width = w;
            img.style.maxWidth = w;
            img.removeAttribute('width');
        }));
    });

    imgToolbar.appendChild(makeSep());

    imgToolbar.appendChild(makeToolbarBtn('⬅ Left', () => {
        img.style.float = 'left';
        img.style.margin = '0.25rem 1rem 0.5rem 0';
        img.style.display = '';
    }));
    imgToolbar.appendChild(makeToolbarBtn('▣ Center', () => {
        img.style.cssFloat = 'none';
        img.style.float = 'none';
        img.style.display = 'block';
        img.style.margin = '0.75rem auto';
    }));
    imgToolbar.appendChild(makeToolbarBtn('➡ Right', () => {
        img.style.float = 'right';
        img.style.margin = '0.25rem 0 0.5rem 1rem';
        img.style.display = '';
    }));

    imgToolbar.appendChild(makeSep());
    imgToolbar.appendChild(makeToolbarBtn('🗑 Remove', () => {
        img.remove();
        imgToolbar.style.display = 'none';
        activeImg = null;
    }));

    // Position below the image, clamped to viewport
    const rect = img.getBoundingClientRect();
    const tbW = 500;
    let left = Math.max(8, Math.min(rect.left, window.innerWidth - tbW - 8));
    let top = rect.bottom + 6;
    // If toolbar would go below viewport, show above the image instead
    if (top + 50 > window.innerHeight) top = rect.top - 50;
    imgToolbar.style.left = left + 'px';
    imgToolbar.style.top = top + 'px';
}

function scheduleHide() {
    hideTimer = setTimeout(() => {
        imgToolbar.style.display = 'none';
        activeImg = null;
    }, 200);
}

// Show toolbar on hover over image in editor
if (editor) {
    editor.addEventListener('mouseover', (e) => {
        if (e.target.tagName === 'IMG') {
            showImgToolbar(e.target);
        }
    });
    editor.addEventListener('mouseout', (e) => {
        if (e.target.tagName === 'IMG') scheduleHide();
    });
}

// Keep toolbar visible while hovering over it
imgToolbar.addEventListener('mouseover', () => clearTimeout(hideTimer));
imgToolbar.addEventListener('mouseout', scheduleHide);

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
