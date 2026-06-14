"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Loader2,
  Search,
  ChevronDown,
  Info,
  Calendar,
  CreditCard,
  User,
  Car,
  Clock,
  Filter,
} from "lucide-react";
import { useFetchWithAuth } from "@/hooks/use-fetch-with-auth";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaterialIcon } from "@/components/Icon";
import { API_ENDPOINTS, buildApiUrl } from "@/config/api";

// Định nghĩa kiểu dữ liệu
interface VehicleType {
  id: string;
  name: string;
}

interface Vehicle {
  vehicleId: string;
  licensePlate: string;
  type: VehicleType;
  brand: string;
  color: string;
}

interface Customer {
  customerId: string;
  customerType: "LECTURER" | "STUDENT";
  name: string;
  gender: "MALE" | "FEMALE";
  dob: string;
  phoneNumber: string;
  address: string;
  email: string;
}

interface User {
  accountId: string;
  username: string;
  password: string;
  role: string;
}

interface Payment {
  paymentId: string;
  amount: number;
  createAt: string;
  paymentType: string;
}

interface MonthlyCard {
  id: string;
  issueDate: string;
  expirationDate: string;
  customer: Customer;
  vehicle: Vehicle;
  createBy: User;
  payment: Payment;
}

interface ActiveCardsResponse {
  code: number;
  message?: string;
  result?: MonthlyCard[];
}

