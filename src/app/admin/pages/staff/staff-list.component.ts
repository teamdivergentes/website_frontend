import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { StaffService } from '../../../shared/services';
import { StaffMember, StaffCategory } from '../../../shared/models';
import { StaffFormDialogComponent, StaffFormDialogData } from './staff-form.component';
import { environment } from '../../../../environments/environment';
import { AdminNotifier } from '../../shared/admin-notifier.service';
import { buildReorderMessage, buildReorderErrorMessage } from '../../../shared/utils/a11y-announce';
import { SkeletonComponent } from '../../shared/skeleton.component';
import { AdminConfirmService } from '../../shared/admin-confirm.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';

/**
 * Page d'administration du staff avec drag & drop pour reordonner.
 * Accessible au clavier via boutons Monter / Descendre (WCAG 2.1.1).
 */
@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [CommonModule, DragDropModule, MatButtonModule, MatIconModule, MatTooltipModule,
    SkeletonComponent,
    EmptyStateComponent],
  templateUrl: './staff-list.component.html',
  styleUrls: ['./staff-list.component.scss']
})
export class StaffListComponent implements OnInit {
  readonly staffService = inject(StaffService);
  private readonly dialog = inject(MatDialog);
  private readonly confirm = inject(AdminConfirmService);
  private readonly notifier = inject(AdminNotifier);

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);
  readonly selectedCategory = signal<StaffCategory>(StaffCategory.ADMIN);
  /** Message annonce par la region aria-live apres chaque reorder. */
  readonly liveMessage = signal('');
  /** Guard anti-double-clic : bloque les appels API de reorder concurrents (SEC-PR206-001). */
  protected readonly reordering = signal(false);

  readonly StaffCategory = StaffCategory;

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
    this.onReorder(event.previousIndex, event.currentIndex);
  }

  /**
   * Logique commune de reorder (appele par drag-drop ET par les boutons Monter/Descendre).
   */
  onReorder(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return;
    if (this.reordering()) return;
    this.reordering.set(true);

    const members = [...this.filteredMembers];
    moveItemInArray(members, fromIndex, toIndex);
    const movedMember = members[toIndex];

    const reorderData = members.map((member, index) => ({
      id: member.id,
      position: index
    }));

    this.staffService.reorderMembers(reorderData).pipe(
      finalize(() => this.reordering.set(false))
    ).subscribe({
      next: () => {
        if (movedMember) {
          this.liveMessage.set(buildReorderMessage(movedMember.name, toIndex + 1, members.length));
        }
      },
      error: (err) => {
        this.error.set('Erreur lors de la réorganisation');
        console.error('Reorder error:', err);
        if (movedMember) {
          this.liveMessage.set(buildReorderErrorMessage(movedMember.name));
        }
        this.loadStaff();
      }
    });
  }

  /**
   * Ouvre le dialog de creation
   */
  openCreateModal(): void {
    const dialogRef = this.dialog.open(StaffFormDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { category: this.selectedCategory() } satisfies StaffFormDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadStaff();
    });
  }

  /**
   * Ouvre le dialog d'edition
   */
  openEditModal(member: StaffMember): void {
    const dialogRef = this.dialog.open(StaffFormDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { member, category: member.category } satisfies StaffFormDialogData
    });

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
