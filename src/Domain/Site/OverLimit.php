<?php

namespace ShipFast\LiveEdit\Domain\Site;

use RuntimeException;

/**
 * A site has used what it is allowed.
 *
 * Its own type because the answer a caller needs is different from a refusal:
 * nothing is wrong with the request, the account simply needs attention. That
 * is a conversation with a bill, not a bug to chase, and the message says so.
 */
class OverLimit extends RuntimeException
{
    /**
     * @param  ?string  $upgrade  where more is got (the host's billing page), when the host says
     * @param  bool  $storage  a full storage, which the editor answers with "Get more storage"
     */
    public function __construct(string $message = '', public readonly ?string $upgrade = null, public readonly bool $storage = false)
    {
        parent::__construct($message);
    }
}
