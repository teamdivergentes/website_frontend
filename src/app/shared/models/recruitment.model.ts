export interface RecruitmentPost {
  id: number;
  title: string;
  type: string;
  description: string;
  image?: string;
  active: boolean;
  position: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRecruitmentDto {
  title: string;
  type: string;
  description: string;
  image?: string;
  active?: boolean;
}

export interface UpdateRecruitmentDto {
  title?: string;
  type?: string;
  description?: string;
  image?: string;
  active?: boolean;
}
