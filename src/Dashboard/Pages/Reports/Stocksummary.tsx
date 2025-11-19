import { useDataContext } from "../../Context/DataContext";
import { Table, Title, Text, Group, Select, Pagination, Button } from "@mantine/core";
import { IconPrinter } from "@tabler/icons-react";
import { sanitizeItemName } from "../../../lib/format-utils";
import { useMemo, useState } from "react";
import { openStockLedgerPrintWindow } from "../../../components/print/printStockLedger";
import type { StockLedgerData, StockLedgerItem } from "../../../components/print/printStockLedger";

type TxItem = {
  _id?: string | number;
  id?: string | number;
  productId?: string | number;
  productName?: string;
  itemName?: string;
  sku?: string;
  quantity?: number;
  received?: number;
  rate?: number;
  salesRate?: number;
  price?: number;
};

type Transaction = {
  items?: TxItem[];
  products?: TxItem[];
  invoiceDate?: string | Date | number;
  date?: string | Date | number;
  poDate?: string | Date | number;
  createdAt?: string | Date | number;
};

type InventoryItem = {
  _id?: string | number;
  id?: string | number;
  itemName?: string;
  // Optional additional properties present on inventory items
  sku?: string;
  metadata?: {
    sku?: string;
  };
  category?: string;
  openingStock?: number;
  stock?: number;
  minimumStockLevel?: number;
};

function getLastTransaction(
  item: InventoryItem,
  transactions: Transaction[],
  type: "sale" | "purchase"
): (TxItem & { date?: Date | null }) | null {
  // type: 'sale' or 'purchase'
  let last: TxItem | null = null;
  let lastDate: Date | null = null;
  for (const tx of transactions) {
    const txItems: TxItem[] =
      (type === "sale" ? tx.items || tx.products : tx.products) || [];
    const match = txItems.find((it) =>
      String(
        it._id ?? it.id ?? it.productId ?? it.productName ?? it.sku ?? ""
      ) === String(item._id) ||
      String(it.productName ?? it.itemName ?? "") === String(item.itemName)
    );
    if (match) {
      const date = new Date(
        (tx.invoiceDate ?? tx.date ?? tx.poDate ?? tx.createdAt) ?? 0
      );
      if (!lastDate || date > lastDate) {
        last = match;
        lastDate = date;
      }
    }
  }
  return last ? { ...last, date: lastDate } : null;
}

export default function Stocksummary() {
  const { inventory = [], sales = [], purchases = [] } = useDataContext();
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<string>("25");

  // Pagination logic
  const totalPages = Math.ceil(inventory.length / parseInt(itemsPerPage));
  const paginatedInventory = useMemo(() => {
    const start = (currentPage - 1) * parseInt(itemsPerPage);
    const end = start + parseInt(itemsPerPage);
    return inventory.slice(start, end);
  }, [inventory, currentPage, itemsPerPage]);

  const handlePrint = () => {
    const stockLedgerItems: StockLedgerItem[] = inventory.map((item, idx) => {
      const lastSale = getLastTransaction(item, sales, "sale");
      const lastPurchase = getLastTransaction(item, purchases, "purchase");
      
      const currentStock = item.openingStock ?? item.stock ?? 0;
      const minLevel = item.minimumStockLevel ?? 0;
      
      let status = "In Stock";
      if (currentStock < 0) {
        status = "Negative Stock";
      } else if (minLevel > 0 && currentStock > 0 && currentStock < minLevel) {
        status = "Low Stock";
      }

      return {
        sr: idx + 1,
        itemName: sanitizeItemName(item.itemName),
        category: item.category ?? undefined,
        openingStock: item.openingStock ?? item.stock ?? 0,
        currentStock: currentStock,
        minimumStockLevel: minLevel > 0 ? minLevel : undefined,
        lastPurchaseQty: lastPurchase?.quantity ?? lastPurchase?.received ?? undefined,
        lastPurchaseRate: lastPurchase?.rate ?? undefined,
        lastPurchaseDate: lastPurchase?.date?.toLocaleDateString?.() ?? undefined,
        lastSaleQty: lastSale?.quantity ?? undefined,
        lastSaleRate: lastSale?.salesRate ?? lastSale?.price ?? undefined,
        lastSaleDate: lastSale?.date?.toLocaleDateString?.() ?? undefined,
        status: status,
      };
    });

    const inStockCount = stockLedgerItems.filter(item => item.status === "In Stock").length;
    const lowStockCount = stockLedgerItems.filter(item => item.status === "Low Stock").length;
    const negativeStockCount = stockLedgerItems.filter(item => item.status === "Negative Stock").length;

    const printData: StockLedgerData = {
      title: "Stock Summary Report",
      companyName: "Ultra Water Technologies",
      reportDate: new Date().toLocaleDateString('en-PK', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      items: stockLedgerItems,
      summary: {
        totalItems: inventory.length,
        inStockItems: inStockCount,
        lowStockItems: lowStockCount,
        negativeStockItems: negativeStockCount,
      },
    };

    openStockLedgerPrintWindow(printData);
  };

  return (
    <div>
      <Group justify="space-between" mb="md">
        <div>
          <Title order={2}>Stock Summary</Title>
          <Text size="sm" c="dimmed">
            Showing {paginatedInventory.length} of {inventory.length} items
          </Text>
        </div>
        <Group>
          <Button
            leftSection={<IconPrinter size={18} />}
            onClick={handlePrint}
            variant="filled"
            color="blue"
          >
            Print Stock Ledger
          </Button>
          <Select
            label="Per page"
            value={itemsPerPage}
            onChange={(val) => {
              setItemsPerPage(val || "25");
              setCurrentPage(1);
            }}
            data={["10", "25", "50", "100"]}
            w={100}
          />
        </Group>
      </Group>
      <Table
        withColumnBorders
        withRowBorders
        striped
        highlightOnHover
        withTableBorder
      >
        <Table.Thead bg={"gray.1"}>
          <Table.Tr>
            <Table.Th>Product</Table.Th>
            <Table.Th>Current Stock</Table.Th>
            <Table.Th>Last Sale</Table.Th>
            <Table.Th>Last Purchase</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {paginatedInventory.map((item) => {
            const lastSale = getLastTransaction(item, sales, "sale");
            const lastPurchase = getLastTransaction(
              item,
              purchases,
              "purchase"
            );
            return (
              <Table.Tr key={item._id}>
                <Table.Td>{sanitizeItemName(item.itemName)}</Table.Td>
                <Table.Td>{item.openingStock ?? item.stock ?? 0}</Table.Td>
                <Table.Td>
                  {lastSale ? (
                    `-${lastSale.quantity ?? 0} @ ${
                      lastSale.salesRate ?? lastSale.price ?? ""
                    } (${lastSale.date?.toLocaleDateString?.() ?? ""})`
                  ) : (
                    <Text c="dimmed">—</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  {lastPurchase ? (
                    `+${
                      lastPurchase.quantity ?? lastPurchase.received ?? 0
                    } @ ${lastPurchase.rate ?? ""} (${
                      lastPurchase.date?.toLocaleDateString?.() ?? ""
                    })`
                  ) : (
                    <Text c="dimmed">—</Text>
                  )}
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
      {totalPages > 1 && (
        <Group justify="center" mt="md" pb="md">
          <Pagination
            value={currentPage}
            onChange={setCurrentPage}
            total={totalPages}
            size="sm"
            withEdges
          />
        </Group>
      )}
    </div>
  );
}
