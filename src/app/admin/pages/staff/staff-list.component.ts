import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { StaffService } from '../../../shared/services';
import { StaffMember, StaffCategory } from '../../../shared/models';
import { StaffFormDialogComponent, StaffFormDialogData } from './staff-form.component';
import { environment } from '../../../../environments/environment';
import { AdminNotifier } from '../../shared/admin-notifier.service';
import { SkeletonComponent } from '../../shared/skeleton.component';
import { AdminConfirmService } from '../../shared/admin-confirm.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { AdminDialogService } from '../../shared/admin-dialog.service';
import { createReorder } from '../../shared/use-reorder';
import { PageHeaderComponent } from '../../shared/page-header.component';

/**
 * Page d'administration du staff avec drag & drop pour reordonner.
 * Accessible au clavier via boutons Monter / Descendre (WCAG 2.1.1).
 */
@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [PageHeaderComponent, CommonModule, DragDropModule, MatButtonModule, MatIconModule, MatTooltipModule,
    SkeletonComponent,
    EmptyStateComponent],
  templateUrl: './staff-list.component.html',
  styleUrls: ['./staff-list.component.scss']
})
export class StaffListComponent implements OnInit {
  readonly staffService = inject(StaffService);
  private readonly dialog = inject(MatDialog);
  private readonly adminDialog = inject(AdminDialogService);
  private readonly confirm = inject(AdminConfirmService);
  private readonly notifier = inject(AdminNotifier);

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);
  readonly selectedCategory = signal<StaffCategory>(StaffCategory.ADMIN);

  readonly StaffCategory = StaffCategory;

  /** Membres de la categorie active. Signal, pour alimenter le helper de reorder. */
  readonly visibleMembers = computed<StaffMember[]>(() => {
    switch (this.selectedCategory()) {
      case StaffCategory.ADMIN:
        return this.staffService.admins();
      case StaffCategory.HEADSTAFF:
        return this.staffService.headstaff();
      case StaffCategory.AMBASSADOR:
        return this.staffService.ambassadors();
      default:
        return [];
    }
  });

  /**
   * Reordonnancement delegue au helper partage.
   * Declare apres `visibleMembers`, dont il depend a l'initialisation.
   */
  private readonly reorder = createReorder<StaffMember>({
    items: this.visibleMembers,
    label: (member) => member.name,
    persist: (ordered) =>
      this.staffService.reorderMembers(ordered.map((member, index) => ({ id: member.id, position: index }))),
    onError: (err) => {
      this.error.set('Erreur lors de la réorganisation');
      if (!environment.production) {
        console.error('Reorder error:', err);
      }
      this.loadStaff();
    },
  });

  readonly reordering = this.reorder.reordering;
  readonly liveMessage = this.reorder.liveMessage;

  get filteredMembers(): StaffMember[] {
    switch (this.selectedCategory()) {
      case StaffCategory.ADMIN:
        return this.staffService.admins();
      case StaffCategory.HEADSTAFF:
        return this.staffService.headstaff();
      case StaffCategory.AMBASSADOR:
        return this.staffService.ambassadors();
      default:
        return [];
    }
  }

  ngOnInit(): void {
    this.loadStaff();
  }

  /**
   * Charge les membres du staff
   */
  loadStaff(): void {
    this.loading.set(true);
    this.error.set(undefined);

    this.staffService.loadStaff().subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Erreur lors du chargement du staff');
        console.error('Load staff error:', err);
      }
    });
  }

  /**
   * Gere le drop pour reordonner (drag-drop CDK).
   */
  onDrop(event: CdkDragDrop<StaffMember[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    this.reorder.onDrop(event);
  }

  /**
   * Logique commune de reorder (appele par drag-drop ET par les boutons Monter/Descendre).
   */
  onReorder(fromIndex: number, toIndex: number): void {
    this.reorder.onReorder(fromIndex, toIndex);
  }

  /**
   * Ouvre le dialog de creation
   */
  openCreateModal(): void {
    const dialogRef = this.adminDialog.open(StaffFormDialogComponent, 'md', { category: this.selectedCategory() } satisfies StaffFormDialogData);

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadStaff();
    });
  }

  /**
   * Ouvre le dialog d'edition
   */
  openEditModal(member: StaffMember): void {
    const dialogRef = this.adminDialog.open(StaffFormDialogComponent, 'md', { member, category: member.category } satisfies StaffFormDialogData);

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadStaff();
    });
  }

  /**
   * Supprime un membre
   */
  deleteMember(member: StaffMember): void {
    this.confirm.delete('ce membre', member.name).subscribe(confirmed => {
      if (!confirmed) return;

      this.staffService.deleteMember(member.id).subscribe({
        next: () => {
          this.notifier.deleted('Membre');
        },
        error: (err) => {
          this.error.set('Erreur lors de la suppression');
          if (!environment.production) {
            console.error('Delete error:', err);
          }
        }
      });
    });
  }

  /**
   * Change la categorie affichee
   */
  selectCategory(category: StaffCategory): void {
    this.selectedCategory.set(category);
  }
}
