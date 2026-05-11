import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Observable, of } from 'rxjs';
import { UserFiltersComponent, UserFiltersValue } from './user-filters.component';
import { RolesService } from '../../../../../../shared/services/api/roles.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

const mockRoles = [
  { id: 1, name: 'Admin', permissions: [], createdAt: '', updatedAt: '' },
  { id: 2, name: 'Member', permissions: [], createdAt: '', updatedAt: '' }
];

describe('UserFiltersComponent', () => {
  let component: UserFiltersComponent;
  let fixture: ComponentFixture<UserFiltersComponent>;
  let rolesServiceSpy: jasmine.SpyObj<RolesService>;

  beforeEach(async () => {
    rolesServiceSpy = jasmine.createSpyObj('RolesService', ['getRoles']);
    rolesServiceSpy.getRoles.and.returnValue(of(mockRoles));

    await TestBed.configureTestingModule({
      imports: [UserFiltersComponent, NoopAnimationsModule],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RolesService, useValue: rolesServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load roles on init', () => {
    expect(rolesServiceSpy.getRoles).toHaveBeenCalled();
    expect(component.availableRoles().length).toBe(2);
    expect(component.availableRoles()[0].name).toBe('Admin');
  });

  it('should have empty controls by default', () => {
    expect(component.searchControl.value).toBe('');
    expect(component.roleFilterControl.value).toBeNull();
    expect(component.statusFilterControl.value).toBeNull();
  });

  it('should emit filtersChange when roleFilterControl changes', () => {
    const emitted: UserFiltersValue[] = [];
    component.filtersChange.subscribe((v: UserFiltersValue) => emitted.push(v));

    component.roleFilterControl.setValue(1);
    fixture.detectChanges();

    expect(emitted.length).toBe(1);
    expect(emitted[0].roleId).toBe(1);
  });

  it('should emit filtersChange when statusFilterControl changes', () => {
    const emitted: UserFiltersValue[] = [];
    component.filtersChange.subscribe((v: UserFiltersValue) => emitted.push(v));

    component.statusFilterControl.setValue(true);
    fixture.detectChanges();

    expect(emitted.length).toBe(1);
    expect(emitted[0].actif).toBeTrue();
  });

  // Note: fakeAsync est incompatible avec provideZonelessChangeDetection.
  // Le debounce de 300ms est couvert par les tests d'intégration E2E.
  it('should not emit immediately after search input change (debounce active)', (done) => {
    const emitted: UserFiltersValue[] = [];
    component.filtersChange.subscribe((v: UserFiltersValue) => emitted.push(v));

    component.searchControl.setValue('test');
    // Pas d'émission immédiate (debounce)
    expect(emitted.length).toBe(0);
    // Après 350ms, l'émission doit avoir eu lieu
    setTimeout(() => {
      expect(emitted.length).toBe(1);
      expect(emitted[0].search).toBe('test');
      done();
    }, 350);
  });

  it('should return false for hasActiveFilters when no filter is set', () => {
    expect(component.hasActiveFilters()).toBeFalse();
  });

  it('should return true for hasActiveFilters when search is set', () => {
    component.searchControl.setValue('test');
    expect(component.hasActiveFilters()).toBeTrue();
  });

  it('should return true for hasActiveFilters when roleId is set', () => {
    component.roleFilterControl.setValue(1);
    expect(component.hasActiveFilters()).toBeTrue();
  });

  it('should return true for hasActiveFilters when actif is set', () => {
    component.statusFilterControl.setValue(false);
    expect(component.hasActiveFilters()).toBeTrue();
  });

  it('should reset all controls on reset()', () => {
    component.searchControl.setValue('test');
    component.roleFilterControl.setValue(1);
    component.statusFilterControl.setValue(true);

    component.reset();

    expect(component.searchControl.value).toBe('');
    expect(component.roleFilterControl.value).toBeNull();
    expect(component.statusFilterControl.value).toBeNull();
  });

  it('should handle error when loading roles fails', () => {
    rolesServiceSpy.getRoles.and.returnValue(
      new Observable((sub) => sub.error(new Error('Erreur réseau')))
    );
    spyOn(console, 'error');

    component.ngOnInit();

    expect(console.error).toHaveBeenCalled();
  });
});
