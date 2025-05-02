import { useState } from "react"; // Removed useEffect
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";
import UsernameInput from "./UsernameInput";
import useFetchMessages from "../hooks/useFetchMessages";
import usePostMessage from "../hooks/usePostMessage";
import usePostUser from "../hooks/usePostUser";
import { MessageCreate, UserCreate } from "../Interfaces";
import axios from "axios";
import useClearChat from "../hooks/useClearChat";

const Chats = () => {
  const [username, setUsername] = useState<string | null>(null);
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    isError: isFetchError,
    error: fetchError,
    refetch,
  } = useFetchMessages();

  const {
    mutate: sendMessage,
    isPending: isSendingMessage,
    isError: isPostError,
    error: postError,
  } = usePostMessage();

  const {
    mutate: createUser,
    isPending: isCreatingUser,
    error: createUserError,
  } = usePostUser();

  const { mutate: clearChatHistory, isPending: isClearingChat } =
    useClearChat();

  const handleSetUsername = (name: string) => {
    const userData: UserCreate = { user_name: name }; // Use updated interface name

    createUser(userData, {
      onSuccess: (createdUser) => {
        setUsername(createdUser.id);
        console.log(`User ${createdUser.id} created/logged in and set.`);
      },
      onError: (error: Error, variables: UserCreate) => {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 409) {
            console.log(
              `User ${variables.user_name} already exists, logging in.`
            );
            setUsername(variables.user_name);
          } else {
            console.error(
              "Axios error creating/verifying user:",
              error.message
            );
          }
        } else {
          console.error("Non-Axios error creating/verify user:", error.message);
        }
      },
    });
  };

  const handleSendMessage = (text: string) => {
    if (!username) return;
    const messageData: MessageCreate = {
      user_name: username,
      message_text: text,
    };
    sendMessage(messageData);
  };

  const handleSignOut = () => {
    setUsername(null);
  };

  const handleClearChat = () => {
    clearChatHistory();
  };

  if (!username) {
    return (
      <UsernameInput
        onSetUsername={handleSetUsername}
        isLoading={isCreatingUser}
        error={createUserError?.message}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 max-w-4xl mx-auto shadow-lg border border-gray-200 overflow-hidden">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-black p-4 rounded-t-lg shadow flex-shrink-0">
        {" "}
        {/* Added flex-shrink-0 */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">Chat App</h1>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm">Logged in as:</p>
              <p className="font-medium">{username}</p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-md shadow focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-indigo-700 transition duration-150 ease-in-out"
              aria-label="Sign out"
            >
              Refresh Chat
            </button>
            <button
              onClick={handleClearChat}
              disabled={isClearingChat} // Disable while clearing
              className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded-md shadow focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-indigo-700 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Clear chat history"
            >
              {isClearingChat ? "Clearing..." : "Clear Chat"}
            </button>
            <button
              onClick={handleSignOut}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md shadow focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-indigo-700 transition duration-150 ease-in-out"
              aria-label="Sign out"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {isLoadingMessages && (
        <p className="text-center text-blue-600 p-4 bg-blue-50 border-b border-blue-200">
          Loading messages...
        </p>
      )}
      {isFetchError && !isLoadingMessages && (
        <p className="text-center text-red-600 p-4 bg-red-50 border-b border-red-200">
          Error loading messages: {fetchError?.message}
        </p>
      )}
      {isPostError && (
        <p className="text-center text-red-600 p-2 bg-red-50">
          Error sending message: {postError?.message}
        </p>
      )}
      <MessageList messages={messages} currentUser={username} />
      <MessageInput
        username={username}
        onSendMessage={handleSendMessage}
        isSending={isSendingMessage}
      />
    </div>
  );
};

export default Chats;
