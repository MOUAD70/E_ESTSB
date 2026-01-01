"use client";
import { Outlet } from "react-router-dom";
import { FloatingNav } from "../../ui/aceternity/FloatingNavbar";
import { IconHome, IconMessage, IconUser } from "@tabler/icons-react";

const NavBar = () => {
  const navItems = [
    {
      name: "Accueil",
      link: "/",
      icon: <IconHome className="h-4 w-4 text-neutral-500 dark:text-white" />,
    },
    {
      name: "À propos",
      link: "/about",
      icon: <IconUser className="h-4 w-4 text-neutral-500 dark:text-white" />,
    },
    {
      name: "Contact",
      link: "/contact",
      icon: (
        <IconMessage className="h-4 w-4 text-neutral-500 dark:text-white" />
      ),
    },
  ];
  return (
    <div className="relative  w-full">
      <FloatingNav navItems={navItems} />
    </div>
  );
};

export default NavBar;
