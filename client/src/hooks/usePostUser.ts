import { UserCreate, UserResponse } from "../Interfaces"; // Ensure interfaces are updated and renamed
import APIClient from "../api/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Client expects UserCreate for TCreate, UserResponse for TResponse
const client = new APIClient<UserCreate, UserResponse>("/users");

const usePostUser = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation<UserResponse, Error, UserCreate>({
    mutationFn: (data: UserCreate) => {
      return client.createUser(data);
    },
    onSuccess: (data) => {
      console.log("User created successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      console.error("Error creating user:", error);
    },
  });

  return mutation;
};

export default usePostUser;
