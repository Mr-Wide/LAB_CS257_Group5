import React from 'react';
import { LucideTrainFront as TrainIcon, BookOpen, User, CalendarDays, Users, Map } from 'lucide-react';

type Props = {
  backgroundUrl?: string;
};

const features = [
  {
    title: 'Home & Authentication',
    icon: TrainIcon,
    text: `A welcoming landing page that guides visitors to Login or Sign-up. Single login portal handles both user and admin roles with account recovery options.`,
  },
  {
    title: 'User Dashboard',
    icon: Users,
    text: `A role-aware dashboard that surfaces profile management, booking history, and train information.`,
  },
  {
    title: 'Booking History',
    icon: BookOpen,
    text: `Clear, categorized booking records: Confirmed, Waiting List, and Previously Booked journeys — all with easy download and status indicators.`,
  },
  {
    title: 'Train Info & Booking',
    icon: Map,
    text: `Search trains by route and date, filter by fare/duration/arrival, choose class & seats with an interactive seat map, and confirm with passenger details.`,
  },
  {
    title: 'Profile Management',
    icon: User,
    text: `Edit personal details and secure your account. Change name, email, phone, and password conveniently.`,
  },
  {
    title: 'Integrated Navigation',
    icon: CalendarDays,
    text: `Consistent role-based navigation (Home → Login → Dashboard → Features) with an app-wide footer for About/Contact/Policies.`,
  },
];

export default function Home({ backgroundUrl }: Props) {
  return (
    <main
      className="min-h-screen bg-cover bg-center relative text-white"
      style={{ backgroundImage: `url(${backgroundUrl ?? 'src/pages/images/railway-bg.jpeg'})` }}
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/60" aria-hidden="true" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-24">
        {/* Hero */}
        <div className="max-w-4xl text-center">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight mb-4 animate-fade-up">
            IITIRCTC
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-100/90 mb-8 animate-fade-up-delayed">
            A clean, role-based Railway Reservation Management interface — search trains, book tickets,
            and manage journeys with confidence.
          </p>

          <div className="flex items-center justify-center gap-4 animate-fade-up-delayed-2">
            <a
              href="#/dashboard"
              className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-blue-600/95 hover:bg-blue-700 transition-shadow shadow-lg font-semibold"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12H3"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12"/></svg>
              Search Trains
            </a>
          </div>
        </div>

        {/* Features grid */}
        <section className="mt-20 w-full max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon as any;
              return (
                <article
                  key={f.title}
                  className="backdrop-blur-sm bg-white/6 border border-white/10 rounded-2xl p-6 flex flex-col gap-4 min-h-[140px] animate-card"
                  style={{ animationDelay: `${120 * i}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-white/6 p-3">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold">{f.title}</h3>
                  </div>
                  <p className="text-sm text-gray-100/85 mt-2">{f.text}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-10 text-center text-sm text-gray-200/80">
            <p>
              Routes and schedules are modeled internally within train records — keeping the user interface
              simple while the backend maintains complete, consistent relationships.
            </p>
          </div>
        </section>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-up { animation: fadeUp 700ms cubic-bezier(.22,.95,.36,1) both; }
        .animate-fade-up-delayed { animation: fadeUp 800ms cubic-bezier(.22,.95,.36,1) 260ms both; }
        .animate-fade-up-delayed-2 { animation: fadeUp 900ms cubic-bezier(.22,.95,.36,1) 480ms both; }

        @keyframes cardPop {
          from { opacity: 0; transform: translateY(14px) scale(.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-card { animation: cardPop 520ms cubic-bezier(.2,.9,.24,1) both; }

        @media (prefers-reduced-motion: reduce) {
          .animate-fade-up, .animate-fade-up-delayed, .animate-fade-up-delayed-2, .animate-card {
            animation: none; opacity: 1; transform: none;
          }
        }
      `}</style>
    </main>
  );
}
