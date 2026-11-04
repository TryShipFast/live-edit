import { describe, expect, it } from 'vitest';
import {
    addField, addOption, copyOf, definitionOf, limitsSaid, moveField, removeOption, rename, restoreField, retireField,
    seedForm, setHelp, setRequired, setType, startBlank, typeLockedBecause, workflowOf,
} from '../../resources/js/forms.js';

/*
 * Forms the owner shapes (the website's LIVE-EDIT-STRUCTURE.md): a form is read from its markup the first
 * time, then added to, renamed, reordered and retired, with what visitors already sent kept readable.
 * The markup is the real templates' own (Car Wash Auto's booking, Adeola Crest School's admissions, a
 * stepped checkout), cut down to what the rules read.
 */

const page = (html) => {
    document.body.innerHTML = html;

    return document.body.firstElementChild;
};

const carWashBooking = () => page(`
<section data-instance="book.your-enquiry" data-component="form.booking-request" data-label="Your enquiry">
  <h2 data-edit="text">Book a wash</h2>
  <form id="booking" action="https://formspree.io/f/your-form-id" method="POST">
    <input type="hidden" name="_subject" value="Booking request">
    <div class="review-trap" aria-hidden="true"><input name="_gotcha"></div>
    <label data-edit="text" data-field="label">Your name<input autocomplete="name" name="name" required></label>
    <label data-edit="text" data-field="label-2">Email address<input name="email" required type="email"></label>
    <label data-edit="text">Service<select name="service" data-list="choices"><option value="exterior" data-edit="text" data-item="t1">Exterior hand wash</option><option value="complete" data-edit="text" data-item="t2">Inside &amp; out</option></select></label>
    <label data-edit="text">Preferred date<input id="date" name="date" required type="date"></label>
    <label class="full" data-edit="text">Anything we should know?<textarea name="message"></textarea></label>
    <div class="full"><button class="button" type="submit" data-edit="text">Send my request</button></div>
  </form>
</section>`);

const admissions = () => page(`
<section data-instance="admissions.apply" data-component="form.admissions-apply" data-label="Apply">
  <form class="js-form form-grid" action="https://formspree.io/f/your-form-id" method="POST">
    <label class="field"><span class="field__l" data-edit="text">Parent or guardian’s name <span class="req" aria-hidden="true">*</span></span><input type="text" name="parent_name" required data-err="pn-err"><span class="field__err" id="pn-err" hidden data-edit="text">Fill this in</span></label>
    <label class="field"><span class="field__l" data-edit="text">Email <span class="req">*</span></span><input type="email" name="email" required></label>
    <label class="field"><span class="field__l" data-edit="text">Child’s full name</span><input type="text" name="child_name" required></label>
    <label class="field"><span class="field__l" data-edit="text">Stage</span><select name="stage" data-list="choices" required><option value="" data-edit="text">Choose…</option><option data-edit="text" data-item="t1">Early Years</option><option data-edit="text" data-item="t2">Primary</option></select></label>
    <label class="field"><span class="field__l" data-edit="text">Bursary <span class="opt" data-edit="text">(optional)</span></span><select name="bursary"><option value="">Choose…</option><option>Not applying</option></select><span class="field__hint">Ask us for the form.</span></label>
    <button type="submit">Send the application</button>
  </form>
</section>`);

const checkout = () => page(`
<section data-instance="checkout.checkout" data-component="form.checkout" data-label="Checkout">
  <form class="co-step" data-step="details" action="https://formspree.io/f/your-form-id" method="POST" novalidate>
    <div class="co-grid">
      <label class="co-field" for="f-n"><span data-edit="text">Full name</span><input id="f-n" name="checkout_name" required data-kit-field-role="customer.name"><span class="co-err" hidden>Enter your full name.</span></label>
      <label class="co-field" for="f-e"><span data-edit="text">Email</span><input id="f-e" name="checkout_email" type="email" required data-kit-field-role="customer.email"></label>
      <label class="co-field" for="f-a"><span data-edit="text">Address</span><input id="f-a" name="checkout_addr" required data-kit-field-role="delivery.address"></label>
    </div>
    <button type="submit">Continue to delivery</button>
  </form>
  <form class="co-step" data-step="delivery" novalidate><label><input type="radio" name="checkout_ship" value="std" data-kit-field-role="delivery.method">Doorstep</label></form>
</section>`);

