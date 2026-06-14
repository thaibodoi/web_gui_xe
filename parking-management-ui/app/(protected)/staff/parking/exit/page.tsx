"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, LogOut, Check, Ban, Search, X } from "lucide-react";
import { toast } from "sonner";

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

// Định nghĩa interface cho kết quả API
interface ExitResponse {
  code: number;
  message?: string;
  result?: {
    historyId: string;
    licensePlate: string;
    identifier: string;
    card: {
      cardId: number;
    };
    exitTime: string;
    payment: {
      paymentId: string;
      amount: number;
      createAt: string;
      paymentType: string;
    };
    staffOut: {
      accountId: string;
      username: string;
      role: string;
    };
  };
}

// Định nghĩa schema xác thực form dùng Zod
const formSchema = z
  .object({
    licensePlate: z.string().optional().or(z.literal("")),
    identifier: z.string().optional().or(z.literal("")),
    cardId: z.coerce
      .number({
        required_error: "Vui lòng nhập mã số thẻ",
        invalid_type_error: "Mã số thẻ phải là số",
      })
      .min(1, "Mã số thẻ không hợp lệ (phải > 0)")
      .max(50000, "Mã số thẻ vượt quá giới hạn hệ thống (tối đa 50000)"),
  })
  .refine((data) => data.licensePlate || data.identifier, {
    message: "Vui lòng nhập biển số xe hoặc identifier",
    path: ["licensePlate"],
  });

type FormValues = z.infer<typeof formSchema>;

