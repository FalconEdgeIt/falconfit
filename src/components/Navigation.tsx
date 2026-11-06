"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChartLine,
  Dumbbell,
  Gauge,
  LogOut,
  Medal,
  Settings,
  ShieldCheck,
  Trophy,
  Users,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import AchievementToasts from "./AchievementToasts";

type Me = {
  id: string;
  name: string;
  role: "ADMIN" | "TRAINER" | "MEMBER";
};

type NavItem = { href: string; label: string; icon: LucideIcon };

const PRIMARY: NavItem[] = [
  { href: "/", label: "Home", icon: Gauge },
  { href: "/workouts", label: "Train", icon: Dumbbell },
  { href: "/nutrition", label: "Fuel", icon: Utensils },
  { href: "/progress", label: "Stats", icon: ChartLine },
  { href: "/achievements", label: "Badges", icon: Medal },
];

// The app shell: a side rail on desktop, and a slim top bar plus thumb-reach tab bar on phones.
// It's fixed in place, so globals.css reserves room for it on any page that renders it.
export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const secondary: NavItem[] = [
    { href: "/leaderboard", label: "Ranks", icon: Trophy },
    ...(me && me.role !== "MEMBER" ? [{ href: "/trainer/group", label: "My Group", icon: Users }] : []),
    ...(me?.role === "ADMIN" ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }] : []),
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const railLink = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`relative flex flex-col items-center gap-1 w-full py-2.5 rounded-lg text-[11px] font-medium tracking-wide transition-colors ${
          active ? "text-white bg-gray-800" : "text-gray-400 hover:text-white hover:bg-gray-800/60"
        }`}
      >
        {active && <span className="absolute -left-2 top-2 bottom-2 w-1 rounded-full bg-red-600" />}
        <item.icon size={21} strokeWidth={active ? 2.4 : 1.9} className={active ? "text-red-400" : ""} />
        {item.label}
      </Link>
    );
  };

  return (
    <>
      <nav data-app-shell aria-label="Main">
        {/* Desktop rail */}
        <div className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-[6rem] flex-col items-center gap-1 bg-gray-950/90 border-r border-gray-800 px-2 py-4">
          <Link href="/" className="mb-5" aria-label="FalconFit home">
            <img src="/falconfit-icon.png" alt="" className="h-10 w-auto" />
          </Link>
          {PRIMARY.map(railLink)}
          <div className="mt-auto w-full flex flex-col items-center gap-1">
            {secondary.map(railLink)}
            <button
              onClick={handleLogout}
              title={me ? `Log out ${me.name}` : "Log out"}
              className="flex flex-col items-center gap-1 w-full py-2.5 rounded-lg text-[11px] font-medium text-gray-500 hover:text-red-400 transition-colors"
            >
              <LogOut size={20} strokeWidth={1.9} />
              Log Out
            </button>
          </div>
        </div>

        {/* Phone top bar */}
        <div className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between h-14 px-4 bg-gray-950/90 backdrop-blur border-b border-gray-800">
          <Link href="/" className="flex items-center gap-2">
            <img src="/falconfit-icon.png" alt="" className="h-7 w-auto" />
            <span className="font-display font-bold text-xl tracking-wide">FALCONFIT</span>
          </Link>
          <div className="flex items-center gap-1">
            {secondary.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={`p-2.5 rounded-lg ${isActive(item.href) ? "text-red-400" : "text-gray-400"}`}
              >
                <item.icon size={20} />
              </Link>
            ))}
            <button onClick={handleLogout} aria-label="Log out" className="p-2.5 rounded-lg text-gray-500">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Phone tab bar */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-5 bg-gray-950/95 backdrop-blur border-t border-gray-800 pb-[env(safe-area-inset-bottom)]">
          {PRIMARY.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-1 pt-2.5 pb-2 text-[11px] font-medium ${
                  active ? "text-white" : "text-gray-400"
                }`}
              >
                {active && <span className="absolute top-0 inset-x-5 h-0.5 rounded-full bg-red-600" />}
                <item.icon size={22} strokeWidth={active ? 2.4 : 1.9} className={active ? "text-red-400" : ""} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
      {me && <AchievementToasts userId={me.id} />}
    </>
  );
}
