import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TeamMemberFormComponent, MemberSaveEvent } from './team-member-form.component';
import type { TeamMember } from '../../../../../../shared/models';

const mockMember: TeamMember = {
  id: 1,
  name: 'TestPlayer',
  realName: 'Jean Dupont',
  role: 'TOP',
  image: 'https://example.com/img.png',
  position: 0,
  joinedAt: '2024-01-01T00:00:00Z',
  nationality: 'FR',
  birthDate: '2000-01-15',
  biography: 'Une bio.',
  socials: { twitter: 'https://twitter.com/test', twitch: 'https://twitch.tv/test' }
};

function setupComponent(editingMember?: TeamMember): ComponentFixture<TeamMemberFormComponent> {
  TestBed.configureTestingModule({
    imports: [TeamMemberFormComponent, NoopAnimationsModule],
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting()
    ]
  });

  const fixture = TestBed.createComponent(TeamMemberFormComponent);
  if (editingMember !== undefined) {
    fixture.componentRef.setInput('editingMember', editingMember);
  }
  fixture.detectChanges();
  return fixture;
}

describe('TeamMemberFormComponent', () => {
  it('should create', () => {
    const fixture = setupComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should be in creation mode by default', () => {
    const fixture = setupComponent();
    expect(fixture.componentInstance.isEditMode()).toBe(false);
  });

  it('should be in edit mode when editingMember is provided', () => {
    const fixture = setupComponent(mockMember);
    expect(fixture.componentInstance.isEditMode()).toBe(true);
  });

  it('should populate form when editingMember is set', () => {
    const fixture = setupComponent(mockMember);
    const form = fixture.componentInstance.form;
    expect(form.value.name).toBe('TestPlayer');
    expect(form.value.realName).toBe('Jean Dupont');
    expect(form.value.role).toBe('TOP');
    expect(form.value.nationality).toBe('FR');
    expect(form.value.twitter).toBe('https://twitter.com/test');
  });

  it('should detect social links when editing member has socials', () => {
    const fixture = setupComponent(mockMember);
    expect(fixture.componentInstance.hasSocialLinks()).toBe(true);
    expect(fixture.componentInstance.socialCount()).toBe(2);
  });

  it('should not show social badge when no socials', () => {
    const memberNoSocials: TeamMember = { ...mockMember, socials: {} };
    const fixture = setupComponent(memberNoSocials);
    expect(fixture.componentInstance.hasSocialLinks()).toBe(false);
    expect(fixture.componentInstance.socialCount()).toBe(0);
  });

  it('should not emit memberSaved if form is invalid', () => {
    const fixture = setupComponent();
    let emitted: MemberSaveEvent | undefined;
    fixture.componentInstance.memberSaved.subscribe((e: MemberSaveEvent) => (emitted = e));

    fixture.componentInstance.onSubmit();
    expect(emitted).toBeUndefined();
  });

  it('should emit memberSaved with correct data in creation mode', () => {
    const fixture = setupComponent();
    const form = fixture.componentInstance.form;
    form.patchValue({ name: 'NewPlayer', role: 'SUPPORT' });

    let emitted: MemberSaveEvent | undefined;
    fixture.componentInstance.memberSaved.subscribe((e: MemberSaveEvent) => (emitted = e));

    fixture.componentInstance.onSubmit();

    expect(emitted).toBeDefined();
    expect(emitted!.data.name).toBe('NewPlayer');
    expect(emitted!.data.role).toBe('SUPPORT');
    expect(emitted!.editingMember).toBeUndefined();
  });

  it('should emit memberSaved with editingMember in edit mode', () => {
    const fixture = setupComponent(mockMember);
    let emitted: MemberSaveEvent | undefined;
    fixture.componentInstance.memberSaved.subscribe((e: MemberSaveEvent) => (emitted = e));

    fixture.componentInstance.onSubmit();

    expect(emitted).toBeDefined();
    expect(emitted!.editingMember).toEqual(mockMember);
  });

  it('should emit editCancelled when cancel is clicked', () => {
    const fixture = setupComponent(mockMember);
    let cancelled = false;
    fixture.componentInstance.editCancelled.subscribe(() => (cancelled = true));

    fixture.componentInstance.onCancel();
    expect(cancelled).toBe(true);
  });

  it('should update image on upload', () => {
    const fixture = setupComponent();
    fixture.componentInstance.onImageUploaded('https://cdn.example.com/photo.png');
    expect(fixture.componentInstance.form.value.image).toBe('https://cdn.example.com/photo.png');
  });

  it('should clear image on removal', () => {
    const fixture = setupComponent(mockMember);
    fixture.componentInstance.onImageRemoved();
    expect(fixture.componentInstance.form.value.image).toBe('');
  });

  it('should use null for empty fields in edit mode', () => {
    const fixture = setupComponent(mockMember);
    fixture.componentInstance.form.patchValue({ realName: '' });

    let emitted: MemberSaveEvent | undefined;
    fixture.componentInstance.memberSaved.subscribe((e: MemberSaveEvent) => (emitted = e));

    fixture.componentInstance.onSubmit();
    expect((emitted!.data as any).realName).toBeNull();
  });

  it('should use undefined for empty fields in creation mode', () => {
    const fixture = setupComponent();
    fixture.componentInstance.form.patchValue({ name: 'X', role: 'Y', realName: '' });

    let emitted: MemberSaveEvent | undefined;
    fixture.componentInstance.memberSaved.subscribe((e: MemberSaveEvent) => (emitted = e));

    fixture.componentInstance.onSubmit();
    expect((emitted!.data as any).realName).toBeUndefined();
  });
});
