/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState, useEffect } from "react";

import {
  Card,
  Text,
  Group,
  ScrollArea,
  TextInput,
  Button,
  Title,
  Stack,
  Menu,
  ActionIcon,
  Modal,
  Text as MantineText,
  Group as MantineGroup,
  Button as MantineButton,
  Pagination,
  Select,
} from "@mantine/core";
import Table from "../../../lib/AppTable";
import { formatCurrency, formatDate } from "../../../lib/format-utils";
import { Plus, Search, MoreVertical } from "lucide-react";
import { IconPencil, IconPrinter, IconTrash } from "@tabler/icons-react";
import openPrintWindow from "../../../components/print/printWindow";
import type { InvoiceData } from "../../../components/print/printTemplate";
import {
  createPaymentVoucher,
  getAllPaymentVouchers,
  deletePaymentVoucher,
  updatePaymentVoucher,
} from "../../../lib/api";
// Update the import path if the file exists elsewhere, for example:
import { PaymentVoucherForm } from "../../../components/accounts/payment-voucher-form";

interface PaymentVoucher {
  id: string;
  voucherNumber: string;
  voucherDate: string | Date;
  paidTo: string;
  paymentMode: string;
  reference?: string;
  amount: number;
  remarks?: string;
}

// Fetch all payment vouchers from backend
async function fetchAllPaymentVouchers() {
  return await getAllPaymentVouchers();
}

