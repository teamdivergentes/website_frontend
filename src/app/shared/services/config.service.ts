import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConfigResponse, ConfigUpdateDto } from '../models';

/**
 * Service de gestion de la configuration de l'application
 * Utilise les signals Angular pour la réactivité
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/config`;

  // Signal contenant toutes les configurations
  private readonly configsSignal = signal<ConfigResponse[]>([]);

  // Computed signals pour accès facile aux configs spécifiques
  readonly youtubeLink = computed(() => {
    const config = this.configsSignal().find(c => c.key === 'youtube_link');
    return config?.value || '';
  });

  readonly siteName = computed(() => {
    const config = this.configsSignal().find(c => c.key === 'site_name');
    return config?.value || 'DVG Esport';
  });

  readonly configs = computed(() => this.configsSignal());

  /**
   * Charge toutes les configurations depuis l'API
   */
  loadConfigs(): Observable<ConfigResponse[]> {
    return this.http.get<ConfigResponse[]>(this.apiUrl).pipe(
      tap(configs => this.configsSignal.set(configs))
    );
  }

  /**
   * Récupère une configuration spécifique par sa clé
   * @param key - Clé de la configuration
   */
  getConfig(key: string): Observable<ConfigResponse> {
    return this.http.get<ConfigResponse>(`${this.apiUrl}/${key}`);
  }

  /**
   * Met à jour une configuration
   * @param key - Clé de la configuration
   * @param data - Données de mise à jour
   */
  updateConfig(key: string, data: ConfigUpdateDto): Observable<ConfigResponse> {
    return this.http.put<ConfigResponse>(`${this.apiUrl}/${key}`, data).pipe(
      tap(updatedConfig => {
        // Met à jour le signal local
        const configs = this.configsSignal();
        const index = configs.findIndex(c => c.key === key);
        if (index !== -1) {
          const newConfigs = [...configs];
          newConfigs[index] = updatedConfig;
          this.configsSignal.set(newConfigs);
        } else {
          this.configsSignal.set([...configs, updatedConfig]);
        }
      })
    );
  }

  /**
   * Crée une nouvelle configuration
   * @param data - Données de la configuration
   */
  createConfig(data: ConfigUpdateDto): Observable<ConfigResponse> {
    return this.http.post<ConfigResponse>(this.apiUrl, data).pipe(
      tap(newConfig => {
        this.configsSignal.set([...this.configsSignal(), newConfig]);
      })
    );
  }
}
