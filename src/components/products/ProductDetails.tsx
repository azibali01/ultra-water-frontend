import { Card, Text, Divider, Badge, Grid } from "@mantine/core";
import type { InventoryItem } from "../../Dashboard/Context/DataContext";
import { formatCurrency } from "../../lib/format-utils";

interface Props {
  product: InventoryItem;
}

export function ProductDetails({ product }: Props) {
  return (
    <div>
      <Card>
        <Grid>
          <Grid.Col span={6}>
            <Text size="xs" c="dimmed">
              Item Name
            </Text>
            <Text fw={600} size="lg">
              {product.itemName || "-"}
            </Text>
          </Grid.Col>

          <Grid.Col span={6}>
            <Text size="xs" c="dimmed">
              Category
            </Text>
            <Badge size="lg" mt={4}>
              {product.category || "-"}
            </Badge>
          </Grid.Col>

          <Grid.Col span={6}>
            <Text size="xs" c="dimmed">
              Brand/Supplier
            </Text>
            <Text fw={600}>{product.brand || "-"}</Text>
          </Grid.Col>
 

          <Divider />

          <Grid.Col span={6}>
            <Text size="xs" c="dimmed">
              Sales Rate
            </Text>
            <Text fw={600} size="lg">
              {product.salesRate ? formatCurrency(product.salesRate) : "-"}
            </Text>
          </Grid.Col>

          <Grid.Col span={6}>
            <Text size="xs" c="dimmed">
              Opening Stock
            </Text>
            <Text fw={600} size="lg">
              {product.openingStock ?? product.stock ?? "-"}
            </Text>
          </Grid.Col>

          <Grid.Col span={6}>
            <Text size="xs" c="dimmed">
              Minimum Stock Level
            </Text>
            <Text fw={600}>{product.minimumStockLevel ?? "-"}</Text>
          </Grid.Col>

          <Grid.Col span={12}>
            <Text size="xs" c="dimmed">
              Description
            </Text>
            <Text fw={400}>
              {product.description || "No description provided"}
            </Text>
          </Grid.Col>
        </Grid>
      </Card>
    </div>
  );
}
