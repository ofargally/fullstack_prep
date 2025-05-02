// Component for the message input form
import React from "react";
import { useState, FormEvent } from "react";

interface MessageInputProps {
  username: string;
  onSendMessage: (text: string) => void;
  isSending: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isSending,
}) => {
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const textToSend = messageText.trim();
    if (!textToSend) return;

    setError(null);
    try {
      await onSendMessage(textToSend);
      setMessageText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border-t border-gray-200 bg-gray-100 rounded-b-lg"
    >
      {error && (
        <p className="text-red-500 text-sm mb-2 text-center">{error}</p>
      )}
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type your message..."
          disabled={isSending}
          className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-200"
          aria-label="Message input"
        />
        <button
          type="submit"
          disabled={isSending || !messageText.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
