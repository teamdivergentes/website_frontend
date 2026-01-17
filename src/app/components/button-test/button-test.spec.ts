import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonTestComponent } from './button-test';
import { RouterTestingModule } from '@angular/router/testing';

describe('ButtonTestComponent', () => {
  let component: ButtonTestComponent;
  let fixture: ComponentFixture<ButtonTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonTestComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all 3 button variants', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.btn-cta')).toBeTruthy();
    expect(compiled.querySelector('.btn-badge')).toBeTruthy();
    expect(compiled.querySelector('.btn-ghost')).toBeTruthy();
  });

  it('should have CTA button section with correct title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const content = compiled.textContent;

    expect(content).toContain('btn-cta');
    expect(content).toContain('Call-to-Action');
  });

  it('should have Badge button section with correct title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const content = compiled.textContent;

    expect(content).toContain('btn-badge');
    expect(content).toContain('Secondary');
  });

  it('should have Ghost button section with correct title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const content = compiled.textContent;

    expect(content).toContain('btn-ghost');
    expect(content).toContain('Tertiary');
  });

  it('should have disabled buttons for each variant', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const disabledButtons = compiled.querySelectorAll('button[disabled]');

    expect(disabledButtons.length).toBeGreaterThanOrEqual(3);
  });

  it('should include accessibility test section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const content = compiled.textContent;

    expect(content).toContain('Accessibilité');
    expect(content).toContain('NFR-A11Y-3');
    expect(content).toContain('Tab');
  });

  it('should include transition test section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const content = compiled.textContent;

    expect(content).toContain('Transitions');
    expect(content).toContain('200ms');
  });

  it('should have navigation link back to test index', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navLink = compiled.querySelector('a[routerLink="/test"]');

    expect(navLink).toBeTruthy();
    expect(navLink?.textContent).toContain('Retour');
  });
});
