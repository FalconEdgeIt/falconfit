import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck, Droplets, Medal, PlayCircle, ScanBarcode, Send, Trophy } from "lucide-react";
import WaitlistForm from "../../components/WaitlistForm";

export const metadata: Metadata = {
  title: "FalconFit for Coaches",
  description:
    "A simple training and nutrition tracker your clients will actually use. Set up for you and supported locally by FalconEdge IT.",
};

const FEATURES = [
  {
    icon: ClipboardCheck,
    title: "See who's slipping",
    text: "A weekly check-in shows every client's workouts, nutrition targets and water at a glance, and flags anyone who's gone quiet.",
  },
  {
    icon: Send,
    title: "Send the program",
    text: "Build a workout once and send it to one client or your whole group. It lands in their app, ready to log.",
  },
  {
    icon: ScanBarcode,
    title: "Food logging that's fast",
    text: "Clients search foods, scan a barcode, or tap a go-to meal. Calories and macros fill in for them.",
  },
  {
    icon: Droplets,
    title: "Hydration built in",
    text: "One-tap water logging with daily targets you can set per client.",
  },
  {
    icon: Trophy,
    title: "A weekly leaderboard",
    text: "Your group competes on showing up, not on who lifts the most, so beginners can win too.",
  },
  {
    icon: Medal,
    title: "Badges that keep them coming back",
    text: "Streaks, PRs and milestones unlock badges with a sense of humour. Clients chase the next one.",
  },
];

const SCREENS = [
  { src: "/landing/dashboard.png", alt: "Client home screen showing level, training calendar and goal progress" },
  { src: "/landing/fuel.png", alt: "Nutrition screen with calorie and macro rings" },
  { src: "/landing/check-in.png", alt: "Coach check-in listing clients who need attention" },
];

export default function CoachesPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <header className="max-w-6xl mx-auto flex items-center justify-between px-5 sm:px-8 py-5">
        <div className="flex items-center gap-2">
          <img src="/falconfit-icon.png" alt="" className="h-8 w-auto" />
          <span className="font-display font-bold text-2xl tracking-wide">FALCONFIT</span>
        </div>
        <Link href="/login" className="text-sm text-gray-300 hover:text-white">
          Log in
        </Link>
      </header>

      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 pb-16 lg:pt-16">
        <p className="font-mono text-xs tracking-wider text-red-400 uppercase">For personal trainers and small studios</p>
        <h1 className="!text-5xl sm:!text-6xl lg:!text-7xl !leading-[0.95] mt-4 max-w-4xl">
          A tracker your clients will actually use
        </h1>
        <p className="text-gray-300 text-lg mt-6 max-w-2xl">
          FalconFit keeps training, nutrition and hydration in one simple app, and shows you who&apos;s on track. We set it
          up for you, and you get real support from a local team.
        </p>
        <div className="flex flex-wrap items-center gap-4 mt-8">
          <a href="#waitlist" className="bg-red-600 hover:bg-red-700 px-7 py-3.5 rounded-lg font-semibold">
            Join the waitlist
          </a>
          <p className="text-gray-400 text-sm">Canadian pricing · Set up for you · Local support</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-16" aria-labelledby="demo-heading">
        <h2 id="demo-heading" className="sr-only">
          See it in action
        </h2>
        <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-5 sm:p-8">
          {/* Swipeable on phones, side by side on wider screens */}
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-5 px-5 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible">
            {SCREENS.map((s) => (
              <img
                key={s.src}
                src={s.src}
                alt={s.alt}
                className="w-[72%] shrink-0 snap-center sm:w-full rounded-xl border border-gray-700 bg-gray-950"
              />
            ))}
          </div>
          <p className="flex items-center justify-center gap-2 text-gray-400 text-sm mt-5">
            <PlayCircle size={18} aria-hidden="true" />
            A 60-second demo video is coming soon.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-16">
        <h2 className="!text-4xl mb-8">What your clients get, and what you see</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-gray-800 border border-gray-700/70 rounded-2xl p-5">
              <Icon size={24} className="text-red-400" aria-hidden="true" />
              <p className="font-semibold text-lg mt-3">{title}</p>
              <p className="text-gray-400 mt-1.5">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="waitlist" className="max-w-3xl mx-auto px-5 sm:px-8 pb-20 scroll-mt-8">
        <h2 className="!text-4xl">Get early access</h2>
        <p className="text-gray-300 mt-3 mb-6">
          We&apos;re opening FalconFit to a small group of founding coaches first.
        </p>
        <WaitlistForm />
      </section>

      <footer className="border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500">
          <a
            href="https://www.falconedgeit.ca"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-red-400"
          >
            <img src="/falconfit-icon.png" alt="" className="h-4 w-auto" />
            Powered by FalconEdge IT
          </a>
          <p>FalconFit is a training tool, not medical advice.</p>
        </div>
      </footer>
    </main>
  );
}
