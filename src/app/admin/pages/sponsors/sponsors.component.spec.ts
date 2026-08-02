import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { SponsorsComponent } from './sponsors.component';
import { SponsorsService } from '../../../shared/services/sponsors.service';
import { AdminDialogService } from '../../shared/admin-dialog.service';
import { ImageLayout, type Sponsor } from '../../../shared/models';

describe('SponsorsComponent', () => {
  let component: SponsorsComponent;
  let fixture: ComponentFixture<SponsorsComponent>;
  let adminDialog: jasmine.SpyObj<AdminDialogService>;
  let router: jasmine.SpyObj<Router>;

  const sponsor: Sponsor = {
    id: 4,
    name: 'Sponsor Test',
    slug: 'sponsor-test',
    description: null,
    position: 0,
    active: true,
    imageLayout: ImageLayout.LAYOUT_1,
    images: [],
    links: [],
    startDate: null,
    endDate: null,
    createdAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    const sponsorsServiceSpy = jasmine.createSpyObj(
      'SponsorsService',
      ['loadAllSponsors', 'deleteSponsor', 'toggleSponsorActive', 'reorder'],
      { sponsors: () => [sponsor] },
    );
    const adminDialogSpy = jasmine.createSpyObj('AdminDialogService', ['open']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    sponsorsServiceSpy.loadAllSponsors.and.returnValue(of([sponsor]));
    adminDialogSpy.open.and.returnValue({ afterClosed: () => of(false) });
    routerSpy.navigate.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [SponsorsComponent, NoopAnimationsModule],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SponsorsService, useValue: sponsorsServiceSpy },
        { provide: AdminDialogService, useValue: adminDialogSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap({})), snapshot: { queryParamMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();

    adminDialog = TestBed.inject(AdminDialogService) as jasmine.SpyObj<AdminDialogService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(SponsorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('navigue vers la page des images au lieu d’ouvrir un dialogue', () => {
    // Le dialogue au palier `lg` a disparu (EPIC-41, feature 3) : la gestion des
    // images est une page adressable.
    component.openImagesPage(sponsor);

    expect(router.navigate).toHaveBeenCalledWith(['/admin/sponsors', 4, 'images']);
    expect(adminDialog.open).not.toHaveBeenCalled();
  });

  it('garde le formulaire de sponsor en dialogue, conforme à la règle', () => {
    // Six champs, aucune liste enfant : ce dialogue-la reste un dialogue.
    component.openEditDialog(sponsor);

    expect(adminDialog.open).toHaveBeenCalled();
    expect(adminDialog.open.calls.mostRecent().args[1]).toBe('md');
  });
});
