import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconSvg } from './icon-svg';

describe('IconSvg', () => {
  let component: IconSvg;
  let fixture: ComponentFixture<IconSvg>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconSvg]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IconSvg);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
