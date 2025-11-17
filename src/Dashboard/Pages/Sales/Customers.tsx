import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  Group,
  Input,
  Modal,
  ScrollArea,
  Text,
  Title,
} from "@mantine/core";
import Table from "../../../lib/AppTable";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconEye,
  IconTrash,
} from "@tabler/icons-react";
import { CustomerForm } from "../../../components/sales/CustomerForm";
import { CustomerDetails } from "../../../components/sales/CustomerDetails";
import { useDataContext } from "../../Context/DataContext";
import type { Customer } from "../../Context/DataContext";

import { deleteCustomer } from "../../../lib/api";
import { showNotification } from "@mantine/notifications";
// local helpers
function formatCurrency(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0 });
}

// Local Customer interface is provided by DataContext; the page reads data from context

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const { customers, setCustomers, refreshFromBackend } = useDataContext();
  useEffect(() => {
    refreshFromBackend();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter((c) =>
      [c.name, c.city, c.phone].some((v) => (v || "").toLowerCase().includes(q))
    );
  }, [customers, search]);

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;

    // Validate ID exists and is valid
    if (
      !customerToDelete._id ||
      customerToDelete._id === "undefined" ||
      customerToDelete._id.includes("undefined")
    ) {
      console.error("Invalid customer ID:", customerToDelete._id);
      showNotification({
        title: "Error",
        message: "Cannot delete customer: Invalid ID",
        color: "red",
      });
      setOpenDelete(false);
      setCustomerToDelete(null);
      return;
    }

    setDeleting(true);
    try {

      await deleteCustomer(customerToDelete._id);
      setCustomers((prev) =>
        prev.filter((x) => x._id !== customerToDelete._id)
      );
      showNotification({
        title: "Success",
        message: "Customer deleted successfully",
        color: "green",
      });
    } catch (error) {
      console.error("Error deleting customer:", error);
      showNotification({
        title: "Error",
        message: "Failed to delete customer",
        color: "red",
      });
    } finally {
      setDeleting(false);
      setOpenDelete(false);
      setCustomerToDelete(null);
    }
  };

  return (
    <div>
      <Box mb="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>Customers</Title>
            <Text c="dimmed">Manage customer directory and balances</Text>
          </div>
          <div>
            <Button onClick={() => setOpenAdd(true)}>
              <IconPlus size={16} style={{ marginRight: 8 }} />
              Add Customer
            </Button>
          </div>
        </Group>
      </Box>

      <Card>
        <Card.Section>
          <Group justify="space-between" p="md">
            <div>
              <Text fw={600}>All Customers</Text>
              <Text c="dimmed" size="sm">
                {filtered.length} found
              </Text>
            </div>
            <div style={{ width: 320 }}>
              <Group justify="flex-start" gap="xs">
                <IconSearch size={16} />
                <Input
                  placeholder="Search customers..."
                  value={search}
                  onChange={(e) => setSearch(e.currentTarget.value)}
                />
              </Group>
            </div>
          </Group>
        </Card.Section>

        <Card.Section>
          <ScrollArea>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>City</Table.Th>
                  <Table.Th>Phone</Table.Th>
                  <Table.Th>Opening Amount</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.map((c: Customer, index) => (
                  <Table.Tr key={c._id || `customer-fallback-${index}`}>
                    <Table.Td style={{ fontWeight: 600 }}>{c.name}</Table.Td>
                    <Table.Td style={{ color: "#666" }}>{c.city}</Table.Td>
                    <Table.Td>{c.phone}</Table.Td>
                    <Table.Td>
                      <span
                        style={{
                          color: c.paymentType === "Debit" ? "red" : "green",
                        }}
                      >
                        {c.paymentType === "Debit" ? "Debit" : "Credit"}{" "}
                        {formatCurrency(c.openingAmount || 0)}
                      </span>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button
                          variant="subtle"
                          size="xs"
                          onClick={() => {
                            setSelected(c);
                            setOpenView(true);
                          }}
                        >
                          <IconEye size={14} />
                        </Button>
                        <Button
                          variant="subtle"
                          size="xs"
                          onClick={() => {
                            setSelected(c);
                            setOpenEdit(true);
                          }}
                        >
                          <IconEdit size={14} />
                        </Button>
                        <Button
                          variant="subtle"
                          color="red"
                          size="xs"
                          onClick={() => {
                            setCustomerToDelete(c);
                            setOpenDelete(true);
                          }}
                        >
                          <IconTrash size={14} />
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Card.Section>
      </Card>

      <Modal opened={openView} onClose={() => setOpenView(false)} size="lg">
        <Box p="md">{selected && <CustomerDetails customer={selected} />}</Box>
      </Modal>

      <Modal opened={openEdit} onClose={() => setOpenEdit(false)} size="lg">
        <Box p="md">
          {selected && (
            <CustomerForm
              customer={selected}
              onClose={() => setOpenEdit(false)}
            />
          )}
        </Box>
      </Modal>

      <Modal opened={openAdd} onClose={() => setOpenAdd(false)} size="lg">
        <Box p="md">
          <CustomerForm onClose={() => setOpenAdd(false)} />
        </Box>
      </Modal>

      <Modal
        opened={openDelete}
        onClose={() => {
          setOpenDelete(false);
          setCustomerToDelete(null);
        }}
        size="sm"
        title="Delete Customer"
      >
        <Box p="md">
          <Text mb="md">
            Are you sure you want to delete customer "{customerToDelete?.name}"?
            This action cannot be undone.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              onClick={() => {
                setOpenDelete(false);
                setCustomerToDelete(null);
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleDeleteConfirm}
              loading={deleting}
            >
              Delete
            </Button>
          </Group>
        </Box>
      </Modal>
    </div>
  );
}
