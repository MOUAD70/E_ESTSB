import {
  IconChartBar,
  IconDashboard,
  IconUsers,
  IconFileAnalytics,
  IconSettings,
  IconUserShield,
} from "@tabler/icons-react";
import { NavLink } from "react-router-dom";

import { NavMain } from "@/components/shared/global/nav-main";
import { NavUser } from "@/components/shared/global/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import {
  ADMIN_DASHBOARD_ROUTE,
  ADMIN_FINAL_SCORES_ROUTE,
  ADMIN_USERS_ROUTE,
} from "../../../routes/Routes";
const adminNav = [
  {
    title: "Tableau de bord",
    url: ADMIN_DASHBOARD_ROUTE,
    icon: IconDashboard,
  },
  {
    title: "Utilisateurs",
    url: ADMIN_USERS_ROUTE,
    icon: IconUsers,
  },
  {
    title: "Notes & Résultats",
    url: ADMIN_FINAL_SCORES_ROUTE,
    icon: IconFileAnalytics,
  },
  {
    title: "Paramètres",
    url: "/admin/settings",
    icon: IconSettings,
  },
];

export function AppSidebar({ ...props }) {
  const { user } = useContext(AuthContext);

  const sidebarUser = {
    name: user ? `${user.nom} ${user.prenom}` : "—",
    email: user?.email || "",
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <NavLink to={ADMIN_DASHBOARD_ROUTE}>
                <IconUserShield />
                <span className="text-base font-semibold">E-ESTSB Admin</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={adminNav} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
