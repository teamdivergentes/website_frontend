export interface Role {
  id: number;
  name: string;
  permissions: string[];
  isSystem?: boolean;
  _count?: { users: number };
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  email: string;
  role: Role;
  actif: boolean;
  createdAt: string;
  updatedAt?: string;
}

// DTOs Request
export interface CreateUserDto {
  email: string;
  password: string;
  roleId?: number;
  actif?: boolean;
}

export interface UpdateUserDto {
  email?: string;
  roleId?: number;
  actif?: boolean;
}

export interface UpdateProfileDto {
  email?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordDto {
  newPassword: string;
}

export interface AssignRoleDto {
  roleId: number;
}

// DTOs pour les rôles
export interface CreateRoleDto {
  name: string;
  permissions: string[];
}

export interface UpdateRoleDto {
  name?: string;
  permissions?: string[];
}

export interface PermissionGroup {
  module: string;
  permissions: string[];
}

// Pagination
export interface UserSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: number;
  actif?: boolean;
  sortBy?: 'email' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