describe('a form, read from its markup the first time', () => {
    it('finds every field by name, with its words, kind, required and help, and leaves the machinery out', () => {
        const form = seedForm(carWashBooking());
        expect(form.purpose).toBe('booking-request');
        expect(form.workflow).toBe('booking');
        expect(form.fields.map((f) => [f.key, f.label, f.type, f.required])).toEqual([
            ['name', 'Your name', 'text', true],
            ['email', 'Email address', 'email', true],
            ['service', 'Service', 'choice', false],
            ['date', 'Preferred date', 'date', true],
            ['message', 'Anything we should know?', 'longtext', false],
        ]);
        // The subject line and the honeypot are the form's own machinery, never questions.
        expect(form.fields.map((f) => f.key)).not.toContain('_subject');
        expect(form.fields.map((f) => f.key)).not.toContain('_gotcha');
        // A dropdown whose choices are the page's words keeps them as the page's.
        expect(form.fields[2].choices).toBe('template');
        expect(form.fields[2].options.map((o) => o.label)).toEqual(['Exterior hand wash', 'Inside & out']);
    });

    it('reads a question without its required mark or optional note, and a help line under it', () => {
        const form = seedForm(admissions());
        expect(form.fields.map((f) => f.label)).toEqual(['Parent or guardian’s name', 'Email', 'Child’s full name', 'Stage', 'Bursary']);
        expect(form.fields.find((f) => f.key === 'bursary').help).toBe('Ask us for the form.');
        expect(form.fields.find((f) => f.key === 'bursary').required).toBe(false);
    });

    it('knows which fields a workflow needs: an application keeps who applies and for what', () => {
        const form = seedForm(admissions());
        const kept = Object.fromEntries(form.fields.map((f) => [f.key, f.protected]));
        expect(form.workflow).toBe('application');
        expect(kept.parent_name).toBe('Needed for applications');
        expect(kept.email).toBe('Needed for applications');
        expect(kept.stage).toBe('Needed for applications');
        expect(kept.child_name).toBeNull();
        expect(kept.bursary).toBeNull();
    });

    it('reads a stepped checkout as one form: the details step, its marked fields the checkout’s', () => {
        const form = seedForm(checkout());
        expect(form.workflow).toBe('checkout');
        expect(form.fields.map((f) => f.key)).toEqual(['checkout_name', 'checkout_email', 'checkout_addr']);
        expect(form.fields.every((f) => f.protected === 'Needed for the checkout')).toBe(true);
    });

    it('says what a purpose feeds', () => {
        expect(workflowOf('quote-request')).toBe('quote');
        expect(workflowOf('class-booking')).toBe('booking');
        expect(workflowOf('school-application')).toBe('application');
        expect(workflowOf('checkout')).toBe('checkout');
        expect(workflowOf('contact')).toBeNull();
    });

    it('reads nothing from a search or a form that sends nowhere', () => {
        expect(seedForm(page('<section data-component="form.part-search" data-instance="x.y"><form method="get" role="search"><input name="q"></form></section>'))).toBeNull();
    });
});

