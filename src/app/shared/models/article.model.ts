import { PaginatedResponse } from '../../../shared/models/user.model';

export interface ArticleType {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  tabletImageUrl?: string;
  published: boolean;
  featured: boolean;
  typeId: number;
  userId: number;
  type?: ArticleType;
  user?: { id: number; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateArticleDto {
  title: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  tabletImageUrl?: string;
  published?: boolean;
  featured?: boolean;
  typeId: number;
}

export interface UpdateArticleDto extends Partial<CreateArticleDto> {
  slug?: string;
}

export interface CreateArticleTypeDto {
  name: string;
}

export interface UpdateArticleTypeDto {
  name?: string;
}

export interface ArticleQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  typeId?: number;
  published?: boolean;
  featured?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export type PaginatedArticles = PaginatedResponse<Article>;
