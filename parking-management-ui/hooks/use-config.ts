import { useState, useEffect, useCallback } from "react";
import { useFetchWithAuth } from "./use-fetch-with-auth";
import { API_ENDPOINTS, buildApiUrl } from "@/config/api";
import { toast } from "sonner";

export interface ShiftConfig {
  dayShiftStartHour: number;
  nightShiftStartHour: number;
  maxParkingCards: number;
}

interface ApiResponse<T> {
  code: number;
  result: T;
  message: string;
}

export function useConfig() {
  const { fetchWithAuth, loading: fetchLoading } = useFetchWithAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [shiftConfig, setShiftConfig] = useState<ShiftConfig | null>(null);

  const fetchShiftConfig = useCallback(async () => {
    try {
      setLoading(true);
      const apiUrl = buildApiUrl("/parking/config/shifts");
      // Wait, we mapped it to /config/shifts in Controller, not /parking/config.
      // Need to use the right URL.
      const data = await fetchWithAuth<ApiResponse<ShiftConfig>>(buildApiUrl("/config/shifts"));
      
      if (data?.code === 1000) {
        setShiftConfig(data.result);
      }
    } catch (error) {
      console.error("Error fetching config:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    fetchShiftConfig();
  }, [fetchShiftConfig]);

  const updateShiftConfig = async (newConfig: ShiftConfig) => {
    try {
      setUpdating(true);
      const data = await fetchWithAuth<ApiResponse<ShiftConfig>>(
        buildApiUrl("/config/shifts"),
        {
          method: "PUT",
          body: JSON.stringify(newConfig),
        }
      );

      if (data?.code === 1000) {
        setShiftConfig(data.result);
        toast.success("Cập nhật cấu hình hệ thống thành công");
        return true;
      } else {
        toast.error("Cập nhật thất bại: " + (data?.message || "Lỗi không xác định"));
        return false;
      }
    } catch (error) {
      console.error("Error updating config:", error);
      toast.error("Đã xảy ra lỗi khi cập nhật cấu hình");
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return {
    shiftConfig,
    loading: loading || fetchLoading,
    updating,
    updateShiftConfig,
    refreshConfig: fetchShiftConfig
  };
}
