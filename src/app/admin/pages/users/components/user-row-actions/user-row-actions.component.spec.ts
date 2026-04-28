import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { UserRowActionsComponent, UserAction } from './user-row-actions.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import type { User } from '../../../../../../shared/models/user.model';

const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  actif: true,
  role: { id: 1, name: 'Admin', permissions: [], createdAt: '', updatedAt: '' },
  createdAt: '2024-01-01T00:00:00Z'
};

describe('UserRowActionsComponent', () => {
  let component: UserRowActionsComponent;
  let fixture: ComponentFixture<UserRowActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRowActionsComponent, NoopAnimationsModule],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(UserRowActionsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('user', mockUser);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default permissions as false', () => {
    expect(component.canWrite()).toBeFalse();
    expect(component.canDelete()).toBeFalse();
  });

  it('should emit edit action on onEdit()', () => {
    const emitted: Array<{ action: UserAction; user: User }> = [];
    component.actionTriggered.subscribe((v: { action: UserAction; user: User }) => emitted.push(v));

    component.onEdit();

    expect(emitted.length).toBe(1);
    expect(emitted[0].action).toBe('edit');
    expect(emitted[0].user).toEqual(mockUser);
  });

  it('should emit changeRole action on onChangeRole()', () => {
    const emitted: Array<{ action: UserAction; user: User }> = [];
    component.actionTriggered.subscribe((v: { action: UserAction; user: User }) => emitted.push(v));

    component.onChangeRole();

    expect(emitted.length).toBe(1);
    expect(emitted[0].action).toBe('changeRole');
  });

  it('should emit resetPassword action on onResetPassword()', () => {
    const emitted: Array<{ action: UserAction; user: User }> = [];
    component.actionTriggered.subscribe((v: { action: UserAction; user: User }) => emitted.push(v));

    component.onResetPassword();

    expect(emitted.length).toBe(1);
    expect(emitted[0].action).toBe('resetPassword');
  });

  it('should emit delete action on onDelete()', () => {
    const emitted: Array<{ action: UserAction; user: User }> = [];
    component.actionTriggered.subscribe((v: { action: UserAction; user: User }) => emitted.push(v));

    component.onDelete();

    expect(emitted.length).toBe(1);
    expect(emitted[0].action).toBe('delete');
  });

  it('should accept canWrite input', () => {
    fixture.componentRef.setInput('canWrite', true);
    fixture.detectChanges();
    expect(component.canWrite()).toBeTrue();
  });

  it('should accept canDelete input', () => {
    fixture.componentRef.setInput('canDelete', true);
    fixture.detectChanges();
    expect(component.canDelete()).toBeTrue();
  });
});
