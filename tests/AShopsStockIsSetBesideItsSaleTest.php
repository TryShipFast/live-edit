<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Http\Request;
use ShipFast\LiveEdit\Contracts\KeepsShopStock;

/**
 * The Flash sale grid's "In stock" column (owner, 8 Nov 2026: "live edit should be sufficient to setup their store").
 * Stock is the host's: the engine only carries it between the grid and the host's KeepsShopStock.
 */
class AShopsStockIsSetBesideItsSaleTest extends TestCase
{
    public function test_without_a_host_that_keeps_stock_there_is_no_column(): void
    {
        $this->getJson('/live-edit/stock')->assertOk()->assertExactJson(['stock' => null]);
        $this->postJson('/live-edit/stock', ['changes' => [['product' => 'products/a', 'size' => '', 'quantity' => 3]]])->assertNotFound();
    }

    public function test_the_hosts_counts_are_read_and_set(): void
    {
        $keeper = new class implements KeepsShopStock
        {
            /** @var array<string, ?int> */
            public array $counts = ['products/kemi|4–5 years' => 12, 'products/kemi|5–6 years' => null, 'products/bag|' => 0];

            public function stock(Request $request): ?array
            {
                return array_map(function (string $key) {
                    [$product, $size] = explode('|', $key);

                    return ['product' => $product, 'name' => $product, 'size' => $size, 'quantity' => $this->counts[$key]];
                }, array_keys($this->counts));
            }

            public function saveStock(Request $request, array $changes): void
            {
                foreach ($changes as $change) {
                    $this->counts[$change['product'].'|'.$change['size']] = $change['quantity'];
                }
            }
        };
        $this->app->instance(KeepsShopStock::class, $keeper);

        $this->getJson('/live-edit/stock')->assertOk()->assertJsonPath('stock.0.quantity', 12)->assertJsonPath('stock.2.quantity', 0);

        $this->postJson('/live-edit/stock', ['changes' => [
            ['product' => 'products/kemi', 'size' => '5–6 years', 'quantity' => 4],
            ['product' => 'products/bag', 'size' => null, 'quantity' => null],
        ]])->assertOk()->assertJsonPath('stock.1.quantity', 4)->assertJsonPath('stock.2.quantity', null);

        $this->postJson('/live-edit/stock', ['changes' => [['product' => 'products/bag', 'size' => '', 'quantity' => -1]]])
            ->assertStatus(422);
        $this->assertNull($keeper->counts['products/bag|']);
    }
}
