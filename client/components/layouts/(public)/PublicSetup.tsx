import type { ReactNode } from "react";

import PublicFooter from "@/components/layouts/(public)/Footer/PublicFooter";
import PublicNavbar from "@/components/layouts/(public)/Navbar/PublicNavbar";

type PublicSetupProps = {
  children: ReactNode;
};

export default function PublicSetup({ children }: PublicSetupProps) {
  return (
    <>
      <PublicNavbar />
      <main className="flex flex-1 px-6 py-14 lg:px-8">{children}</main>
      <PublicFooter />
    </>
  );
}
