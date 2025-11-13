import { useCallback } from "react";
import { NumberInput, TextInput, Button, Select, } from "@mantine/core";

import Table from "../../lib/AppTable";
import type { InventoryItem } from "../../Dashboard/Context/DataContext";
import { IconTrash } from "@tabler/icons-react";
import { sanitizeItemName } from "../../lib/format-utils";

export type LineItem = {
  _id?: string | number;
  itemName?: string;
  discount?: number;
  discountAmount?: number;
  salesRate?: number;
  quantity?: number;
  amount: number;
  totalGrossAmount: number;
  totalNetAmount: number;
};

export function LineItemsTable({
  items,
  onChange,
  products,
}: {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  products?: InventoryItem[];
}) {
  const update = useCallback(
    (rowIdx: number, patch: Partial<LineItem>) =>
      onChange(
        items.map((it, idx) => (idx === rowIdx ? { ...it, ...patch } : it))
      ),
    [items, onChange]
  );

  return (
    <Table withColumnBorders>
      <Table.Thead>
        <Table.Tr>
          <Table.Th style={{ width: 350 }}>Item</Table.Th>
          <Table.Th style={{ width: 120 }}>Qty</Table.Th>
          <Table.Th style={{ width: 120 }}>Rate</Table.Th>
          <Table.Th style={{ width: 120 }}>Gross</Table.Th>
          <Table.Th style={{ width: 120 }}>%</Table.Th>
          <Table.Th style={{ width: 120 }}>Discount</Table.Th>
          <Table.Th style={{ width: 120 }}>Net</Table.Th>
          <Table.Th style={{ width: 120 }}>Amount</Table.Th>
          <Table.Th style={{ textAlign: "left" }}>Remove</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.map((it, idx) => {
          const quantity = Number(it.quantity || 0);
          const rate = Number(it.salesRate || 0);
          const gross = quantity * rate;
          const discountAmount = it.discountAmount ?? 0;
          const net = gross - discountAmount;

          return (
            <Table.Tr key={`line-${idx}`}>
              <Table.Td style={{ minWidth: 200 }}>
                {products && products.length ? (
                  <Select
                    value={String(it._id || "")}
                    data={products.map((p) => ({
                      value: String(p._id),
                      label: sanitizeItemName(String(p.itemName)),
                    }))}
                    onChange={(val: string | null) => {
                      const prod = products.find(
                        (p) => String(p._id) === String(val)
                      );
                      if (prod) {
                        update(idx, {
                          _id: prod._id,
                          itemName: prod.itemName || "",
                          salesRate: Number(prod.salesRate ?? 0),
                          amount: 0,
                          totalGrossAmount: 0,
                          totalNetAmount: 0,
                        });
                      } else {
                        update(idx, {
                          _id: "",
                          itemName: "",
                        });
                      }
                    }}
                    searchable
                    clearable
                    nothingFoundMessage="No products found"
                  />
                ) : (
                  <TextInput
                    value={it.itemName}
                    onChange={(e) =>
                      update(idx, {
                        itemName: e.currentTarget.value,
                      })
                    }
                    placeholder="Product Name"
                  />
                )}
              </Table.Td>

              {/* length removed */}

              <Table.Td>
                <NumberInput
                  value={it.quantity}
                  onChange={(v: number | string | undefined) => {
                    const quantity = Number(v || 0);
                    const rate = Number(it.salesRate || 0);
                    update(idx, {
                      quantity,
                      amount: quantity * rate,
                    });
                  }}
                />
              </Table.Td>

              <Table.Td>
                <NumberInput
                  value={it.salesRate}
                  onChange={(v: number | string | undefined) => {
                    const rate = Number(v || 0);
                    const quantity = Number(it.quantity || 0);
                    update(idx, {
                      salesRate: rate,
                      amount: quantity * rate,
                    });
                  }}
                />
              </Table.Td>

              <Table.Td>{gross.toFixed(2)}</Table.Td>

              <Table.Td>
                <NumberInput
                  value={it.discount ?? 0}
                  onChange={(v: number | string | undefined) => {
                    const pct = Number(v || 0);
                    const discountAmount = (pct / 100) * gross;
                    update(idx, {
                      discount: pct,
                      discountAmount,
                    });
                  }}
                />
              </Table.Td>

              <Table.Td>
                <NumberInput
                  value={it.discountAmount ?? 0}
                  onChange={(v: number | string | undefined) => {
                    const amt = Number(v || 0);
                    const pct = gross > 0 ? (amt / gross) * 100 : 0;
                    update(idx, {
                      discountAmount: amt,
                      discount: pct,
                    });
                  }}
                />
              </Table.Td>

              <Table.Td>{net.toFixed(2)}</Table.Td>

              <Table.Td>{(quantity * rate).toFixed(2)}</Table.Td>

              <Table.Td>
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <Button
                    variant="subtle"
                    onClick={() => onChange(items.filter((_, i) => i !== idx))}
                    leftSection={<IconTrash size={18} />}
                  ></Button>
                </div>
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
}

export default LineItemsTable;
