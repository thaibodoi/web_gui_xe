"use client";

import { useState, useEffect } from "react";
import { useConfig } from "@/hooks/use-config";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Database } from "lucide-react";

export default function ShiftsSettingsPage() {
  const { shiftConfig, loading, updating, updateShiftConfig } = useConfig();
  const [dayStart, setDayStart] = useState<string>("5");
  const [nightStart, setNightStart] = useState<string>("18");
  const [maxCards, setMaxCards] = useState<string>("10000");

  useEffect(() => {
    if (shiftConfig) {
      setDayStart(shiftConfig.dayShiftStartHour.toString());
      setNightStart(shiftConfig.nightShiftStartHour.toString());
      setMaxCards(shiftConfig.maxParkingCards?.toString() || "10000");
    }
  }, [shiftConfig]);

  const handleSave = async () => {
    const parsedMaxCards = parseInt(maxCards);
    if (parsedMaxCards > 50000) {
      toast.error("Vui lòng đặt giới hạn không vượt quá 50.000 thẻ để đảm bảo hiệu năng.");
      return;
    }
    
    await updateShiftConfig({
      dayShiftStartHour: parseInt(dayStart),
      nightShiftStartHour: parseInt(nightStart),
      maxParkingCards: parsedMaxCards || 10000,
    });
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  if (loading && !shiftConfig) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cài đặt hệ thống</h2>
        <p className="text-muted-foreground">
          Cấu hình các tham số hoạt động chung của bãi xe.
        </p>
      </div>

      <Card className="border-t-4 border-t-primary shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Khung giờ làm việc
          </CardTitle>
          <CardDescription>
            Cài đặt thời gian bắt đầu Ca Ngày và Ca Đêm. Hệ thống sẽ tự động dùng khung giờ này để tính giá tiền.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 p-4 bg-orange-50 rounded-lg border border-orange-100">
              <div className="space-y-1">
                <Label htmlFor="dayStart" className="text-orange-800 font-semibold flex items-center gap-2">
                  <span className="text-xl">☀️</span> Giờ bắt đầu Ca Ngày
                </Label>
                <p className="text-xs text-orange-600/80">Áp dụng giá vé Ban Ngày từ giờ này.</p>
              </div>
              <Select value={dayStart} onValueChange={setDayStart}>
                <SelectTrigger id="dayStart" className="bg-white">
                  <SelectValue placeholder="Chọn giờ" />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((hour) => (
                    <SelectItem key={hour} value={hour.toString()}>
                      {hour.toString().padStart(2, '0')}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="space-y-1">
                <Label htmlFor="nightStart" className="text-slate-800 font-semibold flex items-center gap-2">
                  <span className="text-xl">🌙</span> Giờ bắt đầu Ca Đêm
                </Label>
                <p className="text-xs text-slate-500">Áp dụng giá vé Ban Đêm từ giờ này.</p>
              </div>
              <Select value={nightStart} onValueChange={setNightStart}>
                <SelectTrigger id="nightStart" className="bg-white">
                  <SelectValue placeholder="Chọn giờ" />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((hour) => (
                    <SelectItem key={hour} value={hour.toString()}>
                      {hour.toString().padStart(2, '0')}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="bg-blue-50 text-blue-800 p-4 rounded-md text-sm">
            <strong>💡 Lưu ý cách tính:</strong>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Ca Ngày sẽ bắt đầu từ <strong>{dayStart.padStart(2, '0')}:00</strong> đến trước <strong>{nightStart.padStart(2, '0')}:00</strong>.</li>
              <li>Ca Đêm sẽ bắt đầu từ <strong>{nightStart.padStart(2, '0')}:00</strong> đến trước <strong>{dayStart.padStart(2, '0')}:00</strong> sáng hôm sau.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-t-4 border-t-primary shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Dữ liệu hệ thống
          </CardTitle>
          <CardDescription>
            Cài đặt giới hạn số lượng thẻ xe của bãi. Hệ thống sẽ tự động tạo thêm thẻ nếu bạn tăng giới hạn này.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 p-4 bg-emerald-50 rounded-lg border border-emerald-100 max-w-sm">
            <div className="space-y-1">
              <Label htmlFor="maxCards" className="text-emerald-800 font-semibold flex items-center gap-2">
                <span className="text-xl">💳</span> Giới hạn thẻ xe
              </Label>
              <p className="text-xs text-emerald-600/80">Nhập số lượng thẻ tối đa.</p>
            </div>
            <Input 
              id="maxCards" 
              type="number" 
              min="1" 
              max="50000"
              className="bg-white" 
              value={maxCards} 
              onChange={(e) => setMaxCards(e.target.value)} 
            />
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 border-t px-6 py-4 flex justify-end">
          <Button onClick={handleSave} disabled={updating || (shiftConfig?.dayShiftStartHour.toString() === dayStart && shiftConfig?.nightShiftStartHour.toString() === nightStart && shiftConfig?.maxParkingCards?.toString() === maxCards)}>
            {updating ? (
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
      </Card>
    </div>
  );
}
