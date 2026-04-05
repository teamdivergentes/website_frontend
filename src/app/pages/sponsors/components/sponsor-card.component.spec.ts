import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SponsorCardComponent } from './sponsor-card.component';
import { Sponsor, LinkType, ImageLayout } from '../../../shared/models';

describe('SponsorCardComponent', () => {
  let component: SponsorCardComponent;
  let fixture: ComponentFixture<SponsorCardComponent>;

  const mockSponsor: Sponsor = {
    id: 1,
    name: 'Test Sponsor',
    slug: 'test-sponsor',
    description: 'Test description for the sponsor',
    position: 0,
    active: true,
    imageLayout: ImageLayout.LAYOUT_1,
    images: [
      {
        id: 1,
        url: 'https://example.com/logo.png',
        alt: 'Logo',
        isPrimary: true,
        position: 0
      },
      {
        id: 2,
        url: 'https://example.com/secondary1.png',
        alt: 'Secondary 1',
        isPrimary: false,
        position: 1
      },
      {
        id: 3,
        url: 'https://example.com/secondary2.png',
        alt: 'Secondary 2',
        isPrimary: false,
        position: 2
      }
    ],
    links: [
      {
        id: 1,
        url: 'https://example.com',
        label: 'Website',
        type: LinkType.WEBSITE,
        isPrimary: true
      }
    ],
    startDate: '2024-01-01T00:00:00Z',
    endDate: null,
    createdAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SponsorCardComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(SponsorCardComponent);
    component = fixture.componentInstance;
    component.sponsor = mockSponsor;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display sponsor name', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const name = compiled.querySelector('.sponsor-name');
    expect(name?.textContent).toContain('Test Sponsor');
  });

  it('should display sponsor description', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const description = compiled.querySelector('.sponsor-description');
    expect(description?.textContent).toContain('Test description');
  });

  it('should return primary image', () => {
    const primaryImg = component.primaryImage();
    expect(primaryImg?.url).toBe('https://example.com/logo.png');
    expect(primaryImg?.isPrimary).toBe(true);
  });

  it('should return secondary image 1', () => {
    const secondaryImg = component.secondaryImage1();
    expect(secondaryImg?.url).toBe('https://example.com/secondary1.png');
  });

  it('should return secondary image 2', () => {
    const secondaryImg = component.secondaryImage2();
    expect(secondaryImg?.url).toBe('https://example.com/secondary2.png');
  });

  it('should return primary link', () => {
    const link = component.primaryLink();
    expect(link?.url).toBe('https://example.com');
  });

  it('should apply layout class based on imageLayout', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector('.sponsor-section');
    expect(section?.classList.contains('layout-LAYOUT_1')).toBeTruthy();
  });

  it('should apply different layout class for LAYOUT_2', () => {
    component.sponsor = { ...mockSponsor, imageLayout: ImageLayout.LAYOUT_2 };
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector('.sponsor-section');
    expect(section?.classList.contains('layout-LAYOUT_2')).toBeTruthy();
  });

  it('should apply different layout class for LAYOUT_3', () => {
    component.sponsor = { ...mockSponsor, imageLayout: ImageLayout.LAYOUT_3 };
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector('.sponsor-section');
    expect(section?.classList.contains('layout-LAYOUT_3')).toBeTruthy();
  });

  it('should have lazy loading on images', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const imgs = compiled.querySelectorAll('img');
    imgs.forEach(img => {
      expect(img.getAttribute('loading')).toBe('lazy');
    });
  });

  it('should have noopener and sponsored rel attributes on link', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('.sponsor-link') as HTMLAnchorElement;
    expect(link?.rel).toContain('noopener');
    expect(link?.rel).toContain('sponsored');
  });

  it('should display no-logo fallback when no images', () => {
    component.sponsor = { ...mockSponsor, images: [] };
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const noLogo = compiled.querySelector('.no-logo');
    expect(noLogo?.textContent).toContain('Test Sponsor');
  });

  it('should not display link when no links available', () => {
    component.sponsor = { ...mockSponsor, links: [] };
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('.sponsor-link');
    expect(link).toBeNull();
  });

  it('should handle sponsor without description', () => {
    component.sponsor = { ...mockSponsor, description: null };
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const description = compiled.querySelector('.sponsor-description');
    expect(description).toBeNull();
  });
});
