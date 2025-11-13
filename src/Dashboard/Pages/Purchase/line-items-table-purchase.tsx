import { useMemo } from "react";
import { Button, NumberInput } from "@mantine/core";
import SafeSelect from "../../../lib/SafeSelect";
import Table from "../../../lib/AppTable";
import { Plus, Trash2 } from "lucide-react";
import { useDataContext, type InventoryItem } from "../../Context/DataContext";
import { formatCurrency } from "../../../lib/format-utils";
import type { PurchaseLineItem } from "./types";

export function PurchaseLineItemsTable({
  items,
  onChange,
}: {
  items: PurchaseLineItem[];
  onChange: (next: PurchaseLineItem[]) => void;
}) {
  const { inventory } = useDataContext();
  // const loading = !inventory || inventory.length === 0;
  const error = !Array.isArray(inventory);

  const products = Array.isArray(inventory)
    ? inventory.map((p: InventoryItem) => ({
        id: String(p._id ?? ""),
        name: p.itemName ?? "",
        salesRate: p.salesRate || 0,
      }))
    : [];

  const totals = useMemo(() => {
    const sub = items.reduce((sum, i) => sum + (i.grossAmount || 0), 0);
    const totalDiscount = items.reduce(
      (sum, i) => sum + (i.discountAmount || 0),
      0
    );
    const net = items.reduce((sum, i) => sum + (i.netAmount || 0), 0);
    return { sub, totalDiscount, net, total: net };
  }, [items]);

  function addRow() {
    const p = products[0] ?? {
      id: "",
      name: "New Product",
      salesRate: 0,
    };
    const rate = p.salesRate ?? 0;
    const row: PurchaseLineItem = {
      id: crypto.randomUUID(),
      productId: String(p.id),
      productName: p.name || "",
      code: undefined,
      quantity: 1,
      rate,
      length: undefined,
      grossAmount: rate * 1,
      percent: 0,
      discountAmount: 0,
      netAmount: rate * 1,
      amount: rate * 1,
    };
    onChange([...items, row]);
  }

  function removeRow(id: string) {
    onChange(items.filter((i) => i.id !== id));
  }

  function updateRow(id: string, patch: Partial<PurchaseLineItem>) {
    onChange(
      items.map((i) => {
        if (i.id !== id) return i;
        const next: PurchaseLineItem = { ...i, ...patch } as PurchaseLineItem;
        next.grossAmount = Number((next.quantity || 0) * (next.rate || 0));
        if (next.percent && next.percent > 0) {
          next.discountAmount = Number(
            (next.grossAmount * (next.percent || 0)) / 100
          );
        }
        if (patch.discountAmount !== undefined) {
          next.discountAmount = Number(patch.discountAmount || 0);
        }
        next.netAmount = Math.max(
          0,
          next.grossAmount - (next.discountAmount || 0)
        );
        next.amount = Number(next.netAmount || 0);
        return next;
      })
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        style={{ color: "red", padding: 12 }}
      >
        Error loading inventory data.
      </div>
    );
  }

  return (
    <div>
      <Table style={{ width: "100%" }}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ textAlign: "left", padding: 8 }}>Item</Table.Th>
            <Table.Th style={{ textAlign: "left", padding: 8, width: 100 }}>
              Length
            </Table.Th>
            <Table.Th style={{ textAlign: "right", padding: 8, width: 80 }}>
              Qty
            </Table.Th>
            <Table.Th style={{ textAlign: "right", padding: 8, width: 120 }}>
              Rate
            </Table.Th>
            <Table.Th style={{ textAlign: "right", padding: 8, width: 120 }}>
              Gross
            </Table.Th>
            <Table.Th style={{ textAlign: "right", padding: 8, width: 80 }}>
              %
            </Table.Th>
            <Table.Th style={{ textAlign: "right", padding: 8, width: 120 }}>
              Discount
            </Table.Th>
            <Table.Th style={{ textAlign: "right", padding: 8, width: 120 }}>
              Net
            </Table.Th>
            <Table.Th style={{ textAlign: "right", padding: 8, width: 120 }}>
              Amount
            </Table.Th>
            <Table.Th style={{ textAlign: "right", padding: 8, width: 80 }}>
              Action
            </Table.Th>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {items.map((row) => (
            <Table.Tr key={row.id}>
              <Table.Td style={{ padding: 8 }}>
                <SafeSelect
                  searchable
                  data={products
                    .filter((p) => p && (p.name || p.id))
                    .map((p) => ({
                      value: String(p.id),
                      label: `${p.name || "Unnamed"} — ${p.id}`,
                    }))}
                  value={row.productId}
                  onChange={(productId) => {
                    const p = products.find(
                      (x) => String(x.id) === String(productId)
                    );
                    const prod = inventory.find(
                      (inv: InventoryItem) =>
                        String(inv._id ?? "") === String(productId)
                    );
                    if (prod) {
                      updateRow(row.id, {
                        productId: String(prod._id ?? ""),
                        productName: prod.itemName ?? "",
                        code: undefined,
                      
                        rate: Number(prod.salesRate ?? 0),
                       
                       
                        length: undefined,
                      });
                    } else {
                      updateRow(row.id, {
                        productId: String(productId || ""),
                        productName: p?.name || "",
                        code: undefined,
                      
                      });
                    }
                  }}
                  aria-label={`Select product for row ${row.id}`}
                />
              </Table.Td>

              <Table.Td style={{ padding: 8 }}>
                <NumberInput
                  value={row.grossAmount}
                  readOnly
                  aria-label={`Gross amount for row ${row.id}`}
                />
              </Table.Td>

              <Table.Td style={{ padding: 8 }}>
                <NumberInput
                  value={row.percent}
                  onChange={(v) =>
                    updateRow(row.id, { percent: Number(v || 0) })
                  }
                  min={0}
                  max={100}
                  aria-label={`Discount percent for row ${row.id}`}
                />
              </Table.Td>

              <Table.Td style={{ padding: 8 }}>
                <NumberInput
                  value={row.discountAmount}
                  onChange={(v) =>
                    updateRow(row.id, { discountAmount: Number(v || 0) })
                  }
                  min={0}
                  aria-label={`Discount amount for row ${row.id}`}
                />
              </Table.Td>

              <Table.Td style={{ padding: 8 }}>
                <NumberInput
                  value={row.netAmount}
                  readOnly
                  aria-label={`Net amount for row ${row.id}`}
                />
              </Table.Td>

              <Table.Td style={{ padding: 8, textAlign: "right" }}>
                {formatCurrency(row.amount ?? row.netAmount ?? 0)}
              </Table.Td>

              <Table.Td style={{ padding: 8, textAlign: "right" }}>
                <Button
                  variant="subtle"
                  onClick={() => removeRow(row.id)}
                  aria-label={`Remove row ${row.id}`}
                >
                  <Trash2 size={14} />
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 12,
        }}
      >
        <Button
          variant="outline"
          onClick={addRow}
          aria-label="Add Item"
          style={{ backgroundColor: "#1976d2", color: "#fff" }}
        >
          <Plus size={14} style={{ marginRight: 8 }} />
          Add Item
        </Button>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "#1976d2" }}>Subtotal</div>
          <div style={{ fontSize: 14 }}>{formatCurrency(totals.sub)}</div>

          <div style={{ fontSize: 12, color: "#1976d2", marginTop: 6 }}>
            Discount
          </div>
          <div style={{ fontSize: 14 }}>
            {formatCurrency(totals.totalDiscount)}
          </div>

          <div style={{ fontSize: 12, color: "#1976d2", marginTop: 6 }}>Net</div>
          <div style={{ fontSize: 14 }}>{formatCurrency(totals.net)}</div>

          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginTop: 6,
              color: "#1976d2",
            }}
          >
            Total: {formatCurrency(totals.total)}
          </div>
        </div>
      </div>
    </div>
  );
}
