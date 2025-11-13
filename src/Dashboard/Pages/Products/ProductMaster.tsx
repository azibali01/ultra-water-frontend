import { useState, useEffect, useMemo } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import api from "../../../lib/api";
import {
  Card,
  Group,
  Text,
  Title,
  Badge,
  Box,
  Button,
  TextInput,
  Select,
  Modal,
  ScrollArea,
  Checkbox,
  NumberInput,
  Pagination,
} from "@mantine/core";
import Table from "../../../lib/AppTable";
import { showNotification } from "@mantine/notifications";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconEye,
  IconCheck,
  IconX,
} from "@tabler/icons-react";

import { useDataContext } from "../../Context/DataContext";
import type { InventoryItem } from "../../Context/DataContext";

import { ProductForm } from "../../../components/products/ProductForm";
import { ProductDetails } from "../../../components/products/ProductDetails";

function formatNumber(n?: number | null) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "-";
  return n.toLocaleString();
}

function formatCurrency(n?: number | null) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "-";
  return n.toLocaleString("en-PK", { style: "currency", currency: "PKR" });
}

export default function ProductMaster() {
  type UploadPreviewRow = {
    sku?: string;
    code?: string;
    name?: string;
    newPrice?: number | null;
    matchedProductId?: string | null;
    matchedProductName?: string | null;
    selected?: boolean;
    priceInvalid?: boolean;
  };

  type ReviewRow = UploadPreviewRow & {
    oldPrice?: number;
    delta?: number;
    include?: boolean;
  };

  type ApplyResponse = { updated?: Array<{ _id: string; newPrice?: number }> };
  const {
    categoriesForSelect = [],
    deleteInventoryItem,
    loadInventory,
    setInventory: setGlobalInventory,
  } = useDataContext();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchTerm, 200);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(
    null
  );
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<string>("25");

  // Fetch all products from backend on mount
  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data } = await api.get("products");
        // console.log("Fetched products:", data);
        setInventory(data);
        setGlobalInventory(data);
      } catch (err) {
        console.error("Error fetching products:", err);
        setInventory([]);
        setGlobalInventory([]);
        showNotification({
          title: "Error",
          message: "Failed to fetch products. Check backend connection.",
          color: "red",
        });
      }
    }
    fetchProducts();
  }, []);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<UploadPreviewRow[] | null>(
    null
  );

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewRows, setReviewRows] = useState<ReviewRow[] | null>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<Map<string, number> | null>(
    null
  );

  // console.log("inventory", inventory);
  const filtered = useMemo(() => {
    const term = (debouncedSearch || "").toLowerCase();
    const arr = (inventory || []).filter((p) => {
      if (selectedCategory && (p.category || "") !== selectedCategory)
        return false;
      if (!term) return true;
      return Object.values(p).some((v) =>
        String(v).toLowerCase().includes(term)
      );
    });
    return arr;
  }, [inventory, debouncedSearch, selectedCategory]);

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / parseInt(itemsPerPage));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * parseInt(itemsPerPage);
    const end = start + parseInt(itemsPerPage);
    return filtered.slice(start, end);
  }, [filtered, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory]);

  const getStockStatus = (item: InventoryItem) => {
    const stock = item.openingStock ?? item.stock;
    const min = item.minimumStockLevel;
    if (stock == null) return <Badge color="gray">Unknown</Badge>;
    if (stock < 0) return <Badge color="red">Negative</Badge>;
    if (stock <= (min ?? 0)) return <Badge color="yellow">Low Stock</Badge>;
    return <Badge color="green">In Stock</Badge>;
  };
  // Removed setInventory from useDataContext; using local setInventory only

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function handleDeleteRequest(_id: string) {
    // open confirmation modal
    setConfirmDeleteId(_id);
    setConfirmDeleteOpen(true);
  }

  async function performDelete(_id: string) {
    setDeleteLoading(true);
    try {
      await deleteInventoryItem(_id);
      setInventory((prev) => {
        const updated = prev.filter((item) => String(item._id) !== String(_id));
        setGlobalInventory(updated);
        return updated;
      });
      if (typeof loadInventory === "function") {
        const global = await loadInventory();
        setGlobalInventory(global);
      }
      showNotification({
        title: "Deleted",
        message: `Product ${_id} deleted`,
        color: "orange",
      });
    } catch (err) {
      showNotification({
        title: "Delete Failed",
        message: String(err),
        color: "red",
      });
    } finally {
      setDeleteLoading(false);
      setConfirmDeleteOpen(false);
      setConfirmDeleteId(null);
    }
  }

  return (
    <div>
      <Box mb="lg">
        <Group justify="space-between">
          <div>
            <Title order={2}>Product Master</Title>
            <Text c="dimmed">Manage your inventory and products</Text>
          </div>
          <div>
            <Button
              leftSection={<IconPlus />}
              onClick={() => setIsAddOpen(true)}
            >
              Add Product
            </Button>
            <Button
              ml={8}
              variant="outline"
              onClick={() => setIsUploadOpen(true)}
              style={{ marginLeft: 8 }}
            >
              Upload Rates
            </Button>
          </div>
        </Group>
      </Box>

      <Card shadow="sm" p="sm">
        <Group justify="space-between" style={{ marginBottom: 12 }}>
          <div>
            <Title order={4}>All Products</Title>
            <Group gap="xs">
              <Text c="dimmed">
                Showing {paginatedProducts.length} of {filtered.length} products
              </Text>
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
          </div>

          <div style={{ width: 520, display: "flex", gap: 8 }}>
            <TextInput
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              leftSection={<IconSearch size={16} />}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Filter by category"
              data={(categoriesForSelect || [])
                .filter((c) => c && c.value && c.label)
                .map((c) => ({
                  value: c.value,
                  label: c.label,
                }))}
              value={selectedCategory ?? undefined}
              onChange={(v) => setSelectedCategory(v ?? null)}
              clearable
              style={{ width: 250 }}
            />
          </div>
        </Group>

        <ScrollArea>
          <Table
            withColumnBorders
            withRowBorders
            highlightOnHover
            withTableBorder
          >
            <Table.Thead
              style={{
                backgroundColor: "#F1F3F5",
              }}
            >
              <Table.Tr>
                <Table.Th style={{ width: "40px", padding: "8px" }}>
                  Sr No.
                </Table.Th>
                <Table.Th style={{ width: "250px", padding: "8px" }}>
                  Item Name
                </Table.Th>
                <Table.Th style={{ padding: "8px" }}>Category</Table.Th>
                <Table.Th style={{ padding: "8px" }}>Brand/Supplier</Table.Th>
                <Table.Th style={{ width: "100px", padding: "8px" }}>
                  Opening Stock
                </Table.Th>
                <Table.Th style={{ padding: "8px" }}>Sale Rate</Table.Th>
                <Table.Th style={{ width: "120px", padding: "8px" }}>
                  Status
                </Table.Th>
                <Table.Th style={{ width: "150px", padding: "8px", textAlign: "left" }}>
                  Actions
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedProducts.map((p, index) => (
                <Table.Tr key={p._id}>
                  <Table.Td style={{ padding: "8px" }}>
                    {(currentPage - 1) * parseInt(itemsPerPage) + index + 1}
                  </Table.Td>
                  <Table.Td style={{ padding: "8px" }}>
                    {p.itemName || "-"}
                  </Table.Td>
                  <Table.Td style={{ padding: "8px" }}>
                    <Badge
                      size="sm"
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedCategory(p.category || null)}
                    >
                      {p.category}
                    </Badge>
                  </Table.Td>

                  <Table.Td style={{ padding: "8px" }}>
                    {p.brand ?? "-"}
                  </Table.Td>
                  <Table.Td style={{ padding: "8px" }}>
                    {formatNumber(p.openingStock ?? p.stock)}
                  </Table.Td>
                  <Table.Td style={{ padding: "8px" }}>
                    {formatCurrency(p.salesRate ?? null)}
                  </Table.Td>
                  <Table.Td style={{ padding: "8px" }}>
                    {getStockStatus(p)}
                  </Table.Td>
                  <Table.Td style={{ padding: "8px" }}>
                    <Group gap={0} grow>
                      <Button
                        variant="subtle"
                        leftSection={<IconEye size={16} />}
                        onClick={() => {
                          setSelectedProduct(p);
                          setIsViewOpen(true);
                        }}
                      />

                      <Button
                        variant="subtle"
                        leftSection={<IconEdit size={16} />}
                        onClick={() => {
                          setSelectedProduct(p);
                          setIsEditOpen(true);
                        }}
                      />
                      <Button
                        variant="subtle"
                        leftSection={<IconTrash size={18} />}
                        color="red"
                        onClick={() => handleDeleteRequest(String(p._id))}
                      />
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
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
      </Card>

      <Modal
        opened={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Product Details"
        size={"70%"}
      >
        {selectedProduct ? (
          <ProductDetails product={selectedProduct} />
        ) : (
          <Text c="dimmed">No product selected</Text>
        )}
      </Modal>

      <Modal
        opened={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Product"
        size={"70%"}
      >
        {selectedProduct && (
          <ProductForm
            product={selectedProduct}
            onClose={() => setIsEditOpen(false)}
          />
        )}
      </Modal>

      <Modal
        opened={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={<strong>Add Product</strong>}
        size={"70%"}
      >
        <ProductForm onClose={() => setIsAddOpen(false)} />
      </Modal>

      <Modal
        opened={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          setUploadFile(null);
          setUploadPreview(null);
        }}
        title="Upload New Rates"
        size={"60%"}
      >
        <div>
          <input
            type="file"
            accept=".csv, .xlsx, .xls, .pdf"
            onChange={(e) =>
              setUploadFile(e.target.files ? e.target.files[0] : null)
            }
          />

          <div style={{ marginTop: 12 }}>
            <Button>Parse & Preview</Button>
          </div>

          {uploadPreview && (
            <div style={{ marginTop: 12 }}>
              <Button
                disabled={
                  !uploadPreview || !uploadPreview.some((r) => r.selected)
                }
                onClick={() => {
                  if (!uploadPreview) return;
                  const rows = uploadPreview
                    .filter((r) => r.selected)
                    .map((r) => {
                      const matched = inventory.find(
                        (p) => String(p._id) === String(r.matchedProductId)
                      );
                      const oldPrice = matched ? matched.salesRate ?? 0 : 0;
                      const newPrice =
                        typeof r.newPrice === "number" ? r.newPrice : null;
                      return {
                        ...r,
                        oldPrice,
                        delta: newPrice != null ? newPrice - oldPrice : 0,
                        include: !!r.selected,
                        priceInvalid:
                          !!r.priceInvalid ||
                          (newPrice != null && !Number.isFinite(newPrice)),
                      } as ReviewRow;
                    });
                  setReviewRows(rows);
                  setIsReviewOpen(true);
                }}
              >
                Review changes (
                {uploadPreview
                  ? uploadPreview.filter((r) => r.selected).length
                  : 0}
                )
              </Button>
              <Table striped verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: 40 }}>
                      <Checkbox
                        checked={uploadPreview.every((r) => r.selected)}
                        indeterminate={
                          uploadPreview.some((r) => r.selected) &&
                          !uploadPreview.every((r) => r.selected)
                        }
                        onChange={(e) => {
                          const v = e.currentTarget.checked;
                          setUploadPreview((prev) =>
                            prev
                              ? prev.map((r) => ({ ...r, selected: v }))
                              : prev
                          );
                        }}
                      />
                    </Table.Th>
                    <Table.Th>#</Table.Th>
                    <Table.Th>SKU / Code</Table.Th>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>New Price</Table.Th>
                    <Table.Th>Match</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {uploadPreview.map((r, idx) => (
                    <Table.Tr key={idx}>
                      <Table.Td>
                        <Checkbox
                          checked={!!r.selected}
                          onChange={(e) =>
                            setUploadPreview((prev) =>
                              prev
                                ? prev.map((row, i) =>
                                    i === idx
                                      ? {
                                          ...row,
                                          selected: e.currentTarget.checked,
                                        }
                                      : row
                                  )
                                : prev
                            )
                          }
                        />
                      </Table.Td>
                      <Table.Td>{idx + 1}</Table.Td>
                      <Table.Td>{r.sku ?? r.code ?? "-"}</Table.Td>
                      <Table.Td>{r.name ?? "-"}</Table.Td>
                      <Table.Td style={{ textAlign: "right", width: 160 }}>
                        <NumberInput
                          value={r.newPrice ?? undefined}
                          min={0}
                          onChange={(val: string | number) => {
                            const num =
                              typeof val === "number"
                                ? val
                                : Number(String(val).replace(/[^0-9.]/g, ""));
                            setUploadPreview((prev) =>
                              prev
                                ? prev.map((row, i) =>
                                    i === idx
                                      ? {
                                          ...row,
                                          newPrice: Number.isFinite(num)
                                            ? num
                                            : null,
                                          priceInvalid: !Number.isFinite(num),
                                        }
                                      : row
                                  )
                                : prev
                            );
                          }}
                        />
                        {r.priceInvalid && (
                          <Text c="red" size="xs">
                            Invalid price
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>{r.matchedProductName ?? "-"}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              <Group justify="flex-end" style={{ marginTop: 12 }}>
                <Button
                  color="green"
                  onClick={async () => {
                    // Apply selected rows (for now apply all parsed rows)
                    if (!uploadPreview) return;
                    try {
                      const res = await fetch("/api/apply-rates", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ rows: uploadPreview }),
                      });
                      if (!res.ok) throw new Error(await res.text());
                      const json = (await res.json()) as ApplyResponse;
                      // json.updated should contain updated product records
                      const updated = json.updated ?? [];
                      if (updated.length) {
                        setInventory((prev) => {
                          const map = new Map(
                            updated.map((u) => [String(u._id), u] as const)
                          );
                          const newInv = prev.map((p) =>
                            map.has(String(p._id))
                              ? {
                                  ...p,
                                  ...(map.get(String(p._id)) as {
                                    _id: string;
                                    newPrice?: number;
                                  }),
                                }
                              : p
                          );
                          setGlobalInventory(newInv);
                          return newInv;
                        });
                      }
                      setIsUploadOpen(false);
                      setUploadPreview(null);
                      setUploadFile(null);
                      showNotification({
                        title: "Rates Applied",
                        message: "Rates applied successfully",
                        color: "green",
                        icon: <IconCheck size={16} />,
                      });
                    } catch (err) {
                      showNotification({
                        title: "Apply failed",
                        message: String(err),
                        color: "red",
                        icon: <IconX size={16} />,
                      });
                    }
                  }}
                >
                  Apply Rates
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    setUploadPreview(null);
                    setUploadFile(null);
                  }}
                >
                  Clear
                </Button>
              </Group>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        opened={confirmDeleteOpen}
        onClose={() => {
          setConfirmDeleteOpen(false);
          setConfirmDeleteId(null);
        }}
        title="Delete product"
      >
        <Text>
          Are you sure you want to delete product with _id '{confirmDeleteId}'?
          This action cannot be undone.
        </Text>
        <Group justify="flex-end" mt="md">
          <Button
            onClick={() => {
              setConfirmDeleteOpen(false);
              setConfirmDeleteId(null);
            }}
            variant="default"
          >
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => confirmDeleteId && performDelete(confirmDeleteId)}
            loading={deleteLoading}
          >
            Delete
          </Button>
        </Group>
      </Modal>

      {/* Review modal */}
      <Modal
        opened={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        title="Review changes"
        size="70%"
      >
        <div>
          <Table striped verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>SKU</Table.Th>
                <Table.Th>Product</Table.Th>
                <Table.Th>Old Price</Table.Th>
                <Table.Th>New Price</Table.Th>
                <Table.Th>Delta</Table.Th>
                <Table.Th>Include</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {reviewRows?.map((r, i) => (
                <Table.Tr key={i}>
                  <Table.Td>{i + 1}</Table.Td>
                  <Table.Td>{r.sku ?? r.code ?? "-"}</Table.Td>
                  <Table.Td>{r.matchedProductName ?? r.name ?? "-"}</Table.Td>
                  <Table.Td>{formatCurrency(r.oldPrice ?? 0)}</Table.Td>
                  <Table.Td>
                    <NumberInput
                      value={r.newPrice ?? undefined}
                      min={0}
                      onChange={(v: string | number) => {
                        const num =
                          typeof v === "number"
                            ? v
                            : Number(String(v).replace(/[^0-9.]/g, ""));
                        setReviewRows((prev) =>
                          prev
                            ? prev.map((row, idx) =>
                                idx === i
                                  ? {
                                      ...row,
                                      newPrice: Number.isFinite(num)
                                        ? num
                                        : null,
                                      delta:
                                        (Number.isFinite(num) ? num : 0) -
                                        (row.oldPrice ?? 0),
                                      priceInvalid: !Number.isFinite(num),
                                    }
                                  : row
                              )
                            : prev
                        );
                      }}
                    />
                    {r.priceInvalid && (
                      <Text c="red" size="xs">
                        Invalid price
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td
                    style={{
                      color:
                        r.delta && r.delta > 0
                          ? "red"
                          : r.delta && r.delta < 0
                          ? "green"
                          : undefined,
                    }}
                  >
                    {r.delta != null ? formatCurrency(r.delta) : "-"}
                  </Table.Td>
                  <Table.Td>
                    <Checkbox
                      checked={!!r.include}
                      onChange={(e) =>
                        setReviewRows((prev) =>
                          prev
                            ? prev.map((row, idx) =>
                                idx === i
                                  ? { ...row, include: e.currentTarget.checked }
                                  : row
                              )
                            : prev
                        )
                      }
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Group justify="flex-end" style={{ marginTop: 12 }}>
            <Button
              color="green"
              onClick={() => {
                if (!reviewRows) return;
                // build apply list
                const toApply = reviewRows.filter(
                  (r) => r.include && r.matchedProductId && r.newPrice != null
                );
                if (toApply.length === 0) {
                  showNotification({
                    title: "No rows selected",
                    message: "No rows selected to apply",
                    color: "yellow",
                  });
                  return;
                }
                // create undo snapshot
                const snap = new Map<string, number>();
                for (const r of toApply) {
                  const id = r.matchedProductId!;
                  const prod = inventory.find(
                    (p) => String(p._id) === String(id)
                  );
                  snap.set(id, prod ? prod.salesRate ?? 0 : 0);
                }
                setUndoSnapshot(snap);
                // apply locally
                setInventory((prev) => {
                  const newInv = prev.map((p) => {
                    if (snap.has(String(p._id))) {
                      const newVal = toApply.find(
                        (x) => String(x.matchedProductId) === String(p._id)
                      )!.newPrice!;
                      return { ...p, newPrice: newVal };
                    }
                    return p;
                  });
                  setGlobalInventory(newInv);
                  return newInv;
                });
                setIsReviewOpen(false);
                setIsUploadOpen(false);
                setUploadPreview(null);
                setUploadFile(null);
                // show small undo affordance by keeping undoSnapshot for 30s
                setTimeout(() => setUndoSnapshot(null), 30000);
              }}
            >
              Confirm Apply
            </Button>
            <Button variant="default" onClick={() => setIsReviewOpen(false)}>
              Cancel
            </Button>
          </Group>
        </div>
      </Modal>

      {/* Undo notice */}
      {undoSnapshot && (
        <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 9999 }}>
          <Group>
            <Button
              color="yellow"
              onClick={() => {
                // rollback
                setInventory((prev) => {
                  const newInv = prev.map((p) =>
                    undoSnapshot.has(String(p._id))
                      ? { ...p, newPrice: undoSnapshot.get(String(p._id))! }
                      : p
                  );
                  setGlobalInventory(newInv);
                  return newInv;
                });
                setUndoSnapshot(null);
              }}
            >
              Undo recent rate changes
            </Button>
          </Group>
        </div>
      )}
    </div>
  );
}
