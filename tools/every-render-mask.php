#!/usr/bin/env php
<?php

/**
 * The server's idea of what changes on every render, for comparison with the
 * browser's.
 *
 * One rule, two implementations, by necessity: the browser cannot call PHP and
 * the server cannot wait to be told what it already has. Both use it to decide
 * whether a page still needs tagging, and if they ever disagree the two caches
 * silently stop agreeing about which pages are the same page - which is the
 * class of fault that has cost this codebase more than any other.
 *
 * So the parity test runs both over the same markup. This is the server half:
 * markup on stdin, masked markup out.
 */

require __DIR__.'/../vendor/autoload.php';

use ShipFast\LiveEdit\Support\WhatChangesEveryRender;

echo WhatChangesEveryRender::masked((string) file_get_contents('php://stdin'));
