"use client";

import { useMemo, useEffect, useState } from "react";
import {
  Title,
  Text,
  Divider,
  ScrollArea,
  Grid,
  Card,
  Group,
  Button,
} from "@mantine/core";
import { TextInput } from "@mantine/core";
import Table from "../../../lib/AppTable";
import { useDataContext } from "../../Context/DataContext";
import type {
  SaleRecord,
  PurchaseInvoiceRecord,
  Expense,
} from "../../Context/DataContext";
import { formatCurrency, formatDate } from "../../../lib/format-utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function ProfitLoss() {
  // Date range state
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const {
    sales = [],
    purchaseInvoices = [],
    expenses = [],
    loadSales,
    loadPurchaseInvoices,
    loadExpenses,
  } = useDataContext();

  // Filtered data by date range
  const filtered = useMemo(() => {
    const start = fromDate ? new Date(fromDate) : null;
    const end = toDate ? new Date(toDate) : null;
    const inRange = (d: Date | string | undefined) => {
      if (!d) return false;
      const dt = d instanceof Date ? d : new Date(d);
      if (start && dt < start) return false;
      if (end && dt > end) return false;
      return true;
    };
    return {
      sales:
        start || end ? sales.filter((s: SaleRecord) => inRange(s.date)) : sales,
      purchaseInvoices:
        start || end
          ? purchaseInvoices.filter((p: PurchaseInvoiceRecord) =>
              inRange(p.invoiceDate)
            )
          : purchaseInvoices,
      expenses:
        start || end
          ? expenses.filter((e: Expense) => inRange(e.date))
          : expenses,
    };
  }, [sales, purchaseInvoices, expenses, fromDate, toDate]);

  useEffect(() => {
    // load the heavy datasets lazily when this report page mounts
    if (typeof loadSales === "function") loadSales().catch(() => {});
    if (typeof loadPurchaseInvoices === "function")
      loadPurchaseInvoices().catch(() => {});
    if (typeof loadExpenses === "function") loadExpenses().catch(() => {});
  }, [loadSales, loadPurchaseInvoices, loadExpenses]);
  // simple aggregations ignoring tax/COGS details
  const totals = useMemo(() => {
    const sTotal = filtered.sales.reduce((acc: number, r: SaleRecord) => {
      // Use total, totalNetAmount, or totalGrossAmount as fallback
      const saleTotal = r.total || r.totalNetAmount || r.totalGrossAmount || 0;
      return acc + saleTotal;
    }, 0);
    const pTotal = filtered.purchaseInvoices.reduce(
      (acc: number, r: PurchaseInvoiceRecord) => {
        // Calculate total from purchase invoice.total, subTotal, or sum of products
        let purchaseTotal = 0;

        // Try total first (handle undefined, null, 0)
        if (r.total != null && r.total > 0) {
          purchaseTotal = r.total;
        }
        // Try subTotal if total is not available
        else if (r.subTotal != null && r.subTotal > 0) {
          purchaseTotal = r.subTotal;
        }
        // Calculate from products as last resort
        else if (
          r.products &&
          Array.isArray(r.products) &&
          r.products.length > 0
        ) {
          purchaseTotal = r.products.reduce((sum, product) => {
            const amount =
              product.amount || product.quantity * product.rate || 0;
            return sum + amount;
          }, 0);
        }

        return acc + purchaseTotal;
      },
      0
    );
    const eTotal = filtered.expenses.reduce(
      (acc: number, r: Expense) => acc + (r.amount || 0),
      0
    );
    const grossProfit = sTotal - pTotal;
    const netProfit = grossProfit - eTotal;
    return { sTotal, pTotal, eTotal, grossProfit, netProfit };
  }, [filtered]);

  // monthly aggregates for chart (group by YYYY-MM)
  const monthly = useMemo(() => {
    const map = new Map<
      string,
      { month: string; sales: number; purchases: number }
    >();
    const add = (key: string, type: "sales" | "purchases", amt: number) => {
      const cur = map.get(key) || { month: key, sales: 0, purchases: 0 };
      cur[type] = (cur[type] || 0) + amt;
      map.set(key, cur);
    };
    filtered.sales.forEach((s: SaleRecord) => {
      const dateValue = s.invoiceDate ?? s.date;
      if (!dateValue) return; // Skip if no date
      const d = new Date(dateValue);
      if (isNaN(d.getTime())) return; // Skip if invalid date
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      // Use total, totalNetAmount, or totalGrossAmount as fallback
      const saleTotal = s.total || s.totalNetAmount || s.totalGrossAmount || 0;
      add(key, "sales", saleTotal);
    });
    filtered.purchaseInvoices.forEach((p: PurchaseInvoiceRecord) => {
      if (!p.invoiceDate) return; // Skip if no date
      const d = new Date(p.invoiceDate as string);
      if (isNaN(d.getTime())) return; // Skip if invalid date
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;

      // Calculate total from purchase invoice.total, subTotal, or sum of products
      let purchaseTotal = 0;

      // Try total first (handle undefined, null, 0)
      if (p.total != null && p.total > 0) {
        purchaseTotal = p.total;
      }
      // Try subTotal if total is not available
      else if (p.subTotal != null && p.subTotal > 0) {
        purchaseTotal = p.subTotal;
      }
      // Calculate from products as last resort
      else if (Array.isArray(p.products) && p.products.length > 0) {
        purchaseTotal = p.products.reduce((sum, product) => {
          const amount = product.amount || product.quantity * product.rate || 0;
          return sum + amount;
        }, 0);
      }

      add(key, "purchases", purchaseTotal);
    });
    // sort by month
    return Array.from(map.values()).sort((a, b) =>
      a.month > b.month ? 1 : -1
    );
  }, [filtered]);

  // expenses by categoryType for pie chart
  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    filtered.expenses.forEach((ex: Expense) => {
      const k = ex.categoryType || "Other";
      map.set(k, (map.get(k) || 0) + (ex.amount || 0));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div>
          <Title order={3}>Profit & Loss</Title>
          <Text size="sm" c="dimmed">
            Breakdown by source (table views)
          </Text>
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <Group align="center" mb={8}>
          <TextInput
            type="date"
            label="From Date"
            value={fromDate}
            onChange={(e) => setFromDate(e.currentTarget.value)}
            mx={8}
            style={{ minWidth: 140 }}
          />
          <TextInput
            type="date"
            label="To Date"
            value={toDate}
            onChange={(e) => setToDate(e.currentTarget.value)}
            mx={8}
            style={{ minWidth: 140 }}
          />
          <Button
            size="xs"
            style={{ marginLeft: 4, marginTop: 22 }}
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
          >
            Clear
          </Button>
        </Group>
        <Text
          bg={"#f1f3f5"}
          style={{ fontWeight: 600, border: "1px solid #ced4da" }}
        >
          Summary
        </Text>
        <Table
          withRowBorders
          withColumnBorders
          withTableBorder
          highlightOnHover
        >
          <Table.Tbody>
            <Table.Tr>
              <Table.Td>Sales</Table.Td>
              <Table.Td style={{ textAlign: "right" }}>
                {formatCurrency(totals.sTotal)}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>Purchases</Table.Td>
              <Table.Td style={{ textAlign: "right" }}>
                {formatCurrency(totals.pTotal)}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>Gross Profit (Sales - Purchases)</Table.Td>
              <Table.Td style={{ textAlign: "right" }}>
                {formatCurrency(totals.grossProfit)}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>Expenses</Table.Td>
              <Table.Td style={{ textAlign: "right" }}>
                {formatCurrency(totals.eTotal)}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td style={{ fontWeight: 700 }}>Net Profit</Table.Td>
              <Table.Td style={{ textAlign: "right", fontWeight: 700 }}>
                {formatCurrency(totals.netProfit)}
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </div>

      <Divider my="sm" />

      <div style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: 600, marginBottom: 8 }}>Trends</Text>
        <Grid gutter="md">
          <Grid.Col span={8}>
            <Card withBorder padding="sm">
              <Text size="sm" c="dimmed" style={{ marginBottom: 8 }}>
                Monthly Sales vs Purchases
              </Text>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Bar dataKey="sales" fill="#2b8aef" />
                    <Bar dataKey="purchases" fill="#f03e3e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Grid.Col>

          <Grid.Col span={4}>
            <Card withBorder padding="sm">
              <Text size="sm" c="dimmed" style={{ marginBottom: 8 }}>
                Expenses by Category
              </Text>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={80}
                      label
                    />
                    {expenseByCategory.map((_, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={
                          ["#4dabf7", "#f783ac", "#ffd43b", "#69db7c"][i % 4]
                        }
                      />
                    ))}
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Grid.Col>
        </Grid>
      </div>

      <div style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: 600, marginBottom: 8 }}>Sales (latest)</Text>
        <ScrollArea style={{ maxHeight: 240 }}>
          <Table
            withRowBorders
            withColumnBorders
            withTableBorder
            highlightOnHover
          >
            <Table.Thead style={{ backgroundColor: "#f1f3f5" }}>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Customer</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.sales.map((s: SaleRecord, idx: number) => (
                <Table.Tr key={s.id || s.invoiceNumber || `sale-${idx}`}>
                  <Table.Td>{s.id}</Table.Td>
                  <Table.Td>{formatDate(s.invoiceDate || s.date)}</Table.Td>
                  <Table.Td>
                    {typeof s.customer === "string"
                      ? s.customer
                      : Array.isArray(s.customer)
                      ? (s.customer as { name: string }[])
                          .map((c) => c.name)
                          .join(", ")
                      : (s.customer as { name?: string } | undefined)?.name ??
                        "N/A"}
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    {formatCurrency(
                      s.total || s.totalNetAmount || s.totalGrossAmount || 0
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </div>

      <Divider my="sm" />

      <div style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: 600, marginBottom: 8 }}>
          Purchase Invoices (latest)
        </Text>
        <ScrollArea style={{ maxHeight: 240 }}>
          <Table
            withRowBorders
            withColumnBorders
            withTableBorder
            highlightOnHover
          >
            <Table.Thead style={{ backgroundColor: "#f1f3f5" }}>
              <Table.Tr>
                <Table.Th>Purchase Invoice</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Supplier</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.purchaseInvoices.map((p: PurchaseInvoiceRecord, idx: number) => (
                <Table.Tr key={p.id || p.purchaseInvoiceNumber || `purchase-${idx}`}>
                  <Table.Td>{p.purchaseInvoiceNumber || p.id || "-"}</Table.Td>
                  <Table.Td>{formatDate(p.invoiceDate as string)}</Table.Td>
                  <Table.Td>
                    {typeof p.supplier === "string"
                      ? p.supplier
                      : p.supplier?.name ?? "N/A"}
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    {(() => {
                      // Calculate total from purchase invoice.total, subTotal, or sum of products
                      let purchaseTotal = 0;

                      // Try total first (handle undefined, null, 0)
                      if (p.total != null && p.total > 0) {
                        purchaseTotal = p.total;
                      }
                      // Try subTotal if total is not available
                      else if (p.subTotal != null && p.subTotal > 0) {
                        purchaseTotal = p.subTotal;
                      }
                      // Calculate from products as last resort
                      else if (
                        Array.isArray(p.products) &&
                        p.products.length > 0
                      ) {
                        purchaseTotal = p.products.reduce((sum, product) => {
                          const amount =
                            product.amount ||
                            product.quantity * product.rate ||
                            0;
                          return sum + amount;
                        }, 0);
                      }

                      return formatCurrency(purchaseTotal);
                    })()}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </div>

      <Divider my="sm" />

      <div style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: 600, marginBottom: 8 }}>
          Expenses (latest)
        </Text>
        <ScrollArea style={{ maxHeight: 240 }}>
          <Table
            highlightOnHover
            withRowBorders
            withColumnBorders
            withTableBorder
          >
            <Table.Thead style={{ backgroundColor: "#f1f3f5" }}>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Amount</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.expenses.map((ex: Expense, idx: number) => {
                const key = String(ex.id ?? ex.expenseNumber ?? `expense-${idx}`);
                return (
                  <Table.Tr key={key}>
                    <Table.Td>{ex.expenseNumber || ex.id}</Table.Td>
                    <Table.Td>{formatDate(ex.date as string)}</Table.Td>
                    <Table.Td>{ex.categoryType || "Other"}</Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      {formatCurrency(ex.amount)}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}
