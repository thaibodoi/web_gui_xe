"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Loader2,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  X,
  Search,
} from "lucide-react";

import { useFetchWithAuth } from "@/hooks/use-fetch-with-auth";
import { API_ENDPOINTS, buildApiUrl } from "@/config/api";

// Định nghĩa interface
interface VehicleType {
  id: string;
  name: string;
  vietnameseName?: string;
}

// Interface cho responses từ API
interface VehicleTypesResponse {
  code: number;
  message?: string;
  result?: VehicleType[];
}

interface PaymentResponse {
  paymentId: string;
  amount: number;
  createAt: string;
  paymentType: string;
}

interface MissingReportResponse {
  code: number;
  message?: string;
  result?: {
    reportId: string;
    record: {
      historyId: string;
      licensePlate: string;
      identifier: string;
      vehicleType: VehicleType;
      card: {
        cardId: number;
      };
      entryTime: string;
      exitTime: string;
      type: string;
      payment: PaymentResponse;
      staffIn: {
        accountId: string;
        username: string;
        role: string;
      };
      staffOut: {
        accountId: string;
        username: string;
        role: string;
      };
    };
    licensePlate: string;
    identifier: string | null;
    vehicleType: VehicleType;
    name: string;
    gender: string;
    phoneNumber: string;
    address: string;
    brand: string;
    color: string;
    identification: string;
    payment: PaymentResponse;
    createBy: {
      accountId: string;
      username: string;
      role: string;
    };
    createAt: string;
  };
}

// Ánh xạ tên tiếng Anh sang tiếng Việt
const vehicleTypeNameMap: Record<string, string> = {
  Bicycle: "Xe đạp",
  Motorbike: "Xe máy",
  Scooter: "Xe tay ga",
};

// Định nghĩa schema cho form
const formSchema = z
  .object({
    vehicleTypeId: z.string().min(1, "Vui lòng chọn loại xe"),
    brand: z.string().min(1, "Vui lòng nhập hãng xe"),
    licensePlate: z
      .string()
      .min(1, "Vui lòng nhập biển số xe")
      .or(z.literal("")),
    identifier: z.string().optional().or(z.literal("")),
    color: z.string().min(1, "Vui lòng nhập màu xe"),
    name: z.string().min(1, "Vui lòng nhập họ tên người báo mất"),
    gender: z.enum(["MALE", "FEMALE"], {
      required_error: "Vui lòng chọn giới tính",
    }),
    phoneNumber: z
      .string()
      .min(1, "Vui lòng nhập số điện thoại")
      .refine((value) => /^[0-9]{10,11}$/.test(value), {
        message: "Số điện thoại không hợp lệ",
      }),
    address: z.string().min(1, "Vui lòng nhập địa chỉ"),
    identification: z
      .string()
      .min(1, "Vui lòng nhập CMND/CCCD")
      .refine((value) => /^[0-9]{9,12}$/.test(value), {
        message: "CMND/CCCD không hợp lệ",
      }),
  })
  .refine((data) => data.licensePlate || data.identifier, {
    message: "Vui lòng nhập biển số xe hoặc identifier",
    path: ["licensePlate"],
  });

type FormValues = z.infer<typeof formSchema>;

