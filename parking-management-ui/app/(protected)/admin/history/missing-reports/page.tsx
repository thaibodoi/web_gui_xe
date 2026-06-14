"use client";

import { useState, useEffect } from "react";
import {
  format,
  parseISO,
  differenceInMinutes,
  differenceInHours,
} from "date-fns";
import { vi } from "date-fns/locale";
import {
  Loader2,
  Search,
  Car,
  User,
  Calendar,
  Palette,
  CreditCard,
  Info,
  FileText,
  X,
  AlertTriangle,
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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useFetchWithAuth } from "@/hooks/use-fetch-with-auth";
import { API_ENDPOINTS, buildApiUrl } from "@/config/api";

// Định nghĩa interfaces
interface VehicleType {
  name: string;
}

interface Card {
  cardId: number;
}

interface Staff {
  username: string;
}

interface Payment {
  amount: number;
  createAt: string;
  paymentType: string;
}

interface ParkingRecord {
  licensePlate?: string;
  identifier?: string;
  vehicleType: VehicleType;
  card: Card;
  entryTime: string;
  exitTime: string;
  type: "DAILY" | "MONTHLY";
  staffIn: Staff;
  staffOut: Staff;
}

interface MissingReport {
  licensePlate?: string;
  identifier?: string;
  vehicleType: VehicleType;
  name: string;
  gender: "MALE" | "FEMALE";
  phoneNumber: string;
  address: string;
  brand: string;
  color: string;
  identification: string;
  payment: Payment;
  createBy: Staff;
  createAt: string;
  record: ParkingRecord;
}

interface ApiResponse {
  code: number;
  message?: string;
  result: MissingReport[];
}

// Số lượng báo cáo trên mỗi trang
const ITEMS_PER_PAGE = 10;

