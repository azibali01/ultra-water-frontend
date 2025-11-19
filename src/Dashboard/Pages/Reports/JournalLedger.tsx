import { useMemo, useState, useEffect } from "react";
import {
  Title,
  Text,
  Card,
  Group,
  ScrollArea,
  Select,
  TextInput,
  Button,
  Badge,
  Stack,
  Tabs,
  Pagination,
  MultiSelect,
} from "@mantine/core";
import { IconPrinter } from "@tabler/icons-react";
import Table from "../../../lib/AppTable";
import { useDataContext } from "../../Context/DataContext";
import { formatCurrency, formatDate } from "../../../lib/format-utils";
import { Search, RefreshCw } from "lucide-react";
import { openJournalLedgerPrintWindow } from "../../../components/print/printJournalLedger";
import type { JournalLedgerData, JournalLedgerEntry } from "../../../components/print/printJournalLedger";

type LedgerEntry = {
  id: string;
  date: string | Date;
  documentType: "Sale Invoice" | "Purchase Invoice" | "Receipt" | "Payment";
  documentNumber: string;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
  customerOrSupplier: string;
  customerOrSupplierId: string;
};

export default function JournalLedger() {
  const {
    sales = [],
    purchases = [],
    customers = [],
    suppliers = [],
    receiptVouchers = [],
    paymentVouchers = [],
    loadSales,
    loadPurchases,
    loadCustomers,
    loadSuppliers,
    loadReceiptVouchers,
    loadPaymentVouchers,
  } = useDataContext();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>("all");
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<string>("25");

  // Load data on mount
  useEffect(() => {
    if (typeof loadSales === "function") loadSales().catch(() => {});
    if (typeof loadPurchases === "function") loadPurchases().catch(() => {});
    if (typeof loadCustomers === "function") loadCustomers().catch(() => {});
    if (typeof loadSuppliers === "function") loadSuppliers().catch(() => {});
    if (typeof loadReceiptVouchers === "function")
      loadReceiptVouchers().catch(() => {});
    if (typeof loadPaymentVouchers === "function")
      loadPaymentVouchers().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate ledger entries from sales, purchases, receipts, and payments
  const allEntries = useMemo(() => {
    const entries: LedgerEntry[] = [];
    const seenIds = new Set<string>();

    // Add sales invoices (Debit for customers)
    sales.forEach((sale) => {
      const uniqueId = `sale-${sale.id}`;
      // Skip if we've already processed this sale
      if (seenIds.has(uniqueId)) return;
      seenIds.add(uniqueId);

      const customer = Array.isArray(sale.customer)
        ? sale.customer[0]
        : sale.customer;
      const customerId = customer?.id || sale.customerId;
      const customerName =
        customer?.name || sale.customerName || "Unknown Customer";

      entries.push({
        id: uniqueId,
        date: sale.invoiceDate || sale.date || new Date(),
        documentType: "Sale Invoice",
        documentNumber: sale.invoiceNumber || String(sale.id),
        particulars: `Sale to ${customerName}`,
        debit: sale.total || sale.totalNetAmount || 0,
        credit: 0,
        balance: 0, // Will be calculated later
        customerOrSupplier: customerName,
        customerOrSupplierId: String(customerId || ""),
      });
    });

    // Add purchase invoices (Credit for suppliers)
    purchases.forEach((purchase) => {
      const uniqueId = `purchase-${purchase.id}`;
      // Skip if we've already processed this purchase
      if (seenIds.has(uniqueId)) return;
      seenIds.add(uniqueId);

      const supplier = purchase.supplier;
      const supplierId = supplier?._id || "";
      const supplierName = supplier?.name || "Unknown Supplier";

      // Calculate total from purchase.total, subTotal, or sum of products
      let purchaseTotal = purchase.total || purchase.subTotal || 0;

      // If still 0, try to calculate from products
      if (
        purchaseTotal === 0 &&
        purchase.products &&
        Array.isArray(purchase.products)
      ) {
        purchaseTotal = purchase.products.reduce((sum, product) => {
          const amount = product.amount || product.quantity * product.rate || 0;
          return sum + amount;
        }, 0);
      }

      entries.push({
        id: uniqueId,
        date: purchase.poDate || new Date(),
        documentType: "Purchase Invoice",
        documentNumber: purchase.poNumber || String(purchase.id),
        particulars: `Purchase from ${supplierName}`,
        debit: 0,
        credit: purchaseTotal,
        balance: 0, // Will be calculated later
        customerOrSupplier: supplierName,
        customerOrSupplierId: String(supplierId),
      });
    });

    // Add receipt vouchers (Credit for cash received from customers)
    receiptVouchers.forEach((receipt) => {
      const uniqueId = `receipt-${receipt.id}`;
      if (seenIds.has(uniqueId)) return;
      seenIds.add(uniqueId);

      entries.push({
        id: uniqueId,
        date: receipt.voucherDate || new Date(),
        documentType: "Receipt",
        documentNumber: receipt.voucherNumber || String(receipt.id),
        particulars: `Receipt from ${receipt.receivedFrom}`,
        debit: 0,
        credit: receipt.amount || 0,
        balance: 0, // Will be calculated later
        customerOrSupplier: receipt.receivedFrom,
        customerOrSupplierId: "",
      });
    });

    // Add payment vouchers (Debit for cash paid to suppliers)
    paymentVouchers.forEach((payment) => {
      const uniqueId = `payment-${payment.id}`;
      if (seenIds.has(uniqueId)) return;
      seenIds.add(uniqueId);

      entries.push({
        id: uniqueId,
        date: payment.voucherDate || new Date(),
        documentType: "Payment",
        documentNumber: payment.voucherNumber || String(payment.id),
        particulars: `Payment to ${payment.paidTo}`,
        debit: payment.amount || 0,
        credit: 0,
        balance: 0, // Will be calculated later
        customerOrSupplier: payment.paidTo,
        customerOrSupplierId: "",
      });
    });

    // Sort by date
    entries.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });

    return entries;
  }, [sales, purchases, receiptVouchers, paymentVouchers]);

  // Filter entries based on search and selected entity
  const filteredEntries = useMemo(() => {
    let filtered = allEntries;

    // Filter by tab (customers/suppliers/all)
    if (activeTab === "customers") {
      filtered = filtered.filter(
        (entry) =>
          entry.documentType.includes("Sale") ||
          entry.documentType === "Receipt"
      );
    } else if (activeTab === "suppliers") {
      filtered = filtered.filter(
        (entry) =>
          entry.documentType.includes("Purchase") ||
          entry.documentType === "Payment"
      );
    }

    // Filter by selected entity
    if (selectedEntity) {
      // Extract entity name from the selected value
      const entityType = selectedEntity.startsWith("customer-")
        ? "customer"
        : "supplier";
      const entityId = selectedEntity.replace(/^(customer-|supplier-)/, "");

      let entityName = "";
      if (entityType === "customer") {
        const customer = customers.find((c) => c._id === entityId);
        entityName = customer?.name || "";
      } else {
        const supplier = suppliers.find((s) => s._id === entityId);
        entityName = supplier?.name || "";
      }

      filtered = filtered.filter(
        (entry) => entry.customerOrSupplier === entityName
      );
    }

    // Filter by document types
    if (selectedDocTypes.length > 0) {
      filtered = filtered.filter((entry) =>
        selectedDocTypes.includes(entry.documentType)
      );
    }

    // Filter by date range
    if (fromDate) {
      const startDate = new Date(fromDate);
      filtered = filtered.filter((entry) => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate;
      });
    }

    if (toDate) {
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999); // Include the entire end date
      filtered = filtered.filter((entry) => {
        const entryDate = new Date(entry.date);
        return entryDate <= endDate;
      });
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          entry.documentNumber.toLowerCase().includes(term) ||
          entry.particulars.toLowerCase().includes(term) ||
          entry.customerOrSupplier.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [
    allEntries,
    searchTerm,
    selectedEntity,
    activeTab,
    customers,
    suppliers,
    selectedDocTypes,
    fromDate,
    toDate,
  ]);

  // Calculate running balance
  const entriesWithBalance = useMemo(() => {
    let runningBalance = 0;

    // Get opening balance for selected entity
    if (selectedEntity) {
      const entityType = selectedEntity.startsWith("customer-")
        ? "customer"
        : "supplier";
      const entityId = selectedEntity.replace(/^(customer-|supplier-)/, "");

      if (entityType === "customer") {
        const customer = customers.find((c) => c._id === entityId);
        runningBalance = customer?.openingAmount || 0;
      } else {
        const supplier = suppliers.find((s) => s._id === entityId);
        runningBalance = supplier?.openingBalance || 0;
      }
    }

    return filteredEntries.map((entry) => {
      runningBalance += entry.debit - entry.credit;
      return {
        ...entry,
        balance: runningBalance,
      };
    });
  }, [filteredEntries, selectedEntity, customers, suppliers]);

  // Get customer and supplier options for dropdown
  const entityOptions = useMemo(() => {
    const customerOptions = customers.map((c) => ({
      value: `customer-${c._id}`,
      label: `${c.name} (Customer)`,
      name: c.name,
      type: "customer" as const,
    }));

    const supplierOptions = suppliers.map((s) => ({
      value: `supplier-${s._id}`,
      label: `${s.name} (Supplier)`,
      name: s.name,
      type: "supplier" as const,
    }));

    return [
      {
        group: "Customers",
        items: customerOptions,
      },
      {
        group: "Suppliers",
        items: supplierOptions,
      },
    ];
  }, [customers, suppliers]);

  // Pagination logic
  const totalPages = Math.ceil(
    entriesWithBalance.length / parseInt(itemsPerPage)
  );
  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * parseInt(itemsPerPage);
    const endIndex = startIndex + parseInt(itemsPerPage);
    return entriesWithBalance.slice(startIndex, endIndex);
  }, [entriesWithBalance, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedEntity,
    activeTab,
    selectedDocTypes,
    fromDate,
    toDate,
  ]);

  // Document type options for filter
  const documentTypeOptions = [
    { value: "Sale Invoice", label: "Sale Invoice" },
    { value: "Purchase Invoice", label: "Purchase Invoice" },
    { value: "Receipt", label: "Receipt" },
    { value: "Payment", label: "Payment" },
  ];

  // Calculate totals
  const totals = useMemo(() => {
    const totalDebit = entriesWithBalance.reduce(
      (sum, entry) => sum + entry.debit,
      0
    );
    const totalCredit = entriesWithBalance.reduce(
      (sum, entry) => sum + entry.credit,
      0
    );
    const closingBalance =
      entriesWithBalance.length > 0
        ? entriesWithBalance[entriesWithBalance.length - 1].balance
        : 0;

    return { totalDebit, totalCredit, closingBalance };
  }, [entriesWithBalance]);

  // Get opening balance
  const openingBalance = useMemo(() => {
    if (!selectedEntity) return 0;

    const entityType = selectedEntity.startsWith("customer-")
      ? "customer"
      : "supplier";
    const entityId = selectedEntity.replace(/^(customer-|supplier-)/, "");

    if (entityType === "customer") {
      const customer = customers.find((c) => c._id === entityId);
      return customer?.openingAmount || 0;
    } else {
      const supplier = suppliers.find((s) => s._id === entityId);
      return supplier?.openingBalance || 0;
    }
  }, [selectedEntity, customers, suppliers]);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Group justify="space-between" align="center">
        <div>
          <Title order={2}>Journal Ledger</Title>
          <Text size="sm" c="dimmed">
            View all transactions with customers and suppliers
          </Text>
        </div>
        <Group>
          <Button
            leftSection={<IconPrinter size={16} />}
            variant="filled"
            color="blue"
            onClick={() => {
              const printEntries: JournalLedgerEntry[] = entriesWithBalance.map((entry) => ({
                id: entry.id,
                date: entry.date,
                documentType: entry.documentType,
                documentNumber: entry.documentNumber,
                particulars: entry.particulars,
                debit: entry.debit,
                credit: entry.credit,
                balance: entry.balance,
                customerOrSupplier: entry.customerOrSupplier,
              }));

              const selectedEntityName: string | undefined = selectedEntity
                ? (() => {
                    for (const group of entityOptions) {
                      const item = group.items.find((i) => i.value === selectedEntity);
                      if (item) return item.label;
                    }
                    return undefined;
                  })()
                : undefined;

              const printData: JournalLedgerData = {
                title: "Journal Ledger Report",
                companyName: "Ultra Water Technologies",
                reportDate: new Date().toLocaleDateString('en-PK', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }),
                fromDate: fromDate || undefined,
                toDate: toDate || undefined,
                selectedEntity: selectedEntityName,
                entries: printEntries,
                totals: {
                  totalDebit: totals.totalDebit,
                  totalCredit: totals.totalCredit,
                  closingBalance: totals.closingBalance,
                },
              };

              openJournalLedgerPrintWindow(printData);
            }}
          >
            Print Ledger
          </Button>
          <Button
            leftSection={<RefreshCw size={16} />}
            variant="outline"
            onClick={() => {
              if (typeof loadSales === "function") loadSales();
              if (typeof loadPurchases === "function") loadPurchases();
              if (typeof loadCustomers === "function") loadCustomers();
              if (typeof loadSuppliers === "function") loadSuppliers();
            }}
          >
            Refresh
          </Button>
        </Group>
      </Group>

      <Card withBorder shadow="sm" p="md">
        <Stack gap="md">
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="all">All Transactions</Tabs.Tab>
              <Tabs.Tab value="customers">Customers</Tabs.Tab>
              <Tabs.Tab value="suppliers">Suppliers</Tabs.Tab>
            </Tabs.List>
          </Tabs>

          <Group align="flex-end" wrap="wrap">
            <TextInput
              placeholder="Search by document number, particulars, or name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.currentTarget.value);
              }}
              leftSection={<Search size={16} />}
              style={{ flex: 1, minWidth: 250 }}
            />
            <Select
              placeholder="Select customer or supplier"
              data={entityOptions}
              value={selectedEntity}
              onChange={setSelectedEntity}
              searchable
              clearable
              style={{ minWidth: 250 }}
            />
            <MultiSelect
              placeholder="Filter by document type"
              data={documentTypeOptions}
              value={selectedDocTypes}
              onChange={setSelectedDocTypes}
              clearable
              style={{ minWidth: 250 }}
            />
            <TextInput
              type="date"
              label="From Date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.currentTarget.value);
              }}
              style={{ minWidth: 150 }}
            />
            <TextInput
              type="date"
              label="To Date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.currentTarget.value);
              }}
              style={{ minWidth: 150 }}
            />
            <Button
              variant="subtle"
              onClick={() => {
                setSearchTerm("");
                setSelectedEntity(null);
                setSelectedDocTypes([]);
                setFromDate("");
                setToDate("");
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          </Group>

          {selectedEntity && (
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">
                  Selected Entity
                </Text>
                <Text fw={600}>
                  {(() => {
                    const entityType = selectedEntity.startsWith("customer-")
                      ? "customer"
                      : "supplier";
                    const entityId = selectedEntity.replace(
                      /^(customer-|supplier-)/,
                      ""
                    );

                    if (entityType === "customer") {
                      const customer = customers.find(
                        (c) => c._id === entityId
                      );
                      return customer?.name || "";
                    } else {
                      const supplier = suppliers.find(
                        (s) => s._id === entityId
                      );
                      return supplier?.name || "";
                    }
                  })()}
                </Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">
                  Opening Balance
                </Text>
                <Text fw={600} c={openingBalance >= 0 ? "green" : "red"}>
                  {formatCurrency(Math.abs(openingBalance))}{" "}
                  {openingBalance >= 0 ? "(CR)" : "(DR)"}
                </Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">
                  Closing Balance
                </Text>
                <Text fw={600} c={totals.closingBalance >= 0 ? "green" : "red"}>
                  {formatCurrency(Math.abs(totals.closingBalance))}{" "}
                  {totals.closingBalance >= 0 ? "(CR)" : "(DR)"}
                </Text>
              </div>
            </Group>
          )}

          <Group justify="space-between">
            <Stack gap={0}>
              <Text fw={600}>Journal Ledger Entries</Text>
              <Text size="sm" c="dimmed">
                Showing {paginatedEntries.length} of {entriesWithBalance.length}{" "}
                entries
              </Text>
            </Stack>
            <Group>
              <Select
                value={itemsPerPage}
                onChange={(value) => {
                  setItemsPerPage(value || "25");
                  setCurrentPage(1);
                }}
                data={[
                  { value: "10", label: "10 per page" },
                  { value: "25", label: "25 per page" },
                  { value: "50", label: "50 per page" },
                  { value: "100", label: "100 per page" },
                ]}
                style={{ width: 140 }}
              />
              <div>
                <Text size="xs" c="dimmed">
                  Total Debit
                </Text>
                <Text fw={600} c="blue">
                  {formatCurrency(totals.totalDebit)}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  Total Credit
                </Text>
                <Text fw={600} c="orange">
                  {formatCurrency(totals.totalCredit)}
                </Text>
              </div>
            </Group>
          </Group>
        </Stack>
      </Card>

      <Card>
        <ScrollArea>
          <Table
            highlightOnHover
            withRowBorders
            withColumnBorders
            withTableBorder
          >
            <Table.Thead
              style={{ background: "var(--mantine-color-gray-1, #f8f9fa)" }}
            >
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Document Type</Table.Th>
                <Table.Th>Document No.</Table.Th>
                <Table.Th>Particulars</Table.Th>
                <Table.Th>Customer/Supplier</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Debit</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Credit</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Balance</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {selectedEntity && openingBalance !== 0 && (
                <Table.Tr style={{ backgroundColor: "#f8f9fa" }}>
                  <Table.Td colSpan={5}>
                    <Text fw={600}>Opening Balance</Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    {openingBalance < 0
                      ? formatCurrency(Math.abs(openingBalance))
                      : "-"}
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    {openingBalance >= 0 ? formatCurrency(openingBalance) : "-"}
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right", fontWeight: 600 }}>
                    {formatCurrency(Math.abs(openingBalance))}{" "}
                    {openingBalance >= 0 ? "CR" : "DR"}
                  </Table.Td>
                </Table.Tr>
              )}
              {paginatedEntries.map((entry) => (
                <Table.Tr key={entry.id}>
                  <Table.Td>{formatDate(entry.date)}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        entry.documentType === "Sale Invoice"
                          ? "blue"
                          : entry.documentType === "Purchase Invoice"
                          ? "orange"
                          : entry.documentType === "Receipt"
                          ? "green"
                          : "red"
                      }
                      size="sm"
                    >
                      {entry.documentType}
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ fontFamily: "monospace" }}>
                    {entry.documentNumber}
                  </Table.Td>
                  <Table.Td>{entry.particulars}</Table.Td>
                  <Table.Td>{entry.customerOrSupplier}</Table.Td>
                  <Table.Td style={{ textAlign: "right", color: "#1971c2" }}>
                    {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right", color: "#f76707" }}>
                    {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                  </Table.Td>
                  <Table.Td
                    style={{
                      textAlign: "right",
                      fontWeight: 600,
                      color: entry.balance >= 0 ? "#2f9e44" : "#e03131",
                    }}
                  >
                    {formatCurrency(Math.abs(entry.balance))}{" "}
                    {entry.balance >= 0 ? "CR" : "DR"}
                  </Table.Td>
                </Table.Tr>
              ))}
              {entriesWithBalance.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={8} style={{ textAlign: "center" }}>
                    <Text c="dimmed">No entries found</Text>
                  </Table.Td>
                </Table.Tr>
              )}
              {entriesWithBalance.length > 0 && (
                <Table.Tr style={{ backgroundColor: "#f8f9fa" }}>
                  <Table.Td colSpan={5}>
                    <Text fw={700}>Total</Text>
                  </Table.Td>
                  <Table.Td
                    style={{
                      textAlign: "right",
                      fontWeight: 700,
                      color: "#1971c2",
                    }}
                  >
                    {formatCurrency(totals.totalDebit)}
                  </Table.Td>
                  <Table.Td
                    style={{
                      textAlign: "right",
                      fontWeight: 700,
                      color: "#f76707",
                    }}
                  >
                    {formatCurrency(totals.totalCredit)}
                  </Table.Td>
                  <Table.Td
                    style={{
                      textAlign: "right",
                      fontWeight: 700,
                      color: totals.closingBalance >= 0 ? "#2f9e44" : "#e03131",
                    }}
                  >
                    {formatCurrency(Math.abs(totals.closingBalance))}{" "}
                    {totals.closingBalance >= 0 ? "CR" : "DR"}
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        {totalPages > 1 && (
          <Group justify="center" mt="md">
            <Pagination
              value={currentPage}
              onChange={setCurrentPage}
              total={totalPages}
              size="sm"
              withEdges
            />
          </Group>
        )}
      </Card>
    </div>
  );
}
