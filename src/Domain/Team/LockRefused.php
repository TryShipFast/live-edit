<?php

namespace ShipFast\LiveEdit\Domain\Team;

use RuntimeException;

/**
 * Somebody else is working on this part of the site.
 *
 * Answered as 409 Conflict with a sentence a person can act on, and with who
 * holds it, so the editor can show "Ada is editing this section".
 */
class LockRefused extends RuntimeException
{
    /** @param  array<string, mixed>  $lock */
    public function __construct(string $message, public readonly array $lock = [], public readonly string $reason = 'locked')
    {
        parent::__construct($message);
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return ['error' => ['type' => 'section_locked', 'reason' => $this->reason, 'message' => $this->getMessage(), 'lock' => $this->lock]];
    }
}