export default function PaymentVouchersPage() {
  const [q, setQ] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PaymentVoucher | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [data, setData] = useState<PaymentVoucher[]>([]);
  const [open, setOpen] = useState(false);
  const [editVoucher, setEditVoucher] = useState<PaymentVoucher | null>(null);
  const [nextVoucherNumber, setNextVoucherNumber] = useState("PV-0001");
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<string>("25");

  // Load all payment vouchers on mount and calculate next voucher number
  useEffect(() => {
    fetchAllPaymentVouchers().then((vouchers) => {
      // Map backend fields to frontend fields (use correct names)
      const mapped = (vouchers || []).map((v: any) => ({
        id:
          v._id ||
          v.id ||
          v.voucherNumber ||
          Math.random().toString(36).slice(2),
        voucherNumber: v.voucherNumber,
        voucherDate: v.voucherDate,
        paidTo: v.paidTo,
        paymentMode: v.paymentMode,
        reference: v.referenceNumber,
        amount: v.amount,
        remarks: v.remarks,
      }));
      setData(mapped);
      // Find the highest voucher number and increment
      const maxNum = mapped.reduce((max: number, r: PaymentVoucher) => {
        const match =
          typeof r.voucherNumber === "string" &&
          r.voucherNumber.match(/^PV-(\d{4})$/);
        if (match) {
          const num = parseInt(match[1], 10);
          return num > max ? num : max;
        }
        return max;
      }, 0);
      const nextNum = (maxNum + 1).toString().padStart(4, "0");
      setNextVoucherNumber(`PV-${nextNum}`);
    });
  }, []);

  const filtered = useMemo(() => {
    const t = q.toLowerCase().trim();
    if (!t) return data;
    return data.filter(
      (v) =>
        v.voucherNumber.toLowerCase().includes(t) ||
        v.paidTo.toLowerCase().includes(t) ||
        v.paymentMode.toLowerCase().includes(t) ||
        (v.reference ?? "").toLowerCase().includes(t)
    );
  }, [q, data]);

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / parseInt(itemsPerPage));
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * parseInt(itemsPerPage);
    const end = start + parseInt(itemsPerPage);
    return filtered.slice(start, end);
  }, [filtered, currentPage, itemsPerPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [q]);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Group justify="apart" align="center">
        <div>
          <Title order={2}>Payment Vouchers</Title>
          <Text size="sm" color="dimmed">
            Record money paid to suppliers and others
          </Text>
        </div>
      </Group>

      <Group justify="space-between" align="center">
        {/* LEFT SIDE */}
        <Group>
          <Stack gap={0}>
            <Text fw={600}>All Payments</Text>
            <Text size="sm" c="dimmed">
              Showing {paginatedEntries.length} of {filtered.length} entries
            </Text>
          </Stack>
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

        {/* RIGHT SIDE */}
        <Group>
          <TextInput
            placeholder="Search payments..."
            value={q}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setQ(e.currentTarget.value)
            }
            leftSection={<Search size={16} style={{ color: "gray" }} />}
          />

          <Button leftSection={<Plus />} w={180} onClick={() => setOpen(true)}>
            Add Payment
          </Button>
        </Group>
      </Group>

      <Card>
        <Card.Section>
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
                <tr>
                  <th>Voucher No</th>
                  <th>Date</th>
                  <th>Paid To</th>
                  <th>Mode</th>
                  <th>Reference</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th>Action</th>
                </tr>
              </Table.Thead>
              <tbody>
                {paginatedEntries.map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>
                      {v.voucherNumber}
                    </td>
                    <td>{formatDate(v.voucherDate)}</td>
                    <td style={{ fontWeight: 600 }}>{v.paidTo}</td>
                    <td style={{ color: "var(--mantine-color-dimmed)" }}>
                      {v.paymentMode}
                    </td>
                    <td style={{ color: "var(--mantine-color-dimmed)" }}>
                      {v.reference}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {formatCurrency(v.amount)}
                    </td>
                    <td>
                      <Menu shadow="md" width={160} position="bottom-end">
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray">
                            <MoreVertical size={18} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconPencil size={16} />}
                            onClick={() => setEditVoucher(v)}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconPrinter size={16} />}
                            onClick={() => {
                              // Print logic
                              const invoiceData: InvoiceData = {
                                title: "Payment Voucher",
                                companyName: "Ultra Water Technologies",
                                addressLines: [],
                                invoiceNo: v.voucherNumber,
                                date:
                                  typeof v.voucherDate === "string"
                                    ? v.voucherDate
                                    : v.voucherDate.toISOString(),
                                items: [
                                  {
                                    sr: 1,
                                    itemName: `Paid To: ${v.paidTo}`,
                                    section: `Paid To: ${v.paidTo}`,
                                    description: `Paid To: ${v.paidTo}`,
                                    qty: 1,
                                    quantity: 1,
                                    rate: v.amount,
                                    salesRate: v.amount,
                                    amount: v.amount,
                                  },
                                ],
                                totals: { total: v.amount },
                              };
                              openPrintWindow(invoiceData);
                            }}
                          >
                            Print
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconTrash size={16} />}
                            color="red"
                            onClick={() => setDeleteTarget(v)}
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </ScrollArea>
        </Card.Section>
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

      {/* Confirm Delete Modal (must be outside the table/menu) */}
      <Modal
        opened={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Delete"
        centered
      >
        <MantineText>
          Are you sure you want to delete this payment voucher?
        </MantineText>
        <MantineGroup justify="flex-end" mt="md">
          <MantineButton
            variant="outline"
            onClick={() => setDeleteTarget(null)}
            disabled={deleteLoading}
          >
            Cancel
          </MantineButton>
          <MantineButton
            color="red"
            loading={deleteLoading}
            onClick={async () => {
              if (!deleteTarget) return;
              setDeleteLoading(true);
              try {
                await deletePaymentVoucher(deleteTarget.voucherNumber);
                setData((prev) =>
                  prev.filter(
                    (item) => item.voucherNumber !== deleteTarget.voucherNumber
                  )
                );
                setDeleteTarget(null);
              } finally {
                setDeleteLoading(false);
              }
            }}
          >
            Delete
          </MantineButton>
        </MantineGroup>
      </Modal>

      <PaymentVoucherForm
        open={open || !!editVoucher}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditVoucher(null);
        }}
        initialValues={
          editVoucher ||
          (!editVoucher && open
            ? { voucherNumber: nextVoucherNumber }
            : undefined)
        }
        onSave={async (payload) => {
          let dateStr = "";
          if (payload.voucherDate instanceof Date) {
            dateStr = payload.voucherDate.toISOString();
          } else if (typeof payload.voucherDate === "string") {
            const d = new Date(payload.voucherDate);
            dateStr = isNaN(d.getTime())
              ? payload.voucherDate
              : d.toISOString();
          } else {
            dateStr = new Date().toISOString();
          }
          const apiPayload = {
            voucherNumber: String(payload.voucherNumber),
            voucherDate: dateStr,
            paidTo: payload.paidTo || "Unknown",
            amount: payload.amount,
            referenceNumber: payload.reference ? String(payload.reference) : "",
            paymentMode: payload.paymentMode,
            remarks: payload.remarks || "",
          };
          try {
            if (editVoucher) {
              await updatePaymentVoucher(editVoucher.voucherNumber, apiPayload);
              setData((prev) =>
                prev.map((item) =>
                  item.voucherNumber === editVoucher.voucherNumber
                    ? {
                        ...payload,
                        voucherNumber: editVoucher.voucherNumber,
                        id: item.id,
                      }
                    : item
                )
              );
            } else {
              await createPaymentVoucher(apiPayload);
              // Optimistically add new payment to the table
              setData((prev) => [
                {
                  id: Math.random().toString(36).slice(2),
                  voucherNumber: payload.voucherNumber,
                  voucherDate: payload.voucherDate,
                  paidTo: payload.paidTo,
                  paymentMode: payload.paymentMode,
                  reference: payload.reference,
                  amount: payload.amount,
                  remarks: payload.remarks,
                },
                ...prev,
              ]);
            }
          } catch (err) {
            // Optionally show error notification
          }
        }}
        key={editVoucher ? editVoucher.id : undefined}
      />
    </div>
  );
}
