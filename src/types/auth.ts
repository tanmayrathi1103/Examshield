export interface Token {
  access_token: string;
  token_type: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface MessageResponse {
  message: string;
}
