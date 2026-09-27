<?php

namespace ShipFast\LiveEdit\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use ShipFast\LiveEdit\Domain\Site\Editor;
use ShipFast\LiveEdit\Domain\Site\Site;

/**
 * A warning that the editor is about to switch off.
 *
 * Plain text, like the sign-in link beside it. This is a message somebody
 * reads in a preview pane and acts on or ignores in about two seconds, and
 * nothing in it is improved by being laid out.
 *
 * The date is worked out before it gets here, in the site's own timezone.
 * A renewal notice is rendered hours before it is opened, so there is no
 * browser to convert it later, and "expires on 1 March" arriving a day out
 * is the one mistake this message cannot afford.
 */
class LicenceExpiring extends Mailable
{
    public function __construct(
        public readonly Editor $editor,
        public readonly Site $site,
        public readonly int $days,
        public readonly string $on,
        public readonly ?string $console,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: match (true) {
            $this->days <= 0 => 'Editing has stopped on '.$this->site->name,
            $this->days === 1 => 'Editing stops tomorrow on '.$this->site->name,
            default => 'Editing stops in '.$this->days.' days on '.$this->site->name,
        });
    }

    public function content(): Content
    {
        return new Content(text: 'live-edit::mail.licence-expiring');
    }
}
