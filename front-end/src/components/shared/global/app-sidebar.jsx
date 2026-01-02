import {
  IconDashboard,
  IconUsers,
  IconFileAnalytics,
  IconUserShield,
  IconFileText,
  IconClipboardCheck,
  IconUpload,
  IconAward,
} from "@tabler/icons-react";
import { NavLink } from "react-router-dom";
import { useContext, useMemo } from "react";

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

import { AuthContext } from "../../../context/AuthContext";
import {
  ADMIN_DASHBOARD_ROUTE,
  ADMIN_FINAL_SCORES_ROUTE,
  ADMIN_USERS_ROUTE,
  CANDIDAT_APPLY_ROUTE,
  CANDIDATE_PROGRAMS_ROUTE,
  CANDIDATE_UPLOAD_DOCS_ROUTE,
  CANDIDATE_RESULT_ROUTE,
} from "../../../routes/Routes";

// ADMIN
const adminNav = [
  { title: "Tableau de bord", url: ADMIN_DASHBOARD_ROUTE, icon: IconDashboard },
  { title: "Utilisateurs", url: ADMIN_USERS_ROUTE, icon: IconUsers },
  { title: "Notes & Résultats", url: ADMIN_FINAL_SCORES_ROUTE, icon: IconFileAnalytics },
];

// CANDIDAT
const candidateNav = [
  { title: "Mon dossier", url: CANDIDAT_APPLY_ROUTE, icon: IconFileText },
  { title: "Programmes éligibles", url: CANDIDATE_PROGRAMS_ROUTE, icon: IconClipboardCheck },
  { title: "Documents", url: CANDIDATE_UPLOAD_DOCS_ROUTE, icon: IconUpload },
  { title: "Résultat", url: CANDIDATE_RESULT_ROUTE, icon: IconAward },
];

export function AppSidebar({ ...props }) {
  const { user } = useContext(AuthContext);

  const role = (user?.role || "").toUpperCase();

  const items = useMemo(() => {
    if (role === "ADMIN") return adminNav;
    if (role === "CANDIDAT") return candidateNav;
    // fallback: if EVALUATEUR you can add its menu later
    return [];
  }, [role]);

  const header = useMemo(() => {
    if (role === "ADMIN") {
      return {
        title: "E-ESTSB Admin",
        icon: IconUserShield,
        to: ADMIN_DASHBOARD_ROUTE,
      };
    }
    if (role === "CANDIDAT") {
      return {
        title: "E-ESTSB Candidat",
        icon: IconUserShield,
        to: CANDIDAT_APPLY_ROUTE,
      };
    }
    return {
      title: "E-ESTSB",
      icon: IconUserShield,
      to: "/",
    };
  }, [role]);

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
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <NavLink to={header.to}>
                <header.icon className="!size-5" />
                <span className="text-base font-semibold">{header.title}</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
