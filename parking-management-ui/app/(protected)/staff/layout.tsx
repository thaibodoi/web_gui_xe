"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Navbar from "@/components/Navbar";
import StaffSidebar from "@/components/StaffSidebar";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const StaffLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // ===== Người gác cổng: chặn khi chưa đăng nhập =====
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = Cookies.get("authToken") || localStorage.getItem("token");

    if (!token) {
      // Chưa đăng nhập -> về trang login
      router.replace("/login");
      return;
    }

    setAuthorized(true);
  }, [router]);
  // ===================================================

  // Xử lý sự kiện đóng sidebar khi click vào menu item trên mobile
  useEffect(() => {
    const handleCloseSidebar = () => {
      setShowMobileSidebar(false);
    };

    document.addEventListener("closeMobileSidebar", handleCloseSidebar);

    return () => {
      document.removeEventListener("closeMobileSidebar", handleCloseSidebar);
    };
  }, []);

  // Chưa xác thực xong thì không render nội dung
  if (!authorized) return null;

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,0"
        rel="stylesheet"
      />
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Navbar - chiều cao cố định */}
        <div className="shrink-0">
          <Navbar>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2"
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            >
              <Menu className="h-5 w-5 text-white" />
            </Button>
          </Navbar>
        </div>

        {/* Phần nội dung chính - flex-1 để lấp đầy phần còn lại */}
        <div className="flex flex-1 overflow-hidden">
          {/* Mobile sidebar overlay */}
          {showMobileSidebar && (
            <div
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
              onClick={() => setShowMobileSidebar(false)}
            />
          )}

          {/* Mobile sidebar */}
          <div
            className={`
              ${showMobileSidebar ? "translate-x-0" : "-translate-x-full"}
              fixed md:hidden left-0 top-[56px] h-[calc(100vh-56px)] 
              w-[280px] z-40 transition-transform duration-300 ease-in-out
              bg-slate-50 shadow-lg
            `}
          >
            <div className="relative h-full overflow-y-auto">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => setShowMobileSidebar(false)}
              >
                <X className="h-5 w-5" />
              </Button>
              <StaffSidebar />
            </div>
          </div>

          {/* Desktop sidebar - chiều rộng cố định, có thể cuộn */}
          <div className="hidden md:block md:w-[300px] md:shrink-0 overflow-y-auto bg-slate-50 border-r">
            <StaffSidebar />
          </div>

          {/* Main content - có thể cuộn */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-5">{children}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StaffLayout;
