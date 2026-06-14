"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Car, Check } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFetchWithAuth } from "@/hooks/use-fetch-with-auth";
import { useConfig } from "@/hooks/use-config";
import { API_ENDPOINTS, buildApiUrl } from "@/config/api";

// Định nghĩa interface cho loại xe
interface VehicleType {
  id: string;
  name: string;
  vietnameseName?: string; // Thêm tên tiếng Việt
}

interface VehicleTypesResponse {
  code: number;
  message?: string;
  result?: VehicleType[];
}

// Định nghĩa interface cho kết quả API
interface EntryResponse {
  code: number;
  message?: string;
  result?: {
    recordId: string;
    licensePlate: string;
    identifier: string;
    vehicleType: {
      id: string;
      name: string;
    };
    cardId: number;
    entryTime: string;
    type: string;
    staffIn: {
      accountId: string;
      username: string;
    };
  };
}

// Ánh xạ tên tiếng Anh sang tiếng Việt
const vehicleTypeNameMap: Record<string, string> = {
  Bicycle: "Xe đạp",
  Motorbike: "Xe máy",
  Scooter: "Xe tay ga",
};

// Định nghĩa schema xác thực form dùng Zod
const formSchema = z
  .object({
    vehicleTypeId: z.string({
      required_error: "Vui lòng chọn loại xe",
    }),
    licensePlate: z
      .string()
      .refine((val) => val.trim() !== "" || false, {
        message: "Biển số xe không được để trống nếu không dùng identifier",
      })
      .optional()
      .or(z.literal("")),
    identifier: z
      .string()
      .refine((val) => val.trim() !== "" || false, {
        message: "Identifier không được để trống nếu không dùng biển số xe",
      })
      .optional()
      .or(z.literal("")),
    cardId: z.coerce
      .number({
        required_error: "Vui lòng nhập mã số thẻ",
        invalid_type_error: "Mã số thẻ phải là số",
      })
      .min(1, "Mã số thẻ không hợp lệ (phải > 0)")
      .max(50000, "Mã số thẻ vượt quá giới hạn hệ thống (tối đa 50000)"),
  })
  .refine(
    (data) => {
      // Nếu là xe đạp (có thể lấy theo ID), không cần kiểm tra biển số
      if (data.vehicleTypeId && data.vehicleTypeId.includes("Xe đạp")) {
        return true;
      }
      return data.licensePlate || data.identifier;
    },
    {
      message: "Phải nhập ít nhất một trong hai: Biển số xe hoặc Identifier",
      path: ["licensePlate"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

export default function VehicleEntryPage() {
  // Sử dụng hook useFetchWithAuth và useConfig
  const { fetchWithAuth, loading: apiLoading } = useFetchWithAuth();
  const { shiftConfig } = useConfig();

  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTypes, setFetchingTypes] = useState(true);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [entryRecord, setEntryRecord] = useState<
    EntryResponse["result"] | null
  >(null);

  // Khởi tạo form với thứ tự ưu tiên mới
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicleTypeId: "",
      licensePlate: "",
      identifier: "",
      cardId: "" as unknown as number, // Trick for initial empty state
    },
    mode: "onSubmit",
  });

  // Watch fields
  const watchVehicleTypeId = form.watch("vehicleTypeId");
  const watchLicensePlate = form.watch("licensePlate");
  const watchIdentifier = form.watch("identifier");
  const isLoading = loading || apiLoading;

  // Kiểm tra nếu xe đạp (Bicycle)
  const isBicycle =
    vehicleTypes.find((type) => type.id === watchVehicleTypeId)?.name ===
    "Bicycle";

  // Kiểm tra nếu xe máy hoặc xe tay ga
  const isMotorizedVehicle =
    vehicleTypes.find((type) => type.id === watchVehicleTypeId)?.name ===
      "Motorbike" ||
    vehicleTypes.find((type) => type.id === watchVehicleTypeId)?.name ===
      "Scooter" ||
    vehicleTypes.find((type) => type.id === watchVehicleTypeId)?.name ===
      "Car";

  // useEffects để xử lý ràng buộc giữa các trường
  useEffect(() => {
    // Nếu loại xe thay đổi, cập nhật trạng thái các trường khác
    if (isBicycle) {
      // Nếu là xe đạp, xóa và disable biển số
      form.setValue("licensePlate", "");
      // Bật identify nếu nó trống
      if (!form.getValues("identifier")) {
        form.setFocus("identifier");
      }
    } else if (isMotorizedVehicle) {
      // Nếu là xe máy/xe tay ga, xóa và disable identifier
      form.setValue("identifier", "");
      // Bật biển số nếu nó trống
      if (!form.getValues("licensePlate")) {
        form.setFocus("licensePlate");
      }
    }
  }, [watchVehicleTypeId, form, isBicycle, isMotorizedVehicle]);

  // Xử lý ràng buộc giữa licensePlate và identifier
  useEffect(() => {
    // Nếu có biển số xe, xóa identifier (trừ khi là xe đạp)
    if (watchLicensePlate && form.getValues("identifier") && !isBicycle) {
      form.setValue("identifier", "");
    }

    // Nếu có identifier, xóa biển số xe (trừ khi là xe máy hoặc xe tay ga)
    if (
      watchIdentifier &&
      form.getValues("licensePlate") &&
      !isMotorizedVehicle
    ) {
      form.setValue("licensePlate", "");
    }
  }, [watchLicensePlate, watchIdentifier, form, isBicycle, isMotorizedVehicle]);

  // Fetch danh sách loại xe từ API
  useEffect(() => {
    const fetchVehicleTypes = async () => {
      try {
        setFetchingTypes(true);

        const apiUrl = buildApiUrl(API_ENDPOINTS.PARKING.VEHICLE_TYPES);
        const data = await fetchWithAuth<VehicleTypesResponse>(apiUrl);

        // Nếu data là null (có lỗi 401), không cần xử lý tiếp
        if (!data) return;

        if (data.code === 1000 && data.result) {
          // Thêm tên tiếng Việt cho mỗi loại xe
          const enhancedTypes = data.result.map((type) => ({
            ...type,
            vietnameseName: vehicleTypeNameMap[type.name] || type.name,
          }));

          setVehicleTypes(enhancedTypes);

          // Đặt giá trị mặc định cho loại xe nếu có dữ liệu
          if (enhancedTypes.length > 0) {
            form.setValue("vehicleTypeId", enhancedTypes[0].id);
          }
        } else {
          throw new Error(data.message || "Không thể lấy danh sách loại xe");
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách loại xe:", error);
        toast.error("Không thể lấy danh sách loại xe");
      } finally {
        setFetchingTypes(false);
      }
    };

    fetchVehicleTypes();
  }, [form, fetchWithAuth]);

  // Xử lý submit form
  const onSubmit = async (values: FormValues) => {
    const maxCards = shiftConfig?.maxParkingCards || 10000;
    if (values.cardId > maxCards) {
      form.setError("cardId", {
        type: "manual",
        message: `Mã số thẻ phải từ 1 đến ${maxCards}`,
      });
      return;
    }

    try {
      setLoading(true);

      // Chuẩn bị dữ liệu gửi lên server
      const requestBody = {
        licensePlate: values.licensePlate || "",
        identifier: values.identifier || "",
        vehicleTypeId: values.vehicleTypeId,
        cardId: values.cardId,
      };

      const apiUrl = buildApiUrl(API_ENDPOINTS.PARKING.ENTRY);
      const data = await fetchWithAuth<EntryResponse>(apiUrl, {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      // Nếu data là null (có lỗi 401), không cần xử lý tiếp
      if (!data) return;

      // Xử lý các mã lỗi cụ thể
      if (data.code !== 1000) {
        if (data.code === 4006) {
          form.setError("licensePlate", {
            type: "manual",
            message: "Biển số này đã tồn tại trong bãi",
          });
        } else if (data.code === 4007) {
          form.setError("identifier", {
            type: "manual",
            message: "Identifier này đã tồn tại trong bãi",
          });
        } else if (data.code === 4005) {
          form.setError("cardId", {
            type: "manual",
            message: "Thẻ này đang được sử dụng",
          });
        } else {
          toast.error(data.message || "Lỗi không xác định");
        }
        return;
      }

      // Xử lý khi request thành công
      if (data.result) {
        setEntryRecord(data.result);
        setShowSuccessDialog(true);
        form.reset(); // Reset form sau khi thành công

        // Đặt lại giá trị mặc định cho loại xe
        if (vehicleTypes.length > 0) {
          form.setValue("vehicleTypeId", vehicleTypes[0].id);
        }
      } else {
        toast.error("Ghi nhận xe vào bãi thất bại");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Đã xảy ra lỗi khi ghi nhận xe vào bãi");
    } finally {
      setLoading(false);
    }
  };

  const handleNewEntry = () => {
    setShowSuccessDialog(false);
    setEntryRecord(null);
  };

  // Hiển thị loading khi đang fetch dữ liệu
  if (fetchingTypes) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // UI với thứ tự trường đã thay đổi
  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Ghi nhận xe vào bãi</CardTitle>
          <CardDescription>
            Nhập thông tin xe để ghi nhận vào bãi đỗ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Loại xe - đặt lên đầu tiên */}
                <FormField
                  control={form.control}
                  name="vehicleTypeId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col h-full">
                      <FormLabel>Loại xe</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.clearErrors("vehicleTypeId");
                        }}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn loại xe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vehicleTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.vietnameseName || type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="min-h-[20px]">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                {/* Biển số xe */}
                <FormField
                  control={form.control}
                  name="licensePlate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col h-full">
                      <FormLabel>Biển số xe</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ví dụ: 59A-12345"
                          {...field}
                          disabled={
                            isLoading ||
                            isBicycle || // Disable nếu là xe đạp
                            !!watchIdentifier // Hoặc đã nhập identifier
                          }
                          onChange={(e) => {
                            field.onChange(e);
                            form.clearErrors("licensePlate");
                          }}
                          onFocus={() => {
                            form.clearErrors("licensePlate");
                            form.clearErrors("identifier");
                          }}
                        />
                      </FormControl>
                      <div className="min-h-[20px]">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                {/* Identifier */}
                <FormField
                  control={form.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem className="flex flex-col h-full">
                      <FormLabel>Identifier</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nhập ID nếu không có biển số"
                          {...field}
                          disabled={
                            isLoading ||
                            isMotorizedVehicle || // Disable nếu là xe máy/tay ga
                            !!watchLicensePlate // Hoặc đã nhập biển số
                          }
                          onChange={(e) => {
                            field.onChange(e);
                            form.clearErrors("identifier");
                          }}
                          onFocus={() => {
                            form.clearErrors("identifier");
                            form.clearErrors("licensePlate");
                          }}
                        />
                      </FormControl>
                      <div className="min-h-[20px]">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                {/* Card ID */}
                <FormField
                  control={form.control}
                  name="cardId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col h-full">
                      <FormLabel>Mã số thẻ</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ví dụ: 1"
                          {...field}
                          disabled={isLoading}
                          onChange={(e) => {
                            field.onChange(e);
                            form.clearErrors("cardId");
                          }}
                        />
                      </FormControl>
                      <div className="min-h-[20px]">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Car className="mr-2 h-4 w-4" />
                    Ghi nhận xe vào bãi
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Dialog thông báo thành công */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-green-600">
              <Check className="mr-2 h-5 w-5" />
              Ghi nhận thành công
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>Xe đã được ghi nhận vào bãi thành công!</p>

                {entryRecord && (
                  <div className="bg-slate-50 p-4 rounded-md space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      {entryRecord.licensePlate && (
                        <>
                          <div className="text-slate-500">Biển số:</div>
                          <div className="font-medium">
                            {entryRecord.licensePlate}
                          </div>
                        </>
                      )}

                      {entryRecord.identifier && (
                        <>
                          <div className="text-slate-500">Identifier:</div>
                          <div className="font-medium">
                            {entryRecord.identifier}
                          </div>
                        </>
                      )}

                      <div className="text-slate-500">Loại xe:</div>
                      <div className="font-medium">
                        {vehicleTypeNameMap[entryRecord.vehicleType.name] ||
                          entryRecord.vehicleType.name}
                      </div>

                      <div className="text-slate-500">Mã số thẻ:</div>
                      <div className="font-medium">{entryRecord.cardId}</div>

                      <div className="text-slate-500">Thời gian vào:</div>
                      <div className="font-medium">
                        {new Date(entryRecord.entryTime).toLocaleString(
                          "vi-VN"
                        )}
                      </div>

                      <div className="text-slate-500">Loại gửi:</div>
                      <div className="font-medium">
                        {entryRecord.type === "DAILY"
                          ? "Theo ngày"
                          : "Thẻ tháng"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleNewEntry}>
              Nhập xe mới
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
