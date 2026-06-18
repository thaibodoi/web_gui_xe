"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Save, ArrowLeft, Clock, Calendar, Ban } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFetchWithAuth } from "@/hooks/use-fetch-with-auth";
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
  result: PriceData;
}

interface VehicleTypesResponse {
  code: number;
  message?: string;
  result: VehicleType[];
}

// Schema validation cho form cập nhật giá
const priceFormSchema = z.object({
  dayPrice: z
    .string()
    .min(1, { message: "Giá ngày không được để trống" })
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "Giá phải là số dương"
    ),
  nightPrice: z
    .string()
    .min(1, { message: "Giá đêm không được để trống" })
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "Giá phải là số dương"
    ),
  monthlyPrice: z
    .string()
    .min(1, { message: "Giá tháng không được để trống" })
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      "Giá phải là số dương hoặc 0"
    ),
});

type PriceFormValues = z.infer<typeof priceFormSchema>;

export default function UpdatePricePage() {
  const params = useParams();
  const router = useRouter();
  const { fetchWithAuth, loading: fetchLoading } = useFetchWithAuth();

  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formValues, setFormValues] = useState<PriceFormValues | null>(null);

  // Khởi tạo form
  const form = useForm<PriceFormValues>({
    resolver: zodResolver(priceFormSchema),
    defaultValues: {
      dayPrice: "",
      nightPrice: "",
      monthlyPrice: "",
    },
  });

  // Lấy id từ route params
  const typeId = params.id as string;

  // Fetch thông tin loại xe từ API
  useEffect(() => {
    const fetchVehicleTypeInfo = async () => {
      if (!typeId) return;

      try {
        setLoading(true);
        setError(null);

        // Lấy danh sách loại xe từ API để hiển thị tên
        const typesUrl = buildApiUrl(API_ENDPOINTS.PARKING.VEHICLE_TYPES);
        const typesData = await fetchWithAuth<VehicleTypesResponse>(typesUrl);

        let matchingVehicleType: VehicleType | undefined;
        if (typesData && typesData.code === 1000) {
          matchingVehicleType = typesData.result.find(
            (type) => type.id === typeId
          );

          if (matchingVehicleType) {
            setVehicleType(matchingVehicleType);
          } else {
            throw new Error("Không tìm thấy loại xe với ID này");
          }
        } else {
          throw new Error(typesData?.message || "Không thể lấy thông tin loại xe");
        }

        // Lấy thông tin giá hiện tại
        const priceUrl = buildApiUrl(API_ENDPOINTS.PRICES.BY_ID(typeId));
        const priceData = await fetchWithAuth<ApiResponse>(priceUrl);

        if (priceData && priceData.code === 1000 && priceData.result) {
          form.reset({
            dayPrice: priceData.result.dayPrice.toString(),
            nightPrice: priceData.result.nightPrice.toString(),
            monthlyPrice: matchingVehicleType?.name === "Bicycle" ? "0" : priceData.result.monthlyPrice.toString(),
          });
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin loại xe:", error);
        setError("Không thể tải thông tin loại xe. Vui lòng thử lại sau.");
        toast.error("Không thể tải thông tin loại xe");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleTypeInfo();
  }, [typeId, fetchWithAuth]);

  // Xử lý cập nhật giá
  const onSubmit = (values: PriceFormValues) => {
    setFormValues(values);
    setShowConfirmDialog(true);
  };

  // Xử lý dialog xác nhận
  const handleConfirm = async () => {
    if (!formValues) return;

    try {
      setSubmitting(true);

      // Chuyển đổi giá trị từ string sang number
      const payload = {
        dayPrice: formValues.dayPrice,
        nightPrice: formValues.nightPrice,
        monthlyPrice: vehicleType?.name === "Bicycle" ? "0" : formValues.monthlyPrice,
      };

      const apiUrl = buildApiUrl(API_ENDPOINTS.PRICES.BY_ID(typeId));
      const data = await fetchWithAuth<ApiResponse>(apiUrl, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (data && data.code === 1000) {
        toast.success(`Cập nhật giá xe ${data.result.type.name} thành công`);
        router.push("/admin/prices");
      } else {
        throw new Error(data?.message || "Cập nhật giá thất bại");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật giá:", error);
      toast.error("Không thể cập nhật giá. Vui lòng thử lại sau.");
    } finally {
      setSubmitting(false);
      setShowConfirmDialog(false);
    }

    // Hiển thị loader khi đang tải dữ liệu
    if (loading || fetchLoading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
  };

  return (
    <div className="container max-w-3xl mx-auto py-6 px-4">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <h1 className="text-3xl font-bold mb-2">Cập nhật giá dịch vụ</h1>
        <p className="text-gray-500">
          Nhập giá mới cho loại xe {vehicleType?.name === "Bicycle" ? "Xe đạp" : vehicleType?.name === "Motorbike" ? "Xe máy" : vehicleType?.name === "Scooter" ? "Xe tay ga" : vehicleType?.name}
        </p>
      </div>

      {/* Hiển thị lỗi nếu có */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <Ban className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Cập nhật giá xe {vehicleType?.name === "Bicycle" ? "Xe đạp" : vehicleType?.name === "Motorbike" ? "Xe máy" : vehicleType?.name === "Scooter" ? "Xe tay ga" : vehicleType?.name}</CardTitle>
          <CardDescription>
            Nhập giá dịch vụ mới theo từng loại thời gian
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* Giá ngày */}
              <FormField
                control={form.control}
                name="dayPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <div className="p-1 rounded-full bg-blue-100 mr-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      Giá ngày (VNĐ)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nhập giá ngày mới"
                        {...field}
                        type="number"
                        min="1000"
                      />
                    </FormControl>
                    <FormDescription>Áp dụng từ 6:00 đến 18:00</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Giá đêm */}
              <FormField
                control={form.control}
                name="nightPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <div className="p-1 rounded-full bg-indigo-100 mr-2">
                        <Clock className="h-4 w-4 text-indigo-600" />
                      </div>
                      Giá đêm (VNĐ)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nhập giá đêm mới"
                        {...field}
                        type="number"
                        min="1000"
                      />
                    </FormControl>
                    <FormDescription>
                      Áp dụng từ 18:00 đến 6:00 hôm sau
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Giá tháng */}
              {vehicleType?.name !== "Bicycle" && (
                <FormField
                  control={form.control}
                  name="monthlyPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <div className="p-1 rounded-full bg-green-100 mr-2">
                          <Calendar className="h-4 w-4 text-green-600" />
                        </div>
                        Giá tháng (VNĐ)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nhập giá tháng mới"
                          {...field}
                          type="number"
                          min="10000"
                        />
                      </FormControl>
                      <FormDescription>
                        Áp dụng cho vé tháng với thời hạn 30 ngày
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>

            <CardFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push("/admin/prices")}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      {/* Dialog xác nhận */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận cập nhật giá</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn cập nhật giá cho loại xe {vehicleType?.name === "Bicycle" ? "Xe đạp" : vehicleType?.name === "Motorbike" ? "Xe máy" : vehicleType?.name === "Scooter" ? "Xe tay ga" : vehicleType?.name}{" "}
              không?
              <div className="mt-4 p-4 bg-slate-50 rounded-md space-y-3">
                <div className="flex justify-between">
                  <span>Giá ngày:</span>
                  <span className="font-semibold">
                    {Number(formValues?.dayPrice).toLocaleString("vi-VN")} VNĐ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Giá đêm:</span>
                  <span className="font-semibold">
                    {Number(formValues?.nightPrice).toLocaleString("vi-VN")} VNĐ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Giá tháng:</span>
                  <span className="font-semibold">
                    {Number(formValues?.monthlyPrice).toLocaleString("vi-VN")}{" "}
                    VNĐ
                  </span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              onClick={(e) => {
                e.preventDefault(); // Ngăn dialog tự động đóng
                handleConfirm();
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                "Xác nhận"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
