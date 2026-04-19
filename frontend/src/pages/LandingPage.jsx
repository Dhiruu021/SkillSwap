import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";
import HeroTyping from "../components/HeroTyping";

const LandingPage = () => {
  const { user } = useAuth();

  if (user) return <Navigate to="/app" replace />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">

      {/* HERO SECTION */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">

        <div className="grid gap-12 md:gap-16 md:grid-cols-2 md:items-center">

          {/* LEFT SIDE */}
          <div className="space-y-6 sm:space-y-8 text-center md:text-left">

            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">

              <span className="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
                Exchange Skills
              </span>

              <br />

              <HeroTyping />

            </h1>

            <p className="max-w-xl mx-auto md:mx-0 text-base sm:text-lg text-slate-300 leading-relaxed">
              Skill Swap connects people who want to teach with people who want
              to learn. No fees, no barriers — just a community helping each
              other grow.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">

              <Link
                to="/register"
                className="btn-primary text-base sm:text-lg px-6 py-3 w-full sm:w-auto text-center"
              >
                Get started free
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-6 py-3 text-base sm:text-lg font-semibold hover:bg-slate-900 transition w-full sm:w-auto"
              >
                Login
              </Link>

            </div>

            {/* STATS */}
            <div className="flex flex-wrap justify-center md:justify-start gap-6 sm:gap-8 pt-4 sm:pt-6 text-xs sm:text-sm text-slate-400">

              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">1K+</p>
                <p>Users</p>
              </div>

              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">4K+</p>
                <p>Skill Exchanges</p>
              </div>

              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">95%</p>
                <p>Success Rate</p>
              </div>

            </div>

          </div>


          {/* RIGHT SIDE CARD */}
          <div className="relative">

            <div className="card glass space-y-5 sm:space-y-6 p-5 sm:p-8">

              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-slate-400">
                How it works
              </h2>

              <ol className="space-y-3 sm:space-y-4 text-sm sm:text-base text-slate-200">

                <li>
                  <span className="font-bold text-indigo-400">1.</span>{" "}
                  Tell us what you can{" "}
                  <span className="font-bold">teach</span> and what you want to{" "}
                  <span className="font-bold">learn</span>.
                </li>

                <li>
                  <span className="font-bold text-indigo-400">2.</span>{" "}
                  We match you with people whose skills complement yours.
                </li>

                <li>
                  <span className="font-bold text-indigo-400">3.</span>{" "}
                  Chat, schedule sessions, and rate your learning experience.
                </li>

              </ol>

              {/* SKILL EXAMPLES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-xs sm:text-sm text-slate-300">

                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
                  <p className="font-bold text-white">Teach</p>
                  <p>Web Dev, Python, UI Design etc..</p>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
                  <p className="font-bold text-white">Learn</p>
                  <p>Guitar, Photography, Public Speaking etc..</p>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* FEATURES SECTION */}
      <section className="border-t border-slate-800">

        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">

          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 sm:mb-14">
            Why use SkillSwap?
          </h2>

          <div className="grid gap-6 sm:gap-10 md:grid-cols-3">

            <div className="card p-5 sm:p-6 text-center md:text-left">
              <h3 className="text-base sm:text-lg font-bold">Skill Matching</h3>
              <p className="text-slate-400 mt-2 text-sm sm:text-base">
                Our platform automatically finds people whose skills match what
                you want to learn.
              </p>
            </div>

            <div className="card p-5 sm:p-6 text-center md:text-left">
              <h3 className="text-base sm:text-lg font-bold">Real-time Chat</h3>
              <p className="text-slate-400 mt-2 text-sm sm:text-base">
                Connect instantly with your skill partner using real-time
                messaging.
              </p>
            </div>

            <div className="card p-5 sm:p-6 text-center md:text-left">
              <h3 className="text-base sm:text-lg font-bold">Community Learning</h3>
              <p className="text-slate-400 mt-2 text-sm sm:text-base">
                Build meaningful connections while growing your knowledge.
              </p>
            </div>

          </div>

        </div>

      </section>


    </div>
  );
};

export default LandingPage;