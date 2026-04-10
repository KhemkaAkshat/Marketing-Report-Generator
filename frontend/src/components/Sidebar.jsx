const Sidebar = ({ history, loadFromHistory }) => {
  const startNewChat = () => {
  window.location.reload();
}
  return (
    <div className="w-72 bg-[#0d0d0d] border-r border-gray-800 flex flex-col">

      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-3">History</h2>

        <button
          onClick={startNewChat}
          className="w-full bg-white text-black py-2 rounded-lg text-sm font-medium hover:scale-105 transition"
        >
          + New Chat
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">

        {history.length === 0 && (
          <p className="text-gray-500 text-sm text-center mt-4">
            No history yet
          </p>
        )}

        {history.map((item, index) => (
          <div
            key={index}
            onClick={() => loadFromHistory(item)}
            className="group cursor-pointer px-3 py-2 rounded-xl hover:bg-[#262626] transition-all duration-200"
          >
            <p className="text-md text-gray-200 truncate group-hover:text-white">
              {item.query}
            </p>
          </div>
        ))}

      </div>
    </div>
  );
};

export default Sidebar;