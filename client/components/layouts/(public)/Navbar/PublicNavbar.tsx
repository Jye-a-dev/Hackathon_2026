import Link from "next/link";

import BaseNavbar from "@/components/layouts/@base/Navbar/BaseNavbar";

export default function PublicNavbar() {
  return (
    <BaseNavbar
      brand={
        <Link
          href="/"
          className="text-[2.05rem] font-semibold tracking-[-0.04em] text-neutral-900"
        >
          Template React
        </Link>
      }
      action={
        <Link
          href="/"
          className="rounded-full bg-neutral-900 px-6 py-3 text-2xl font-semibold text-white transition hover:bg-neutral-800"
        >
          Home
        </Link>
      }
    />
  );
}
