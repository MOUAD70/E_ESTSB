import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/shared/global/app-sidebar";
import { SiteHeader } from "@/components/shared/global/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AdminLayout() {
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      }}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <Outlet/>
      </SidebarInset>
    </SidebarProvider>
  );
}
