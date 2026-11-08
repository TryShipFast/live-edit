<?php

namespace ShipFast\LiveEdit\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use ShipFast\LiveEdit\Contracts\KeepsShopStock;

/**
 * The shop's stock, for the Flash sale grid's "In stock" column (KeepsShopStock).
 *
 *   GET  /live-edit/stock  → {"stock": [{"product","name","size","quantity"}] | null}
 *   POST /live-edit/stock  {"changes": [{"product","size","quantity"}]} → {"stock": [...]}
 *
 * Null stock (no host binding, or a site that keeps none) hides the column; nothing else changes.
 */
class ShopStockController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $keeper = $this->keeper();

        return response()->json(['stock' => $keeper?->stock($request)])
            ->withHeaders(['Cache-Control' => 'no-store, private']);
    }

    public function update(Request $request): JsonResponse
    {
        $keeper = $this->keeper();

        if ($keeper === null) {
            return response()->json(['error' => ['type' => 'no_stock', 'message' => 'This website does not keep stock.']], 404);
        }

        $validated = $request->validate([
            'changes' => ['required', 'array', 'max:2000'],
            'changes.*.product' => ['required', 'string', 'max:300'],
            'changes.*.size' => ['nullable', 'string', 'max:200'],
            'changes.*.quantity' => ['nullable', 'integer', 'min:0', 'max:1000000'],
        ], [
            'changes.*.quantity.*' => 'In stock is a whole number, like 12, or empty.',
        ]);

        $keeper->saveStock($request, array_map(fn (array $change) => [
            'product' => (string) $change['product'],
            'size' => (string) ($change['size'] ?? ''),
            'quantity' => isset($change['quantity']) ? (int) $change['quantity'] : null,
        ], $validated['changes']));

        return response()->json(['stock' => $keeper->stock($request)])
            ->withHeaders(['Cache-Control' => 'no-store, private']);
    }

    private function keeper(): ?KeepsShopStock
    {
        return app()->bound(KeepsShopStock::class) ? app(KeepsShopStock::class) : null;
    }
}
