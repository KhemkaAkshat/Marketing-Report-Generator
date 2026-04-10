const HistoryList = ({ history, activeChatId, onSelectChat }) => (
  <div className="flex-1 overflow-y-auto p-3 space-y-2">
    {history.length === 0 && (
      <p className="mt-4 text-center text-sm text-gray-500">No history yet</p>
    )}

    {history.map((item, index) => (
      <div
        key={item.chatId || index}
        onClick={() => onSelectChat(item)}
        className={`group cursor-pointer rounded-xl px-3 py-2 transition-all duration-200 ${
          activeChatId === item.chatId ? "bg-[#262626]" : "hover:bg-[#262626]"
        }`}
      >
        <p className="text-md truncate text-gray-200 group-hover:text-white">
          {item.title}
        </p>
      </div>
    ))}
  </div>
);

const SidebarHeader = ({ onNewChat }) => (
  <div className="border-b border-gray-800 p-4">
    <div className="flex items-center justify-between gap-3 lg:block">
      <h2 className="text-lg font-semibold text-white lg:mb-3">History</h2>

      <button
        onClick={onNewChat}
        className="shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:scale-105 lg:w-full"
      >
        + New Chat
      </button>
    </div>
  </div>
);

const Sidebar = ({
  history,
  activeChatId,
  loadFromHistory,
  startNewChat,
  isMobileOpen,
  closeMobileSidebar,
}) => {
  const handleSelectChat = (item) => {
    loadFromHistory(item);
    closeMobileSidebar?.();
  };

  const handleNewChat = () => {
    startNewChat();
    closeMobileSidebar?.();
  };

  return (
    <>
      <aside className="hidden h-screen w-72 border-r border-gray-800 bg-[#0d0d0d] lg:flex lg:flex-col">
        <SidebarHeader onNewChat={handleNewChat} />
        <HistoryList
          history={history}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
        />
      </aside>

      {isMobileOpen && (
        <>
          <button
            aria-label="Close chat history"
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={closeMobileSidebar}
          />

          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-[#0d0d0d] shadow-xl lg:hidden">
            <SidebarHeader onNewChat={handleNewChat} />
            <HistoryList
              history={history}
              activeChatId={activeChatId}
              onSelectChat={handleSelectChat}
            />
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;
