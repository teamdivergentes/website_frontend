import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TeamMemberRowComponent } from './team-member-row.component';
import type { TeamMember } from '../../../../../../shared/models';

const mockMember: TeamMember = {
  id: 1,
  name: 'TestPlayer',
  realName: 'Jean Dupont',
  role: 'TOP',
  image: 'https://example.com/image.png',
  position: 0,
  joinedAt: '2024-01-01T00:00:00Z',
  socials: { twitter: 'https://twitter.com/test' }
};

function setupComponent(member: TeamMember = mockMember): ComponentFixture<TeamMemberRowComponent> {
  TestBed.configureTestingModule({
    imports: [TeamMemberRowComponent, NoopAnimationsModule],
    providers: [provideZonelessChangeDetection()]
  });

  const fixture = TestBed.createComponent(TeamMemberRowComponent);
  fixture.componentRef.setInput('member', member);
  fixture.detectChanges();
  return fixture;
}

describe('TeamMemberRowComponent', () => {
  it('should create', () => {
    const fixture = setupComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display member name', () => {
    const fixture = setupComponent();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('TestPlayer');
  });

  it('should display member realName when set', () => {
    const fixture = setupComponent();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Jean Dupont');
  });

  it('should not display realName when absent', () => {
    const memberWithoutRealName: TeamMember = { ...mockMember, realName: undefined };
    const fixture = setupComponent(memberWithoutRealName);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.real-name')).toBeNull();
  });

  it('should display member role', () => {
    const fixture = setupComponent();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('TOP');
  });

  it('should render img tag when image is set', () => {
    const fixture = setupComponent();
    const img = fixture.nativeElement.querySelector('img.member-image');
    expect(img).not.toBeNull();
    expect(img.src).toContain('example.com/image.png');
    expect(img.alt).toBe('TestPlayer');
  });

  it('should render placeholder div when image is absent', () => {
    const memberNoImage: TeamMember = { ...mockMember, image: undefined };
    const fixture = setupComponent(memberNoImage);
    expect(fixture.nativeElement.querySelector('img.member-image')).toBeNull();
    expect(fixture.nativeElement.querySelector('.member-image.no-image')).not.toBeNull();
  });

  it('should emit editClicked with member on edit button click', () => {
    const fixture = setupComponent();
    let emitted: TeamMember | undefined;
    fixture.componentInstance.editClicked.subscribe((m: TeamMember) => (emitted = m));

    const btn = fixture.nativeElement.querySelectorAll('button')[0] as HTMLButtonElement;
    btn.click();
    expect(emitted).toEqual(mockMember);
  });

  it('should emit deleteClicked with member on delete button click', () => {
    const fixture = setupComponent();
    let emitted: TeamMember | undefined;
    fixture.componentInstance.deleteClicked.subscribe((m: TeamMember) => (emitted = m));

    const btn = fixture.nativeElement.querySelectorAll('button')[1] as HTMLButtonElement;
    btn.click();
    expect(emitted).toEqual(mockMember);
  });
});
