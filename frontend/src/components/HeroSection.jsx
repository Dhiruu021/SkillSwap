import HeroTyping from "./HeroTyping";
import { Link } from "react-router-dom";

function HeroSection() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">

      <div className="max-w-6xl mx-auto px-6 text-center">

        {/* Heading */}
        <h1 className="text-4xl md:text-6xl font-bold leading-tight">

          <span className="bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
            Skill Swap
          </span>

          <br />

          <HeroTyping />

        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-slate-300 text-lg md:text-xl max-w-2xl mx-auto">
          Exchange skills with people around the world. Teach what you know and
          learn what you love.
        </p>

        {/* Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">

          <Link
            to="/register"
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition shadow-lg"
          >
            Start Swapping
          </Link>

          <Link
            to="/login"
            className="px-6 py-3 border border-slate-600 hover:border-slate-400 text-white rounded-xl transition"
          >
            Login
          </Link>

        </div>

      </div>

    </section>
  );
}

export default HeroSection;