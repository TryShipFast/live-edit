<?php

namespace ShipFast\LiveEdit\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use ShipFast\LiveEdit\Domain\Site\Editor;
use ShipFast\LiveEdit\Domain\Site\Site;

/**
 * The link that lets somebody edit their own site.
 *
 * Plain text, on purpose. This is a credential in an inbox: it should look
 * like what it is, be short enough to read in a preview pane, and not depend
 * on images loading to make sense.
 */
class SignInLink extends Mailable
{
    public function __construct(
        public readonly Editor $editor,
        public readonly Site $site,
        public readonly string $link,
        public readonly int $minutes,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Edit '.$this->site->name);
    }

    public function content(): Content
    {
        return new Content(text: 'live-edit::mail.sign-in');
    }
}
