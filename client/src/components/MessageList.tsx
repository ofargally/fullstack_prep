import React, { useEffect, useRef } from "react";
import { MessageResponse } from "../Interfaces"; // Ensure interface is updated
import { formatTimestamp } from "../utils/formatTimestamp";

interface MessageListProps {
  messages: MessageResponse[];
  currentUser: string | null;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUser }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <p className="text-center text-gray-500 italic my-4">
          No messages yet. Start chatting!
        </p>
      </div>
    );
  }

  return (
    <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-b-lg">
      {messages.map((msg) => {
        console.log("Rendering message with key:", msg._id, msg);
        const isCurrentUser = msg.user_id === currentUser;
        return (
          <div
            key={msg._id}
            className={`flex ${
              isCurrentUser ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg shadow ${
                isCurrentUser
                  ? "bg-blue-500 text-black"
                  : "bg-white text-gray-800 border border-gray-200"
              }`}
            >
              <p className="text-xs font-semibold text-purple-600 mb-1">
                {msg.user_id}
              </p>
              <p className="text-sm break-words">{msg.message}</p>
              <p
                className={`text-xs mt-1 ${
                  isCurrentUser ? "text-black-200" : "text-black-400"
                } text-right`}
              >
                {formatTimestamp(msg.timestamp)}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
