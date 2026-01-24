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
 * DTO pour créer/mettre à jour une config
 */
export interface ConfigUpdateDto {
  key: string;
  value: string;
  description?: string;
}
