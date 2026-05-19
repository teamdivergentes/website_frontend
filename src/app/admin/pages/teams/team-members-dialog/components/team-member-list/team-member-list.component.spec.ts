import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TeamMemberListComponent } from './team-member-list.component';
import type { TeamMember } from '../../../../../../shared/models';

const mockMembers: TeamMember[] = [
  {
    id: 1,
    name: 'Player1',
    role: 'TOP',
    position: 0,
    joinedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Player2',
    role: 'JUNGLE',
    position: 1,
    joinedAt: '2024-01-02T00:00:00Z'
  }
];

function setupComponent(members: TeamMember[] = mockMembers): ComponentFixture<TeamMemberListComponent> {
  TestBed.configureTestingModule({
    imports: [TeamMemberListComponent, NoopAnimationsModule],
    providers: [provideZonelessChangeDetection()]
  });

  const fixture = TestBed.createComponent(TeamMemberListComponent);
  fixture.componentRef.setInput('members', members);
  fixture.detectChanges();
  return fixture;
}

describe('TeamMemberListComponent', () => {
  it('should create', () => {
    const fixture = setupComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display member count in title', () => {
    const fixture = setupComponent();
    const h3: HTMLElement = fixture.nativeElement.querySelector('h3');
    expect(h3.textContent).toContain('2');
  });

  it('should display empty state when no members', () => {
    const fixture = setupComponent([]);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.empty-state')).not.toBeNull();
    expect(el.textContent).toContain('Aucun membre');
  });

  it('should not display empty state when members exist', () => {
    const fixture = setupComponent();
    expect(fixture.nativeElement.querySelector('.empty-state')).toBeNull();
  });

  it('should render a row for each member', () => {
    const fixture = setupComponent();
    const rows = fixture.nativeElement.querySelectorAll('app-team-member-row');
    expect(rows.length).toBe(2);
  });

  it('should emit editMember when row editClicked fires', () => {
    const fixture = setupComponent();
    let emitted: TeamMember | undefined;
    fixture.componentInstance.editMember.subscribe((m: TeamMember) => (emitted = m));

    fixture.componentInstance.onEdit(mockMembers[0]);
    expect(emitted).toEqual(mockMembers[0]);
  });

  it('should emit deleteMember when row deleteClicked fires', () => {
    const fixture = setupComponent();
    let emitted: TeamMember | undefined;
    fixture.componentInstance.deleteMember.subscribe((m: TeamMember) => (emitted = m));

    fixture.componentInstance.onDelete(mockMembers[1]);
    expect(emitted).toEqual(mockMembers[1]);
  });

  // ── a11y : boutons monter / descendre (WCAG 2.1.1) ──────────────────────

  describe('a11y — boutons Monter / Descendre (WCAG 2.1.1)', () => {
    it('should emit reorderRequest when moveUp is called on row i=1', () => {
      const fixture = setupComponent();
      let emitted: { fromIndex: number; toIndex: number } | undefined;
      fixture.componentInstance.reorderRequest.subscribe(e => (emitted = e));
      fixture.componentInstance.moveUp(1);
      expect(emitted).toEqual({ fromIndex: 1, toIndex: 0 });
    });

    it('should emit reorderRequest when moveDown is called on row i=0', () => {
      const fixture = setupComponent();
      let emitted: { fromIndex: number; toIndex: number } | undefined;
      fixture.componentInstance.reorderRequest.subscribe(e => (emitted = e));
      fixture.componentInstance.moveDown(0);
      expect(emitted).toEqual({ fromIndex: 0, toIndex: 1 });
    });

    it('should not emit reorderRequest when moveUp is called on first row (i=0)', () => {
      const fixture = setupComponent();
      let emitted = false;
      fixture.componentInstance.reorderRequest.subscribe(() => (emitted = true));
      fixture.componentInstance.moveUp(0);
      expect(emitted).toBeFalse();
    });

    it('should not emit reorderRequest when moveDown is called on last row', () => {
      const fixture = setupComponent();
      let emitted = false;
      fixture.componentInstance.reorderRequest.subscribe(() => (emitted = true));
      fixture.componentInstance.moveDown(mockMembers.length - 1);
      expect(emitted).toBeFalse();
    });

    it('should disable moveUp button on first row', () => {
      const fixture = setupComponent();
      const moveUpBtns = fixture.nativeElement.querySelectorAll('[aria-label$="vers le haut"]');
      expect(moveUpBtns.length).toBeGreaterThan(0);
      expect(moveUpBtns[0].disabled).toBeTrue();
    });

    it('should disable moveDown button on last row', () => {
      const fixture = setupComponent();
      const moveDownBtns = fixture.nativeElement.querySelectorAll('[aria-label$="vers le bas"]');
      expect(moveDownBtns.length).toBeGreaterThan(0);
      expect(moveDownBtns[moveDownBtns.length - 1].disabled).toBeTrue();
    });

    it('should update liveMessage when setLiveMessage is called', () => {
      const fixture = setupComponent();
      fixture.componentInstance.setLiveMessage('Player1', 2, 2);
      expect(fixture.componentInstance.liveMessage()).toContain('Player1');
    });

    it('should update liveMessage with error when setErrorMessage is called', () => {
      const fixture = setupComponent();
      fixture.componentInstance.setErrorMessage('Player1');
      expect(fixture.componentInstance.liveMessage()).toContain('Echec');
    });

    it('should render aria-live region with polite attribute', () => {
      const fixture = setupComponent();
      const liveRegion = fixture.nativeElement.querySelector('[aria-live="polite"]');
      expect(liveRegion).not.toBeNull();
    });

    it('should not emit reorderRequest when already reordering via moveUp (SEC-PR206-001)', () => {
      const fixture = setupComponent();
      let emitted = false;
      fixture.componentInstance.reorderRequest.subscribe(() => (emitted = true));
      fixture.componentInstance['reordering'].set(true);
      fixture.componentInstance.moveUp(1);
      expect(emitted).toBeFalse();
    });

    it('should not emit reorderRequest when already reordering via moveDown (SEC-PR206-001)', () => {
      const fixture = setupComponent();
      let emitted = false;
      fixture.componentInstance.reorderRequest.subscribe(() => (emitted = true));
      fixture.componentInstance['reordering'].set(true);
      fixture.componentInstance.moveDown(0);
      expect(emitted).toBeFalse();
    });
  });
});
