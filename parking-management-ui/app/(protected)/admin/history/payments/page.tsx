"use client";

import { useState, useEffect } from "react";
import { format, parseISO, addDays } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  CreditCard,
  Wallet,
  Clock,
  FileText,
  Loader2,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { useFetchWithAuth } from "@/hooks/use-fetch-with-auth";
import { API_ENDPOINTS, buildApiUrl } from "@/config/api";

// Định nghĩa interfaces
interface Payment {
  paymentId: string;
  amount: number;
  createAt: string;
  paymentType: string;
}

interface ApiResponse {
  code: number;
  message?: string;
  result: Payment[];
}

// Số lượng bản ghi trên mỗi trang
const ITEMS_PER_PAGE = 10;

export default function PaymentHistoryPage() {
  const { fetchWithAuth, loading: apiLoading } = useFetchWithAuth();

  // State cho chọn ngày
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // State cho danh sách giao dịch
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // State cho bộ lọc loại thanh toán
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<
    "all" | "PARKING" | "MONTHLY"
  >("all");

  // Hàm lấy dữ liệu cho ngày đã chọn
  const fetchPaymentData = async (date: Date) => {
    try {
      setLoading(true);
      setError(null);

      const month = date.getMonth() + 1; // getMonth() trả về 0-11
      const day = date.getDate();

      const apiUrl = buildApiUrl(API_ENDPOINTS.PAYMENTS.AT_DATE, {
        month,
        day,
      });
      const data = await fetchWithAuth<ApiResponse>(apiUrl);

      if (data && data.code === 1000) {
        // Sắp xếp theo thời gian gần nhất
        const sortedPayments = [...data.result].sort(
          (a, b) =>
            new Date(b.createAt).getTime() - new Date(a.createAt).getTime()
        );

        setPayments(sortedPayments);
        setFilteredPayments(sortedPayments);
        setTotalPages(Math.ceil(sortedPayments.length / ITEMS_PER_PAGE));
        setCurrentPage(1);
      } else {
        throw new Error(data?.message || "Không thể lấy dữ liệu giao dịch");
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu giao dịch:", error);
      setError("Không thể tải lịch sử giao dịch. Vui lòng thử lại sau.");
      toast.error("Không thể tải lịch sử giao dịch");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi chọn ngày
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setCalendarOpen(false);
      fetchPaymentData(date);
    }
  };

  // Fetch dữ liệu khi component mount
  useEffect(() => {
    if (selectedDate) {
      fetchPaymentData(selectedDate);
    }
  }, [fetchWithAuth, selectedDate]);

  // Xử lý filter theo loại thanh toán
  useEffect(() => {
    if (paymentTypeFilter === "all") {
      setFilteredPayments(payments);
    } else {
      const filtered = payments.filter(
        (payment) => payment.paymentType === paymentTypeFilter
      );
      setFilteredPayments(filtered);
    }

    setCurrentPage(1);
  }, [payments, paymentTypeFilter]);

  // Lấy các bản ghi hiển thị trên trang hiện tại
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredPayments.slice(startIndex, endIndex);
  };

  // Xử lý chuyển trang
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Tạo mảng số trang để hiển thị phân trang
  const getPageNumbers = () => {
    const pageNumbers: number[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let startPage: number;
      let endPage: number;

      if (currentPage <= Math.ceil(maxPagesToShow / 2)) {
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (currentPage + Math.floor(maxPagesToShow / 2) >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - Math.floor(maxPagesToShow / 2);
        endPage = currentPage + Math.floor(maxPagesToShow / 2);
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }

    return pageNumbers;
  };

  // Format thời gian đầy đủ
  const formatDateTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), "HH:mm:ss - dd/MM/yyyy", {
        locale: vi,
      });
    } catch (error) {
      return dateString;
    }
  };

  // Hiển thị loader khi đang tải dữ liệu
  if (loading || apiLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Lấy dữ liệu hiển thị trên trang hiện tại
  const currentItems = getCurrentPageItems();
  const pageNumbers = getPageNumbers();

  // Tính tổng doanh thu
  const totalRevenue = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  // Số lượng từng loại giao dịch
  const parkingPayments = payments.filter((p) => p.paymentType === "PARKING");
  const monthlyPayments = payments.filter((p) => p.paymentType === "MONTHLY");
  const missingPayments = payments.filter((p) => p.paymentType === "MISSING");

  // Hàm xuất Excel (CSV)
  const exportToExcel = () => {
    if (filteredPayments.length === 0) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }
    const headers = ["STT", "Thời gian", "Số tiền (VNĐ)", "Loại giao dịch"];
    const rows = filteredPayments.map((payment, index) => {
      const time = formatDateTime(payment.createAt);
      const amount = payment.amount;
      const type = payment.paymentType === "PARKING" ? "Thẻ ngày" : 
                   payment.paymentType === "MONTHLY" ? "Thẻ tháng" : 
                   payment.paymentType === "MISSING" ? "Mất thẻ" : payment.paymentType;
      return [index + 1, time, amount, type];
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lich_su_thanh_toan.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã xuất file Excel thành công");
  };

  return (
    <div className="w-full px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Lịch sử giao dịch</h1>
        <p className="text-gray-500">
          Xem chi tiết các giao dịch thanh toán theo ngày
        </p>
      </div>

      {/* Hiển thị lỗi nếu có */}
      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 mb-8">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Bộ chọn ngày */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal w-[240px]",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "dd 'tháng' MM, yyyy", { locale: vi })
                ) : (
                  <span>Chọn ngày</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateChange}
                disabled={(date) =>
                  date > today ||
                  date < addDays(new Date(today.getFullYear(), 0, 1), 0)
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Thống kê tổng quát */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center justify-between pt-3">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100 mr-4">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
                <p className="text-2xl font-bold">
                  {totalRevenue.toLocaleString("vi-VN")} VNĐ
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between pt-3">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-100 mr-4">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Thẻ ngày</p>
                <p className="text-2xl font-bold">
                  {parkingPayments.length}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    giao dịch
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between pt-3">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-purple-100 mr-4">
                <CalendarIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Thẻ tháng</p>
                <p className="text-2xl font-bold">
                  {monthlyPayments.length}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    giao dịch
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between pt-3">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-red-100 mr-4">
                <CreditCard className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mất thẻ</p>
                <p className="text-2xl font-bold">
                  {missingPayments.length}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    giao dịch
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bảng lịch sử giao dịch */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center">
            <div>
              <CardTitle>
                {`Giao dịch ngày ${
                  selectedDate
                    ? format(selectedDate, "dd/MM/yyyy", { locale: vi })
                    : ""
                } (${filteredPayments.length})`}
              </CardTitle>
              <CardDescription>
                {`Danh sách giao dịch thanh toán theo ngày ${
                  selectedDate
                    ? format(selectedDate, "dd/MM/yyyy", { locale: vi })
                    : ""
                }`}
              </CardDescription>
            </div>

            <div className="mt-4 lg:mt-0 flex gap-3 items-center">
              <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
                <Download className="h-4 w-4" />
                Xuất Excel
              </Button>
              <Select
                value={paymentTypeFilter}
                onValueChange={(value) =>
                  setPaymentTypeFilter(value as "all" | "PARKING" | "MONTHLY")
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Loại giao dịch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="PARKING">Thẻ ngày</SelectItem>
                  <SelectItem value="MONTHLY">Thẻ tháng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800">
                  <TableHead className="font-medium w-[5%] text-center">
                    STT
                  </TableHead>
                  <TableHead className="font-medium w-[15%] text-center">
                    Thời gian
                  </TableHead>
                  <TableHead className="font-medium w-[10%] text-center">
                    Số tiền (VNĐ)
                  </TableHead>
                  <TableHead className="font-medium w-[10%] text-center">
                    Loại giao dịch
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="h-10 w-10 mb-2 opacity-20" />
                        <span>Không tìm thấy giao dịch nào</span>
                        {paymentTypeFilter !== "all" && (
                          <div className="flex items-center gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPaymentTypeFilter("all")}
                            >
                              Xóa bộ lọc
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((payment, index) => (
                    <TableRow
                      key={payment.paymentId}
                      className={
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      }
                    >
                      <TableCell className="text-center text-slate-500">
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {formatDateTime(payment.createAt)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-center">
                        {payment.amount.toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          {payment.paymentType === "PARKING" ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                              Thẻ ngày
                            </Badge>
                          ) : payment.paymentType === "MONTHLY" ? (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100">
                              Thẻ tháng
                            </Badge>
                          ) : payment.paymentType === "MISSING" ? (
                            <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
                              Mất thẻ
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">
                              {payment.paymentType}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="py-4 border-t px-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        handlePageChange(Math.max(1, currentPage - 1))
                      }
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {pageNumbers[0] > 1 && (
                    <>
                      <PaginationItem>
                        <PaginationLink onClick={() => handlePageChange(1)}>
                          1
                        </PaginationLink>
                      </PaginationItem>
                      {pageNumbers[0] > 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                    </>
                  )}

                  {pageNumbers.map((pageNumber) => (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => handlePageChange(pageNumber)}
                        isActive={pageNumber === currentPage}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  {pageNumbers[pageNumbers.length - 1] < totalPages && (
                    <>
                      {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => handlePageChange(totalPages)}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        handlePageChange(Math.min(totalPages, currentPage + 1))
                      }
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