export default function MissingReportPage() {
  const { fetchWithAuth } = useFetchWithAuth();
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [fetchingTypes, setFetchingTypes] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [tempFormData, setTempFormData] = useState<FormValues | null>(null);
  const [reportResult, setReportResult] = useState<
    MissingReportResponse["result"] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [activeRecords, setActiveRecords] = useState<any[]>([]);

  // Fetch active records for auto-fill
  useEffect(() => {
    const fetchActiveRecords = async () => {
      try {
        const apiUrl = buildApiUrl(API_ENDPOINTS.PARKING.RECORDS);
        const data = await fetchWithAuth<any>(apiUrl);
        if (data && data.code === 1000) {
          setActiveRecords(data.result || []);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách xe trong bãi:", error);
      }
    };
    fetchActiveRecords();
  }, [fetchWithAuth]);

  const handleSearch = () => {
    const lp = form.getValues("licensePlate")?.trim();
    const iden = form.getValues("identifier")?.trim();

    if (!lp && !iden) {
      toast.warning("Vui lòng nhập Biển số xe hoặc Identifier để tìm kiếm!");
      return;
    }

    const found = activeRecords.find(r => {
      let isMatch = true;
      if (lp && r.licensePlate !== lp) isMatch = false;
      if (iden && r.identifier !== iden) isMatch = false;
      return isMatch;
    });

    if (found) {
      form.setValue("licensePlate", found.licensePlate || "");
      form.setValue("identifier", found.identifier || "");
      if (found.vehicleType?.id) {
        form.setValue("vehicleTypeId", found.vehicleType.id);
      }
      
      toast.success("Đã tìm thấy xe và tự động điền thông tin cơ bản!");
    } else {
      toast.error("Không tìm thấy xe đang trong bãi khớp với thông tin trên!");
    }
  };

  // Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicleTypeId: "",
      brand: "",
      licensePlate: "",
      identifier: "",
      color: "",
      name: "",
      gender: "MALE",
      phoneNumber: "",
      address: "",
      identification: "",
    },
    mode: "onSubmit",
  });

  // Fetch danh sách loại xe
  useEffect(() => {
    const fetchVehicleTypes = async () => {
      try {
        setFetchingTypes(true);
        setError(null);

        const apiUrl = buildApiUrl(API_ENDPOINTS.PARKING.VEHICLE_TYPES);
        const data = await fetchWithAuth<VehicleTypesResponse>(apiUrl);

        if (!data) {
          throw new Error("Không nhận được dữ liệu từ server");
        }

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
        setError("Không thể lấy danh sách loại xe. Vui lòng thử lại sau.");
        toast.error("Không thể lấy danh sách loại xe");
      } finally {
        setFetchingTypes(false);
      }
    };

    fetchVehicleTypes();
  }, [fetchWithAuth, form]);

  // Watch cho các field để xử lý logic disable
  const watchVehicleTypeId = form.watch("vehicleTypeId");
  const watchLicensePlate = form.watch("licensePlate");
  const watchIdentifier = form.watch("identifier");

  // Kiểm tra loại xe đã chọn
  const selectedVehicleType = vehicleTypes.find(
    (type) => type.id === watchVehicleTypeId
  )?.name;

  const isBicycle = selectedVehicleType === "Bicycle";
  const isMotorizedVehicle =
    selectedVehicleType === "Motorbike" || selectedVehicleType === "Scooter";

  // Xử lý thay đổi loại xe
  useEffect(() => {
    if (isBicycle) {
      // Nếu là xe đạp, xóa và disable biển số
      form.setValue("licensePlate", "");
    } else if (isMotorizedVehicle) {
      // Nếu là xe máy/xe tay ga, xóa và disable identifier
      form.setValue("identifier", "");
    }
  }, [watchVehicleTypeId, form, isBicycle, isMotorizedVehicle]);

  // Xử lý khi người dùng nhập biển số
  useEffect(() => {
    if (watchLicensePlate && !isBicycle) {
      if (form.getValues("identifier")) {
        form.setValue("identifier", "");
      }
      // Cập nhật lỗi nếu cần
      if (form.formState.errors.licensePlate) {
        form.clearErrors("licensePlate");
      }
    }
  }, [watchLicensePlate, form, isBicycle]);

  // Xử lý khi người dùng nhập identifier
  useEffect(() => {
    if (watchIdentifier && !isMotorizedVehicle) {
      if (form.getValues("licensePlate")) {
        form.setValue("licensePlate", "");
      }
      // Cập nhật lỗi nếu có
      if (form.formState.errors.identifier) {
        form.clearErrors("identifier");
      }
    }
  }, [watchIdentifier, form, isMotorizedVehicle]);

  // Xử lý khi người dùng submit form
  const onSubmit = (values: FormValues) => {
    setTempFormData(values);
    setShowConfirmDialog(true);
  };

  // Xử lý khi người dùng xác nhận
  const handleConfirm = async () => {
    if (!tempFormData) return;

    try {
      setLoading(true);
      setShowConfirmDialog(false);
      setError(null);

      const apiUrl = buildApiUrl(API_ENDPOINTS.MISSING_REPORTS);
      const response = await fetchWithAuth<MissingReportResponse>(apiUrl, {
        method: "POST",
        body: JSON.stringify({
          licensePlate: tempFormData.licensePlate || "",
          vehicleTypeId: tempFormData.vehicleTypeId,
          identifier: tempFormData.identifier || "",
          name: tempFormData.name,
          gender: tempFormData.gender,
          phoneNumber: tempFormData.phoneNumber,
          address: tempFormData.address,
          brand: tempFormData.brand,
          color: tempFormData.color,
          identification: tempFormData.identification,
        }),
      });

      // Xử lý các trường hợp lỗi cụ thể
      if (response.code !== 1000) {
        switch (response.code) {
          case 6001:
            form.setError("licensePlate", {
              type: "manual",
              message: "Xe không tồn tại trong bãi",
            });
            form.setError("identifier", {
              type: "manual",
              message: "Xe không tồn tại trong bãi",
            });
            toast.error(
              "Xe không tồn tại trong bãi, vui lòng kiểm tra lại thông tin"
            );
            break;
          case 5003:
            form.setError("vehicleTypeId", {
              type: "manual",
              message: "Loại xe không khớp so với biển số đã gửi trong bãi",
            });
            break;
          default:
            setError(response.message || "Đã xảy ra lỗi khi báo mất thẻ");
            toast.error(response.message || "Đã xảy ra lỗi khi báo mất thẻ");
        }
        return;
      }

      // Xử lý thành công
      if (response.result) {
        setReportResult(response.result);
        setShowSuccessDialog(true);
        form.reset();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setError("Đã xảy ra lỗi khi gửi thông tin báo mất thẻ");
      toast.error("Đã xảy ra lỗi khi gửi thông tin báo mất thẻ");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý đóng dialog thành công và chuẩn bị cho báo cáo mới
  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    setReportResult(null);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "HH:mm:ss dd/MM/yyyy", {
        locale: vi,
      });
    } catch (error) {
      return "Không hợp lệ";
    }
  };

  const isFormLoading = loading || fetchingTypes;

  if (fetchingTypes) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error && !vehicleTypes.length) {
    return (
      <div className="container mx-auto p-4">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">
              Không thể tải dữ liệu
            </CardTitle>
            <CardDescription>
              Đã xảy ra lỗi khi tải thông tin cần thiết
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-red-500">{error}</p>
            <Button onClick={() => window.location.reload()}>Thử lại</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="font-semibold text-2xl">
                Báo Mất Thẻ Xe
              </CardTitle>
              <CardDescription>
                Vui lòng nhập đầy đủ thông tin để báo mất thẻ xe
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => {
                form.setValue("licensePlate", "");
                form.setValue("identifier", "");
              }} disabled={loading} className="shrink-0" title="Xóa tìm kiếm">
                <X className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" onClick={handleSearch} disabled={loading} className="shrink-0">
                <Search className="h-4 w-4 mr-2" />
                Tìm xe
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 flex items-start">
              <AlertTriangle className="text-red-600 h-5 w-5 mt-0.5 mr-2" />
              <div className="flex-1">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Thông tin xe</h3>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Loại xe - đưa lên đầu */}
                  <FormField
                    control={form.control}
                    name="vehicleTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loại xe</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (form.formState.errors.vehicleTypeId) {
                              form.clearErrors("vehicleTypeId");
                            }
                          }}
                          defaultValue={field.value}
                          disabled={isFormLoading}
                        >
                          <FormControl>
                            <SelectTrigger
                              className={
                                form.formState.errors.vehicleTypeId
                                  ? "border-red-300"
                                  : ""
                              }
                            >
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Hãng xe - đưa lên thứ hai */}
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hãng xe</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ví dụ: Honda Wave"
                            {...field}
                            disabled={isFormLoading}
                            className={
                              form.formState.errors.brand
                                ? "border-red-300"
                                : ""
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Biển số xe */}
                  <FormField
                    control={form.control}
                    name="licensePlate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Biển số xe</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ví dụ: 59A-12345.67"
                            {...field}
                            disabled={
                              isFormLoading ||
                              isBicycle || // Disable nếu là xe đạp
                              !!watchIdentifier // Hoặc đã nhập identifier
                            }
                            onChange={(e) => {
                              field.onChange(e);
                              // Tự động định dạng biển số về chữ hoa
                              e.target.value = e.target.value.toUpperCase();
                              if (
                                e.target.value &&
                                form.formState.errors.licensePlate
                              ) {
                                form.clearErrors("licensePlate");
                              }
                            }}
                            className={
                              form.formState.errors.licensePlate
                                ? "border-red-300"
                                : ""
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Identifier */}
                  <FormField
                    control={form.control}
                    name="identifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Identifier</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nhập identifier nếu không có biển số"
                            {...field}
                            disabled={
                              isFormLoading ||
                              isMotorizedVehicle || // Disable nếu là xe máy/tay ga
                              !!watchLicensePlate // Hoặc đã nhập biển số
                            }
                            onChange={(e) => {
                              field.onChange(e);
                              if (
                                e.target.value &&
                                form.formState.errors.identifier
                              ) {
                                form.clearErrors("identifier");
                              }
                            }}
                            className={
                              form.formState.errors.identifier
                                ? "border-red-300"
                                : ""
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Màu xe */}
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Màu xe</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ví dụ: Đỏ"
                            {...field}
                            disabled={isFormLoading}
                            className={
                              form.formState.errors.color
                                ? "border-red-300"
                                : ""
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <h3 className="text-lg font-semibold pt-4">
                  Thông tin người báo mất
                </h3>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Họ tên */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Họ và tên</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Họ và tên người báo mất"
                            {...field}
                            disabled={isFormLoading}
                            className={
                              form.formState.errors.name ? "border-red-300" : ""
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Giới tính */}
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Giới tính</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                            disabled={isFormLoading}
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="MALE" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                Nam
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="FEMALE" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                Nữ
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Số điện thoại */}
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số điện thoại</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Số điện thoại"
                            {...field}
                            disabled={isFormLoading}
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            onChange={(e) => {
                              // Chỉ cho phép nhập số
                              const value = e.target.value.replace(
                                /[^0-9]/g,
                                ""
                              );
                              field.onChange(value);
                            }}
                            className={
                              form.formState.errors.phoneNumber
                                ? "border-red-300"
                                : ""
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* CMND/CCCD */}
                  <FormField
                    control={form.control}
                    name="identification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CMND/CCCD</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Số CMND hoặc CCCD"
                            {...field}
                            disabled={isFormLoading}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            onChange={(e) => {
                              // Chỉ cho phép nhập số
                              const value = e.target.value.replace(
                                /[^0-9]/g,
                                ""
                              );
                              field.onChange(value);
                            }}
                            className={
                              form.formState.errors.identification
                                ? "border-red-300"
                                : ""
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Địa chỉ */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Địa chỉ</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Địa chỉ liên hệ"
                            {...field}
                            disabled={isFormLoading}
                            className={
                              form.formState.errors.address
                                ? "border-red-300"
                                : ""
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button type="submit" disabled={isFormLoading} className="w-full">
                {isFormLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Gửi báo cáo mất thẻ
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Dialog xác nhận báo mất */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận báo mất thẻ</AlertDialogTitle>
            <AlertDialogDescription>
              Vui lòng kiểm tra lại thông tin trước khi xác nhận báo mất thẻ
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Họ và tên:</p>
              <p className="font-semibold">{tempFormData?.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">
                  Biển số/Identifier:
                </p>
                <p>{tempFormData?.licensePlate || tempFormData?.identifier}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">
                  Số điện thoại:
                </p>
                <p>{tempFormData?.phoneNumber}</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">
                    Lưu ý quan trọng
                  </h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <p>
                      Khi xác nhận báo mất thẻ, khách hàng sẽ phải thanh toán
                      phí phạt mất thẻ. Hành động này không thể hoàn tác sau khi
                      xác nhận.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <AlertDialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={loading}
              className="mt-2 sm:mt-0"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận báo mất
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog báo mất thành công */}
      <AlertDialog
        open={showSuccessDialog}
        onOpenChange={handleCloseSuccessDialog}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-green-600">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Báo mất thẻ thành công
            </AlertDialogTitle>
            <AlertDialogDescription>
              Đã ghi nhận thông tin báo mất thẻ và thanh toán phí phạt
            </AlertDialogDescription>
          </AlertDialogHeader>

          {reportResult && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-md space-y-4 text-sm">
                <div className="text-lg font-semibold text-slate-800">
                  Thông tin xe
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-slate-500">Biển số xe:</div>
                  <div className="font-medium">
                    {reportResult.licensePlate || "Không có"}
                  </div>

                  <div className="text-slate-500">Loại xe:</div>
                  <div className="font-medium">
                    {vehicleTypeNameMap[reportResult.vehicleType.name] ||
                      reportResult.vehicleType.name}
                  </div>

                  <div className="text-slate-500">Mã thẻ:</div>
                  <div className="font-medium">
                    {reportResult.record.card.cardId}
                  </div>

                  <div className="text-slate-500">Thời gian vào:</div>
                  <div className="font-medium">
                    {formatDate(reportResult.record.entryTime)}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-md space-y-4 text-sm">
                <div className="text-lg font-semibold text-slate-800">
                  Thông tin thanh toán
                </div>
                <div className="flex justify-between items-center p-3 rounded-md bg-green-50 border border-green-100">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-slate-600" />
                    <span>Phí phạt mất thẻ</span>
                  </div>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(reportResult.payment.amount)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogAction
              onClick={handleCloseSuccessDialog}
              className="bg-green-600 hover:bg-green-700 w-full"
            >
              Hoàn thành
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
