import { MessageResponse, MessageCreate } from "../Interfaces"; // Ensure interfaces are updated
import APIClient from "../api/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Client expects MessageCreate for TCreate, MessageResponse for TResponse (single message)
const client = new APIClient<MessageCreate, MessageResponse>("/chat");

const usePostMessage = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation<MessageResponse, Error, MessageCreate>({
    mutationFn: (data: MessageCreate) => {
      return client.sendMessage(data);
    },
    onSuccess: (data) => {
      console.log("Message sent successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["chat"] }); // Changed from ["messages"]
    },
    onError: (error) => {
      console.error("Error sending message:", error);
    },
  });
  return mutation;
};

export default usePostMessage;
