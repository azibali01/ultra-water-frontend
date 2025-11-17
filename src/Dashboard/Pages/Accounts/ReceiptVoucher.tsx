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
  Pagination,
  Select,
} from "@mantine/core";
import Table from "../../../lib/AppTable";
import { ReceiptForm } from "../../../components/accounts/receipt-form";
import { formatCurrency, formatDate } from "../../../lib/format-utils";
import { Plus, Search, MoreVertical } from "lucide-react";
import {
  Menu,
  ActionIcon,
  Modal,
  Text as MantineText,
  Group as MantineGroup,
  Button as MantineButton,
} from "@mantine/core";

import { createReceiptVoucher, getAllReceiptVouchers } from "../../../lib/api";
import { IconPencil, IconPrinter, IconTrash } from "@tabler/icons-react";
// Fetch all receipt vouchers from backend
async function fetchAllReceiptVouchers() {
  return await getAllReceiptVouchers();
}

interface ReceiptVoucher {
  id: string;
  voucherNumber: string;
  voucherDate: string | Date;
  receivedFrom: string;
  paymentMode: string;
  reference?: string;
  amount: number;
  remarks?: string;
}

import openPrintWindow from "../../../components/print/printWindow";
import type { InvoiceData } from "../../../components/print/printTemplate";
import { deleteReceiptVoucher, updateReceiptVoucher } from "../../../lib/api";

export default function ReceiptsPage() {
  const [q, setQ] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ReceiptVoucher | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [data, setData] = useState<ReceiptVoucher[]>([]);
  const [open, setOpen] = useState(false);
  const [editVoucher, setEditVoucher] = useState<ReceiptVoucher | null>(null);
  const [nextVoucherNumber, setNextVoucherNumber] = useState("RV-0001");
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<string>("25");

  // Load all receipts on mount and calculate next voucher number
  useEffect(() => {
    fetchAllReceiptVouchers().then((vouchers) => {

      // Map backend fields to frontend fields (use correct names)
      const mapped = (vouchers || []).map((v: any) => ({
        id:
          v._id ||
          v.id ||
          v.voucherNumber ||
          Math.random().toString(36).slice(2),
        voucherNumber: v.voucherNumber,
        voucherDate: v.voucherDate,
        receivedFrom: v.receivedFrom,
        paymentMode: v.paymentMode,
        reference: v.referenceNumber,
        amount: v.amount,
        remarks: v.remarks,
      }));
      setData(mapped);
      // Find the highest voucher number and increment
      const maxNum = mapped.reduce((max: number, r: ReceiptVoucher) => {
        const match =
          typeof r.voucherNumber === "string" &&
          r.voucherNumber.match(/^RV-(\d{4})$/);
        if (match) {
          const num = parseInt(match[1], 10);
          return num > max ? num : max;
        }
        return max;
      }, 0);
      const nextNum = (maxNum + 1).toString().padStart(4, "0");
      setNextVoucherNumber(`RV-${nextNum}`);
    });
  }, []);

  const filtered = useMemo(() => {
    const t = q.toLowerCase().trim();
    if (!t) return data;
    return data.filter(
      (v) =>
        v.voucherNumber.toLowerCase().includes(t) ||
        v.receivedFrom.toLowerCase().includes(t) ||
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
          <Title order={2}>Receipts</Title>
          <Text size="sm" color="dimmed">
            Record money received from customers and others
          </Text>
        </div>
      </Group>

      <Group justify="space-between" align="center">
        {/* LEFT SIDE */}
        <Group>
          <Stack gap={0}>
            <Text fw={600}>All Receipts</Text>
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
            placeholder="Search receipts..."
            value={q}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setQ(e.currentTarget.value)
            }
            leftSection={<Search size={16} style={{ color: "gray" }} />}
          />

          <Button leftSection={<Plus />} w={160} onClick={() => setOpen(true)}>
            Add Receipt
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
                  <th>Received From</th>
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
                    <td style={{ fontWeight: 600 }}>{v.receivedFrom}</td>
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
                                title: "Receipt Voucher",
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
                                    itemName: `Received From: ${v.receivedFrom}`,
                                    section: `Received From: ${v.receivedFrom}`,
                                    description: `Received From: ${v.receivedFrom}`,
                                    qty: 1,
                                    quantity: 1,
                                    rate: v.amount,
                                    salesRate: v.amount,
                                    amount: v.amount,
                                  },
                                ],
                                totals: {
                                  subtotal: v.amount,
                                  total: v.amount,
                                  totalGrossAmount: v.amount,
                                  totalDiscountAmount: 0,
                                  totalNetAmount: v.amount,
                                },
                                footerNotes: [
                                  "Receipt generated by Aluminium POS",
                                ],
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
          Are you sure you want to delete this receipt voucher?
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
                await deleteReceiptVoucher(deleteTarget.id);
                setData((prev) =>
                  prev.filter((item) => item.id !== deleteTarget.id)
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

      <ReceiptForm
        open={open || !!editVoucher}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditVoucher(null);
        }}
        initialValues={
          editVoucher
            ? {
                ...editVoucher,
                voucherDate:
                  typeof editVoucher.voucherDate === "string"
                    ? new Date(editVoucher.voucherDate)
                    : editVoucher.voucherDate,
                paymentMode: editVoucher.paymentMode as
                  | "Cash"
                  | "Card"
                  | "UPI"
                  | "Cheque"
                  | undefined,
              }
            : !editVoucher && open
            ? { voucherNumber: nextVoucherNumber }
            : undefined
        }
        onSave={async (payload: ReceiptVoucher) => {
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
            receivedFrom: payload.receivedFrom || "Unknown",
            amount: payload.amount,
            referenceNumber: payload.reference ? String(payload.reference) : "",
            paymentMode: payload.paymentMode,
            remarks: payload.remarks || "",
          };
          try {
            if (editVoucher) {
              await updateReceiptVoucher(editVoucher.id, apiPayload);
              setData((prev) =>
                prev.map((item) =>
                  item.id === editVoucher.id
                    ? { ...payload, id: editVoucher.id }
                    : item
                )
              );
            } else {
              await createReceiptVoucher(apiPayload);
              // Optimistically add new receipt to the table
              setData((prev) => [
                {
                  id: Math.random().toString(36).slice(2),
                  voucherNumber: payload.voucherNumber,
                  voucherDate: payload.voucherDate,
                  receivedFrom: payload.receivedFrom,
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
