import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, NEVER } from 'rxjs';
import { StructureComponent } from './structure';
import { StaffService } from '../../shared/services/staff.service';
import { ConfigService } from '../../shared/services/config.service';
import { SeoService } from '../../shared/services/seo.service';
import { StaffMember, StaffCategory } from '../../shared/models/staff.model';
import { provideRouter } from '@angular/router';

describe('StructureComponent', () => {
  let component: StructureComponent;
  let fixture: ComponentFixture<StructureComponent>;
  let staffService: jasmine.SpyObj<StaffService>;
  let configService: jasmine.SpyObj<ConfigService>;
  let seoService: jasmine.SpyObj<SeoService>;

  const mockAdmins: StaffMember[] = [
    { id: 1, name: 'Admin User', role: 'Président', category: StaffCategory.ADMIN, position: 0 }
  ];

  const mockHeadstaff: StaffMember[] = [
    { id: 2, name: 'Head Staff', role: 'Manager', category: StaffCategory.HEADSTAFF, position: 0 }
  ];

  beforeEach(async () => {
    const staffServiceSpy = jasmine.createSpyObj('StaffService', ['loadStaff'], {
      admins: jasmine.createSpy().and.returnValue(mockAdmins),
      headstaff: jasmine.createSpy().and.returnValue(mockHeadstaff)
    });
    const configServiceSpy = jasmine.createSpyObj('ConfigService', ['loadConfigs'], {
      youtubeLink: jasmine.createSpy().and.returnValue('https://youtube.com'),
      socialLinksMap: jasmine.createSpy().and.returnValue({ discord: 'https://discord.gg/dvg' })
    });
    const seoServiceSpy = jasmine.createSpyObj('SeoService', [
      'updateMetaTags',
      'setJsonLd',
      'getBreadcrumbListJsonLd',
    ]);
    seoServiceSpy.getBreadcrumbListJsonLd.and.returnValue({ '@type': 'BreadcrumbList' });

    await TestBed.configureTestingModule({
      imports: [StructureComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: StaffService, useValue: staffServiceSpy },
        { provide: ConfigService, useValue: configServiceSpy },
        { provide: SeoService, useValue: seoServiceSpy },
        provideRouter([])
      ]
    }).compileComponents();

    staffService = TestBed.inject(StaffService) as jasmine.SpyObj<StaffService>;
    configService = TestBed.inject(ConfigService) as jasmine.SpyObj<ConfigService>;
    seoService = TestBed.inject(SeoService) as jasmine.SpyObj<SeoService>;

    // Default: NEVER to avoid HTTP calls
    staffService.loadStaff.and.returnValue(NEVER);
    configService.loadConfigs.and.returnValue(NEVER);

    fixture = TestBed.createComponent(StructureComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call updateMetaTags on init', () => {
    fixture.detectChanges();
    expect(seoService.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({ title: 'Structure' })
    );
  });

  it('should call setJsonLd with BreadcrumbList [Accueil, Structure] on init', () => {
    fixture.detectChanges();
    expect(seoService.getBreadcrumbListJsonLd).toHaveBeenCalledWith([
      { name: 'Accueil', url: '/' },
      { name: 'Structure', url: '/structure' },
    ]);
    expect(seoService.setJsonLd).toHaveBeenCalledWith({ '@type': 'BreadcrumbList' });
  });

  it('should call loadStaff on init', () => {
    fixture.detectChanges();
    expect(staffService.loadStaff).toHaveBeenCalled();
  });

  it('should call loadConfigs on init', () => {
    fixture.detectChanges();
    expect(configService.loadConfigs).toHaveBeenCalled();
  });

  it('should return placeholder image when no image provided', () => {
    const result = component.getImageUrl(undefined);
    expect(result).toContain('no_photo.png');
  });

  it('should return provided image url', () => {
    const result = component.getImageUrl('/uploads/avatar.png');
    expect(result).toBe('/uploads/avatar.png');
  });

  it('should load staff and configs on init successfully', () => {
    staffService.loadStaff.and.returnValue(of([]));
    configService.loadConfigs.and.returnValue(of([]));

    fixture.detectChanges();

    expect(staffService.loadStaff).toHaveBeenCalled();
    expect(configService.loadConfigs).toHaveBeenCalled();
  });
});
