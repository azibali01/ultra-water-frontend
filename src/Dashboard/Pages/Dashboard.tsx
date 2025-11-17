import React, { useMemo } from "react";
import { Card, Group, Text, Title, SimpleGrid, Box } from "@mantine/core";
import {
  IconShoppingCart,
  IconPackage,
  IconChartBar,
  IconCalendar,
  IconUsers,
  IconFileInvoice,
  IconReportAnalytics,
} from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { useDataContext, type SaleRecord } from "../Context/DataContext";
import { formatCurrency } from "../../lib/format-utils";
import dayjs from "dayjs";
// ...existing code...

export default function Dashboard() {
  const {
    inventory = [],
    sales,
    purchases = [],
    customers = [],
    categories = [],
    expenses = [],
  } = useDataContext();

  const salesArray: SaleRecord[] = useMemo(() => {
    if (Array.isArray(sales)) return sales as SaleRecord[];
    const maybe = sales as unknown as { data?: unknown } | undefined;
    if (maybe && Array.isArray(maybe.data)) return maybe.data as SaleRecord[];
    return [];
  }, [sales]);

  const totalSales = useMemo(
    () => salesArray.reduce((s, it) => s + (it.total || 0), 0),
    [salesArray]
  );
  const inventoryCount = inventory.length;

  const todayRevenue = useMemo(() => {
    return salesArray
      .filter((s) => dayjs(s.date).isSame(dayjs(), "day"))
      .reduce((sum, s) => sum + (s.total || 0), 0);
  }, [salesArray]);

  const monthlyRevenue = useMemo(() => {
    const byMonth: Record<string, number> = {};
    salesArray.forEach((s) => {
      const m = dayjs(s.date).format("MMM YYYY");
      byMonth[m] = (byMonth[m] || 0) + (s.total || 0);
    });
    const months = Array.from({ length: 7 }).map((_, i) =>
      dayjs()
        .subtract(6 - i, "month")
        .format("MMM YYYY")
    );
    return months.map((m) => ({
      month: m,
      amount: Math.round(byMonth[m] || 0),
    }));
  }, [salesArray]);

  // ...existing code...

  // ...existing code...

  const purchasesTotal = useMemo(
    () => purchases.reduce((s, p) => s + (p.total || 0), 0),
    [purchases]
  );
  const customersCount = customers.length;
  const categoriesCount = categories.length;
  const expensesTotal = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  // Low stock: Same logic as StockReport.tsx
  // Stock is positive, minimum level is set (> 0), and stock is less than minimum
  const lowStock = inventory.filter((i) => {
    const stock = i.openingStock ?? i.stock ?? 0;
    const min = i.minimumStockLevel || 0;
    return stock > 0 && min > 0 && stock < min;
  });

  // Total Stock Value: Calculate total worth of inventory
  const totalStockValue = useMemo(() => {
    return inventory.reduce((total, item) => {
      const stock = item.openingStock ?? item.stock ?? 0;
      const rate = item.salesRate ?? 0;
      return total + (stock * rate);
    }, 0);
  }, [inventory]);

  const stats = [
    {
      title: "Total Sales",
      value: formatCurrency(totalSales),
      icon: <IconShoppingCart size={20} color="#868e96" />,
    },
    {
      title: "Inventory Items",
      value: String(inventoryCount),
      icon: <IconPackage size={20} color="#868e96" />,
    },
    {
      title: "Total Stock Value",
      value: formatCurrency(totalStockValue),
      icon: <IconChartBar size={20} color="#868e96" />,
    },
  ];

  type CardDef = {
    label: string;
    path: string;
    icon: React.ReactNode;
    meta?: string;
    renderExtra?: () => React.ReactNode;
  };

  const quickLinks: CardDef[] = [
    {
      label: "Products",
      path: "/products",
      icon: <IconPackage size={18} />,
      meta: `${inventoryCount} items`,
    },
    {
      label: "Categories",
      path: "/products/categories",
      icon: <IconReportAnalytics size={18} />,
      meta: `${categoriesCount} categories`,
    },
    {
      label: "Stock Report",
      path: "/products/stock-report",
      icon: <IconChartBar size={18} />,
      meta: `${lowStock.length} low`,
      renderExtra: () => {
        // Find unique categories with low stock
        const lowStockCategories = Array.from(
          new Set(lowStock.map((item) => item.category))
        );
        return (
          <Box mt={6}>
            <Text size="xs" color="red" fw={600}>
              {lowStockCategories.length > 0 ? "Low Stock Categories:" : ""}
            </Text>
            {lowStockCategories.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {lowStockCategories.map((cat) => (
                  <li key={cat} style={{ fontSize: 12, color: "#d7263d" }}>
                    {cat}
                  </li>
                ))}
              </ul>
            )}
          </Box>
        );
      },
    },
    {
      label: "Stock Summary",
      path: "/products/stock-summary",
      icon: <IconReportAnalytics size={18} />,
    },
    {
      label: "Customers",
      path: "/sales/customers",
      icon: <IconUsers size={18} />,
      meta: `${customersCount} customers`,
    },
    {
      label: "Sales Invoices",
      path: "/sales/invoices",
      icon: <IconFileInvoice size={18} />,
      meta: `${salesArray.length} · ${formatCurrency(totalSales)}`,
    },

    {
      label: "Purchase Invoices",
      path: "/purchase/invoices",
      icon: <IconFileInvoice size={18} />,
      meta: `${purchases.length} · ${formatCurrency(purchasesTotal)}`,
    },
    {
      label: "Expenses",
      path: "/expenses",
      icon: <IconReportAnalytics size={18} />,
      meta: `${expenses.length} · ${formatCurrency(expensesTotal)}`,
    },
    // --- Vouchers & Books ---
    {
      label: "Receipt Voucher",
      path: "/accounts/receipt-voucher",
      icon: <IconFileInvoice size={18} />,
    },
    {
      label: "Payment Voucher",
      path: "/accounts/payment-voucher",
      icon: <IconFileInvoice size={18} />,
    },
    {
      label: "Journal Voucher",
      path: "/accounts/journal-voucher",
      icon: <IconFileInvoice size={18} />,
    },
    {
      label: "Cash Book",
      path: "/accounts/cash-book",
      icon: <IconReportAnalytics size={18} />,
    },
    {
      label: "Bank Book",
      path: "/accounts/bank-book",
      icon: <IconReportAnalytics size={18} />,
    },
    // --- Reports ---
    {
      label: "Profit & Loss",
      path: "/reports/profit-loss",
      icon: <IconChartBar size={18} />,
    },
  ];

  return (
    <div>
      <Box mb="lg">
        <Title order={1}>Welcome to Ultra Water Technologies</Title>
        <Text c="dimmed" size="md">
          Manage your business with SemiColon.
        </Text>
      </Box>

      <SimpleGrid cols={{ base: 1, md: 3, lg: 4 }} spacing="lg" mb="xl">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
          >
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>
                {stat.title}
              </Text>
              {stat.icon}
            </Group>
            <Text size="xl" fw={700}>
              {stat.value}
            </Text>
          </Card>
        ))}
      </SimpleGrid>

      {/* Monthly/Today's Revenue Section */}
      <Box mb="xl">
        <SimpleGrid cols={{ base: 1, md: 2, lg: 2 }} spacing="lg">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>
                Monthly Revenue (Last 7 Months)
              </Text>
              <IconChartBar size={20} color="#868e96" />
            </Group>
            <Text size="xl" fw={700}>
              {formatCurrency(monthlyRevenue.reduce((s, m) => s + m.amount, 0))}
            </Text>
          </Card>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>
                Today's Revenue
              </Text>
              <IconCalendar size={20} color="#868e96" />
            </Group>
            <Text size="xl" fw={700}>
              {formatCurrency(todayRevenue)}
            </Text>
          </Card>
        </SimpleGrid>
      </Box>

      <Box mb="lg">
        <Title order={3} mb="sm">
          Quick Links
        </Title>
        <SimpleGrid cols={{ base: 1, md: 3, lg: 4 }} spacing="md">
          {quickLinks.map((p) => (
            <Card
              key={p.path}
              component={Link}
              to={p.path}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{ cursor: "pointer", textDecoration: "none" }}
            >
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={600}>
                  {p.label}
                </Text>
                {p.icon}
              </Group>
              {p.meta ? (
                <Text size="lg" fw={700} mb="xs">
                  {p.meta}
                </Text>
              ) : (
                <Text size="sm" c="dimmed">
                  Open {p.label}
                </Text>
              )}
              {/* Show low stock categories if this is the Stock Report card */}
              {typeof p.renderExtra === "function" && p.renderExtra()}
            </Card>
          ))}
        </SimpleGrid>
      </Box>

      {/* Low stock/negative stock alerts and Recent Sales removed per user request */}

      {/* Graphs removed as per user request */}
    </div>
  );
}
