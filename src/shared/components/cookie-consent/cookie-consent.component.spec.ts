import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { CookieConsentComponent } from './cookie-consent.component';
import { AnalyticsService } from '../../services/analytics.service';
import { CookieConsentService } from '../../services/cookie-consent.service';
import { RuntimeConfigService } from '../../services/runtime-config.service';

describe('CookieConsentComponent', () => {
  let fixture: ComponentFixture<CookieConsentComponent>;
  let component: CookieConsentComponent;
  let analyticsSpy: jasmine.SpyObj<AnalyticsService>;
  let cookieConsentSpy: jasmine.SpyObj<CookieConsentService> & { showBanner: WritableSignal<boolean> };
  let runtimeConfigSpy: jasmine.SpyObj<RuntimeConfigService>;
  let showBannerSignal: WritableSignal<boolean>;
  let gaIdValue: string;

  /**
   * Crée les spies, configure le TestBed et instancie le composant.
   * Doit être appelée dans chaque test (après avoir éventuellement modifié gaIdValue).
   */
  async function setup(): Promise<void> {
    showBannerSignal = signal(false);

    cookieConsentSpy = Object.assign(
      jasmine.createSpyObj<CookieConsentService>('CookieConsentService', [
        'hasResponded',
        'accept',
        'decline',
        'reopen',
      ]),
      { showBanner: showBannerSignal }
    );

    analyticsSpy = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', [
      'setConsent',
      'init',
      'pageView',
      'event',
    ]);

    runtimeConfigSpy = Object.assign(
      jasmine.createSpyObj<RuntimeConfigService>('RuntimeConfigService', ['load']),
      { googleAnalyticsId: gaIdValue }
    );

    await TestBed.configureTestingModule({
      imports: [CookieConsentComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AnalyticsService, useValue: analyticsSpy },
        { provide: CookieConsentService, useValue: cookieConsentSpy },
        { provide: RuntimeConfigService, useValue: runtimeConfigSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CookieConsentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(() => {
    gaIdValue = '';
    TestBed.resetTestingModule();
  });

  // ------------------------------------------------------------------ //
  // Cas 1 : le composant se crée sans erreur
  // ------------------------------------------------------------------ //
  it('should create', async () => {
    cookieConsentSpy = Object.assign(
      jasmine.createSpyObj<CookieConsentService>('CookieConsentService', [
        'hasResponded', 'accept', 'decline', 'reopen',
      ]),
      { showBanner: signal(false) }
    );
    analyticsSpy = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', [
      'setConsent', 'init', 'pageView', 'event',
    ]);
    runtimeConfigSpy = Object.assign(
      jasmine.createSpyObj<RuntimeConfigService>('RuntimeConfigService', ['load']),
      { googleAnalyticsId: '' }
    );

    await TestBed.configureTestingModule({
      imports: [CookieConsentComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AnalyticsService, useValue: analyticsSpy },
        { provide: CookieConsentService, useValue: cookieConsentSpy },
        { provide: RuntimeConfigService, useValue: runtimeConfigSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CookieConsentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component).toBeTruthy();
  });

  // ------------------------------------------------------------------ //
  // Cas 2 : bannière NON affichée si googleAnalyticsId est vide
  // ------------------------------------------------------------------ //
  it('should NOT show banner when googleAnalyticsId is empty', async () => {
    gaIdValue = '';
    cookieConsentSpy = Object.assign(
      jasmine.createSpyObj<CookieConsentService>('CookieConsentService', [
        'hasResponded', 'accept', 'decline', 'reopen',
      ]),
      { showBanner: signal(false) }
    );
    cookieConsentSpy.hasResponded.and.returnValue(false);
    analyticsSpy = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', [
      'setConsent', 'init', 'pageView', 'event',
    ]);
    runtimeConfigSpy = Object.assign(
      jasmine.createSpyObj<RuntimeConfigService>('RuntimeConfigService', ['load']),
      { googleAnalyticsId: gaIdValue }
    );

    await TestBed.configureTestingModule({
      imports: [CookieConsentComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AnalyticsService, useValue: analyticsSpy },
        { provide: CookieConsentService, useValue: cookieConsentSpy },
        { provide: RuntimeConfigService, useValue: runtimeConfigSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CookieConsentComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    // showBanner doit rester false car gaId est vide
    expect(cookieConsentSpy.showBanner()).toBeFalse();
    const banner = fixture.nativeElement.querySelector('.cookie-banner');
    expect(banner).toBeNull();
  });

  // ------------------------------------------------------------------ //
  // Cas 3 : bannière NON affichée si hasResponded() retourne true
  // ------------------------------------------------------------------ //
  it('should NOT show banner when user has already responded', async () => {
    const showBanner = signal(false);
    cookieConsentSpy = Object.assign(
      jasmine.createSpyObj<CookieConsentService>('CookieConsentService', [
        'hasResponded', 'accept', 'decline', 'reopen',
      ]),
      { showBanner }
    );
    cookieConsentSpy.hasResponded.and.returnValue(true);
    analyticsSpy = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', [
      'setConsent', 'init', 'pageView', 'event',
    ]);
    runtimeConfigSpy = Object.assign(
      jasmine.createSpyObj<RuntimeConfigService>('RuntimeConfigService', ['load']),
      { googleAnalyticsId: 'G-TESTID1234' }
    );

    await TestBed.configureTestingModule({
      imports: [CookieConsentComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AnalyticsService, useValue: analyticsSpy },
        { provide: CookieConsentService, useValue: cookieConsentSpy },
        { provide: RuntimeConfigService, useValue: runtimeConfigSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CookieConsentComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    // hasResponded() est true : showBanner ne doit pas être passé à true
    expect(showBanner()).toBeFalse();
    const banner = fixture.nativeElement.querySelector('.cookie-banner');
    expect(banner).toBeNull();
  });

  // ------------------------------------------------------------------ //
  // Cas 4 : bannière AFFICHÉE si googleAnalyticsId présent + pas de réponse
  // ------------------------------------------------------------------ //
  it('should show banner when googleAnalyticsId is set and user has not responded', async () => {
    const showBanner = signal(false);
    cookieConsentSpy = Object.assign(
      jasmine.createSpyObj<CookieConsentService>('CookieConsentService', [
        'hasResponded', 'accept', 'decline', 'reopen',
      ]),
      { showBanner }
    );
    cookieConsentSpy.hasResponded.and.returnValue(false);
    analyticsSpy = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', [
      'setConsent', 'init', 'pageView', 'event',
    ]);
    runtimeConfigSpy = Object.assign(
      jasmine.createSpyObj<RuntimeConfigService>('RuntimeConfigService', ['load']),
      { googleAnalyticsId: 'G-TESTID1234' }
    );

    await TestBed.configureTestingModule({
      imports: [CookieConsentComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AnalyticsService, useValue: analyticsSpy },
        { provide: CookieConsentService, useValue: cookieConsentSpy },
        { provide: RuntimeConfigService, useValue: runtimeConfigSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CookieConsentComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    // afterNextRender aura exécuté : showBanner doit être true
    expect(showBanner()).toBeTrue();
    fixture.detectChanges();
    const banner = fixture.nativeElement.querySelector('.cookie-banner');
    expect(banner).not.toBeNull();
  });

  // ------------------------------------------------------------------ //
  // Cas 5 : bouton "Accepter" appelle analytics.setConsent(true)
  // ------------------------------------------------------------------ //
  it('should call analytics.setConsent(true) and hide banner when accept button is clicked', async () => {
    const showBanner = signal(true); // bannière déjà visible
    cookieConsentSpy = Object.assign(
      jasmine.createSpyObj<CookieConsentService>('CookieConsentService', [
        'hasResponded', 'accept', 'decline', 'reopen',
      ]),
      { showBanner }
    );
    cookieConsentSpy.hasResponded.and.returnValue(false);
    // Simuler le comportement de setConsent(true) -> cookieConsent.accept() -> showBanner false
    analyticsSpy = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', [
      'setConsent', 'init', 'pageView', 'event',
    ]);
    analyticsSpy.setConsent.and.callFake((accepted: boolean) => {
      if (accepted) showBanner.set(false);
    });
    runtimeConfigSpy = Object.assign(
      jasmine.createSpyObj<RuntimeConfigService>('RuntimeConfigService', ['load']),
      { googleAnalyticsId: 'G-TESTID1234' }
    );

    await TestBed.configureTestingModule({
      imports: [CookieConsentComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AnalyticsService, useValue: analyticsSpy },
        { provide: CookieConsentService, useValue: cookieConsentSpy },
        { provide: RuntimeConfigService, useValue: runtimeConfigSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CookieConsentComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const acceptBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-accept');
    expect(acceptBtn).not.toBeNull();

    acceptBtn.click();
    fixture.detectChanges();

    expect(analyticsSpy.setConsent).toHaveBeenCalledOnceWith(true);
    expect(showBanner()).toBeFalse();
  });

  // ------------------------------------------------------------------ //
  // Cas 6 : bouton "Refuser" appelle analytics.setConsent(false)
  // ------------------------------------------------------------------ //
  it('should call analytics.setConsent(false) and hide banner when decline button is clicked', async () => {
    const showBanner = signal(true); // bannière déjà visible
    cookieConsentSpy = Object.assign(
      jasmine.createSpyObj<CookieConsentService>('CookieConsentService', [
        'hasResponded', 'accept', 'decline', 'reopen',
      ]),
      { showBanner }
    );
    cookieConsentSpy.hasResponded.and.returnValue(false);
    analyticsSpy = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', [
      'setConsent', 'init', 'pageView', 'event',
    ]);
    analyticsSpy.setConsent.and.callFake((accepted: boolean) => {
      if (!accepted) showBanner.set(false);
    });
    runtimeConfigSpy = Object.assign(
      jasmine.createSpyObj<RuntimeConfigService>('RuntimeConfigService', ['load']),
      { googleAnalyticsId: 'G-TESTID1234' }
    );

    await TestBed.configureTestingModule({
      imports: [CookieConsentComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AnalyticsService, useValue: analyticsSpy },
        { provide: CookieConsentService, useValue: cookieConsentSpy },
        { provide: RuntimeConfigService, useValue: runtimeConfigSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CookieConsentComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const declineBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-decline');
    expect(declineBtn).not.toBeNull();

    declineBtn.click();
    fixture.detectChanges();

    expect(analyticsSpy.setConsent).toHaveBeenCalledOnceWith(false);
    expect(showBanner()).toBeFalse();
  });
});
