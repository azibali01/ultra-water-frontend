import { useMemo } from "react";
import { Button, NumberInput, Select, Group } from "@mantine/core";
import Table from "../../../lib/AppTable";
import { Trash2 } from "lucide-react";
import type { PurchaseLineItem } from "./types";
import { formatCurrency } from "../../../lib/format-utils";
import { useEffect } from "react";
export interface LineItemsTableUniversalProps {
  items: PurchaseLineItem[];
  setItems: (items: PurchaseLineItem[]) => void;
  inventory: {
    id?: string;
    _id?: string;
    itemName?: string;
    name?: string;
    salesRate?: number;
  }[];
  // colors prop removed
  allowNegativeQty?: boolean;
  editableRate?: boolean;
  showAmountCol?: boolean;
  addRowLabel?: string;
}

export function LineItemsTableUniversal({
  items,
  setItems,
  inventory,
  
  allowNegativeQty = false,
  editableRate = true,
  showAmountCol = true,
  addRowLabel = "Add Item",
}: LineItemsTableUniversalProps) {
  const products = useMemo(
    () =>
      inventory.map((p) => ({
        id: String(p.id || p._id),
        name: p.itemName ?? p.name ?? "",
        salesRate: p.salesRate || 0,
      })),
    [inventory]
  );

  // Ensure at least one row is present on mount
  useEffect(() => {
    if (items.length === 0) {
      addRow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addRow() {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        productId: "",
        productName: "",
        quantity: 1,
        rate: 0,
        grossAmount: 0,
        percent: 0,
        discountAmount: 0,
        netAmount: 0,
        amount: 0,
      },
    ]);
  }

  function removeRow(id: string) {
    setItems(items.filter((i) => i.id !== id));
  }

  function updateRow(id: string, patch: Partial<PurchaseLineItem>) {
    setItems(
      items.map((i) => {
        if (i.id !== id) return i;
        const next: PurchaseLineItem = { ...i, ...patch };
        // Calculate amount as quantity * rate (length removed)
        const qty = Number(next.quantity) || 0;
        const rate = Number(next.rate) || 0;
        next.amount = qty * rate;
        return next;
      })
    );
  }

  return (
    <div>
      <div>
        <Group justify="flex-end">
          <Button variant="outline" onClick={addRow} size="xs">
            + {addRowLabel}
          </Button>
        </Group>
        <Table
          striped
          highlightOnHover
          verticalSpacing="sm"
          style={{ width: "100%" }}
          withColumnBorders
          withTableBorder
          withRowBorders
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ textAlign: "left", padding: 8, width: 180 }}>
                Item
              </Table.Th>
              
              {/* Length column removed */}
              <Table.Th style={{ textAlign: "left", padding: 8, width: 80 }}>
                Qty
              </Table.Th>
              <Table.Th style={{ textAlign: "left", padding: 8, width: 120 }}>
                Rate
              </Table.Th>
              {showAmountCol && (
                <Table.Th style={{ textAlign: "left", padding: 8, width: 120 }}>
                  Amount
                </Table.Th>
              )}
              <Table.Th style={{ textAlign: "left", padding: 8, width: 80 }}>
                Action
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td style={{ padding: 8 }}>
                  <Select
                    searchable
                    clearable
                    nothingFoundMessage="No products found"
                    data={products.map((p) => ({
                      value: String(p.id),
                      label: p.name,
                    }))}
                    value={
                      products.find((p) => p.name === row.productName)?.id || ""
                    }
                    onChange={(productId) => {
                      const p = products.find(
                        (x) => String(x.id) === String(productId)
                      );
                      if (p) {
                        updateRow(row.id, {
                          productName: p.name || "",
                          rate: p.salesRate ?? 0,
                        });
                      } else {
                        updateRow(row.id, {
                          productName: "",
                          rate: 0,
                        });
                      }
                    }}
                  />
                </Table.Td>
                
                {/* Length input removed */}
                <Table.Td style={{ padding: 8, textAlign: "right" }}>
                  <NumberInput
                    value={row.quantity}
                    onChange={(v) =>
                      updateRow(row.id, {
                        quantity: allowNegativeQty
                          ? Number(v)
                          : Math.max(0, Number(v || 0)),
                      })
                    }
                    min={allowNegativeQty ? undefined : 0}
                  />
                </Table.Td>
                <Table.Td style={{ padding: 8 }}>
                  <NumberInput
                    value={row.rate}
                    onChange={(v) =>
                      editableRate
                        ? updateRow(row.id, { rate: Number(v || 0) })
                        : undefined
                    }
                    min={0}
                    readOnly={!editableRate}
                  />
                </Table.Td>
                {showAmountCol && (
                  <Table.Td style={{ padding: 8, textAlign: "left" }}>
                    {formatCurrency(row.amount ?? 0)}
                  </Table.Td>
                )}
                <Table.Td style={{ padding: 8, textAlign: "left" }}>
                  <Button variant="subtle" onClick={() => removeRow(row.id)}>
                    <Trash2 size={16} />
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>
    </div>
  );
}
