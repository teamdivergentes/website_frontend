import { ComponentFixture, TestBed } from '@angular/core/testing';

import {IconSvg} from './icon-svg';
import {sharedTestProvider} from '../../tests/shared-test-provider';
import {IconConfig, ProjectIconType} from '../../models/icon-types';

describe('IconSvg', () => {
  let component: IconSvg;
  let fixture: ComponentFixture<IconSvg>;

  const iconConfig: IconConfig = {iconType: ProjectIconType.INSTAGRAM};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconSvg],
      providers: [sharedTestProvider]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IconSvg);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('iconConfig', iconConfig);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
