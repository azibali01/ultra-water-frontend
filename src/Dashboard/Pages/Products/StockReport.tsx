import {
  Card,
  Group,
  Text,
  Title,
  Badge,
  Box,
  Grid,
  Tabs,
  ScrollArea,
  Pagination,
  Select,
  Button,
} from "@mantine/core";
import Table from "../../../lib/AppTable";
import {
  IconAlertTriangle,
  IconPackage,
  IconPackageExport,
  IconPrinter,
} from "@tabler/icons-react";

import { useState, useEffect, useMemo } from "react";
import api from "../../../lib/api";
import type { InventoryItem } from "../../Context/DataContext";
import { openStockLedgerPrintWindow } from "../../../components/print/printStockLedger";
import type { StockLedgerData, StockLedgerItem } from "../../../components/print/printStockLedger";

function formatNumber(n: number | undefined) {
  if (n === undefined || n === null || isNaN(n)) {
    return "0";
  }
  return n.toLocaleString();
}

export default function StockReportPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  // Pagination state for each tab
  const [allPage, setAllPage] = useState(1);
  const [allPerPage, setAllPerPage] = useState<string>("25");
  const [lowPage, setLowPage] = useState(1);
  const [lowPerPage, setLowPerPage] = useState<string>("25");
  const [negPage, setNegPage] = useState(1);
  const [negPerPage, setNegPerPage] = useState<string>("25");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data } = await api.get("products");
        setInventory(Array.isArray(data) ? data : []);
      } catch {
        setInventory([]);
      }
    }
    fetchProducts();
  }, []);

  const products: InventoryItem[] = Array.isArray(inventory) ? inventory : [];
  // Get stock value - prioritize openingStock for new products, then stock for updated products
  const getStockValue = (p: InventoryItem) => {
    const stock = p.openingStock ?? p.stock ?? 0;
    return typeof stock === "number" ? stock : 0;
  };

  // Low stock: stock is positive but less than minimumStockLevel
  const lowStockItems = products.filter((p) => {
    const stock = getStockValue(p);
    const min = p.minimumStockLevel || 0;
    // Only show as low stock if:
    // 1. Stock is positive (> 0)
    // 2. Minimum level is set (> 0)
    // 3. Stock is less than minimum level
    return stock > 0 && min > 0 && stock < min;
  });
  // Negative stock: stock < 0
  const negativeStockItems = products.filter((p) => getStockValue(p) < 0);
  // In stock: stock >= minimumStockLevel (or minimumStockLevel not set)
  const inStockItems = products.filter((p) => {
    const stock = getStockValue(p);
    const min = p.minimumStockLevel || 0;
    // In stock if:
    // 1. Stock is >= 0 (not negative)
    // 2. Either no minimum level set (min = 0) OR stock >= minimum level
    return stock >= 0 && (min === 0 || stock >= min);
  });

  // Pagination for All Items
  const allTotalPages = Math.ceil(products.length / parseInt(allPerPage));
  const allPaginated = useMemo(() => {
    const start = (allPage - 1) * parseInt(allPerPage);
    const end = start + parseInt(allPerPage);
    return products.slice(start, end);
  }, [products, allPage, allPerPage]);

  // Pagination for Low Stock
  const lowTotalPages = Math.ceil(lowStockItems.length / parseInt(lowPerPage));
  const lowPaginated = useMemo(() => {
    const start = (lowPage - 1) * parseInt(lowPerPage);
    const end = start + parseInt(lowPerPage);
    return lowStockItems.slice(start, end);
  }, [lowStockItems, lowPage, lowPerPage]);

  // Pagination for Negative Stock
  const negTotalPages = Math.ceil(
    negativeStockItems.length / parseInt(negPerPage)
  );
  const negPaginated = useMemo(() => {
    const start = (negPage - 1) * parseInt(negPerPage);
    const end = start + parseInt(negPerPage);
    return negativeStockItems.slice(start, end);
  }, [negativeStockItems, negPage, negPerPage]);

  const handlePrint = () => {
    const stockLedgerItems: StockLedgerItem[] = products.map((item, idx) => {
      const currentStock = getStockValue(item);
      const minLevel = item.minimumStockLevel ?? 0;
      
      let status = "In Stock";
      if (currentStock < 0) {
        status = "Negative Stock";
      } else if (minLevel > 0 && currentStock > 0 && currentStock < minLevel) {
        status = "Low Stock";
      }

      return {
        sr: idx + 1,
        itemName: item.itemName ?? "Unknown",
        category: item.category ?? undefined,
        openingStock: item.openingStock ?? item.stock ?? 0,
        currentStock: currentStock,
        minimumStockLevel: minLevel > 0 ? minLevel : undefined,
        status: status,
      };
    });

    const inStockCount = inStockItems.length;
    const lowStockCount = lowStockItems.length;
    const negativeStockCount = negativeStockItems.length;

    const printData: StockLedgerData = {
      title: "Stock Report",
      companyName: "Ultra Water Technologies",
      reportDate: new Date().toLocaleDateString('en-PK', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      items: stockLedgerItems,
      summary: {
        totalItems: products.length,
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
        <Box>
          <Title order={2}>Stock Report</Title>
          <Text color="dimmed">Monitor inventory levels and stock status</Text>
        </Box>
        <Button
          leftSection={<IconPrinter size={18} />}
          onClick={handlePrint}
          variant="filled"
          color="blue"
        >
          Print Stock Report
        </Button>
      </Group>

      <Grid gutter="md" mb="md">
        <Grid.Col span={4}>
          <Card>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={600} c="dimmed">
                In Stock
              </Text>
              <IconPackage size={18} />
            </Group>
            <Text fw={700} size="xl">
              {inStockItems.length}
            </Text>
            <Text size="xs" color="dimmed">
              Items above minimum level
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={4}>
          <Card>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={600} c="dimmed">
                Low Stock
              </Text>
              <IconAlertTriangle size={18} />
            </Group>
            <Text fw={700} size="xl">
              {lowStockItems.length}
            </Text>
            <Text size="xs" color="dimmed">
              Items below minimum level
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={4}>
          <Card>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={600} c="dimmed">
                Negative Stock
              </Text>
              <IconPackageExport size={18} />
            </Group>
            <Text fw={700} size="xl">
              {negativeStockItems.length}
            </Text>
            <Text size="xs" color="dimmed">
              Items with minus balance
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

      <Tabs defaultValue="all">
        <Tabs.List>
          <Tabs.Tab value="all">All Items ({products.length})</Tabs.Tab>
          <Tabs.Tab value="low">Low Stock ({lowStockItems.length})</Tabs.Tab>
          <Tabs.Tab value="negative">
            Negative ({negativeStockItems.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="all" pt="md">
          <Card>
            <Card.Section>
              <Box p="md">
                <Group justify="space-between">
                  <div>
                    <Text size="lg" fw={600} mb="xs">
                      All Products
                    </Text>
                    <Text size="sm" color="dimmed">
                      Showing {allPaginated.length} of {products.length} items
                    </Text>
                  </div>
                  <Select
                    label="Per page"
                    value={allPerPage}
                    onChange={(val) => {
                      setAllPerPage(val || "25");
                      setAllPage(1);
                    }}
                    data={["10", "25", "50", "100"]}
                    w={100}
                  />
                </Group>
              </Box>
            </Card.Section>
            <Card.Section>
              <ScrollArea>
                <Table verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Sr No.</Table.Th>
                      <Table.Th>Item Name</Table.Th>
                      <Table.Th>Category</Table.Th>
                      <Table.Th style={{ textAlign: "right" }}>
                        Current Stock
                      </Table.Th>
                      <Table.Th style={{ textAlign: "right" }}>
                        Min. Level
                      </Table.Th>
                      <Table.Th>Status</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {allPaginated.map((product, index) => (
                      <Table.Tr key={product._id}>
                        <Table.Td style={{ fontFamily: "monospace" }}>
                          {(allPage - 1) * parseInt(allPerPage) + index + 1}
                        </Table.Td>
                        <Table.Td>{product.itemName}</Table.Td>
                        <Table.Td>
                          <Badge>{product.category}</Badge>
                        </Table.Td>
                        <Table.Td
                          style={{ textAlign: "right", fontWeight: 600 }}
                        >
                          {formatNumber(product.openingStock ?? product.stock)}
                        </Table.Td>
                        <Table.Td style={{ textAlign: "right", color: "#666" }}>
                          {formatNumber(product.minimumStockLevel)}
                        </Table.Td>
                        <Table.Td>
                          {getStockValue(product) < 0 ? (
                            <Badge color="red">Negative</Badge>
                          ) : (product.minimumStockLevel || 0) > 0 &&
                            getStockValue(product) < (product.minimumStockLevel || 0) ? (
                            <Badge color="yellow">Low Stock</Badge>
                          ) : (
                            <Badge color="green">In Stock</Badge>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Card.Section>
            {allTotalPages > 1 && (
              <Group justify="center" mt="md" pb="md">
                <Pagination
                  value={allPage}
                  onChange={setAllPage}
                  total={allTotalPages}
                  size="sm"
                  withEdges
                />
              </Group>
            )}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="low" pt="md">
          <Card>
            <Card.Section>
              <Box p="md">
                <Group justify="space-between">
                  <div>
                    <Text size="lg" fw={600} mb="xs">
                      Low Stock Items
                    </Text>
                    <Text size="sm" c="dimmed">
                      Showing {lowPaginated.length} of {lowStockItems.length}{" "}
                      items
                    </Text>
                  </div>
                  <Select
                    label="Per page"
                    value={lowPerPage}
                    onChange={(val) => {
                      setLowPerPage(val || "25");
                      setLowPage(1);
                    }}
                    data={["10", "25", "50", "100"]}
                    w={100}
                  />
                </Group>
              </Box>
            </Card.Section>
            <Card.Section>
              <ScrollArea>
                <Table verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Sr No.</Table.Th>
                      <Table.Th>Item Name</Table.Th>
                      <Table.Th>Category</Table.Th>
                      <Table.Th style={{ textAlign: "right" }}>
                        Current Stock
                      </Table.Th>
                      <Table.Th style={{ textAlign: "right" }}>
                        Min. Level
                      </Table.Th>
                      <Table.Th style={{ textAlign: "right" }}>
                        Shortfall
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {lowPaginated.map((product, index) => (
                      <Table.Tr key={product._id}>
                        <Table.Td style={{ fontFamily: "monospace" }}>
                          {(lowPage - 1) * parseInt(lowPerPage) + index + 1}
                        </Table.Td>
                        <Table.Td>{product.itemName}</Table.Td>
                        <Table.Td>
                          <Badge>{product.category}</Badge>
                        </Table.Td>
                        <Table.Td
                          style={{
                            textAlign: "right",
                            color: "#c92a2a",
                            fontWeight: 600,
                          }}
                        >
                          {formatNumber(getStockValue(product))}
                        </Table.Td>
                        <Table.Td style={{ textAlign: "right", color: "#666" }}>
                          {formatNumber(product.minimumStockLevel)}
                        </Table.Td>
                        <Table.Td
                          style={{
                            textAlign: "right",
                            color: "#c92a2a",
                            fontWeight: 600,
                          }}
                        >
                          {formatNumber(
                            (product.minimumStockLevel || 0) -
                              getStockValue(product)
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Card.Section>
            {lowTotalPages > 1 && (
              <Group justify="center" mt="md" pb="md">
                <Pagination
                  value={lowPage}
                  onChange={setLowPage}
                  total={lowTotalPages}
                  size="sm"
                  withEdges
                />
              </Group>
            )}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="negative" pt="md">
          <Card>
            <Card.Section>
              <Box p="md">
                <Group justify="space-between">
                  <div>
                    <Text size="lg" fw={600} mb="xs">
                      Negative Stock Items
                    </Text>
                    <Text size="sm" c="dimmed">
                      Showing {negPaginated.length} of{" "}
                      {negativeStockItems.length} items
                    </Text>
                  </div>
                  <Select
                    label="Per page"
                    value={negPerPage}
                    onChange={(val) => {
                      setNegPerPage(val || "25");
                      setNegPage(1);
                    }}
                    data={["10", "25", "50", "100"]}
                    w={100}
                  />
                </Group>
              </Box>
            </Card.Section>
            <Card.Section>
              <ScrollArea>
                <Table verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Sr No.</Table.Th>
                      <Table.Th>Item Name</Table.Th>
                      <Table.Th>Category</Table.Th>
                      <Table.Th style={{ textAlign: "right" }}>
                        Current Stock
                      </Table.Th>
                      <Table.Th style={{ textAlign: "right" }}>
                        Min. Level
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {negPaginated.map((product, index) => (
                      <Table.Tr key={product._id}>
                        <Table.Td style={{ fontFamily: "monospace" }}>
                          {(negPage - 1) * parseInt(negPerPage) + index + 1}
                        </Table.Td>
                        <Table.Td>{product.itemName}</Table.Td>
                        <Table.Td>
                          <Badge>{product.category}</Badge>
                        </Table.Td>
                        <Table.Td
                          style={{
                            textAlign: "right",
                            color: "#c92a2a",
                            fontWeight: 600,
                          }}
                        >
                          {formatNumber(getStockValue(product))}
                        </Table.Td>
                        <Table.Td style={{ textAlign: "right", color: "#666" }}>
                          {formatNumber(product.minimumStockLevel)}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Card.Section>
            {negTotalPages > 1 && (
              <Group justify="center" mt="md" pb="md">
                <Pagination
                  value={negPage}
                  onChange={setNegPage}
                  total={negTotalPages}
                  size="sm"
                  withEdges
                />
              </Group>
            )}
          </Card>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
