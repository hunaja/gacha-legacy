"use client";

import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/react";
import { Patrick_Hand_SC } from "next/font/google";
import Image from "next/image";
import { api } from "~/trpc/react";

const font = Patrick_Hand_SC({
  weight: "400",
});

export default function GachaNavbar({
  selected,
}: {
  selected?: "frontPage" | "roll" | "allies" | "enemies" | "admin";
}) {
  const [balance] = api.user.getBalance.useSuspenseQuery();

  const characterSelected = selected === "enemies" || selected == "allies";

  return (
    <Navbar
      position="static"
      className={`bg-gradient-to-l from-slate-900 to-slate-700 text-4xl shadow-xl`}
    >
      <NavbarBrand>
        <Link
          className={`inline-block text-4xl text-slate-200 italic ${font.className}`}
          href="/"
        >
          AstralFantasia
        </Link>
      </NavbarBrand>
      <NavbarContent justify="center"></NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem className="flex justify-center text-slate-900">
          <Image src="/energy.png" alt="Energy Icon" height={25} width={25} />
          <span className="ml-2 text-lg text-slate-300">0</span>
        </NavbarItem>
        <NavbarItem className="flex justify-center">
          <Image
            src="/goldCropped.png"
            alt="Gold Icon"
            height={25}
            width={25}
          />
          <span className="ml-2 text-lg text-slate-300">{balance.gold}</span>
        </NavbarItem>
        <NavbarItem className="flex justify-center">
          <Image
            src="/diamondCropped.png"
            alt="Diamond Icon"
            height={25}
            width={25}
          />
          <span className="ml-2 text-lg text-slate-300">
            {balance.diamonds}
          </span>
        </NavbarItem>
        <NavbarItem>
          <button
            className={`text-shadow-lg ${font.className} block bg-[url(/buttons/3Button.png)] bg-contain bg-center bg-no-repeat px-6 py-3 text-center text-3xl font-bold text-gray-200 transition-transform hover:cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Shop
          </button>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
