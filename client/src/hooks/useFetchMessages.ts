import { MessageCreate, MessageResponse } from "../Interfaces";
import APIClient from "../api/api-client";
import { useQuery } from "@tanstack/react-query";

const client = new APIClient<MessageCreate, MessageResponse[]>("/chat");

const useFetchMessages = () => {
  const query = useQuery<MessageResponse[], Error>({
    queryKey: ["chat"],
    queryFn: () => client.fetchMessages(),
    staleTime: 1000 * 60 * 1,
  });
  return query;
};
export default useFetchMessages;
