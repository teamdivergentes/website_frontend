import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogoWithHover } from './logo-with-hover';
import {sharedTestProvider} from '../../tests/shared-test-provider';

describe('LogoWithHover', () => {
  let component: LogoWithHover;
  let fixture: ComponentFixture<LogoWithHover>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoWithHover],
      providers: [sharedTestProvider]
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
