/**
 * Checkout cart (client state). Batch-priced products are allocated
 * across batches FEFO (earliest expiry first): when a quantity exceeds a
 * batch's stock, the overflow rolls into the next batch automatically, so
 * a sale of 10 becomes e.g. 8 × Batch A + 2 × Batch B — each at its own
 * MRP — with no manual math. Cleared on completing/abandoning a sale.
 */
import { create } from 'zustand';

const lineKey = (productId, batchId) =>
  batchId ? `${productId}_${batchId}` : `${productId}`;

// Allocates `want` units across FEFO batches, respecting how many of each
// are already in the cart. Returns per-batch additions and any leftover
// that didn't fit (out of stock).
const allocateFEFO = (batches, existingByBatch, want) => {
  const additions = [];
  let remaining = want;

  for (const batch of batches) {
    if (remaining <= 0) break;

    const inCart = existingByBatch[batch.id] || 0;
    const room = Math.max(0, batch.available - inCart);
    const take = Math.min(room, remaining);

    if (take > 0) {
      additions.push({ batch, quantity: take });
      remaining -= take;
    }
  }

  return { additions, leftover: remaining };
};

export const useCartStore = create((set, get) => ({
  lines: [],
  // productId -> FEFO batches [{ id, batchNo, expiryDate, sellPrice, available }]
  batchInfo: {},

  // Add `qty` units of a resolved lookup item. Product-priced items get a
  // single line; batch-priced items are split across batches FEFO.
  addUnits: (item, qty = 1) => {
    const batches = item.batches || [];

    // Product-priced (or batch-less) — one line, simple merge.
    if (item.pricingMode !== 'batch' || batches.length === 0) {
      set((state) => {
        const key = lineKey(item.productId, null);
        const existing = state.lines.find((l) => l.key === key);

        if (existing) {
          return {
            lines: state.lines.map((l) =>
              l.key === key ? { ...l, quantity: l.quantity + qty } : l,
            ),
          };
        }

        return {
          lines: [
            ...state.lines,
            {
              key,
              productId: item.productId,
              name: item.name,
              sku: item.sku,
              barcode: item.barcode,
              pricingMode: item.pricingMode,
              sellType: item.sellType,
              unitPrice: item.unitPrice,
              batchId: null,
              batchNo: null,
              expiryDate: null,
              quantity: qty,
            },
          ],
        };
      });

      return { added: qty, requested: qty };
    }

    // Batch-priced — FEFO allocation with rollover.
    const existingByBatch = {};
    get()
      .lines.filter((l) => l.productId === item.productId)
      .forEach((l) => {
        existingByBatch[l.batchId] = l.quantity;
      });

    const { additions, leftover } = allocateFEFO(batches, existingByBatch, qty);

    set((state) => {
      let lines = [...state.lines];

      additions.forEach(({ batch, quantity }) => {
        const key = lineKey(item.productId, batch.id);
        const existing = lines.find((l) => l.key === key);

        if (existing) {
          lines = lines.map((l) =>
            l.key === key ? { ...l, quantity: l.quantity + quantity } : l,
          );
        } else {
          lines.push({
            key,
            productId: item.productId,
            name: item.name,
            sku: item.sku,
            barcode: item.barcode,
            pricingMode: item.pricingMode,
            sellType: item.sellType,
            unitPrice: batch.sellPrice,
            batchId: batch.id,
            batchNo: batch.batchNo,
            expiryDate: batch.expiryDate,
            quantity,
          });
        }
      });

      return {
        lines,
        batchInfo: { ...state.batchInfo, [item.productId]: batches },
      };
    });

    return { added: qty - leftover, requested: qty };
  },

  // +1 on a line: for batch products this rolls into the next batch when
  // the current one is full; for product-priced it just increments.
  incLine: (key) => {
    const line = get().lines.find((l) => l.key === key);
    if (!line) return { added: 0, requested: 1 };

    if (line.batchId) {
      const batches = get().batchInfo[line.productId] || [];
      return get().addUnits(
        {
          productId: line.productId,
          name: line.name,
          sku: line.sku,
          barcode: line.barcode,
          pricingMode: 'batch',
          sellType: line.sellType,
          batches,
        },
        1,
      );
    }

    set((state) => ({
      lines: state.lines.map((l) =>
        l.key === key ? { ...l, quantity: l.quantity + 1 } : l,
      ),
    }));

    return { added: 1, requested: 1 };
  },

  decLine: (key) =>
    set((state) => ({
      lines: state.lines
        .map((l) => (l.key === key ? { ...l, quantity: l.quantity - 1 } : l))
        .filter((l) => l.quantity > 0),
    })),

  // Set a batch line to a specific quantity, rolling any overflow beyond
  // this batch's stock into the subsequent FEFO batches.
  setLineQuantity: (key, desired) => {
    const line = get().lines.find((l) => l.key === key);
    if (!line) return { added: 0, requested: desired };

    const want = Math.max(0, Math.floor(desired) || 0);

    // Product-priced — plain set.
    if (!line.batchId) {
      set((state) => ({
        lines: state.lines
          .map((l) => (l.key === key ? { ...l, quantity: want } : l))
          .filter((l) => l.quantity > 0),
      }));
      return { added: want, requested: want };
    }

    const batches = get().batchInfo[line.productId] || [];
    const thisIndex = batches.findIndex((b) => b.id === line.batchId);
    const thisBatch = batches[thisIndex];
    const thisAvail = thisBatch ? thisBatch.available : line.quantity;

    const thisQty = Math.min(want, thisAvail);
    const overflow = Math.max(0, want - thisAvail);

    // Set (or remove) this batch's line.
    set((state) => ({
      lines: state.lines
        .map((l) => (l.key === key ? { ...l, quantity: thisQty } : l))
        .filter((l) => l.quantity > 0),
    }));

    // Roll the overflow into later batches (respecting what's in cart).
    if (overflow > 0 && thisIndex >= 0) {
      const later = batches.slice(thisIndex + 1);
      const existingByBatch = {};
      get()
        .lines.filter((l) => l.productId === line.productId)
        .forEach((l) => {
          existingByBatch[l.batchId] = l.quantity;
        });

      return get().addUnits(
        {
          productId: line.productId,
          name: line.name,
          sku: line.sku,
          barcode: line.barcode,
          pricingMode: 'batch',
          sellType: line.sellType,
          batches: later,
        },
        overflow,
      );
    }

    return { added: thisQty, requested: want };
  },

  // Override a line's batch (e.g. the pack is clearly from another batch).
  changeLineBatch: (key, batch) =>
    set((state) => {
      const line = state.lines.find((l) => l.key === key);
      if (!line) return {};

      const newKey = lineKey(line.productId, batch.id);
      const merged = state.lines.find((l) => l.key === newKey);

      // If a line for the target batch exists, fold this quantity into it.
      if (merged && merged.key !== key) {
        return {
          lines: state.lines
            .filter((l) => l.key !== key)
            .map((l) =>
              l.key === newKey
                ? { ...l, quantity: l.quantity + line.quantity }
                : l,
            ),
        };
      }

      return {
        lines: state.lines.map((l) =>
          l.key === key
            ? {
                ...l,
                key: newKey,
                unitPrice: batch.sellPrice,
                batchId: batch.id,
                batchNo: batch.batchNo,
                expiryDate: batch.expiryDate,
              }
            : l,
        ),
      };
    }),

  removeLine: (key) =>
    set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),

  clear: () => set({ lines: [], batchInfo: {} }),

  totals: () => {
    const lines = get().lines;
    const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

    return { itemCount, subtotal, grandTotal: subtotal };
  },
}));

export default useCartStore;
