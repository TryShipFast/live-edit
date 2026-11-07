<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Mapper\MarkupScanner;

/**
 * A copied product sold where it stands is a product of its own.
 *
 * The Photographer's prints are each sold on the prints page (Add to bag, no page of
 * their own). A print the owner duplicated kept the first one's data-kit-product, so its
 * Add to bag put the first print in the bag at the first print's price, and the shop
 * priced it the same way (owner walk, 7 Nov 2026). The Kit contract (LIVE-EDIT-STRUCTURE.md): "a copied product
 * card keeps its own product association".
 *
 * A card that opens a product's page (commerce.product) is that product however many
 * times it is shown, so its copy keeps the product.
 */
class ACopiedProductIsAProductOfItsOwnTest extends TestCase
{
    private function render(string $item, array $order): string
    {
        return (new MarkupScanner)->applyOverrides('<div data-edit-list="prints">'.$item.'</div>', [
            'prints' => json_encode($order),
        ]);
    }

    public function test_a_copy_sold_in_place_has_its_own_product(): void
    {
        $out = $this->render(
            '<article data-edit-item="t1" data-print="blue-hour" data-kit-product="blue-hour"><h3 data-kit-name data-edit="setting:p.t1.name">Blue Hour</h3>'
            .'<p data-kit-price data-edit="setting:p.t1.price">From ₦60,000</p>'
            .'<button data-kit-action="commerce.add-to-bag" data-kit-product="blue-hour">Add to cart</button></article>',
            ['t1', 'n1_t1'],
        );

        $this->assertSame(2, substr_count($out, 'data-kit-product="blue-hour"'), 'the design\'s own print changed');
        $this->assertSame(2, substr_count($out, 'data-kit-product="blue-hour--n1_t1"'), 'the copy and its Add to bag are not a product of their own');
    }

    public function test_a_copied_card_that_opens_a_product_page_is_still_that_product(): void
    {
        $out = $this->render(
            '<article data-edit-item="t1" data-kit-product="arc"><a href="/products/arc/" data-kit-action="commerce.product">Arc</a>'
            .'<button data-kit-action="commerce.add-to-bag" data-kit-product="arc">Add to bag</button></article>',
            ['t1', 'n1_t1'],
        );

        $this->assertSame(4, substr_count($out, 'data-kit-product="arc"'));
        $this->assertStringNotContainsString('arc--', $out);
    }

    public function test_a_copy_of_something_not_sold_is_left_alone(): void
    {
        $out = $this->render('<article data-edit-item="t1" data-kit-product="tag"><h3>Words</h3></article>', ['t1', 'n1_t1']);

        $this->assertSame(2, substr_count($out, 'data-kit-product="tag"'));
    }
}
