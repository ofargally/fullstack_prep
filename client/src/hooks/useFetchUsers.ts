import { UserCreate, UserResponse } from "../Interfaces";
import APIClient from "../api/api-client";
import { useQuery } from "@tanstack/react-query";

const client = new APIClient<UserCreate, UserResponse[]>("/users");
const useFetchUsers = () => {
  const query = useQuery<UserResponse[], Error>({
    queryKey: ["users"],
    queryFn: () => client.fetchUsers(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  return query;
};
export default useFetchUsers;
