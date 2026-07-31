import Link from "next/link";

const links = [
  { href: "/", label: "Today's Content" },
  { href: "/posts", label: "Posts" },
  { href: "/images", label: "Images" },
  { href: "/excel", label: "Excel" },
  { href: "/scheduler", label: "Scheduler" },
  { href: "/logs", label: "Logs" }
];

export function DashboardNav() {
  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
