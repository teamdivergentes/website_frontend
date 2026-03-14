import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { StaffService } from '../../../shared/services';
import { StaffMember, StaffCategory } from '../../../shared/models';
import { StaffFormDialogComponent, StaffFormDialogData } from './staff-form.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

/**
 * Page d'administration du staff avec drag & drop pour réordonner
 */
@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './staff-list.component.html',
  styleUrls: ['./staff-list.component.scss']
})
export class StaffListComponent implements OnInit {
  readonly staffService = inject(StaffService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);
  readonly selectedCategory = signal<StaffCategory>(StaffCategory.ADMIN);

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
   * Gère le drop pour réordonner
   */
  onDrop(event: CdkDragDrop<StaffMember[]>): void {
    const members = [...this.filteredMembers];
    moveItemInArray(members, event.previousIndex, event.currentIndex);

    const reorderData = members.map((member, index) => ({
      id: member.id,
      position: index
    }));

    this.staffService.reorderMembers(reorderData).subscribe({
      error: (err) => {
        this.error.set('Erreur lors de la réorganisation');
        console.error('Reorder error:', err);
        this.loadStaff();
      }
    });
  }

  /**
   * Ouvre le dialog de création
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
   * Ouvre le dialog d'édition
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
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '95vw',
      data: {
        title: 'Confirmer la suppression',
        message: `Voulez-vous vraiment supprimer ${member.name} ?`
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.staffService.deleteMember(member.id).subscribe({
        error: (err) => {
          this.error.set('Erreur lors de la suppression');
          console.error('Delete error:', err);
        }
      });
    });
  }

  /**
   * Change la catégorie affichée
   */
  selectCategory(category: StaffCategory): void {
    this.selectedCategory.set(category);
  }
}
