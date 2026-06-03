import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConfigResponse, ConfigUpdateDto, ConfigCreateDto } from '../models';

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
  private readonly adminApiUrl = `${environment.apiUrl}/api/config/admin/all`;

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

  // Page visibility signals
  readonly pageShopVisible = computed(() => {
    const config = this.configsSignal().find(c => c.key === 'page_shop_visible');
    return config?.value === 'true';
  });

  readonly pageContactVisible = computed(() => {
    const config = this.configsSignal().find(c => c.key === 'page_contact_visible');
    return config?.value === 'true';
  });

  readonly pageEquipesVisible = computed(() => {
    const config = this.configsSignal().find(c => c.key === 'page_equipes_visible');
    return config?.value === 'true';
  });

  readonly pageSponsorsVisible = computed(() => {
    const config = this.configsSignal().find(c => c.key === 'page_sponsors_visible');
    return config?.value === 'true';
  });

  readonly pageRecrutementVisible = computed(() => {
    const config = this.configsSignal().find(c => c.key === 'page_recrutement_visible');
    return config?.value === 'true';
  });

  readonly pageArticlesVisible = computed(() => {
    const config = this.configsSignal().find(c => c.key === 'page_articles_visible');
    // Visible par défaut si la clé n'existe pas encore en base
    return config ? config.value === 'true' : true;
  });

  readonly pageTwitchVisible = computed(() => {
    const config = this.configsSignal().find(c => c.key === 'page_twitch_visible');
    // Visible par défaut si la clé n'existe pas encore en base
    return config ? config.value === 'true' : true;
  });

  /**
   * Indique si la page palmarès (/structure/palmares) est visible.
   * Masqué par défaut si la clé est absente, contrairement à articles/twitch
   * qui sont visibles par défaut (clé absente = permissif).
   */
  readonly pagePalmaresVisible = computed(() => {
    const config = this.configsSignal().find(c => c.key === 'page_palmares_visible');
    return config?.value === 'true';
  });

  readonly ogTitle = computed(() => {
    const config = this.configsSignal().find(c => c.key === 'og_title');
    return config?.value || '';
  });

  readonly ogDescription = computed(() => {
    const config = this.configsSignal().find(c => c.key === 'og_description');
    return config?.value || '';
  });

  readonly ogImage = computed(() => {
    const config = this.configsSignal().find(c => c.key === 'og_image');
    return config?.value || '';
  });

  readonly socialLinksMap = computed<Record<string, string>>(() => {
    const configs = this.configsSignal();
    const get = (key: string) => configs.find(c => c.key === key)?.value || '';
    return {
      twitter: get('twitter_url'),
      instagram: get('instagram_url'),
      discord: get('discord_url'),
      youtube: get('youtube_url'),
      twitch: get('twitch_url'),
      mail: get('mail_url'),
    };
  });

  readonly socialUrls = computed(() => {
    const individual = ['twitter_url', 'instagram_url', 'discord_url']
      .map(key => this.configsSignal().find(c => c.key === key)?.value || '')
      .filter(url => url.length > 0);

    const extra = this.configsSignal().find(c => c.key === 'social_urls');
    const extraUrls = extra?.value
      ? extra.value.split('\n').map(url => url.trim()).filter(url => url.length > 0)
      : [];

    return [...new Set([...individual, ...extraUrls])];
  });

  readonly configs = computed(() => this.configsSignal());

  /**
   * Charge les configurations publiques depuis l'API (endpoint non protégé).
   * Utilisé au démarrage de l'application et par les pages publiques.
   * Ne retourne pas les clés sensibles (SMTP, webhooks, etc.).
   */
  loadConfigs(): Observable<ConfigResponse[]> {
    return this.http.get<ConfigResponse[]>(this.apiUrl).pipe(
      tap(configs => this.configsSignal.set(configs))
    );
  }

  /**
   * Charge TOUTES les configurations depuis l'endpoint admin protégé (JWT + rôle admin).
   * Utilisé exclusivement par le panel admin de configuration.
   * Retourne également les clés sensibles (SMTP, webhooks, etc.).
   * Le token JWT est ajouté automatiquement par l'authInterceptor.
   */
  getAllConfigsAdmin(): Observable<ConfigResponse[]> {
    return this.http.get<ConfigResponse[]>(this.adminApiUrl).pipe(
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
  createConfig(data: ConfigCreateDto): Observable<ConfigResponse> {
    return this.http.post<ConfigResponse>(this.apiUrl, data).pipe(
      tap(newConfig => {
        this.configsSignal.set([...this.configsSignal(), newConfig]);
      })
    );
  }
}
