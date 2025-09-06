import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NotFound } from './not-found';

describe('NotFound', () => {
  let component: NotFound;
  let fixture: ComponentFixture<NotFound>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [NotFound],
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotFound);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display error message', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Page introuvable');
  });

  it('should display Team Divergent logo', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const logo = compiled.querySelector('.logo') as HTMLImageElement;
    expect(logo).toBeTruthy();
    expect(logo.src).toContain('logoTD.svg');
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

  it('should display useful links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('.useful-link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('should display action buttons', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('.btn');
    expect(buttons.length).toBe(2);
  });
});
