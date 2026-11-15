// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { libraryForTheChat } from '../../resources/js/chat-page.js';

/*
 * The coverage walk said "Add a video or a map: Ask AI is not told what it needs for this" on Quillstack Academy and The
 * Blogger with the add window offering both: the page data kept the first 80 sections of the add window, and the video
 * and the map come after a design's own sections and its charts and tables. They are always among what Ask AI is told.
 */
describe('the add window\'s sections, as Ask AI is told them', () => {
    const many = Array.from({ length: 95 }, (_, i) => ({ label: `Section ${i + 1}` }));

    it('keeps the video and the map when a design has more sections than are sent', () => {
        const told = libraryForTheChat([...many, { label: 'Video', kind: 'video' }, { label: 'Map', kind: 'map' }]);

        expect(told).toHaveLength(80);
        expect(told.slice(-2).map((s) => s.kind)).toEqual(['video', 'map']);
        expect(told[0].label).toBe('Section 1');
    });

    it('sends a short library as it is', () => {
        const short = [{ label: 'Hero' }, { label: 'Video', kind: 'video' }];

        expect(libraryForTheChat(short)).toEqual(short);
    });
});
