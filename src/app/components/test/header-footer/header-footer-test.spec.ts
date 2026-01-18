import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderFooterTestComponent } from './header-footer-test';

describe('HeaderFooterTestComponent', () => {
  let component: HeaderFooterTestComponent;
  let fixture: ComponentFixture<HeaderFooterTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderFooterTestComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderFooterTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have scrollable content with min-height > 100vh', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('div');
    expect(container?.style.minHeight).toBe('150vh');
  });
});
