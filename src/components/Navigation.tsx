export default function Navigation() {
  return (
    <nav className="bg-gray-800 p-4 rounded-xl mb-6 flex items-center justify-between flex-wrap gap-4">
      <a href="/" className="flex items-center gap-2">
        <img src="/falconfit-icon.png" alt="FalconFit" className="h-9 w-auto" />
        <span className="font-bold text-lg tracking-tight">FALCONFIT</span>
      </a>
      <ul className="flex flex-wrap gap-4">
        <li>
          <a href="/" className="hover:text-red-400">
            🏠 Dashboard
          </a>
        </li>
        <li>
          <a href="/workouts" className="hover:text-red-400">
            🏋 Workouts
          </a>
        </li>
        <li>
          <a href="/nutrition" className="hover:text-red-400">
            🍗 Nutrition
          </a>
        </li>
        <li>
          <a href="/supplements" className="hover:text-red-400">
            💊 Supplements
          </a>
        </li>
        <li>
          <a href="/progress" className="hover:text-red-400">
            ⚖ Progress
          </a>
        </li>
        <li>
          <a href="/settings" className="hover:text-red-400">
            ⚙ Settings
          </a>
        </li>
      </ul>
    </nav>
  );
}