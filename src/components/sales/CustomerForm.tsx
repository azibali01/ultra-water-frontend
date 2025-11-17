import React, { useState } from "react";
import {
  Button,
  Group,
  TextInput,
  Textarea,
  NumberInput,
  Select,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { useDataContext } from "../../Dashboard/Context/DataContext";
import type { Customer } from "../../Dashboard/Context/DataContext";
import { createCustomer, updateCustomer } from "../../lib/api";

export function CustomerForm({
  customer,
  onClose,
}: {
  customer?: Customer;
  onClose: () => void;
}) {
  const { setCustomers } = useDataContext();

  const [form, setForm] = useState<Customer>(() => ({
    _id: customer?._id || String(Date.now()),
    name: customer?.name || "",
    phone: customer?.phone || "",
    address: customer?.address || "",
    city: customer?.city || "",
    openingAmount: customer?.openingAmount || 0,
    creditLimit: customer?.creditLimit || 0,
    paymentType: customer?.paymentType === "Debit" ? "Debit" : "Credit",
    createdAt: customer?.createdAt || new Date().toISOString(),
  }));

  // Local UI state: keep opening amount positive and a type (credit/debit)
  const initialOpening = customer?.openingAmount ?? 0;
  const [openingAmount, setOpeningAmount] = useState<number>(
    Math.abs(initialOpening)
  );
  const [paymentType, setPaymentType] = useState<"Credit" | "Debit">(
    customer?.paymentType === "Debit" ? "Debit" : "Credit"
  );
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const customerData = {
        name: form.name,
        phone: form.phone || "",
        address: form.address || "",
        city: form.city || "",
        openingAmount: openingAmount,
        paymentType: paymentType, // Use 'Credit' | 'Debit' (capitalized)
        creditLimit: form.creditLimit || 0,
        createdAt: form.createdAt,
      };

      if (customer) {
        // Update existing customer
        await updateCustomer(customer._id, customerData);
        const updatedCustomer = {
          ...form,
          openingAmount: openingAmount,
          paymentType,
        } as Customer;
        setCustomers((prev) =>
          prev.map((c) => (c._id === updatedCustomer._id ? updatedCustomer : c))
        );
        showNotification({
          title: "Success",
          message: "Customer updated successfully",
          color: "green",
        });
      } else {
        // Create new customer
        const newCustomer = await createCustomer(customerData);


        // Ensure we have a valid MongoDB ID (string)
        const customerId =
          newCustomer._id || newCustomer.id || String(Date.now());
        const customerWithId = {
          ...form,
          _id: String(customerId), // Ensure ID is always a string
          openingAmount: openingAmount,
          paymentType,
        } as Customer;
        setCustomers((prev) => [customerWithId, ...prev]);
        showNotification({
          title: "Success",
          message: "Customer created successfully",
          color: "green",
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving customer:", error);
      showNotification({
        title: "Error",
        message: "Failed to save customer",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
      <Group grow>
        <TextInput
          label="Name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
          placeholder="Customer name"
        />
        <TextInput
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.currentTarget.value })}
          placeholder="+92 ..."
        />
      </Group>

      <Textarea
        label="Address"
        minRows={2}
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.currentTarget.value })}
      />

      <TextInput
        label="City"
        value={form.city}
        onChange={(e) => setForm({ ...form, city: e.currentTarget.value })}
      />

      <Group grow>
        <NumberInput
          label="Opening Amount"
          value={openingAmount}
          min={0}
          onChange={(value: string | number) => {
            const num =
              typeof value === "number"
                ? value
                : Number(String(value).replace(/[^0-9.]/g, ""));
            setOpeningAmount(Number.isFinite(num) ? num : 0);
          }}
        />
        <Select
          label="Type"
          value={paymentType}
          data={[
            { value: "Credit", label: "Credit" },
            { value: "Debit", label: "Debit" },
          ]}
          onChange={(v) =>
            setPaymentType((v as "Credit" | "Debit") || "Credit")
          }
          style={{ width: 150 }}
        />
        <NumberInput
          label="Credit Limit"
          value={form.creditLimit}
          onChange={(value: number | string) =>
            setForm({ ...form, creditLimit: Number(value) || 0 })
          }
        />
      </Group>

      <Group style={{ justifyContent: "flex-end" }}>
        <Button
          variant="outline"
          onClick={onClose}
          type="button"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {customer ? "Update" : "Save"}
        </Button>
      </Group>
    </form>
  );
}
