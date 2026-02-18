export interface RecruitmentPost {
  id: number;
  title: string;
  type: string;
  description: string;
  image?: string;
  active: boolean;
  position: number;
  slug?: string;
  location?: string;
  duration?: string;
  missions?: string;
  skills?: string;
  requirements?: string;
  benefits?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRecruitmentDto {
  title: string;
  type: string;
  description: string;
  image?: string;
  active?: boolean;
  slug?: string;
  location?: string;
  duration?: string;
  missions?: string;
  skills?: string;
  requirements?: string;
  benefits?: string;
}

export interface UpdateRecruitmentDto {
  title?: string;
  type?: string;
  description?: string;
  image?: string;
  active?: boolean;
  slug?: string;
  location?: string;
  duration?: string;
  missions?: string;
  skills?: string;
  requirements?: string;
  benefits?: string;
}
