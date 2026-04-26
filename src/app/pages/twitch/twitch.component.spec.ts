import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Route } from '@angular/router';
import { TwitchComponent } from './twitch.component';
import { SeoService } from '../../shared/services/seo.service';
import { routes } from '../../app.routes';

describe('TwitchComponent', () => {
  let component: TwitchComponent;
  let fixture: ComponentFixture<TwitchComponent>;
  let seoServiceSpy: jasmine.SpyObj<SeoService>;

  beforeEach(async () => {
    seoServiceSpy = jasmine.createSpyObj('SeoService', ['updateMetaTags']);

    await TestBed.configureTestingModule({
      imports: [TwitchComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SeoService, useValue: seoServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TwitchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait se créer', () => {
    expect(component).toBeTruthy();
  });

  it('devrait appeler updateMetaTags avec le titre "En live" au init', () => {
    expect(seoServiceSpy.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({ title: 'En live' })
    );
  });

  it('la route /twitch ne doit pas avoir de guard canActivate', () => {
    // Trouver la route /twitch dans la config publique (MainLayout children)
    const mainLayoutRoute = routes.find(r => r.path === '');
    expect(mainLayoutRoute).toBeDefined();

    const twitchRoute = (mainLayoutRoute!.children ?? []).find(
      (r: Route) => r.path === 'twitch'
    );
    expect(twitchRoute).toBeDefined('La route /twitch doit exister dans app.routes.ts');
    expect(twitchRoute!.canActivate).toBeUndefined(
      'La route /twitch ne doit pas avoir de guard canActivate (accessible sans authentification)'
    );
  });

  it('la route /twitch doit avoir le bon titre', () => {
    const mainLayoutRoute = routes.find(r => r.path === '');
    const twitchRoute = (mainLayoutRoute!.children ?? []).find(
      (r: Route) => r.path === 'twitch'
    );
    expect(twitchRoute!.title).toBe('En live · Team Divergentes');
  });
});
