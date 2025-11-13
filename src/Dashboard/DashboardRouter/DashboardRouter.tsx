import type { RouteObject } from "react-router";
import DashboardLayout from "../DashboardLayout/DashboardLayout";
import ProtectedRoute from "../../Auth/ProtectedRoute";
import Dashboard from "../Pages/Dashboard";
import SalesReturnPage from "../Pages/Sales/Salereturn";
import ProductMaster from "../Pages/Products/ProductMaster";
import StockReportPage from "../Pages/Products/StockReport";
import CustomersPage from "../Pages/Sales/Customers";
import QuotationsPage from "../Pages/Sales/Quotation";
import SalesInvoicePage from "../Pages/Sales/SaleInvoice";
import SuppliersPage from "../Pages/Purchase/Supplier";
import PurchaseOrderPage from "../Pages/Purchase/PurchaseOrder";

import PurchaseInvoicePage from "../Pages/Purchase/PurchaseInvoice";
import PurchaseReturnPage from "../Pages/Purchase/PurchaseReturn";
import ExpensesPage from "../Pages/Expenses";

import CashBookPage from "../Pages/Accounts/CashBook";
import BankBookPage from "../Pages/Accounts/BankBook";

import ProfitLoss from "../Pages/Reports/Profit&Loss";
import JournalLedger from "../Pages/Reports/JournalLedger";

import CategoryPage from "../Pages/Products/Category";

import PaymentVouchersPage from "../Pages/Accounts/PaymentVoucher";
import ReceiptsPage from "../Pages/Accounts/ReceiptVoucher";
import Stocksummary from "../Pages/Reports/Stocksummary";

const routes: RouteObject[] = [
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      //-------------------Products-----------------//
      {
        path: "products",
        element: <ProductMaster />,
      },
      {
        path: "products/categories",
        element: <CategoryPage />,
      },
      {
        path: "products/stock-report",
        element: <StockReportPage />,
      },
      {
        path: "products/stock-summary",
        element: <Stocksummary />,
      },
      //-------------------Sales-----------------//
      {
        path: "sales/customers",
        element: <CustomersPage />,
      },
      {
        path: "sales/quotations",
        element: <QuotationsPage />,
      },
      {
        path: "sales/invoices",
        element: <SalesInvoicePage />,
      },
      {
        path: "sales/returns",
        element: <SalesReturnPage />,
      },
      //-------------------Purchases-----------------//
      {
        path: "/purchase/suppliers",
        element: <SuppliersPage />,
      },
      {
        path: "/purchase/orders",
        element: <PurchaseOrderPage />,
      },

      {
        path: "/purchase/invoices",
        element: <PurchaseInvoicePage />,
      },
      {
        path: "/purchase/returns",
        element: <PurchaseReturnPage />,
      },
      //-------------------Expenses-----------------//
      {
        path: "/expenses",
        element: <ExpensesPage />,
      },
      // -------------------Accounts-----------------//
      {
        path: "/accounts/receipts",
        element: <ReceiptsPage />,
      },
      {
        path: "/accounts/payments",
        element: <PaymentVouchersPage />,
      },

      {
        path: "/accounts/cash-book",
        element: <CashBookPage />,
      },
      {
        path: "/accounts/bank-book",
        element: <BankBookPage />,
      },
      //---------------------Reports-----------------//

      {
        path: "/reports/profit-loss",
        element: <ProfitLoss />,
      },
      {
        path: "/reports/journal-ledger",
        element: <JournalLedger />,
      },
      {},
    ],
  },
];
export default routes;
