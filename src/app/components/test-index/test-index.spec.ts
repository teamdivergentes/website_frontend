import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestIndexComponent } from './test-index';
import { RouterTestingModule } from '@angular/router/testing';

describe('TestIndexComponent', () => {
  let component: TestIndexComponent;
  let fixture: ComponentFixture<TestIndexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestIndexComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(TestIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display page title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const content = compiled.textContent;

    expect(content).toContain('Pages de Test');
  });

  it('should have link to Font Test page', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const fontTestLink = compiled.querySelector('a[routerLink="/test/font"]');

    expect(fontTestLink).toBeTruthy();
    expect(fontTestLink?.textContent).toContain('Font Test');
    expect(fontTestLink?.textContent).toContain('Story 1.2');
  });

  it('should have link to Button Test page', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const buttonTestLink = compiled.querySelector('a[routerLink="/test/buttons"]');

    expect(buttonTestLink).toBeTruthy();
    expect(buttonTestLink?.textContent).toContain('Button Test');
    expect(buttonTestLink?.textContent).toContain('Story 1.3');
  });

  it('should have link to legacy fonts test', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const legacyLink = compiled.querySelector('a[routerLink="/test/fonts"]');

    expect(legacyLink).toBeTruthy();
    expect(legacyLink?.textContent).toContain('Legacy');
  });

  it('should display placeholder sections for future tests', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const content = compiled.textContent;

    expect(content).toContain('Design Tokens');
    expect(content).toContain('Components');
    expect(content).toContain('Coming soon');
  });
});
