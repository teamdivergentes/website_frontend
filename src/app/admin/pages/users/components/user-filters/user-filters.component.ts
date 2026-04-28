import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  output,
  signal
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { RolesService } from '../../../../../../shared/services/api/roles.service';

export interface UserFiltersValue {
  search: string | null;
  roleId: number | null;
  actif: boolean | null;
}

/**
 * Composant de filtres pour la liste des utilisateurs.
 * Gère la recherche textuelle, le filtre par rôle et le filtre par statut.
 */
@Component({
  selector: 'app-user-filters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './user-filters.component.html',
  styleUrl: './user-filters.component.scss'
})
export class UserFiltersComponent implements OnInit, OnDestroy {
  private readonly rolesService = inject(RolesService);
  private readonly destroy$ = new Subject<void>();

  readonly filtersChange = output<UserFiltersValue>();

  readonly searchControl = new FormControl<string>('');
  readonly roleFilterControl = new FormControl<number | null>(null);
  readonly statusFilterControl = new FormControl<boolean | null>(null);

  readonly availableRoles = signal<Array<{ id: number; name: string }>>([]);

  ngOnInit(): void {
    this.loadRoles();
    this.setupFilterListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge les rôles disponibles depuis l'API
   */
  private loadRoles(): void {
    this.rolesService
      .getRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => this.availableRoles.set(roles),
        error: (err) => console.error('Erreur chargement des rôles:', err)
      });
  }

  /**
   * Configure les abonnements aux changements de filtres
   */
  private setupFilterListeners(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.emitFilters());

    this.roleFilterControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.emitFilters());

    this.statusFilterControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.emitFilters());
  }

  /**
   * Émet les valeurs actuelles des filtres
   */
  private emitFilters(): void {
    this.filtersChange.emit({
      search: this.searchControl.value ?? null,
      roleId: this.roleFilterControl.value,
      actif: this.statusFilterControl.value
    });
  }

  /**
   * Vérifie si au moins un filtre est actif
   */
  hasActiveFilters(): boolean {
    return !!(
      this.searchControl.value ||
      this.roleFilterControl.value !== null ||
      this.statusFilterControl.value !== null
    );
  }

  /**
   * Réinitialise tous les filtres
   */
  reset(): void {
    this.searchControl.setValue('');
    this.roleFilterControl.setValue(null);
    this.statusFilterControl.setValue(null);
  }
}