export default function MissingReportsPage() {
  const { fetchWithAuth, loading: apiLoading } = useFetchWithAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State cho danh sách báo cáo
  const [reports, setReports] = useState<MissingReport[]>([]);

  // State cho tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredReports, setFilteredReports] = useState<MissingReport[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // State cho dialog chi tiết
  const [selectedReport, setSelectedReport] = useState<MissingReport | null>(
    null
  );
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Fetch danh sách báo cáo từ API
  useEffect(() => {
    const fetchMissingReports = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiUrl = buildApiUrl(API_ENDPOINTS.MISSING_REPORTS);
        const data = await fetchWithAuth<ApiResponse>(apiUrl);

        if (data && data.code === 1000) {
          // Sắp xếp theo thời gian tạo mới nhất
          const sortedReports = [...data.result].sort(
            (a, b) =>
              new Date(b.createAt).getTime() - new Date(a.createAt).getTime()
          );

          setReports(sortedReports);
          setFilteredReports(sortedReports);
          setTotalPages(Math.ceil(sortedReports.length / ITEMS_PER_PAGE));
        } else {
          throw new Error(
            data?.message || "Không thể lấy danh sách báo cáo mất xe"
          );
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách báo cáo mất xe:", error);
        setError(
          "Không thể tải danh sách báo cáo mất xe. Vui lòng thử lại sau."
        );
        toast.error("Không thể tải danh sách báo cáo mất xe");
      } finally {
        setLoading(false);
      }
    };

    fetchMissingReports();
  }, [fetchWithAuth]);

  // Xử lý tìm kiếm
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredReports(reports);
      setIsSearching(false);
      setTotalPages(Math.ceil(reports.length / ITEMS_PER_PAGE));
      setCurrentPage(1);
      return;
    }

    setIsSearching(true);
    const lowercasedSearchTerm = searchTerm.toLowerCase();

    const results = reports.filter((report) => {
      return (
        (report.licensePlate?.toLowerCase().includes(lowercasedSearchTerm)) ||
        (report.identifier?.toLowerCase().includes(lowercasedSearchTerm)) ||
        (report.name?.toLowerCase().includes(lowercasedSearchTerm)) ||
        (report.brand?.toLowerCase().includes(lowercasedSearchTerm)) ||
        (report.createBy?.username?.toLowerCase().includes(lowercasedSearchTerm)) ||
        (report.phoneNumber?.includes(searchTerm)) ||
        (report.identification?.includes(searchTerm))
      );
    });

    setFilteredReports(results);
    setTotalPages(Math.ceil(results.length / ITEMS_PER_PAGE));
    setCurrentPage(1);
  }, [searchTerm, reports]);

  // Lấy các báo cáo hiển thị trên trang hiện tại
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredReports.slice(startIndex, endIndex);
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
      return format(parseISO(dateString), "HH:mm - dd/MM/yyyy", { locale: vi });
    } catch (error) {
      return dateString;
    }
  };

  // Tính thời gian đỗ xe
  const calculateParkingDuration = (entryTime: string, exitTime: string) => {
    const entry = parseISO(entryTime);
    const exit = parseISO(exitTime);

    const minutes = differenceInMinutes(exit, entry);
    const hours = differenceInHours(exit, entry);

    if (hours < 1) {
      return `${minutes} phút`;
    } else {
      const remainingMinutes = minutes % 60;
      return `${hours} giờ ${remainingMinutes} phút`;
    }
  };

  // Hiển thị chi tiết báo cáo
  const showReportDetail = (report: MissingReport) => {
    setSelectedReport(report);
    setDetailDialogOpen(true);
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
  const currentReports = getCurrentPageItems();
  const pageNumbers = getPageNumbers();

  return (
    <div className="w-full px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Lịch sử báo cáo mất thẻ xe</h1>
        <p className="text-gray-500">
          Danh sách các báo cáo mất thẻ xe đã được ghi nhận trong hệ thống
        </p>
      </div>

      {/* Hiển thị lỗi nếu có */}
      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 mb-8">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Thống kê tổng quát */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center justify-between pt-3">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-red-100 mr-4">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng báo cáo</p>
                <p className="text-2xl font-bold">{reports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between pt-3">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100 mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="text-blue-600"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="5.5" cy="17.5" r="3.5"></circle>
                  <circle cx="18.5" cy="17.5" r="3.5"></circle>
                  <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5 1.5-5 4-3-5-1-2 4-4 5"></path>
                </svg>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phương tiện</p>
                <p className="text-2xl font-bold">
                  {
                    reports.filter(
                      (report) =>
                        report.vehicleType.name === "Motorbike" ||
                        report.vehicleType.name === "Scooter"
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between pt-3">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-yellow-100 mr-4">
                <CreditCard className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng phí đã thu</p>
                <p className="text-2xl font-bold">
                  {reports
                    .reduce((sum, report) => sum + report.payment.amount, 0)
                    .toLocaleString("vi-VN")}{" "}
                  VNĐ
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bảng danh sách báo cáo mất xe */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center">
            <div>
              <CardTitle>
                {isSearching
                  ? `Kết quả tìm kiếm (${filteredReports.length})`
                  : `Danh sách báo cáo mất thẻ xe (${reports.length})`}
              </CardTitle>
              <CardDescription>
                {isSearching
                  ? `Đang hiển thị kết quả tìm kiếm cho "${searchTerm}"`
                  : "Danh sách tất cả báo cáo mất thẻ xe theo thứ tự thời gian gần đây nhất"}
              </CardDescription>
            </div>

            {/* Tìm kiếm */}
            <div className="w-full lg:w-[320px] mt-4 lg:mt-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm biển số, tên, CMND..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {isSearching && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-10 w-10"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
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
                    Ngày báo cáo
                  </TableHead>
                  <TableHead className="font-medium w-[15%] text-center">
                    Biển số/Identifier
                  </TableHead>
                  <TableHead className="font-medium w-[15%] text-center">
                    Người báo cáo
                  </TableHead>
                  <TableHead className="font-medium w-[10%] text-center">
                    Loại xe
                  </TableHead>
                  <TableHead className="font-medium w-[10%] text-center">
                    Thương hiệu
                  </TableHead>
                  <TableHead className="font-medium w-[10%] text-center">
                    Phí (VNĐ)
                  </TableHead>
                  <TableHead className="font-medium w-[10%] text-center">
                    Nhân viên
                  </TableHead>
                  <TableHead className="font-medium w-[10%] text-center">
                    Chi tiết
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="h-10 w-10 mb-2 opacity-20" />
                        <span>Không tìm thấy báo cáo mất thẻ xe nào</span>
                        {isSearching && (
                          <div className="flex items-center gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSearchTerm("")}
                            >
                              Xóa tìm kiếm
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentReports.map((report, index) => (
                    <TableRow
                      key={index}
                      className={
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      }
                    >
                      <TableCell className="text-center text-slate-500">
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">
                        {formatDateTime(report.createAt)}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {report.licensePlate || (
                          <span className="text-slate-500 italic">
                            ID: {report.identifier}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center">
                          <div className="font-medium">{report.name}</div>
                          <div className="text-xs text-slate-500">
                            {report.phoneNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full inline-block ${
                              report.vehicleType.name === "Bicycle"
                                ? "bg-yellow-500"
                                : report.vehicleType.name === "Motorbike"
                                ? "bg-blue-500"
                                : report.vehicleType.name === "Scooter"
                                ? "bg-green-500"
                                : "bg-purple-500"
                            }`}
                          ></span>
                          {report.vehicleType.name === "Bicycle"
                            ? "Xe đạp"
                            : report.vehicleType.name === "Motorbike"
                            ? "Xe máy"
                            : report.vehicleType.name === "Scooter"
                            ? "Xe tay ga"
                            : report.vehicleType.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Palette className="h-3 w-3 text-slate-400" />
                          <span>{report.brand}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {report.color}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-center">
                        {report.payment.amount.toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <User className="h-3 w-3 text-slate-400" />
                          <span>{report.createBy.username}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => showReportDetail(report)}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
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

      {/* Dialog xem chi tiết báo cáo */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết báo cáo mất thẻ xe</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về báo cáo mất thẻ xe
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Thông tin người báo mất */}
                <div className="bg-slate-50 p-3 rounded-md">
                  <h3 className="font-semibold text-slate-700 mb-2 flex items-center">
                    <User className="h-4 w-4 mr-2 text-slate-600" />
                    Thông tin người báo mất
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-slate-500">Họ tên:</div>
                    <div className="font-medium col-span-2">
                      {selectedReport.name}
                    </div>

                    <div className="text-slate-500">Giới tính:</div>
                    <div className="font-medium col-span-2">
                      {selectedReport.gender === "MALE" ? "Nam" : "Nữ"}
                    </div>

                    <div className="text-slate-500">CMND/CCCD:</div>
                    <div className="font-medium col-span-2">
                      {selectedReport.identification}
                    </div>

                    <div className="text-slate-500">Điện thoại:</div>
                    <div className="font-medium col-span-2">
                      {selectedReport.phoneNumber}
                    </div>

                    <div className="text-slate-500">Địa chỉ:</div>
                    <div className="font-medium col-span-2">
                      {selectedReport.address}
                    </div>
                  </div>
                </div>

                {/* Thông tin xe */}
                <div className="bg-slate-50 p-3 rounded-md">
                  <h3 className="font-semibold text-slate-700 mb-2 flex items-center">
                    <Car className="h-4 w-4 mr-2 text-slate-600" />
                    Thông tin xe
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-slate-500">Loại xe:</div>
                    <div className="font-medium col-span-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full inline-block ${
                            selectedReport.vehicleType.name === "Bicycle"
                              ? "bg-yellow-500"
                              : selectedReport.vehicleType.name === "Motorbike"
                              ? "bg-blue-500"
                              : selectedReport.vehicleType.name === "Scooter"
                              ? "bg-green-500"
                              : "bg-purple-500"
                          }`}
                        ></span>
                        {selectedReport.vehicleType.name === "Bicycle"
                          ? "Xe đạp"
                          : selectedReport.vehicleType.name === "Motorbike"
                          ? "Xe máy"
                          : selectedReport.vehicleType.name === "Scooter"
                          ? "Xe tay ga"
                          : selectedReport.vehicleType.name}
                      </div>
                    </div>

                    <div className="text-slate-500">Biển số:</div>
                    <div className="font-medium col-span-2">
                      {selectedReport.licensePlate || "Không có"}
                    </div>

                    <div className="text-slate-500">Identifier:</div>
                    <div className="font-medium col-span-2">
                      {selectedReport.identifier || "Không có"}
                    </div>

                    <div className="text-slate-500">Thương hiệu:</div>
                    <div className="font-medium col-span-2">
                      {selectedReport.brand}
                    </div>

                    <div className="text-slate-500">Màu sắc:</div>
                    <div className="font-medium col-span-2">
                      {selectedReport.color}
                    </div>

                    <div className="text-slate-500">Mã thẻ:</div>
                    <div className="font-medium col-span-2">
                      {selectedReport.record?.card?.cardId || "Không có"}
                    </div>

                    <div className="text-slate-500">Loại vé:</div>
                    <div className="font-medium col-span-2">
                      {selectedReport.record?.type === "DAILY"
                        ? "Vé ngày"
                        : selectedReport.record?.type === "MONTHLY"
                        ? "Vé tháng"
                        : "Không có"}
                    </div>
                  </div>
                </div>

                {/* Thông tin thời gian */}
                <div className="bg-slate-50 p-3 rounded-md">
                  <h3 className="font-semibold text-slate-700 mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-slate-600" />
                    Thông tin thời gian
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-slate-500">Thời gian gửi xe:</div>
                    <div className="font-medium col-span-2">
                      {selectedReport.record?.entryTime ? formatDateTime(selectedReport.record.entryTime) : "Không có"}
                    </div>

                    <div className="text-slate-500">Thời gian báo mất:</div>
                    <div className="font-medium col-span-2">
                      {formatDateTime(selectedReport.createAt)}
                    </div>

                    <div className="text-slate-500">Thời gian gửi:</div>
                    <div className="font-medium col-span-2">
                      {selectedReport.record?.entryTime && selectedReport.record?.exitTime ? calculateParkingDuration(
                        selectedReport.record.entryTime,
                        selectedReport.record.exitTime
                      ) : "Không có"}
                    </div>
                  </div>
                </div>

                {/* Thông tin thanh toán */}
                <div className="bg-slate-50 p-3 rounded-md">
                  <h3 className="font-semibold text-slate-700 mb-2 flex items-center">
                    <CreditCard className="h-4 w-4 mr-2 text-slate-600" />
                    Thông tin thanh toán
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-slate-500">Phí bồi thường:</div>
                    <div className="font-medium col-span-2">
                      {selectedReport.payment.amount.toLocaleString("vi-VN")}{" "}
                      VNĐ
                    </div>

                    <div className="text-slate-500">Thời gian thanh toán:</div>
                    <div className="font-medium col-span-2">
                      {formatDateTime(selectedReport.payment.createAt)}
                    </div>

                    <div className="text-slate-500">Nhân viên xử lý:</div>
                    <div className="font-medium col-span-2">
                      {selectedReport.createBy.username}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setDetailDialogOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
