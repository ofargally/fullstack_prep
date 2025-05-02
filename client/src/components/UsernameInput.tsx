import React, { useState, FormEvent } from "react";

interface UsernameInputProps {
  onSetUsername: (username: string) => void;
  isLoading?: boolean; // Add isLoading prop
  error?: string | null; // Add error prop
}

const UsernameInput: React.FC<UsernameInputProps> = ({
  onSetUsername,
  isLoading = false,
  error = null,
}) => {
  const [name, setName] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName && !isLoading) {
      onSetUsername(trimmedName);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-indigo-100 to-purple-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold text-black-800 mb-6">
          Welcome to Omar's Chat App!
        </h1>
        <p className="text-gray-600 mb-6">Please enter a username to join:</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter Your Username"
            maxLength={50}
            required
            disabled={isLoading} // Disable input when loading
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
            aria-label="Username input"
          />
          <button
            type="submit"
            disabled={!name.trim() || isLoading} // Disable button when loading or input empty
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
          >
            {isLoading ? "Joining..." : "Join Chat"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UsernameInput;