export default function VehicleExitPage() {
  const { fetchWithAuth, loading: apiLoading } = useFetchWithAuth();
  const { shiftConfig } = useConfig();
  const [loading, setLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [exitRecord, setExitRecord] = useState<ExitResponse["result"] | null>(
    null
  );
  const [activeRecords, setActiveRecords] = useState<any[]>([]);
  const [foundVehicleType, setFoundVehicleType] = useState<string>("");

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

  const handleSearch = async () => {
    const lp = form.getValues("licensePlate")?.trim();
    const iden = form.getValues("identifier")?.trim();
    const card = form.getValues("cardId");

    if (!lp && !iden && !card) {
      toast.warning("Vui lòng nhập Biển số, Identifier hoặc Mã thẻ để tìm kiếm!");
      return;
    }

    // Tải lại danh sách xe mới nhất để đảm bảo không bị sót xe mới vào
    let currentRecords = activeRecords;
    try {
      const apiUrl = buildApiUrl(API_ENDPOINTS.PARKING.RECORDS);
      const data = await fetchWithAuth<any>(apiUrl);
      if (data && data.code === 1000) {
        currentRecords = data.result || [];
        setActiveRecords(currentRecords);
      }
    } catch (error) {
      console.error("Lỗi khi tải lại danh sách xe:", error);
    }

    const found = currentRecords.find((r: any) => {
      let isMatch = true;
      if (lp && r.licensePlate !== lp) isMatch = false;
      if (iden && r.identifier !== iden) isMatch = false;
      if (card && r.cardId?.toString() !== card?.toString()) isMatch = false;
      return isMatch;
    });

    if (found) {
      form.setValue("licensePlate", found.licensePlate || "");
      form.setValue("identifier", found.identifier || "");
      form.setValue("cardId", found.cardId || ("" as unknown as number));
      
      const typeName = found.vehicleType?.name;
      const vnName = typeName === "Bicycle" ? "Xe đạp" : typeName === "Motorbike" ? "Xe máy" : typeName === "Scooter" ? "Xe tay ga" : typeName;
      setFoundVehicleType(vnName || "");
      
      toast.success("Đã tự động điền thông tin xe!");
    } else {
      setFoundVehicleType("");
      toast.error("Không tìm thấy xe đang trong bãi khớp với thông tin trên!");
    }
  };

  // Khởi tạo form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      licensePlate: "",
      identifier: "",
      cardId: "" as unknown as number,
    },
    mode: "onSubmit",
  });

  // Xử lý khi một trường thay đổi để kiểm tra logic
  const watchLicensePlate = form.watch("licensePlate");
  const watchIdentifier = form.watch("identifier");

  // Xử lý khi người dùng nhập biển số, xóa identifier
  useEffect(() => {
    if (watchLicensePlate) {
      if (form.getValues("identifier")) {
        form.setValue("identifier", "");
      }
    }
  }, [watchLicensePlate, form]);

  // Xử lý khi người dùng nhập identifier, xóa biển số
  useEffect(() => {
    if (watchIdentifier) {
      if (form.getValues("licensePlate")) {
        form.setValue("licensePlate", "");
      }
    }
  }, [watchIdentifier, form]);

  // Xử lý submit
  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);

      // Chuẩn bị dữ liệu gửi lên server
      const requestBody = {
        licensePlate: values.licensePlate || "",
        identifier: values.identifier || "",
        cardId: values.cardId,
      };

      // Sử dụng fetchWithAuth
      const apiUrl = buildApiUrl(API_ENDPOINTS.PARKING.EXIT);
      const data = await fetchWithAuth<ExitResponse>(apiUrl, {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      if (!data) return;

      if (data.code !== 1000) {
        setErrorMessage(data.message || "Lỗi không xác định");
        setShowErrorDialog(true);
        return;
      }

      // Xử lý khi request thành công
      if (data.result) {
        setExitRecord(data.result);
        setShowSuccessDialog(true);
        form.reset(); // Reset form sau khi thành công
        setFoundVehicleType("");
      } else {
        throw new Error(data.message || "Ghi nhận xe ra bãi thất bại");
      }
    } catch (error) {
      console.error("Error submitting form:", error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      setErrorMessage("Đã xảy ra lỗi khi ghi nhận xe ra bãi");
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const handleNewExit = () => {
    setShowSuccessDialog(false);
    setExitRecord(null);
  };

  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
    setErrorMessage("");
  };

  // Format số tiền thành chuỗi VND
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const isLoading = loading || apiLoading;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">Ghi nhận xe ra bãi</CardTitle>
              <CardDescription>
                Nhập các thông tin biển số xe hoặc identifier và mã thẻ để ghi nhận
                xe ra bãi
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => {
                form.reset({ licensePlate: "", identifier: "", cardId: "" as unknown as number });
                setFoundVehicleType("");
              }} disabled={isLoading} className="shrink-0" title="Xóa trắng form">
                <X className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" onClick={handleSearch} disabled={isLoading} className="shrink-0">
                <Search className="h-4 w-4 mr-2" />
                Tìm xe
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          disabled={!!watchIdentifier || isLoading}
                          onChange={(e) => {
                            field.onChange(e);
                            if (form.formState.errors.licensePlate) {
                              form.clearErrors("licensePlate");
                            }
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
                          disabled={!!watchLicensePlate || isLoading}
                          onChange={(e) => {
                            field.onChange(e);
                            if (form.formState.errors.identifier) {
                              form.clearErrors("identifier");
                            }
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

                <FormField
                  control={form.control}
                  name="cardId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col h-full">
                      <FormLabel>Mã số thẻ</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ví dụ: 1"
                          {...field}
                          type="number"
                          disabled={isLoading}
                          onChange={(e) => {
                            field.onChange(e);
                            if (form.formState.errors.cardId) {
                              form.clearErrors("cardId");
                            }
                          }}
                          onFocus={() => {
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

                <div className="flex flex-col h-full">
                  <FormLabel className="mb-3">Loại xe</FormLabel>
                  <Input 
                    value={foundVehicleType} 
                    readOnly 
                    disabled 
                    placeholder="Sẽ hiển thị khi tìm thấy xe..." 
                  />
                  <div className="min-h-[20px]"></div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Ghi nhận xe ra bãi
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
                <p>Xe đã được ghi nhận ra bãi thành công!</p>

                {exitRecord && (
                  <div className="bg-slate-50 p-4 rounded-md space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      {exitRecord.licensePlate && (
                        <>
                          <div className="text-slate-500">Biển số:</div>
                          <div className="font-medium">
                            {exitRecord.licensePlate}
                          </div>
                        </>
                      )}

                      {exitRecord.identifier && (
                        <>
                          <div className="text-slate-500">Identifier:</div>
                          <div className="font-medium">
                            {exitRecord.identifier}
                          </div>
                        </>
                      )}

                      <div className="text-slate-500">Mã số thẻ:</div>
                      <div className="font-medium">
                        {exitRecord.card?.cardId}
                      </div>

                      <div className="text-slate-500">Thời gian ra:</div>
                      <div className="font-medium">
                        {new Date(exitRecord.exitTime).toLocaleString("vi-VN")}
                      </div>
                    </div>

                    {/* Thông tin thanh toán */}
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="text-lg font-semibold text-slate-800 mb-2">
                        Thông tin thanh toán
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-slate-500">Số tiền:</div>
                        <div className="font-bold text-green-600">
                          {formatCurrency(exitRecord.payment?.amount || 0)}
                        </div>

                        <div className="text-slate-500">
                          Thời gian thanh toán:
                        </div>
                        <div className="font-medium">
                          {new Date(
                            exitRecord.payment?.createAt || ""
                          ).toLocaleString("vi-VN")}
                        </div>

                        <div className="text-slate-500">Loại thanh toán:</div>
                        <div className="font-medium">Phí gửi xe</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={handleNewExit}
              className="bg-green-600 hover:bg-green-700"
            >
              Nhập xe mới
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog thông báo lỗi */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <Ban className="mr-2 h-5 w-5" />
              Không tìm thấy thông tin xe
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-slate-500">
                {errorMessage === "Record not found" ? (
                  <div className="space-y-2">
                    <p>Không tìm thấy thông tin xe trong bãi. Có thể do:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Xe không đang đỗ trong bãi</li>
                      <li>Thẻ xe không đang được sử dụng</li>
                      <li>Thông tin biển số/identifier và thẻ xe không khớp</li>
                    </ul>
                    <p className="mt-2">
                      Vui lòng kiểm tra lại thông tin và thử lại.
                    </p>
                  </div>
                ) : (
                  <p>{errorMessage || "Đã xảy ra lỗi, vui lòng thử lại"}</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleCloseErrorDialog}>
              Đã hiểu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
