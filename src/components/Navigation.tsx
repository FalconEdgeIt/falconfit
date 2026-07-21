export default function Navigation() {
  return (
    <nav className="bg-gray-800 p-4 rounded-xl mb-6">

      <div className="flex flex-wrap gap-4">

        <a href="/" className="hover:text-blue-400">
          🏠 Dashboard
        </a>

        <a href="/workouts" className="hover:text-blue-400">
          🏋 Workouts
        </a>

        <a href="/nutrition" className="hover:text-blue-400">
          🍗 Nutrition
        </a>

        <a href="/supplements" className="hover:text-blue-400">
          💊 Supplements
        </a>

        <a href="/progress" className="hover:text-blue-400">
          ⚖ Progress
        </a>

        <a href="/settings" className="hover:text-blue-400">
          ⚙ Settings
        </a>

      </div>

    </nav>
  );
}