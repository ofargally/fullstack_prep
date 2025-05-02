import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Create an Axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

class APIClient<TCreate, TResponse> {
  constructor(private endpoint: string) {}

  // Fetches the list of messages from the single chat document
  async fetchMessages(): Promise<TResponse> {
    try {
      // GET /chat/ returns List[MessageInChat] which matches MessageResponse[]
      const response = await axiosInstance.get<TResponse>(this.endpoint);
      return response.data;
    } catch (error: unknown) {
      console.error(`Error fetching messages from ${this.endpoint}:`, error);
      throw error;
    }
  }

  // Sends a new message to be added to the chat document
  async sendMessage(data: TCreate): Promise<TResponse> {
    try {
      // POST /chat/ returns MessageInChat which matches MessageResponse
      const response = await axiosInstance.post<TResponse>(this.endpoint, data);
      return response.data;
    } catch (error: unknown) {
      console.error(`Error sending message to ${this.endpoint}:`, error);
      throw error;
    }
  }

  // Creates a new user
  async createUser(data: TCreate): Promise<TResponse> {
    try {
      const response = await axiosInstance.post<TResponse>(this.endpoint, data);
      return response.data;
    } catch (error: unknown) {
      console.error(`Error creating user at ${this.endpoint}:`, error);
      throw error;
    }
  }

  // Fetches all users
  async fetchUsers(): Promise<TResponse> {
    try {
      const response = await axiosInstance.get<TResponse>(this.endpoint);
      return response.data;
    } catch (error: unknown) {
      console.error(`Error fetching users from ${this.endpoint}:`, error);
      throw error;
    }
  }
  // Clear chat
  async clearChat(): Promise<void> {
    // Returns void as backend sends 204 No Content
    try {
      await axiosInstance.post(`${this.endpoint}/reinitialize/`);
    } catch (error: unknown) {
      console.error(
        `Error clearing chat at ${this.endpoint}/reinitialize/`,
        error
      );
      throw error;
    }
  }
}

export default APIClient;
