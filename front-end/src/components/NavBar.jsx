"use client";
import { Outlet } from "react-router-dom";
import { FloatingNav } from "./ui/aceternity/floating-navbar";
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
      <DummyContent />
    </div>
  );
};
const DummyContent = () => {
  return (
    <div className="mx-auto mt-30 w-full max-w-4xl relative rounded-2xl border border-neutral-200 dark:border-white/20 bg-white dark:bg-black overflow-hidden mb-5">
      <Outlet />
    </div>
  );
};

export default NavBar;
