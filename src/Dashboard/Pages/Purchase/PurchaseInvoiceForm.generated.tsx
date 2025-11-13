import type React from "react";
import { useMemo, useState } from "react";
import {
  Card,
  TextInput,
  Textarea,
  Button,
  Badge,
  Text,
  Select,
  Title,
  NumberInput,
} from "@mantine/core";
import Table from "../../../lib/AppTable";
import type { PurchaseLineItem } from "./types";
import { formatCurrency, formatDate } from "../../../lib/format-utils";
import { useDataContext } from "../../Context/DataContext";
import { Trash2 } from "lucide-react";
import { Group } from "@mantine/core";
import type { Supplier as BaseSupplier } from "../../../components/purchase/SupplierForm";

type Supplier = BaseSupplier & {
  Credit?: number;
  Debit?: number;
};
import type { InventoryItem } from "../../Context/DataContext";

export type PurchaseInvoiceFormPayload = {
  purchaseInvoiceNumber: string;
  invoiceDate: Date;
  expectedDelivery?: Date;
  supplierId?: string;
  products: PurchaseLineItem[];
  remarks?: string;
  subTotal?: number;
  total?: number;
};

export function PurchaseInvoiceForm({
  onSubmit,
  defaultInvoiceNumber = "",
  initialValues,
}: {
  onSubmit?: (payload: PurchaseInvoiceFormPayload) => void;
  defaultInvoiceNumber?: string;
  initialValues?: Partial<
    PurchaseInvoiceFormPayload & { products: PurchaseLineItem[] }
  >;
}) {
  // Use defaultInvoiceNumber prop for auto-generation
  const purchaseInvoiceNumber =
    initialValues?.purchaseInvoiceNumber || defaultInvoiceNumber;
  const [invoiceDate, setInvoiceDate] = useState<string>(
    initialValues?.invoiceDate
      ? typeof initialValues.invoiceDate === "string"
        ? (initialValues.invoiceDate as string).slice(0, 10)
        : new Date(initialValues.invoiceDate as string | Date)
            .toISOString()
            .slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [expectedDelivery, setExpectedDelivery] = useState<string>(
    initialValues?.expectedDelivery
      ? typeof initialValues.expectedDelivery === "string"
        ? (initialValues.expectedDelivery as string).slice(0, 10)
        : new Date(initialValues.expectedDelivery as string | Date)
            .toISOString()
            .slice(0, 10)
      : ""
  );
  const { inventory = [],suppliers = [] } = useDataContext();
  function isSupplierObject(obj: unknown): obj is { _id: string } {
    return (
      !!obj &&
      typeof obj === "object" &&
      "_id" in obj &&
      typeof (obj as { _id?: unknown })._id === "string"
    );
  }
  function getSupplierIdFromInitialValues(init?: typeof initialValues): string {
    if (init?.supplierId) return init.supplierId;
    if (init && typeof init === "object" && "supplier" in init) {
      const s = (init as { supplier?: unknown }).supplier;
      if (isSupplierObject(s)) {
        return s._id;
      }
    }
    return "";
  }
  const [supplierId, setSupplierId] = useState<string>(
    getSupplierIdFromInitialValues(initialValues)
  );
  const [remarks, setRemarks] = useState(
    initialValues?.remarks ?? "Monthly stock replenishment"
  );
  const [status] = useState("Draft");
  const [products, setProducts] = useState<PurchaseLineItem[]>(
    initialValues?.products && initialValues.products.length > 0
      ? initialValues.products.map((p) => ({
          ...p,
          id: p.id || crypto.randomUUID(),
          productId: p.productId ?? "",
        
          grossAmount: typeof p.grossAmount === "number" ? p.grossAmount : 0,
          netAmount: typeof p.netAmount === "number" ? p.netAmount : 0,
        }))
      : [
          {
            id: crypto.randomUUID(),
            productId: "",
            productName: "Select product",
            quantity: 1,
            rate: 0,
        
            length: 0,
            grossAmount: 0,
            percent: 0,
            discountAmount: 0,
            netAmount: 0,
            amount: 0,
          },
        ]
  );
  const subTotal = useMemo(() => {
    return products.reduce((s, i) => {
      const length = Number(i.length) || 1;
      const rate = Number(i.rate) || 0;
      const qty = Number(i.quantity) || 0;
      return s + length * rate * qty;
    }, 0);
  }, [products]);
  const total = subTotal;

  const selectedSupplier = suppliers.find(
    (s: Supplier) => String(s._id) === String(supplierId)
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Only call onSubmit, let parent handle API and state
    const invoicePayload = {
      purchaseInvoiceNumber,
      invoiceDate: new Date(invoiceDate),
      expectedDelivery: expectedDelivery
        ? new Date(expectedDelivery)
        : undefined,
      supplierId,
      products: products.map((p) => ({
        id: p.id,
        productId:
          p.productId ??
          inventory.find((inv) => inv.itemName === p.productName)?._id ??
          "",
        productName: p.productName,
        quantity: Math.floor(Number(p.quantity) || 0),
        rate: Math.floor(Number(p.rate) || 0),
      
        length: Math.floor(Number(p.length) || 0),
        grossAmount: Math.floor(
          typeof p.grossAmount === "number" ? p.grossAmount : 0
        ),
        netAmount: Math.floor(
          typeof p.netAmount === "number" ? p.netAmount : 0
        ),
        percent: Math.floor(typeof p.percent === "number" ? p.percent : 0),
        discountAmount: Math.floor(
          typeof p.discountAmount === "number" ? p.discountAmount : 0
        ),
        amount: Math.floor(typeof p.amount === "number" ? p.amount : 0),
        inventoryId: inventory.find((inv) => inv.itemName === p.productName)
          ?._id,
      })),
      remarks,
      subTotal: Math.floor(subTotal),
      total: Math.floor(total),
    };
    onSubmit?.(invoicePayload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <div
          style={{
            padding: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Title order={3}>Purchase Invoice</Title>
            <Text color="dimmed">Create and record a purchase invoice</Text>
          </div>
          <Badge variant="outline">{status}</Badge>
        </div>

        <div style={{ padding: 12 }} className="space-y-4">
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(3, 1fr)",
            }}
          >
            <div>
              <label htmlFor="invoiceNo">Invoice Number</label>
              <TextInput
                id="invoiceNo"
                value={purchaseInvoiceNumber}
                readOnly
                placeholder="INV-2025-001"
              />
            </div>
            <div>
              <label htmlFor="invoiceDate">Invoice Date</label>
              <TextInput
                id="invoiceDate"
                type="date"
                value={invoiceDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setInvoiceDate(e.target.value)
                }
              />
            </div>
            <div>
              <label htmlFor="expDate">Expected Delivery</label>
              <TextInput
                id="expDate"
                type="date"
                value={expectedDelivery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setExpectedDelivery(e.target.value)
                }
              />
            </div>
          </div>

          <div
            style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}
          >
            <div>
              <label>Supplier</label>
              <Select
                data={suppliers.map((s: Supplier) => ({
                  value: String(s._id),
                  label: `${s.name} — ${s.city}`,
                }))}
                value={supplierId}
                onChange={(v) => setSupplierId(v ?? "")}
                placeholder={
                  suppliers.length === 0
                    ? "No suppliers found"
                    : "Select supplier"
                }
                searchable
                required
              />
            </div>
            <div>
              <label>Supplier Details</label>
              {selectedSupplier ? (
                <Card
                  shadow="xs"
                  padding="md"
                  radius="md"
                  withBorder
                  style={{ background: "#f8fafc", marginTop: 4 }}
                >
                  <div style={{ marginBottom: 6 }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <Text fw={600} size="md" color="blue.8">
                        {selectedSupplier.name}
                      </Text>
                      {selectedSupplier.paymentType && (
                        <Badge
                          color={
                            selectedSupplier.paymentType === "Credit"
                              ? "green"
                              : "red"
                          }
                          variant="filled"
                          size="sm"
                        >
                          {selectedSupplier.paymentType}
                        </Badge>
                      )}
                    </div>
                    <Text size="sm" c="gray.7">
                      {selectedSupplier.address}
                    </Text>
                    <Text size="sm" c="gray.7">
                      {selectedSupplier.city}
                    </Text>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      flexWrap: "wrap",
                      marginTop: 8,
                    }}
                  >
                    <Badge color="gray" variant="light">
                      Opening Balance:{" "}
                      <span style={{ color: "#0a0" }}>
                        &nbsp;
                        {typeof selectedSupplier.openingBalance !== "undefined"
                          ? selectedSupplier.openingBalance
                          : "-"}
                      </span>
                    </Badge>
                    <Badge color="green" variant="light">
                      Credit:{" "}
                      <span style={{ color: "#0a0" }}>
                        &nbsp;
                        {typeof (selectedSupplier as Supplier).Credit !==
                        "undefined"
                          ? (selectedSupplier as Supplier).Credit
                          : "-"}
                      </span>
                    </Badge>
                    <Badge color="red" variant="light">
                      Debit:{" "}
                      <span style={{ color: "#c00" }}>
                        &nbsp;
                        {typeof (selectedSupplier as Supplier).Debit !==
                        "undefined"
                          ? (selectedSupplier as Supplier).Debit
                          : "-"}
                      </span>
                    </Badge>
                  </div>
                </Card>
              ) : (
                <Card
                  shadow="xs"
                  padding="md"
                  radius="md"
                  withBorder
                  style={{ background: "#f8fafc", marginTop: 4 }}
                >
                  <Text size="sm" c="gray.6">
                    No supplier selected
                  </Text>
                </Card>
              )}
            </div>
          </div>

          <div>
            <Group justify="space-between" my={20}>
              <Title order={4}>Products</Title>
              <Button
                variant="subtle"
                size="sm"
                onClick={() =>
                  setProducts((prev) => [
                    ...prev,
                    {
                      id: crypto.randomUUID(),
                      productId: "",
                      productName: "Select product",
                      quantity: 1,
                      rate: 0,
                      unit: "pcs",
                      color: "",
                      thickness: "",
                      length: 0,
                      grossAmount: 0,
                      percent: 0,
                      discountAmount: 0,
                      netAmount: 0,
                      amount: 0,
                    },
                  ])
                }
              >
                + Add Row
              </Button>
            </Group>
            <div style={{ overflowX: "auto" }}>
              <Table style={{ width: "100%", borderCollapse: "collapse" }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ textAlign: "left", padding: 8 }}>
                      Item
                    </Table.Th>
                    <Table.Th
                      style={{ textAlign: "left", padding: 8, width: 120 }}
                    >
                      Color
                    </Table.Th>
                    <Table.Th
                      style={{ textAlign: "left", padding: 8, width: 120 }}
                    >
                      Thickness
                    </Table.Th>
                    <Table.Th
                      style={{ textAlign: "left", padding: 8, width: 120 }}
                    >
                      Length
                    </Table.Th>
                    <Table.Th
                      style={{ textAlign: "right", padding: 8, width: 100 }}
                    >
                      Qty
                    </Table.Th>
                    <Table.Th
                      style={{ textAlign: "right", padding: 8, width: 120 }}
                    >
                      Rate
                    </Table.Th>
                    <Table.Th
                      style={{ textAlign: "right", padding: 8, width: 120 }}
                    >
                      Amount
                    </Table.Th>
                    <Table.Th
                      style={{ textAlign: "right", padding: 8, width: 80 }}
                    >
                      Action
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {products.map((it) => {
                    const length = Number(it.length) || 1;
                    const rate = Number(it.rate) || 0;
                    const qty = Number(it.quantity) || 0;
                    const lineTotal = length * rate * qty;
                    return (
                      <Table.Tr key={it.id}>
                        <Table.Td style={{ padding: 8 }}>
                          <Select
                            searchable
                            data={inventory.map((p: InventoryItem) => ({
                              value: String(p._id),
                              label: p.itemName,
                            }))}
                            value={
                              it.productName &&
                              inventory.some(
                                (p) => p.itemName === it.productName
                              )
                                ? inventory.find(
                                    (p) => p.itemName === it.productName
                                  )?._id
                                : ""
                            }
                            onChange={(val) => {
                              const prod = inventory.find(
                                (p: InventoryItem) =>
                                  String(p._id) === String(val)
                              );
                              setProducts((prev) =>
                                prev.map((row) =>
                                  row.id === it.id && prod
                                    ? {
                                        ...row,
                                        productName: prod.itemName || "",
                                        rate: prod.salesRate || 0,
                                        length: prod.length ?? undefined,
                                      }
                                    : row
                                )
                              );
                            }}
                            placeholder="Select product"
                          />
                        </Table.Td>
                        
                        <Table.Td style={{ padding: 8 }}>
                          <TextInput
                            value={String(it.length ?? "")}
                            onChange={(e) =>
                              setProducts((prev) =>
                                prev.map((row) =>
                                  row.id === it.id
                                    ? { ...row, length: e.target.value }
                                    : row
                                )
                              )
                            }
                            placeholder="Length"
                          />
                        </Table.Td>
                        <Table.Td style={{ padding: 8, textAlign: "right" }}>
                          <NumberInput
                            value={it.quantity === 0 ? "" : it.quantity}
                            onChange={(v) =>
                              setProducts((prev) =>
                                prev.map((row) =>
                                  row.id === it.id
                                    ? {
                                        ...row,
                                        quantity: v === "" ? 1 : Number(v),
                                      }
                                    : row
                                )
                              )
                            }
                            min={1}
                          />
                        </Table.Td>
                        <Table.Td style={{ padding: 8 }}>
                          <NumberInput
                            value={it.rate === 0 ? "" : it.rate}
                            onChange={(v) =>
                              setProducts((prev) =>
                                prev.map((row) =>
                                  row.id === it.id
                                    ? {
                                        ...row,
                                        rate: v === "" ? 0 : Number(v),
                                      }
                                    : row
                                )
                              )
                            }
                            min={0}
                          />
                        </Table.Td>
                        <Table.Td style={{ padding: 8, textAlign: "right" }}>
                          {formatCurrency(lineTotal)}
                        </Table.Td>
                        <Table.Td style={{ padding: 8, textAlign: "right" }}>
                          <Button
                            variant="subtle"
                            onClick={() =>
                              setProducts((prev) =>
                                prev.filter((r) => r.id !== it.id)
                              )
                            }
                          >
                            <Trash2 size={14} />
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </div>
          </div>

          <div>
            <label>Remarks</label>
            <Textarea
              value={remarks}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setRemarks(e.target.value)
              }
              minRows={3}
            />
          </div>
        </div>

        <div
          style={{
            padding: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 13, color: "#666" }}>
            Date: {formatDate(new Date(invoiceDate))}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "#777" }}>Subtotal</div>
            <div style={{ fontSize: 14 }}>{formatCurrency(subTotal)}</div>
            {/* GST removed */}
            <div style={{ fontSize: 12, color: "#777", marginTop: 8 }}>
              Total
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>
              {formatCurrency(total)}
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Button type="button" variant="outline" onClick={() => window.print()}>
          Print
        </Button>
        <Button type="submit" onClick={handleSubmit}>
          Save Invoice
        </Button>
      </div>
    </form>
  );
}
