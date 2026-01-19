export interface Role {
  id: number;
  name: string;
  permissions: string[];
}

export interface User {
  id: number;
  email: string;
  role: Role;
  actif: boolean;
  createdAt: string;
}