export default function ListActiveMonthlyCards() {
  const { fetchWithAuth } = useFetchWithAuth();
  const [cards, setCards] = useState<MonthlyCard[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCard, setSelectedCard] = useState<MonthlyCard | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOption, setSortOption] = useState<string>("name");
  const [filterType, setFilterType] = useState<string>("all");

  // Tính số ngày còn lại của thẻ
  const calculateRemainingDays = (expirationDate: string) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: vi });
    } catch (error) {
      return "Không hợp lệ";
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Lấy dữ liệu thẻ tháng
  useEffect(() => {
    const fetchActiveCards = async () => {
      try {
        setIsLoading(true);
        const apiUrl = buildApiUrl(API_ENDPOINTS.MONTHLY_CARDS.ACTIVE);
        const data = await fetchWithAuth<ActiveCardsResponse>(apiUrl);

        if (data.code === 1000 && data.result) {
          setCards(data.result);
        } else {
          toast.error(data.message || "Không thể lấy danh sách thẻ tháng");
        }
      } catch (error) {
        console.error("Error fetching active monthly cards:", error);
        toast.error("Đã xảy ra lỗi khi lấy danh sách thẻ tháng");
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveCards();
  }, [fetchWithAuth]);

  // Lọc thẻ theo từ khóa tìm kiếm và filter
  const filteredAndSortedCards = cards
    .filter(
      (card) =>
        (card.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          card.vehicle.licensePlate
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) &&
        (filterType === "all" ||
          (filterType === "lecturer" &&
            card.customer.customerType === "LECTURER") ||
          (filterType === "student" &&
            card.customer.customerType === "STUDENT") ||
          (filterType === "motorbike" &&
            card.vehicle.type.name === "Motorbike") ||
          (filterType === "scooter" && card.vehicle.type.name === "Scooter") ||
          (filterType === "expiringSoon" &&
            calculateRemainingDays(card.expirationDate) <= 30))
    )
    .sort((a, b) => {
      switch (sortOption) {
        case "name":
          return a.customer.name.localeCompare(b.customer.name);
        case "expirationDate":
          return (
            new Date(a.expirationDate).getTime() -
            new Date(b.expirationDate).getTime()
          );
        case "issueDate":
          return (
            new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
          );
        default:
          return 0;
      }
    });

  // Hiển thị chi tiết thẻ
  const handleShowDetails = (card: MonthlyCard) => {
    setSelectedCard(card);
    setShowDetailDialog(true);
  };

  // Áp dụng bộ lọc
  const handleFilter = (filter: string) => {
    setFilterType(filter);
  };

  // Áp dụng sắp xếp
  const handleSort = (sort: string) => {
    setSortOption(sort);
  };

  // Lấy màu cho loại xe
  const getVehicleTypeColor = (typeName: string) => {
    switch (typeName) {
      case "Bicycle":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Motorbike":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Scooter":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  // Lấy màu cho loại khách hàng
  const getCustomerTypeColor = (type: string) => {
    return type === "LECTURER"
      ? "bg-purple-100 text-purple-800 border-purple-200"
      : "bg-cyan-100 text-cyan-800 border-cyan-200";
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center justify-between pt-3">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100 mr-4">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-m text-muted-foreground">Tổng số thẻ</p>
                <p className="text-3xl font-bold">{cards.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between pt-3">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-purple-100 mr-4">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-m text-muted-foreground">Giảng viên</p>
                <p className="text-3xl font-bold">
                  {
                    cards.filter(
                      (card) => card.customer.customerType === "LECTURER"
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
              <div className="p-2 rounded-full bg-cyan-100 mr-4">
                <User className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-m text-muted-foreground">Sinh viên</p>
                <p className="text-3xl font-bold">
                  {
                    cards.filter(
                      (card) => card.customer.customerType === "STUDENT"
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Danh Sách Thẻ Tháng Đang Còn Hạn</span>
            <div className="flex gap-2"></div>
          </CardTitle>
          <CardDescription>
            Thông tin về các thẻ tháng hiện đang còn hạn sử dụng trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Thanh tìm kiếm và lọc */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Tìm theo tên hoặc biển số xe..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Lọc
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => handleFilter("all")}>
                    Tất cả
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleFilter("lecturer")}>
                    <User className="mr-2 h-4 w-4 text-purple-600" />
                    <span>Giảng viên</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilter("student")}>
                    <User className="mr-2 h-4 w-4 text-cyan-600" />
                    <span>Sinh viên</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleFilter("motorbike")}>
                    <Car className="mr-2 h-4 w-4 text-blue-600" />
                    <span>Xe máy</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilter("scooter")}>
                    <Car className="mr-2 h-4 w-4 text-green-600" />
                    <span>Xe scooter</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleFilter("expiringSoon")}
                  >
                    <Clock className="mr-2 h-4 w-4 text-amber-600" />
                    <span>Sắp hết hạn (≤30 ngày)</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Sắp xếp <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleSort("name")}>
                    Theo tên (A-Z)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSort("expirationDate")}
                  >
                    Ngày hết hạn (Gần nhất)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort("issueDate")}>
                    Ngày đăng ký (Mới nhất)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Bảng thẻ tháng */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredAndSortedCards.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[5%] text-center">STT</TableHead>
                    <TableHead className="w-[15%] text-center">
                      Họ tên
                    </TableHead>
                    <TableHead className="w-[15%] text-center">
                      Loại khách hàng
                    </TableHead>
                    <TableHead className="w-[15%] text-center">
                      Biển số xe
                    </TableHead>
                    <TableHead className="w-[15%] text-center">
                      Loại xe
                    </TableHead>
                    <TableHead className="w-[15%] text-center">
                      Ngày hết hạn
                    </TableHead>
                    <TableHead className="w-[15%] text-center">
                      Thời hạn còn lại
                    </TableHead>
                    <TableHead className="w-[5%] text-center"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedCards.map((card, index) => (
                    <TableRow
                      key={card.id}
                      className={
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      }
                    >
                      <TableCell className="text-center text-slate-500">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <User
                            className={`h-4 w-4 ${
                              card.customer.customerType === "LECTURER"
                                ? "text-purple-600"
                                : "text-cyan-600"
                            }`}
                          />
                          {card.customer.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Badge
                            variant="outline"
                            className={getCustomerTypeColor(
                              card.customer.customerType
                            )}
                          >
                            {card.customer.customerType === "LECTURER"
                              ? "Giảng viên"
                              : "Sinh viên"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {card.vehicle.licensePlate}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Badge
                            variant="outline"
                            className={getVehicleTypeColor(
                              card.vehicle.type.name
                            )}
                          >
                            <span>
                              {card.vehicle.type.name === "Bicycle"
                                ? "Xe đạp"
                                : card.vehicle.type.name === "Motorbike"
                                ? "Xe máy"
                                : card.vehicle.type.name === "Scooter"
                                ? "Xe tay ga"
                                : card.vehicle.type.name}
                            </span>
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                          {formatDate(card.expirationDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Badge
                            className={`${
                              calculateRemainingDays(card.expirationDate) <= 7
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : calculateRemainingDays(card.expirationDate) <=
                                  30
                                ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                : "bg-green-100 text-green-800 border border-green-200"
                            }`}
                          >
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            {calculateRemainingDays(card.expirationDate)} ngày
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleShowDetails(card)}
                          title="Xem chi tiết"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-md border">
              <CreditCard className="h-10 w-10 mx-auto mb-2 text-slate-300" />
              <p className="text-muted-foreground font-medium mb-2">
                Không tìm thấy thẻ tháng nào
              </p>
              <p className="text-sm text-slate-500">
                {searchTerm
                  ? `Không có kết quả phù hợp với "${searchTerm}"`
                  : "Không có thẻ tháng nào đang còn hạn"}
              </p>
              {(searchTerm || filterType !== "all") && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterType("all");
                  }}
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t p-4 text-sm text-muted-foreground">
          Tổng số {filteredAndSortedCards.length} thẻ tháng
        </CardFooter>
      </Card>

      {/* Dialog chi tiết thẻ tháng */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi Tiết Thẻ Tháng</DialogTitle>
            <DialogDescription>
              Thông tin đầy đủ về thẻ tháng đã đăng ký
            </DialogDescription>
          </DialogHeader>

          {selectedCard && (
            <Tabs defaultValue="customer" className="w-full mt-2">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="customer">Thông tin khách hàng</TabsTrigger>
                <TabsTrigger value="vehicle">Thông tin xe</TabsTrigger>
                <TabsTrigger value="card">Thông tin thẻ</TabsTrigger>
              </TabsList>
              <div className="h-[230px] overflow-y-auto">
                <TabsContent
                  value="customer"
                  className="space-y-4 m-0 data-[state=inactive]:hidden"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">
                        Họ tên
                      </p>
                      <div className="flex items-center">
                        <User
                          className={`h-4 w-4 mr-1.5 ${
                            selectedCard.customer.customerType === "LECTURER"
                              ? "text-purple-600"
                              : "text-cyan-600"
                          }`}
                        />
                        <p>{selectedCard.customer.name}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">
                        Loại khách hàng
                      </p>
                      <Badge
                        variant="outline"
                        className={getCustomerTypeColor(
                          selectedCard.customer.customerType
                        )}
                      >
                        {selectedCard.customer.customerType === "LECTURER"
                          ? "Giảng viên"
                          : "Sinh viên"}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">
                        Giới tính
                      </p>
                      <p>
                        {selectedCard.customer.gender === "MALE" ? "Nam" : "Nữ"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">
                        Ngày sinh
                      </p>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1.5 text-gray-500" />
                        <p>{formatDate(selectedCard.customer.dob)}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">
                        Số điện thoại
                      </p>
                      <p>{selectedCard.customer.phoneNumber}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p>{selectedCard.customer.email}</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <p className="text-sm font-medium text-gray-500">
                        Địa chỉ
                      </p>
                      <p>{selectedCard.customer.address}</p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent
                  value="vehicle"
                  className="space-y-4 m-0 data-[state=inactive]:hidden"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">
                        Biển số xe
                      </p>
                      <p className="font-medium">
                        {selectedCard.vehicle.licensePlate}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">
                        Loại xe
                      </p>
                      <Badge
                        variant="outline"
                        className={getVehicleTypeColor(
                          selectedCard.vehicle.type.name
                        )}
                      >
                        <span>
                          {selectedCard.vehicle.type.name === "Bicycle"
                            ? "Xe đạp"
                            : selectedCard.vehicle.type.name === "Motorbike"
                            ? "Xe máy"
                            : selectedCard.vehicle.type.name === "Scooter"
                            ? "Xe tay ga"
                            : selectedCard.vehicle.type.name}
                        </span>
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">
                        Hãng xe
                      </p>
                      <p>{selectedCard.vehicle.brand}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">
                        Màu xe
                      </p>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-3 h-3 rounded-full border border-slate-300"
                          style={{
                            backgroundColor:
                              selectedCard.vehicle.color.toLowerCase(),
                          }}
                        ></div>
                        <p>{selectedCard.vehicle.color}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent
                  value="card"
                  className="space-y-4 m-0 data-[state=inactive]:hidden"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">
                        Ngày phát hành
                      </p>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1.5 text-gray-500" />
                        <p>{formatDate(selectedCard.issueDate)}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">
                        Ngày hết hạn
                      </p>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1.5 text-gray-500" />
                        <p>{formatDate(selectedCard.expirationDate)}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">
                        Số ngày còn lại
                      </p>
                      <Badge
                        className={`${
                          calculateRemainingDays(selectedCard.expirationDate) <=
                          7
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : calculateRemainingDays(
                                selectedCard.expirationDate
                              ) <= 30
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                            : "bg-green-100 text-green-800 border border-green-200"
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5 mr-1.5" />
                        {calculateRemainingDays(
                          selectedCard.expirationDate
                        )}{" "}
                        ngày
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">
                        Giá tiền
                      </p>
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-1.5 text-gray-500" />
                        <p className="font-semibold text-green-600">
                          {formatCurrency(selectedCard.payment.amount)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">
                        Người tạo
                      </p>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1.5 text-gray-500" />
                        <p>{selectedCard.createBy.username}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">
                        Thời gian thanh toán
                      </p>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1.5 text-gray-500" />
                        <p>{formatDate(selectedCard.payment.createAt)}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          )}

          <DialogFooter>
            <Button onClick={() => setShowDetailDialog(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
