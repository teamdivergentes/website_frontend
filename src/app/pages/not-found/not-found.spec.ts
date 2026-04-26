import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NotFound } from './not-found';
import { sharedTestProvider } from '../../../shared/tests/shared-test-provider';

describe('NotFound', () => {
  let component: NotFound;
  let fixture: ComponentFixture<NotFound>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [NotFound],
      providers: [
        { provide: Router, useValue: routerSpy },
        sharedTestProvider,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFound);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display error heading', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(
      'PAGE INTROUVABLE'
    );
  });

  it('should display Team Divergent logo', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const logo = compiled.querySelector('.logo') as HTMLImageElement;
    expect(logo).toBeTruthy();
    expect(logo.src).toContain('logoTD.svg');
  });

  it('should have a canvas with role img and aria-label', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const canvas = compiled.querySelector('canvas');
    expect(canvas).toBeTruthy();
    expect(canvas?.getAttribute('role')).toBe('img');
    expect(canvas?.getAttribute('aria-label')).toContain('404');
  });

  it('should navigate to home when goHome is called', () => {
    component.goHome();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should call window.history.back when goBack is called', () => {
    spyOn(window.history, 'back');
    component.goBack();
    expect(window.history.back).toHaveBeenCalled();
  });

  it('should display action buttons', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const ctaBtn = compiled.querySelector('.btn-cta');
    const outlineBtn = compiled.querySelector('.btn-outline');
    expect(ctaBtn).toBeTruthy();
    expect(outlineBtn).toBeTruthy();
  });

  it('should display descriptive messages', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(
      compiled.querySelector('.message-primary')?.textContent
    ).toContain('matrice');
    expect(
      compiled.querySelector('.message-secondary')?.textContent
    ).toContain('existe plus');
  });
});
