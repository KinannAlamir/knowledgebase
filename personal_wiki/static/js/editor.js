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
  display:none; position:fixed; z-index:1000;
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
    b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); onClick(); });
    return b;
}

function makeSep() {
    const s = document.createElement('span');
    s.style.cssText = 'width:1px;height:18px;background:rgba(255,255,255,0.2);margin:0 2px;';
    return s;
}

let activeImg = null;

function showImgToolbar(img, x, y) {
    activeImg = img;
    imgToolbar.innerHTML = '';
    imgToolbar.style.display = 'flex';

    // Size buttons
    const sizes = [['XS', '20%'], ['S', '35%'], ['M', '55%'], ['L', '75%'], ['Full', '100%']];
    sizes.forEach(([label, w]) => {
        imgToolbar.appendChild(makeToolbarBtn(label, () => {
            img.style.width = w;
            img.style.maxWidth = w;
            img.removeAttribute('width');
        }));
    });

    imgToolbar.appendChild(makeSep());

    // Alignment / float buttons
    imgToolbar.appendChild(makeToolbarBtn('⬅ Left', () => {
        img.style.float = 'left';
        img.style.margin = '0.25rem 1rem 0.5rem 0';
        img.style.display = '';
    }));
    imgToolbar.appendChild(makeToolbarBtn('▣ Center', () => {
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
        hideImgToolbar();
    }));

    // Position near the image
    const rect = img.getBoundingClientRect();
    const tbW = 480;
    let left = rect.left;
    if (left + tbW > window.innerWidth) left = window.innerWidth - tbW - 8;
    imgToolbar.style.left = left + 'px';
    imgToolbar.style.top = (rect.bottom + 6) + 'px';
}

function hideImgToolbar() {
    imgToolbar.style.display = 'none';
    activeImg = null;
}

if (editor) {
    editor.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
            showImgToolbar(e.target, e.clientX, e.clientY);
        } else {
            hideImgToolbar();
        }
    });
}

document.addEventListener('click', (e) => {
    if (imgToolbar.style.display !== 'none' && !imgToolbar.contains(e.target) && e.target !== activeImg) {
        hideImgToolbar();
    }
});

document.addEventListener('scroll', () => {
    if (activeImg) showImgToolbar(activeImg);
}, true);

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
