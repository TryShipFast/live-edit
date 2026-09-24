Hello{{ $editor->name ? ' '.$editor->name : '' }},

Here is your link to edit {{ $site->name }}:

{{ $link }}

It works once and expires in {{ $minutes }} minutes.

If you did not ask for this, nothing has happened and you can ignore it.
