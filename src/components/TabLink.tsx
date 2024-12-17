import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

type TabLinkProps = {
  label: string;
  to: string;
  active?: boolean;
}

export const TabLink: React.FC<TabLinkProps> = ({ label, to, active }) => {
  return (
    <Link
      activeProps={{ className: "bg-background text-foreground shadow-sm" }}
      to={to}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        active && "bg-background text-foreground shadow-sm"
      )}
    >
      {label}
    </Link>
  );
};