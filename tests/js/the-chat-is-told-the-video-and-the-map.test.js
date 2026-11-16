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

    it('keeps every built-in section, first, when a design has more sections than are sent (NewBanger: 116)', () => {
        const many = Array.from({ length: 116 }, (_, i) => ({ label: `Section ${i + 1}` }));
        const told = libraryForTheChat([...many, { label: 'Bar chart', kind: 'chart' }, { label: 'Video', kind: 'video' }, { label: 'Map', kind: 'map' }]);

        expect(told).toHaveLength(119);
        expect(told.slice(0, 3).map((s) => s.kind)).toEqual(['chart', 'video', 'map']);
        expect(told[3].label).toBe('Section 1');
        expect(told.at(-1).label).toBe('Section 116');
    });

    it('stops adding the design\'s own sections at the characters it may send', () => {
        const long = Array.from({ length: 50 }, (_, i) => ({ label: 'x'.repeat(200) + i }));
        const told = libraryForTheChat([...long, { label: 'Video', kind: 'video' }]);

        expect(told[0].kind).toBe('video');
        expect(told.reduce((n, s) => n + s.label.length, 0)).toBeLessThanOrEqual(8000);
    });

    it('sends at most 120, built-in ones first', () => {
        const told = libraryForTheChat([...Array.from({ length: 130 }, (_, i) => ({ label: `S${i + 1}` })), { label: 'Map', kind: 'map' }]);

        expect(told).toHaveLength(120);
        expect(told[0].kind).toBe('map');
        expect(told.at(-1).label).toBe('S119');
    });

    it('sends a short library whole, built-in ones first', () => {
        const short = [{ label: 'Hero' }, { label: 'Video', kind: 'video' }];

        expect(libraryForTheChat(short)).toEqual([short[1], short[0]]);
    });
});
