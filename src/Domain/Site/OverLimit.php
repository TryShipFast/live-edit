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
class OverLimit extends RuntimeException {}
