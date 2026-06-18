"use client";

import { useState, useEffect } from "react";
import { Loader2, Clock, Calendar, Settings } from "lucide-react";
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
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useFetchWithAuth } from "@/hooks/use-fetch-with-auth";
import { Badge } from "@/components/ui/badge";
import { API_ENDPOINTS, buildApiUrl } from "@/config/api";

// Định nghĩa interfaces
interface VehicleType {
  id: string;
  name: string;
}

interface PriceData {
  type: VehicleType;
  dayPrice: number;
  nightPrice: number;
  monthlyPrice: number;
}

interface ApiResponse {
  code: number;
  message?: string;
  result: PriceData[];
}

export default function GetPricePage() {
  const router = useRouter();
  const { fetchWithAuth, loading: fetchLoading } = useFetchWithAuth();
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dữ liệu giá từ API
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiUrl = buildApiUrl(API_ENDPOINTS.PRICES.ALL);
        const data = await fetchWithAuth<ApiResponse>(apiUrl);

        if (data && data.code === 1000) {
          setPriceData(data.result);
        } else {
          throw new Error(data?.message || "Không thể lấy thông tin giá");
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin giá:", error);
        setError("Không thể tải thông tin giá. Vui lòng thử lại sau.");
        toast.error("Không thể tải thông tin giá");
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, [fetchWithAuth]);

  // Hiển thị loader khi đang tải dữ liệu
  if (loading || fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Quản lý giá dịch vụ</h1>
        <p className="text-gray-500">Xem bảng giá dịch vụ gửi xe hiện tại</p>
      </div>

      {/* Hiển thị lỗi nếu có */}
      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 mb-8">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Thông tin về các loại giá */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <div className="p-2 rounded-full bg-blue-100 mr-2">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              Giá ngày
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p className="text-sm text-muted-foreground">
                Áp dụng từ 6:00 đến 18:00 cho khách hàng gửi xe.
              </p>
              <p className="text-sm mt-2">
                Phí được tính cho mỗi lượt ra/vào, không tính theo giờ.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <div className="p-2 rounded-full bg-indigo-100 mr-2">
                <Clock className="h-4 w-4 text-indigo-600" />
              </div>
              Giá đêm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p className="text-sm text-muted-foreground">
                Áp dụng từ 18:00 đến 6:00 sáng hôm sau cho khách hàng gửi xe.
              </p>
              <p className="text-sm mt-2">
                Phí cao hơn so với giá ngày do chi phí vận hành ban đêm.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <div className="p-2 rounded-full bg-green-100 mr-2">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
              Giá tháng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p className="text-sm text-muted-foreground">
                Áp dụng cho khách hàng đăng ký vé tháng, có thời hạn 30 ngày.
              </p>
              <p className="text-sm mt-2">
                Phí một lần nhưng được phép ra vào không giới hạn số lần trong
                thời hạn.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bảng giá */}
      <Card className="shadow-sm">
        <CardHeader>
          <div>
            <CardTitle className="text-xl">Bảng giá gửi xe hiện tại</CardTitle>
            <CardDescription>
              Giá dịch vụ gửi xe theo từng loại phương tiện
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800">
                <TableHead className="font-medium text-center">
                  Loại xe
                </TableHead>
                <TableHead className="font-medium text-center">
                  Giá ngày (VNĐ)
                </TableHead>
                <TableHead className="font-medium text-center">
                  Giá đêm (VNĐ)
                </TableHead>
                <TableHead className="font-medium text-center">
                  Giá tháng (VNĐ)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceData.map((price, index) => (
                <TableRow
                  key={price.type.id}
                  className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={`w-3 h-3 rounded-full ${price.type.name === "Bicycle"
                            ? "bg-yellow-500"
                            : price.type.name === "Motorbike"
                              ? "bg-blue-500"
                              : "bg-green-500"
                          }`}
                      ></span>
                      {price.type.name === "Bicycle" ? "Xe đạp" : price.type.name === "Motorbike" ? "Xe máy" : "Xe tay ga"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-center">
                      <span className="font-medium">
                        {price.dayPrice.toLocaleString("vi-VN")}
                      </span>
                      <Badge
                        variant="outline"
                        className="ml-2 bg-blue-50 text-blue-700 border-blue-200"
                      >
                        Ngày
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-center">
                      <span className="font-medium">
                        {price.nightPrice.toLocaleString("vi-VN")}
                      </span>
                      <Badge
                        variant="outline"
                        className="ml-2 bg-indigo-50 text-indigo-700 border-indigo-200"
                      >
                        Đêm
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-center">
                      <span className="font-medium">
                        {price.monthlyPrice.toLocaleString("vi-VN")}
                      </span>
                      <Badge
                        variant="outline"
                        className="ml-2 bg-green-50 text-green-700 border-green-200"
                      >
                        Tháng
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/admin/prices/${price.type.id}`)
                      }
                      className="h-8 w-8 p-0"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
