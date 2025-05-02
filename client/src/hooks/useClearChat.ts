import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCreate, MessageResponse } from "../Interfaces"; // Import necessary types if needed by APIClient
import APIClient from "../api/api-client";

const client = new APIClient<MessageCreate, MessageResponse>("/chat");

const useClearChat = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation<void, Error, void>({
    mutationFn: () => client.clearChat(),
    onSuccess: () => {
      console.log("Chat cleared successfully.");
      // invalidate and refetch.
      queryClient.setQueryData(["chat"], []);
    },
    onError: (error) => {
      console.error("Error clearing chat:", error);
    },
  });

  return mutation;
};

export default useClearChat;
