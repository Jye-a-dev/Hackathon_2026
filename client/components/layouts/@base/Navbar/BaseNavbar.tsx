import type { ReactNode } from "react";

type BaseNavbarProps = {
  brand: ReactNode;
  action?: ReactNode;
};

export default function BaseNavbar({ brand, action }: BaseNavbarProps) {
  return (
    <header className="border-b border-neutral-200">
      <div className="flex items-center justify-between px-6 py-6 lg:px-8">
        <div>{brand}</div>
        {action ? <div>{action}</div> : null}
      </div>
    </header>
  );
}
