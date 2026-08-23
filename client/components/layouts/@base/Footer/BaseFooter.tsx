import type { ReactNode } from "react";

type BaseFooterProps = {
  left: ReactNode;
  right?: ReactNode;
};

export default function BaseFooter({ left, right }: BaseFooterProps) {
  return (
    <footer className="border-t border-neutral-200">
      <div className="flex flex-col gap-3 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div>{left}</div>
        {right ? <div>{right}</div> : null}
      </div>
    </footer>
  );
}
