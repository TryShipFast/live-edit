@php
    $name = $editor->name ?: null;
@endphp
{{ $name ? 'Hello '.$name.',' : 'Hello,' }}

@if ($days <= 0)
The licence for {{ $site->name }} ran out on {{ $on }}, so editing has stopped.

Your website is unaffected. Every word your team wrote is still on it and still
in your own database. What has stopped is the editor: the toolbar will not
appear, and changes cannot be saved until the licence is renewed.
@elseif ($days === 1)
The licence for {{ $site->name }} runs out tomorrow, {{ $on }}.

After that the editor stops appearing and changes cannot be saved. Your website
carries on exactly as it is, because your words live in your own database.
@else
The licence for {{ $site->name }} runs out in {{ $days }} days, on {{ $on }}.

Nothing changes before then. After it, the editor stops appearing and changes
cannot be saved. Your website carries on exactly as it is, because your words
live in your own database.
@endif

@if ($console)
Renew it here:
{{ $console }}
@else
Renew it from your dashboard.
@endif

@if ($days > 0)
If somebody else at {{ $site->name }} looks after this, forward this to them.
@endif

ShipFast Live
