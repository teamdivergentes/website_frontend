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
});
