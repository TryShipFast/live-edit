<?php

namespace ShipFast\LiveEdit\Contracts;

use Illuminate\Http\Request;

/**
 * Stock a host keeps for a shop, offered to the editor's Flash sale grid (owner, 8 Nov 2026: "live edit should be
 * sufficient to setup their store"; "they only go to the dashboard for orders").
 *
 * Stock is the host's, not the page's: a paid order takes it off on the host's server, so it is never a draft and is
 * never published. A host that keeps stock binds this interface in its container; without a binding the editor shows
 * no "In stock" column. The routes are inside the editor's own middleware (config live-edit.middleware), and the host
 * answers only for the site the signed-in person may edit, exactly as it does for their words.
 *
 * A row is one product, or one size of it:
 *   ['product' => 'products/kemi-gingham-dress', 'name' => 'Kemi gingham dress', 'size' => '4–5 years', 'quantity' => 12]
 * `product` is the product page's path from the site's root (no slashes at either end, no index.html), `size` is ''
 * for a product without sizes, and `quantity` is null when it is not counted (it can always be bought).
 */
interface KeepsShopStock
{
    /**
     * Every product (and size) the shop sells with its count, or null when this site keeps no stock.
     *
     * @return list<array{product: string, name: string, size: string, quantity: ?int}>|null
     */
    public function stock(Request $request): ?array;

    /**
     * Set these counts (null: stop counting). Only rows the shop sells; anything else is refused by the host.
     *
     * @param  list<array{product: string, size: string, quantity: ?int}>  $changes
     */
    public function saveStock(Request $request, array $changes): void;
}
