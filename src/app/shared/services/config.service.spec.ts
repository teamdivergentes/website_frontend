import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ConfigService } from './config.service';
import type { ConfigResponse } from '../models';

const API_URL = 'http://localhost:3000/api/config';

function makeConfig(key: string, value: string, id = 1): ConfigResponse {
  return { id, key, value };
}

describe('ConfigService', () => {
  let service: ConfigService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        ConfigService,
      ],
    });
    service = TestBed.inject(ConfigService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // ------------------------------------------------------------------ //
  // loadConfigs()
  // ------------------------------------------------------------------ //

  it('loadConfigs() doit appeler GET /api/config et populer les signals', () => {
    const mockConfigs: ConfigResponse[] = [
      makeConfig('page_shop_visible', 'true', 1),
      makeConfig('site_name', 'DVG Esport', 2),
      makeConfig('youtube_link', 'https://youtube.com', 3),
    ];

    let result: ConfigResponse[] | undefined;
    service.loadConfigs().subscribe(c => (result = c));

    const req = http.expectOne(API_URL);
    expect(req.request.method).toBe('GET');
    req.flush(mockConfigs);

    expect(result).toEqual(mockConfigs);
    expect(service.configs()).toEqual(mockConfigs);
  });

  it('loadConfigs() retourne un tableau vide si l\'API renvoie []', () => {
    service.loadConfigs().subscribe();
    const req = http.expectOne(API_URL);
    req.flush([]);

    expect(service.configs()).toEqual([]);
  });

  // ------------------------------------------------------------------ //
  // pageShopVisible()
  // ------------------------------------------------------------------ //

  it('pageShopVisible() retourne true si value="true"', () => {
    service.loadConfigs().subscribe();
    const req = http.expectOne(API_URL);
    req.flush([makeConfig('page_shop_visible', 'true')]);

    expect(service.pageShopVisible()).toBeTrue();
  });

  it('pageShopVisible() retourne false si value="false"', () => {
    service.loadConfigs().subscribe();
    const req = http.expectOne(API_URL);
    req.flush([makeConfig('page_shop_visible', 'false')]);

    expect(service.pageShopVisible()).toBeFalse();
  });

  it('pageShopVisible() retourne false si la cle est absente', () => {
    service.loadConfigs().subscribe();
    const req = http.expectOne(API_URL);
    req.flush([]);

    expect(service.pageShopVisible()).toBeFalse();
  });

  // ------------------------------------------------------------------ //
  // pageTwitchVisible()
  // ------------------------------------------------------------------ //

  it('pageTwitchVisible() retourne true si la cle est absente (defaut permissif)', () => {
    service.loadConfigs().subscribe();
    const req = http.expectOne(API_URL);
    req.flush([]);

    expect(service.pageTwitchVisible()).toBeTrue();
  });

  it('pageTwitchVisible() retourne true si value="true"', () => {
    service.loadConfigs().subscribe();
    const req = http.expectOne(API_URL);
    req.flush([makeConfig('page_twitch_visible', 'true')]);

    expect(service.pageTwitchVisible()).toBeTrue();
  });

  it('pageTwitchVisible() retourne false si value="false"', () => {
    service.loadConfigs().subscribe();
    const req = http.expectOne(API_URL);
    req.flush([makeConfig('page_twitch_visible', 'false')]);

    expect(service.pageTwitchVisible()).toBeFalse();
  });

  // ------------------------------------------------------------------ //
  // pageArticlesVisible() — meme comportement permissif
  // ------------------------------------------------------------------ //

  it('pageArticlesVisible() retourne true par defaut si la cle est absente', () => {
    service.loadConfigs().subscribe();
    const req = http.expectOne(API_URL);
    req.flush([]);

    expect(service.pageArticlesVisible()).toBeTrue();
  });

  // ------------------------------------------------------------------ //
  // getSiteConfig via computed signal
  // ------------------------------------------------------------------ //

  it('siteName retourne la valeur de la cle site_name', () => {
    service.loadConfigs().subscribe();
    const req = http.expectOne(API_URL);
    req.flush([makeConfig('site_name', 'Team Divergentes')]);

    expect(service.siteName()).toBe('Team Divergentes');
  });

  it('siteName retourne "DVG Esport" par defaut si la cle est absente', () => {
    service.loadConfigs().subscribe();
    const req = http.expectOne(API_URL);
    req.flush([]);

    expect(service.siteName()).toBe('DVG Esport');
  });

  it('youtubeLink retourne la valeur de la cle youtube_link', () => {
    service.loadConfigs().subscribe();
    const req = http.expectOne(API_URL);
    req.flush([makeConfig('youtube_link', 'https://youtube.com/@dvg')]);

    expect(service.youtubeLink()).toBe('https://youtube.com/@dvg');
  });

  // ------------------------------------------------------------------ //
  // updateConfig()
  // ------------------------------------------------------------------ //

  it('updateConfig() doit envoyer PUT et mettre a jour le signal local', () => {
    // Charger d'abord
    service.loadConfigs().subscribe();
    const loadReq = http.expectOne(API_URL);
    loadReq.flush([makeConfig('page_shop_visible', 'false', 1)]);

    expect(service.pageShopVisible()).toBeFalse();

    const updated = makeConfig('page_shop_visible', 'true', 1);
    service.updateConfig('page_shop_visible', { value: 'true' }).subscribe();

    const putReq = http.expectOne(`${API_URL}/page_shop_visible`);
    expect(putReq.request.method).toBe('PUT');
    putReq.flush(updated);

    expect(service.pageShopVisible()).toBeTrue();
  });

  it('updateConfig() ajoute la cle si elle n\'existait pas dans le signal', () => {
    service.loadConfigs().subscribe();
    const loadReq = http.expectOne(API_URL);
    loadReq.flush([]);

    const newConfig = makeConfig('page_contact_visible', 'true', 99);
    service.updateConfig('page_contact_visible', { value: 'true' }).subscribe();

    const putReq = http.expectOne(`${API_URL}/page_contact_visible`);
    putReq.flush(newConfig);

    expect(service.configs()).toContain(newConfig);
  });

  // ------------------------------------------------------------------ //
  // createConfig()
  // ------------------------------------------------------------------ //

  it('createConfig() doit envoyer POST et ajouter la config au signal', () => {
    service.loadConfigs().subscribe();
    const loadReq = http.expectOne(API_URL);
    loadReq.flush([]);

    const newConfig = makeConfig('discord_url', 'https://discord.gg/dvg', 10);
    service.createConfig({ key: 'discord_url', value: 'https://discord.gg/dvg' }).subscribe();

    const postReq = http.expectOne(API_URL);
    expect(postReq.request.method).toBe('POST');
    postReq.flush(newConfig);

    expect(service.configs()).toContain(newConfig);
  });

  // ------------------------------------------------------------------ //
  // socialLinksMap computed
  // ------------------------------------------------------------------ //

  it('socialLinksMap retourne un objet avec les reseaux sociaux', () => {
    service.loadConfigs().subscribe();
    const req = http.expectOne(API_URL);
    req.flush([
      makeConfig('twitter_url', 'https://twitter.com/dvg', 1),
      makeConfig('discord_url', 'https://discord.gg/dvg', 2),
      makeConfig('instagram_url', 'https://instagram.com/dvg', 3),
    ]);

    const map = service.socialLinksMap();
    expect(map['twitter']).toBe('https://twitter.com/dvg');
    expect(map['discord']).toBe('https://discord.gg/dvg');
    expect(map['instagram']).toBe('https://instagram.com/dvg');
    expect(map['youtube']).toBe('');
  });

  // ------------------------------------------------------------------ //
  // Computed signals page visibility
  // ------------------------------------------------------------------ //

  it('pageContactVisible() retourne true si value="true"', () => {
    service.loadConfigs().subscribe();
    http.expectOne(API_URL).flush([makeConfig('page_contact_visible', 'true')]);
    expect(service.pageContactVisible()).toBeTrue();
  });

  it('pageEquipesVisible() retourne false si value="false"', () => {
    service.loadConfigs().subscribe();
    http.expectOne(API_URL).flush([makeConfig('page_equipes_visible', 'false')]);
    expect(service.pageEquipesVisible()).toBeFalse();
  });

  it('pageSponsorsVisible() retourne true si value="true"', () => {
    service.loadConfigs().subscribe();
    http.expectOne(API_URL).flush([makeConfig('page_sponsors_visible', 'true')]);
    expect(service.pageSponsorsVisible()).toBeTrue();
  });

  it('pageRecrutementVisible() retourne false si value="false"', () => {
    service.loadConfigs().subscribe();
    http.expectOne(API_URL).flush([makeConfig('page_recrutement_visible', 'false')]);
    expect(service.pageRecrutementVisible()).toBeFalse();
  });
});
