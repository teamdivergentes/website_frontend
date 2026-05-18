import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SponsorsListComponent } from './sponsors-list.component';
import { type Sponsor } from '../../../shared/models';

const makeSponsor = (id: number, name: string, position: number): Sponsor => ({
  id,
  name,
  slug: name.toLowerCase(),
  description: null,
  position,
  active: true,
  imageLayout: 'default' as any,
  images: [],
  links: [],
  startDate: null,
  endDate: null,
  createdAt: '2024-01-01T00:00:00Z',
});

const mockSponsors: Sponsor[] = [
  makeSponsor(1, 'Logitech', 0),
  makeSponsor(2, 'RedBull', 1),
  makeSponsor(3, 'Razer', 2),
];

async function setup(sponsors: Sponsor[] = mockSponsors): Promise<{
  fixture: ComponentFixture<SponsorsListComponent>;
  component: SponsorsListComponent;
}> {
  await TestBed.configureTestingModule({
    imports: [SponsorsListComponent, NoopAnimationsModule],
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(SponsorsListComponent);
  fixture.componentRef.setInput('sponsors', sponsors);
  fixture.detectChanges();
  await fixture.whenStable();

  return { fixture, component: fixture.componentInstance };
}

describe('SponsorsListComponent — a11y reorder', () => {
  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should emit reorder when moveUp is triggered on row i=1', async () => {
    const { component } = await setup();
    spyOn(component.reorder, 'emit');
    component.onReorder(1, 0);
    expect(component.reorder.emit).toHaveBeenCalled();
  });

  it('should emit reorder when moveDown is triggered on row i=1', async () => {
    const { component } = await setup();
    spyOn(component.reorder, 'emit');
    component.onReorder(1, 2);
    expect(component.reorder.emit).toHaveBeenCalled();
  });

  it('should disable moveUp button on first row', async () => {
    const { fixture } = await setup();
    const moveUpBtns = fixture.nativeElement.querySelectorAll('[aria-label$="vers le haut"]');
    expect(moveUpBtns.length).toBeGreaterThan(0);
    expect(moveUpBtns[0].disabled).toBeTrue();
  });

  it('should disable moveDown button on last row', async () => {
    const { fixture } = await setup();
    const moveDownBtns = fixture.nativeElement.querySelectorAll('[aria-label$="vers le bas"]');
    expect(moveDownBtns.length).toBeGreaterThan(0);
    expect(moveDownBtns[moveDownBtns.length - 1].disabled).toBeTrue();
  });

  it('should set liveMessage after reorder (optimistic)', async () => {
    const { component } = await setup();
    component.onReorder(1, 2);
    expect(component.liveMessage()).not.toBe('');
  });

  it('should set error liveMessage when setErrorMessage is called', async () => {
    const { component } = await setup();
    component.setErrorMessage('RedBull');
    expect(component.liveMessage()).toContain('Echec');
  });

  it('should not emit reorder when drop on same position', async () => {
    const { component } = await setup();
    spyOn(component.reorder, 'emit');
    component.onDrop({ previousIndex: 1, currentIndex: 1 } as any);
    expect(component.reorder.emit).not.toHaveBeenCalled();
  });

  it('should render aria-live region', async () => {
    const { fixture } = await setup();
    const liveRegion = fixture.nativeElement.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
  });

  it('should not emit reorder when already reordering (SEC-PR206-001)', async () => {
    const { component } = await setup();
    spyOn(component.reorder, 'emit');
    component['reordering'].set(true);
    component.onReorder(0, 1);
    expect(component.reorder.emit).not.toHaveBeenCalled();
  });
});
