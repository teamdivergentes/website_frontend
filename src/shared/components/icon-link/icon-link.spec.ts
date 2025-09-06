import {ComponentFixture, TestBed} from '@angular/core/testing';

import {IconConfig, IconLink} from './icon-link';
import {sharedTestProvider} from '../../tests/shared-test-provider';
import {ProjectIconType} from '../icon-svg/icon-svg';

describe('IconLink', () => {
  let component: IconLink;
  let fixture: ComponentFixture<IconLink>;

  const iconConfig: IconConfig = {iconType: ProjectIconType.INSTAGRAM};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconLink],
      providers: [sharedTestProvider]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IconLink);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('iconConfig', iconConfig);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
