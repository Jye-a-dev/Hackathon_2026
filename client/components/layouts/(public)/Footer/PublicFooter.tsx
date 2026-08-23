import BaseFooter from "@/components/layouts/@base/Footer/BaseFooter";

export default function PublicFooter() {
  return (
    <BaseFooter
      left={<p>&copy; 2026 Template React Client</p>}
      right={<p>Built with React, Vite and Tailwind CSS.</p>}
    />
  );
}
