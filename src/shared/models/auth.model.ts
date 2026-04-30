import { User } from './user.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

/**
 * Reponse du backend apres login.
 * Depuis la migration cookie HttpOnly, le token JWT n'est plus dans le body.
 */
export interface AuthResponse {
  user: User;
}
