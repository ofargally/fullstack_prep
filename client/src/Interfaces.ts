// define type for the API response
export interface MessageResponse {
  _id: number;
  user_id: string;
  message: string;
  timestamp: string;
}
// define type for creating a new message
export interface MessageCreate {
  user_name: string;
  message_text: string;
}

export interface UserCreate {
  user_name: string;
}

export interface UserResponse {
  id: string;
}
