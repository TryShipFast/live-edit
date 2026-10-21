import { afterEach, describe, expect, it, vi } from 'vitest';
import { uploadWidget } from '../../resources/js/upload.js';

describe('the shared image upload control', () => {
    afterEach(() => document.body.replaceChildren());

    it('uses the styled picker and reports the selected file', () => {
        const onFile = vi.fn();
        const picker = uploadWidget({ onFile });
        document.body.append(picker);

        expect(picker.classList.contains('le-upload')).toBe(true);
        expect(picker.querySelector('.le-upload-btn').textContent).toBe('Choose file');
        const input = picker.querySelector('input[type="file"]');
        expect(input.accept).toBe('image/*');

        const file = new File(['logo'], 'brand-logo.png', { type: 'image/png' });
        Object.defineProperty(input, 'files', { configurable: true, value: [file] });
        input.dispatchEvent(new Event('change'));

        expect(onFile).toHaveBeenCalledWith(file);
        expect(picker.querySelector('.le-upload-hint').textContent).toBe('brand-logo.png');
    });
});
