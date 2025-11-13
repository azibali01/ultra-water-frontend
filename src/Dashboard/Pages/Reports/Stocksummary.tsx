import { useDataContext } from "../../Context/DataContext";
import { Table, Title, Text, Group, Select, Pagination } from "@mantine/core";
import { sanitizeItemName } from "../../../lib/format-utils";
import { useMemo, useState } from "react";

function getLastTransaction(
  item: any,
  transactions: any[],
  type: "sale" | "purchase"
): any | null {
  // type: 'sale' or 'purchase'
  let last: any = null;
  let lastDate: Date | null = null;
  for (const tx of transactions) {
    const txItems: any[] =
      (type === "sale" ? tx.items || tx.products : tx.products) || [];
    const match = txItems.find(
      (it: any) =>
        String(
          it._id ?? it.id ?? it.productId ?? it.productName ?? it.sku ?? ""
        ) === String(item._id) ||
        String(it.productName ?? it.itemName ?? "") === String(item.itemName)
    );
    if (match) {
      const date = new Date(
        tx.invoiceDate || tx.date || tx.poDate || tx.createdAt || 0
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

  return (
    <div>
      <Group justify="space-between" mb="md">
        <div>
          <Title order={2}>Stock Summary</Title>
          <Text size="sm" c="dimmed">
            Showing {paginatedInventory.length} of {inventory.length} items
          </Text>
        </div>
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
                    <Text color="dimmed">—</Text>
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
                    <Text color="dimmed">—</Text>
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
