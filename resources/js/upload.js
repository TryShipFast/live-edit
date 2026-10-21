/** A styled image picker shared by image and brand uploads. */
export const uploadWidget = ({ hint = 'PNG, JPG or WEBP, or drag one here', onFile, compact = false } = {}) => {
    const wrap = document.createElement('label');
    wrap.className = `le-upload${compact ? ' le-upload-compact' : ''}`;

    const inner = document.createElement('div');
    inner.className = 'le-upload-inner';
    const icon = document.createElement('span');
    icon.className = 'le-upload-icon';
    icon.textContent = '\u2191';
    const text = document.createElement('span');
    text.className = 'le-upload-text';
    const title = document.createElement('span');
    title.className = 'le-upload-title';
    title.textContent = 'Upload from your computer';
    const hintEl = document.createElement('span');
    hintEl.className = 'le-upload-hint';
    hintEl.textContent = hint;
    text.append(title, hintEl);
    const button = document.createElement('span');
    button.className = 'le-upload-btn';
    button.textContent = 'Choose file';
    inner.append(icon, text, button);

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    const accept = (file) => {
        if (!file) return;
        hintEl.textContent = file.name;
        if (compact) button.textContent = file.name;
        onFile?.(file);
    };
    input.addEventListener('change', () => accept(input.files[0]));

    ['dragenter', 'dragover'].forEach((type) =>
        wrap.addEventListener(type, (event) => {
            event.preventDefault();
            wrap.classList.add('is-dragover');
        })
    );
    ['dragleave', 'drop'].forEach((type) =>
        wrap.addEventListener(type, (event) => {
            event.preventDefault();
            wrap.classList.remove('is-dragover');
        })
    );
    wrap.addEventListener('drop', (event) => {
        const file = event.dataTransfer?.files?.[0];
        if (!file) return;
        const transfer = new DataTransfer();
        transfer.items.add(file);
        input.files = transfer.files;
        accept(file);
    });

    wrap.append(inner, input);
    return wrap;
};
