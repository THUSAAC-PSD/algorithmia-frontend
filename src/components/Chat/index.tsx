import { PaperAirplaneIcon, PlusIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

const Chat = () => {
  const [activeChat, setActiveChat] = useState('general');
  const [message, setMessage] = useState('');

  // Mock data for chat groups and messages
  const chatGroups = [
    { id: 'aaa', name: '啊啊啊', unread: 0 },
    { id: 'bbb', name: '呜呜呜', unread: 3 },
    { id: 'ccc', name: '哦哦哦', unread: 0 },
    { id: 'ddd', name: '哈哈哈', unread: 1 },
  ];

  const chatMessages = {
    aaa: [
      {
        id: 1,
        sender: '张三',
        content: '大家好，麦当劳太好吃了',
        timestamp: '10:30 AM',
        isCurrentUser: false,
      },
      {
        id: 2,
        sender: '我',
        content: '肯德基才是最好吃的',
        timestamp: '10:32 AM',
        isCurrentUser: true,
      },
    ],
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // TODO: handle API call
      setMessage('');
    }
  };

  return (
    <div className="flex h-full bg-slate-900">
      <div className="w-72 bg-slate-800 border-r border-slate-700/50 flex flex-col">
        <div className="p-4 border-b border-slate-700/50">
          <h2 className="text-xl font-medium text-white">Chats</h2>
        </div>

        <div className="flex-1 overflow-auto">
          <ul className="px-2 py-3 space-y-1">
            {chatGroups.map((group) => (
              <li key={group.id}>
                <button
                  className={`flex items-center w-full px-3 py-2 rounded-lg transition-all duration-200 ${
                    activeChat === group.id
                      ? 'bg-indigo-500/10 text-indigo-400'
                      : 'text-slate-400 hover:bg-slate-700/40 hover:text-white'
                  }`}
                  onClick={() => setActiveChat(group.id)}
                >
                  <span className="font-medium">{group.name}</span>
                  {group.unread > 0 && (
                    <span className="ml-auto bg-indigo-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                      {group.unread}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h3 className="text-lg font-medium text-white">
            {chatGroups.find((group) => group.id === activeChat)?.name}
          </h3>
        </div>

        <div className="flex-1 p-6 overflow-auto bg-slate-900">
          <div className="space-y-4">
            {chatMessages[activeChat as keyof typeof chatMessages]?.map(
              (msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      msg.isCurrentUser
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    {!msg.isCurrentUser && (
                      <div className="font-medium text-indigo-400 text-sm mb-1">
                        {msg.sender}
                      </div>
                    )}
                    <p>{msg.content}</p>
                    <div
                      className={`text-xs mt-1 ${
                        msg.isCurrentUser ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-700/50 bg-slate-800">
          <form onSubmit={sendMessage} className="flex items-center">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-l-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-r-lg transition-colors"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
