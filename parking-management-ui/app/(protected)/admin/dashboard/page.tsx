"use client";

import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Calendar,
  TimerIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useDashboard } from "@/hooks/use-dashboard";
import { MaterialIcon } from "@/components/Icon";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend as RechartsLegend, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
  const {
    loading,
    error,
    currentStats,
    inParkingCount,
    entriesCount,
    exitsCount,
    currentPage,
    totalPages,
    getPaginatedData,
    getPageNumbers,
    handlePageChange,
    formatTimestamp,
    getVehicleTypeCount,
  } = useDashboard(5); // 5 items per page

  // Script để cập nhật thời gian thực
  useEffect(() => {
    const updateTime = () => {
      const timeElement = document.getElementById("live-time");
      if (timeElement) {
        timeElement.textContent = new Date().toLocaleTimeString("vi-VN");
      }
    };

    const interval = setInterval(updateTime, 1000);
    updateTime();

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const currentData = getPaginatedData();
  const pageNumbers = getPageNumbers();

  const pieData = [
    { name: "Xe máy", value: currentStats?.motorbike || 0, color: "#3b82f6" },
    { name: "Xe tay ga", value: currentStats?.scooter || 0, color: "#22c55e" },
    { name: "Xe đạp", value: currentStats?.bicycle || 0, color: "#eab308" },
  ].filter(item => item.value > 0);

  return (
    <div className="w-full px-4 py-6">
      {/* Header với breadcrumb */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-500">
            Tổng quan tình hình bãi đỗ xe ngày {today}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-4 py-2">
          <Calendar className="h-4 w-4 text-slate-500" />
          <span className="text-slate-600 font-medium">
            {new Date().toLocaleDateString("vi-VN")}
          </span>
          <TimerIcon className="h-4 w-4 text-slate-500 ml-2" />
          <span className="text-slate-600 font-medium" id="live-time">
            {new Date().toLocaleTimeString("vi-VN")}
          </span>
        </div>
      </div>

      {/* Hiển thị lỗi */}
      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 mb-8">
          <p className="text-red-600 font-medium flex items-center">
            <span className="mr-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </span>
            {error}
          </p>
        </div>
      )}

      {/* Grid layout cho thống kê */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Thống kê tổng số xe - chiếm 3/12 */}
        <Card className="col-span-12 sm:col-span-6 lg:col-span-3 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-m font-medium">
              Tổng số xe hiện tại
            </CardTitle>
            <div className="p-2 rounded-full bg-slate-100">
              <Users className="h-4 w-4 text-slate-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-5">
              {inParkingCount || 0}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Số xe đang có trong bãi
              </p>
              <div className="text-xs font-medium bg-slate-100 rounded-full px-2 py-0.5">
                +{entriesCount} vào hôm nay
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thống kê xe máy - chiếm 3/12 */}
        <Card className="col-span-12 sm:col-span-6 lg:col-span-3 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-m font-medium">Xe máy</CardTitle>
            <div className="px-1.5 py-1 rounded-full bg-blue-100">
              <MaterialIcon icon="motorcycle" className="text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600 mb-5">
              {currentStats?.motorbike || 0}
            </div>
            <div className="flex items-center justify-between">
              {/* Số lượng xe vào bên trái */}
              <span className="text-green-600 flex items-center text-xs gap-0.5 bg-green-50 rounded-full px-2 py-0.5">
                <TrendingUp className="h-3 w-3" />
                {getVehicleTypeCount("Motorbike", "ENTRY")} vào
              </span>

              {/* Số lượng xe ra bên phải */}
              <span className="text-red-600 flex items-center text-xs gap-0.5 bg-red-50 rounded-full px-2 py-0.5">
                <TrendingDown className="h-3 w-3" />
                {getVehicleTypeCount("Motorbike", "EXIT")} ra
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Thống kê xe tay ga - chiếm 3/12 */}
        <Card className="col-span-12 sm:col-span-6 lg:col-span-3 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-m font-medium">Xe tay ga</CardTitle>
            <div className="px-1.5 py-1 rounded-full bg-green-100">
              <MaterialIcon
                icon="electric_scooter"
                className="text-green-600"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600 mb-5">
              {currentStats?.scooter || 0}
            </div>
            <div className="flex items-center justify-between">
              {/* Số lượng xe vào bên trái */}
              <span className="text-green-600 flex items-center text-xs gap-0.5 bg-green-50 rounded-full px-2 py-0.5">
                <TrendingUp className="h-3 w-3" />
                {getVehicleTypeCount("Scooter", "ENTRY")} vào
              </span>

              {/* Số lượng xe ra bên phải */}
              <span className="text-red-600 flex items-center text-xs gap-0.5 bg-red-50 rounded-full px-2 py-0.5">
                <TrendingDown className="h-3 w-3" />
                {getVehicleTypeCount("Scooter", "EXIT")} ra
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Thống kê xe đạp - chiếm 3/12 */}
        <Card className="col-span-12 sm:col-span-6 lg:col-span-3 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-m font-medium">Xe đạp</CardTitle>
            <div className="px-1.5 py-1 rounded-full bg-yellow-100">
              <MaterialIcon icon="pedal_bike" className="text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-yellow-600 mb-5">
              {currentStats?.bicycle || 0}
            </div>
            <div className="flex items-center justify-between">
              {/* Số lượng xe vào bên trái */}
              <span className="text-green-600 flex items-center text-xs gap-0.5 bg-green-50 rounded-full px-2 py-0.5">
                <TrendingUp className="h-3 w-3" />
                {getVehicleTypeCount("Bicycle", "ENTRY")} vào
              </span>

              {/* Số lượng xe ra bên phải */}
              <span className="text-red-600 flex items-center text-xs gap-0.5 bg-red-50 rounded-full px-2 py-0.5">
                <TrendingDown className="h-3 w-3" />
                {getVehicleTypeCount("Bicycle", "EXIT")} ra
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-6 mb-8">
        <Card className="col-span-12 lg:col-span-4 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Phân bổ loại xe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <RechartsLegend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Không có dữ liệu loại xe
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-8 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="flex flex-row items-start justify-between border-b pb-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Lượt ra vào gần đây
              </CardTitle>
              <CardDescription className="mt-1">
                Các xe ra/vào bãi trong ngày ({entriesCount + exitsCount} lượt)
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800">
                    <TableHead className="font-medium w-[5%] text-center py-3">
                      STT
                    </TableHead>
                    <TableHead className="font-medium w-[20%] text-center py-3 pl-6">
                      Biển số/Identifier
                    </TableHead>
                    <TableHead className="font-medium w-[15%] text-center py-3">
                      Loại xe
                    </TableHead>
                    <TableHead className="font-medium w-[25%] text-center py-3">
                      Thời gian
                    </TableHead>
                    <TableHead className="font-medium w-[15%] text-center py-3">
                      Loại vé
                    </TableHead>
                    <TableHead className="font-medium w-[20%] text-center py-3 pr-6">
                      Trạng thái
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <Activity className="h-10 w-10 mb-2 opacity-20" />
                          <span>Không có hoạt động nào</span>
                          <span className="text-sm mt-1">
                            Các hoạt động xe ra/vào sẽ hiển thị ở đây
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentData.map((record, index) => (
                      <TableRow
                        key={index}
                        className={
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/50 dark:bg-slate-900/50"
                        }
                      >
                        <TableCell className="text-center text-slate-500">
                          {(currentPage - 1) * 5 + index + 1}
                        </TableCell>
                        <TableCell className="font-medium text-center pl-6">
                          {record.licensePlate}
                        </TableCell>
                        <TableCell>
                          {record.vehicleType === "Bicycle" && (
                            <span className="flex items-center justify-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block"></span>
                              Xe đạp
                            </span>
                          )}
                          {record.vehicleType === "Motorbike" && (
                            <span className="flex items-center justify-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                              Xe máy
                            </span>
                          )}
                          {record.vehicleType === "Scooter" && (
                            <span className="flex items-center justify-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                              Xe tay ga
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-center text-xs">
                          {formatTimestamp(record.timestamp)}
                        </TableCell>
                        <TableCell className="text-center">
                          {record.ticketType === "MONTHLY" ? (
                            <div className="flex justify-center">
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-800 border-green-200"
                              >
                                Vé tháng
                              </Badge>
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <Badge
                                variant="outline"
                                className="bg-blue-100 text-blue-800 border-blue-200"
                              >
                                Vé ngày
                              </Badge>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="pr-6 text-center">
                          <div className="flex justify-center">
                            {record.eventType === "ENTRY" ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="m15 14 5-5-5-5"></path>
                                  <path d="M4 20v-7a4 4 0 0 1 4-4h12"></path>
                                </svg>
                                Vào
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="m9 10-5 5 5 5"></path>
                                  <path d="M20 4v7a4 4 0 0 1-4 4H4"></path>
                                </svg>
                                Ra
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
    </div>
  );
}
