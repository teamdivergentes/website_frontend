import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogoWithHover } from './logo-with-hover';

describe('LogoWithHover', () => {
  let component: LogoWithHover;
  let fixture: ComponentFixture<LogoWithHover>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoWithHover]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogoWithHover);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
