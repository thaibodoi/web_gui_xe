import { useState, useEffect, useCallback } from "react";
import { useFetchWithAuth } from "./use-fetch-with-auth";
import { API_ENDPOINTS, buildApiUrl } from "@/config/api";

interface VehicleStats {
  motorbike: number;
  scooter: number;
  bicycle: number;
  total: number;
}

interface VehicleRecord {
  licensePlate: string;
  vehicleType: "Bicycle" | "Motorbike" | "Scooter";
  ticketType: "DAILY" | "MONTHLY";
  timestamp: string;
  eventType: "ENTRY" | "EXIT";
}

interface ApiResponse {
  code: number;
  result: VehicleRecord[];
  message: string;
}

export function useDashboard(itemsPerPage = 5) {
  const { fetchWithAuth, loading: fetchLoading } = useFetchWithAuth();
  const [loading, setLoading] = useState(true);
  const [currentStats, setCurrentStats] = useState<VehicleStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<VehicleRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  // TỔNG số xe đang thực sự trong bãi (gồm cả xe vào từ hôm trước chưa ra)
  const [inParkingCount, setInParkingCount] = useState(0);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const calculateVehicleStats = useCallback(() => (records: VehicleRecord[]): VehicleStats => {
    // Khởi tạo đối tượng theo dõi xe trong bãi
    const currentVehicles: Record<string, VehicleRecord> = {};

    // Duyệt qua tất cả các bản ghi theo thứ tự thời gian
    const sortedRecords = [...records].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (const record of sortedRecords) {
      if (record.eventType === "ENTRY") {
        // Xe vào bãi, thêm vào tracking
        currentVehicles[record.licensePlate] = record;
      } else if (record.eventType === "EXIT") {
        // Xe ra khỏi bãi, xóa khỏi tracking
        delete currentVehicles[record.licensePlate];
      }
    }

    // Đếm số lượng xe hiện tại theo loại
    let motorbike = 0;
    let scooter = 0;
    let bicycle = 0;

    Object.values(currentVehicles).forEach((vehicle) => {
      switch (vehicle.vehicleType) {
        case "Motorbike":
          motorbike++;
          break;
        case "Scooter":
          scooter++;
          break;
        case "Bicycle":
          bicycle++;
          break;
      }
    });

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Sử dụng fetchWithAuth thay vì fetch trực tiếp
      const apiUrl = buildApiUrl(API_ENDPOINTS.PARKING.TODAY);
      const data = await fetchWithAuth<ApiResponse>(apiUrl);

      // Nếu data là null (xảy ra khi có lỗi 401), không cần xử lý tiếp
      if (!data) return;

      if (data.code === 1000) {
        // Lưu trữ dữ liệu hoạt động
        const sortedActivity = [...data.result].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setRecentActivity(sortedActivity);
        setTotalPages(Math.ceil(sortedActivity.length / itemsPerPage));

        // Tính toán số lượng xe hiện tại từ dữ liệu API
        const stats = calculateVehicleStats(data.result);
        setCurrentStats(stats);

        // Lấy TỔNG số xe đang trong bãi (mọi ngày) từ danh sách xe đang đỗ.
        // Đây mới là con số thực tế trong bãi, không chỉ tính theo hôm nay.
        try {
          const recordsUrl = buildApiUrl(API_ENDPOINTS.PARKING.RECORDS);
          const recordsData = await fetchWithAuth<{
            code: number;
            result: unknown[];
          }>(recordsUrl);
          if (
            recordsData?.code === 1000 &&
            Array.isArray(recordsData.result)
          ) {
            setInParkingCount(recordsData.result.length);
          }
        } catch (e) {
          console.error("Lỗi khi lấy tổng xe trong bãi:", e);
        }
      } else {
        throw new Error(
          "Lỗi khi lấy dữ liệu: " + (data.message || "Không xác định")
        );
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu"
      );
    } finally {
      setLoading(false);
    }
  }, [calculateVehicleStats, fetchWithAuth, itemsPerPage]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Hàm tính toán thống kê xe từ dữ liệu API
  

    const total = motorbike + scooter + bicycle;

    return {
      motorbike,
      scooter,
      bicycle,
      total,
    };
  },[]);

  // Lấy các record cho trang hiện tại
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return recentActivity.slice(startIndex, endIndex);
  };

  // Tạo mảng số trang để hiển thị
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // Số lượng nút trang tối đa hiển thị

    if (totalPages <= maxPagesToShow) {
      // Nếu tổng số trang nhỏ hơn hoặc bằng maxPagesToShow, hiển thị tất cả
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Nếu tổng số trang lớn hơn maxPagesToShow
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = startPage + maxPagesToShow - 1;

      if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }

    return pageNumbers;
  };

  // Xử lý sự kiện thay đổi trang
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Format thời gian thân thiện với người dùng
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (e) {
      return timestamp; // Nếu không parse được, trả về nguyên giá trị
    }
  };

  // Tính số lượng xe vào và ra hôm nay
  const entriesCount = recentActivity.filter(
    (record) => record.eventType === "ENTRY"
  ).length;

  const exitsCount = recentActivity.filter(
    (record) => record.eventType === "EXIT"
  ).length;

  // Đếm số lượng vào/ra theo loại xe
  const getVehicleTypeCount = (
    type: "Bicycle" | "Motorbike" | "Scooter",
    event: "ENTRY" | "EXIT"
  ) => {
    return recentActivity.filter(
      (r) => r.vehicleType === type && r.eventType === event
    ).length;
  };

  return {
    loading: loading || fetchLoading,
    error,
    currentStats,
    inParkingCount,
    recentActivity,
    currentPage,
    totalPages,
    entriesCount,
    exitsCount,
    getPaginatedData,
    getPageNumbers,
    handlePageChange,
    formatTimestamp,
    getVehicleTypeCount,
    refreshDashboard: fetchDashboardData,
  };
}

// Export interfaces để các component khác có thể sử dụng
export type { VehicleStats, VehicleRecord };