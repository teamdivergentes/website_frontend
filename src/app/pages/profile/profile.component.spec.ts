import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { AuthService } from '../../../shared/services/api/auth.service';
import { ProfileService } from '../../../shared/services/api/profile.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let profileService: jasmine.SpyObj<ProfileService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockRole = { id: 1, name: 'Admin', permissions: [], createdAt: '', updatedAt: '' };
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    actif: true,
    createdAt: '2024-01-01T00:00:00Z',
    role: mockRole
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      user: jasmine.createSpy().and.returnValue(mockUser)
    });
    const profileServiceSpy = jasmine.createSpyObj('ProfileService', ['updateProfile', 'changePassword']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideAnimationsAsync(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ProfileService, useValue: profileServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        provideRouter([])
      ]
    }).compileComponents();

    profileService = TestBed.inject(ProfileService) as jasmine.SpyObj<ProfileService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with user data', () => {
    expect(component.user()).toBe(mockUser);
  });

  it('should initialize savingEmail to false', () => {
    expect(component.savingEmail()).toBe(false);
  });

  it('should initialize savingPassword to false', () => {
    expect(component.savingPassword()).toBe(false);
  });

  it('should pre-fill email form with user email', () => {
    expect(component.emailForm.value.email).toBe('test@example.com');
  });

  it('should not call updateProfile when email form is invalid', () => {
    component.emailForm.patchValue({ email: '' });
    component.updateEmail();
    expect(profileService.updateProfile).not.toHaveBeenCalled();
  });

  it('should call updateProfile when email form is valid', () => {
    profileService.updateProfile.and.returnValue(of({ ...mockUser, email: 'new@example.com' }));
    component.emailForm.patchValue({ email: 'new@example.com' });
    component.updateEmail();
    expect(profileService.updateProfile).toHaveBeenCalledWith({ email: 'new@example.com' });
  });

  it('should show success snackbar after email update', () => {
    profileService.updateProfile.and.returnValue(of({ ...mockUser, email: 'new@example.com' }));
    component.emailForm.patchValue({ email: 'new@example.com' });
    component.updateEmail();
    expect(snackBar.open).toHaveBeenCalledWith('Email modifié avec succès', 'OK', jasmine.any(Object));
  });

  it('should show error snackbar when email update fails', () => {
    profileService.updateProfile.and.returnValue(throwError(() => new Error('error')));
    component.emailForm.patchValue({ email: 'new@example.com' });
    component.updateEmail();
    expect(snackBar.open).toHaveBeenCalledWith(
      jasmine.stringContaining('Erreur'),
      'OK',
      jasmine.any(Object)
    );
  });

  it('should not call changePassword when password form is invalid', () => {
    component.updatePassword();
    expect(profileService.changePassword).not.toHaveBeenCalled();
  });

  it('should validate password mismatch', () => {
    component.passwordForm.patchValue({
      currentPassword: 'oldpass123',
      newPassword: 'newpass123',
      confirmPassword: 'different123'
    });
    expect(component.passwordForm.hasError('passwordMismatch')).toBe(true);
  });

  it('should call changePassword when password form is valid', () => {
    profileService.changePassword.and.returnValue(of(undefined as any));
    component.passwordForm.patchValue({
      currentPassword: 'oldpass123',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123'
    });
    component.updatePassword();
    expect(profileService.changePassword).toHaveBeenCalledWith({
      currentPassword: 'oldpass123',
      newPassword: 'newpass123'
    });
  });

  it('should reset password form after successful change', () => {
    profileService.changePassword.and.returnValue(of(undefined as any));
    component.passwordForm.patchValue({
      currentPassword: 'oldpass123',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123'
    });
    component.updatePassword();
    expect(component.passwordForm.value.currentPassword).toBeNull();
  });

  it('should set savingPassword to false after error', () => {
    profileService.changePassword.and.returnValue(throwError(() => new Error('error')));
    component.passwordForm.patchValue({
      currentPassword: 'oldpass123',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123'
    });
    component.updatePassword();
    expect(component.savingPassword()).toBe(false);
  });
});
