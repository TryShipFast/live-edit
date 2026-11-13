import { describe, expect, it } from 'vitest';
import { changeForm } from '../../resources/js/forms.js';

/*
 * Ask AI changes a form's questions with the form builder's own functions and rules, all or nothing (owner, 13 Nov
 * 2026: chat does what a click does; the coverage walk on The Speaker: 105 form parts could not be changed by chat).
 */
const booking = () => ({
    key: 'booking', settingKey: 'form:booking', saved: true, workflow: 'enquiry',
    fields: [
        { key: 'name', label: 'Your name', type: 'text', required: true, help: '', retired: false, options: [], seeded: true, protected: 'We need it to reply', answers: 3 },
        { key: 'phone', label: 'Phone', type: 'phone', required: true, help: '', retired: false, options: [], seeded: true, protected: null, answers: 3 },
        { key: 'kind', label: 'Kind of event', type: 'choice', required: false, help: '', retired: false, choices: 'own', seeded: true, protected: null, answers: 0,
            options: [{ value: 'Conference', label: 'Conference', retired: false }, { value: 'Offsite', label: 'Offsite', retired: false }] },
    ],
});

describe('a form changed in words', () => {
    it('makes each change the builder makes', () => {
        const { form } = changeForm(booking(), [
            { do: 'rename', question: 'phone', label: 'Phone or WhatsApp' },
            { do: 'required', question: 'phone', required: false },
            { do: 'add_choice', question: 'kind', choice: 'Virtual' },
            { do: 'rename_choice', question: 'kind', choice: 'Offsite', to: 'Leadership offsite' },
            { do: 'add', type: 'text', label: 'Your company', required: true },
            { do: 'move', question: 'phone', by: 1 },
        ]);

        expect(form.fields.find((f) => f.key === 'phone')).toMatchObject({ label: 'Phone or WhatsApp', required: false });
        expect(form.fields.find((f) => f.key === 'kind').options.map((o) => o.label)).toEqual(['Conference', 'Leadership offsite', 'Virtual']);
        expect(form.fields.find((f) => f.label === 'Your company')).toMatchObject({ type: 'text', required: true });
        expect(form.fields.filter((f) => !f.retired).map((f) => f.key).indexOf('phone')).toBe(2);
    });

    it('refuses, as the builder does, and saves nothing', () => {
        // a question the booking needs stays
        expect(changeForm(booking(), [{ do: 'rename', question: 'phone', label: 'Mobile' }, { do: 'remove', question: 'name' }])).toEqual({ refused: 'We need it to reply. You can rename it or move it.' });
        expect(changeForm(booking(), [{ do: 'remove_choice', question: 'kind', choice: 'Nowhere' }])).toEqual({ refused: 'That choice is not there.' });
        expect(changeForm(booking(), [{ do: 'type', question: 'phone', type: 'teleport' }])).toEqual({ refused: 'That kind of answer is not offered.' });
    });

    it('takes a question off and puts it back', () => {
        const off = changeForm(booking(), [{ do: 'remove', question: 'phone' }]).form;
        expect(off.fields.find((f) => f.key === 'phone').retired).toBe(true);
        expect(changeForm(off, [{ do: 'restore', question: 'phone' }]).form.fields.find((f) => f.key === 'phone').retired).toBe(false);
    });
});
