/**
 * Modèle de configuration de l'application
 */
export interface ConfigResponse {
  id: number;
  key: string;
  value: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * DTO pour mettre à jour une config
 */
export interface ConfigUpdateDto {
  value: string;
  description?: string;
}

/**
 * DTO pour créer une config
 */
export interface ConfigCreateDto {
  key: string;
  value: string;
  description?: string;
}