describe('shaping it', () => {
    const fresh = () => ({ ...seedForm(carWashBooking()), key: 'book/book.your-enquiry', saved: false });
    const seq = () => {
        let n = 0;

        return () => [0.11111, 0.22222, 0.33333, 0.44444][n++ % 4];
    };

    it('adds a phone field that must be filled in, and a dropdown of the owner’s own choices', () => {
        const form = fresh();
        const phone = addField(form, 'phone', seq());
        expect(phone).toMatch(/^f[a-z0-9]{3,}$/);
        expect(setRequired(form, phone, true)).toBeNull();
        expect(rename(form, phone, 'Mobile number')).toBeNull();
        const choice = addField(form, 'choice', seq());
        expect(addOption(form, choice, 'A friend')).toBeNull();
        expect(addOption(form, choice, 'A friend')).toBe('That choice is there already.');
        const saved = definitionOf(form);
        const added = saved.fields.find((f) => f.key === phone);
        expect(added).toEqual({ key: phone, label: 'Mobile number', type: 'phone', required: true, help: '', retired: false, options: [] });
        expect(saved.fields.find((f) => f.key === choice).options.map((o) => o.label)).toEqual(['First choice', 'Second choice', 'A friend']);
        // Only the definition is saved: never the reasons and counts the host works out.
        expect(Object.keys(added)).not.toContain('protected');
    });

    it('renames and reorders, and a question needs words', () => {
        const form = fresh();
        expect(rename(form, 'message', '  Anything   else?  ')).toBeNull();
        expect(rename(form, 'message', '')).toBe('A question needs some words.');
        expect(rename(form, 'message', '<b>x</b>')).toMatch(/cannot have < or >/);
        expect(moveField(form, 'message', -1)).toBe(true);
        expect(form.fields.map((f) => f.key)).toEqual(['name', 'email', 'service', 'message', 'date']);
        expect(moveField(form, 'name', -1)).toBe(false);
        expect(setHelp(form, 'message', 'Vehicle model, or a question.')).toBeNull();
        expect(form.fields[3].label).toBe('Anything else?');
    });

    it('never lets a booking lose the date or the contact it needs, and says so', () => {
        const form = fresh();
        expect(retireField(form, 'date')).toBe('Needed for bookings. You can rename it or move it.');
        expect(setType(form, 'email', 'text')).toBe('Needed for bookings, so it stays the kind of field it is.');
        expect(setRequired(form, 'name', false)).toMatch(/Needed for bookings, so whether it must be filled in stays as it is/);
        startBlank(form);
        expect(form.fields.filter((f) => !f.retired).map((f) => f.key)).toEqual(['name', 'email', 'date']);
    });

    it('locks a field’s kind once it has answers, retires instead of erasing, and keeps a picked choice', () => {
        const form = fresh();
        form.submissions = 3;
        form.saved = true;
        const message = form.fields.find((f) => f.key === 'message');
        message.answers = 3;
        message.answeredAs = 'longtext';
        expect(typeLockedBecause(message)).toBe('It already has 3 answers, so it stays a long answer field. To ask in another way, take it off the form and add a new field.');
        expect(setType(form, 'message', 'text')).toMatch(/already has 3 answers/);
        expect(retireField(form, 'message')).toBeNull();
        expect(form.fields.find((f) => f.key === 'message').retired).toBe(true);
        expect(definitionOf(form).fields.map((f) => f.key)).toContain('message');
        restoreField(form, 'message');
        expect(form.fields.find((f) => f.key === 'message').retired).toBe(false);

        const choice = addField(form, 'radios', seq());
        expect(removeOption(form, choice, 'First choice')).toBeNull();
        expect(form.fields.find((f) => f.key === choice).options.find((o) => o.value === 'First choice').retired).toBe(true);
        expect(removeOption(form, choice, 'Second choice')).toBe('A field of choices keeps at least one choice.');
    });

    it('lets a question nobody answered change its kind, and a new one go away for good', () => {
        const form = fresh();
        expect(setType(form, 'message', 'text')).toBeNull();
        const extra = addField(form, 'text', seq());
        expect(retireField(form, extra)).toBeNull();
        expect(form.fields.map((f) => f.key)).not.toContain(extra);
    });

    it('keeps the page’s own choices the page’s', () => {
        const form = fresh();
        expect(addOption(form, 'service', 'Valet')).toMatch(/words on your page/);
        expect(setType(form, 'service', 'radios')).toMatch(/Its choices are words on your page/);
    });

    it('tells the owner the limits in plain words once the form has answers', () => {
        const form = copyOf(fresh());
        form.submissions = 2;
        const said = limitsSaid(form);
        expect(said[0]).toMatch(/This form has 2 answers so far/);
        expect(said[0]).toMatch(/Making a question required applies to new answers only/);
        expect(said[1]).toMatch(/This is a booking form/);
        expect(said.join(' ')).not.toMatch(/—/);
    });
});
