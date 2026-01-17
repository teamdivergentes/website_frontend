import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FontTestComponent } from './font-test';

describe('FontTestComponent', () => {
  let component: FontTestComponent;
  let fixture: ComponentFixture<FontTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FontTestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FontTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render font test sections', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    // Verify all 4 font sections are present
    expect(compiled.querySelector('.font-heading')).toBeTruthy();
    expect(compiled.querySelector('.font-body')).toBeTruthy();
    expect(compiled.querySelector('.font-secondary')).toBeTruthy();
    expect(compiled.querySelector('.font-decorative')).toBeTruthy();
  });

  it('should display Bebas Neue heading section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const headingSection = compiled.textContent;

    expect(headingSection).toContain('Bebas Neue');
    expect(headingSection).toContain('font-heading');
  });

  it('should display Asar body section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const content = compiled.textContent;

    expect(content).toContain('Asar');
    expect(content).toContain('font-body');
  });

  it('should display Athiti secondary section with all weights', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const content = compiled.textContent;

    expect(content).toContain('Athiti');
    expect(content).toContain('font-secondary');
    expect(content).toContain('300');
    expect(content).toContain('400');
    expect(content).toContain('600');
  });

  it('should display Bokor decorative section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const content = compiled.textContent;

    expect(content).toContain('Bokor');
    expect(content).toContain('font-decorative');
  });

  it('should include WCAG contrast test section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const content = compiled.textContent;

    expect(content).toContain('WCAG');
    expect(content).toContain('21:1');
  });

  it('should include DevTools validation instructions', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const content = compiled.textContent;

    expect(content).toContain('font-display: swap');
    expect(content).toContain('LCP');
    expect(content).toContain('DevTools');
  });
});
