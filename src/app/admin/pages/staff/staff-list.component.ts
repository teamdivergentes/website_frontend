import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { StaffService } from '../../../shared/services';
import { StaffMember, StaffCategory } from '../../../shared/models';
import { StaffFormComponent } from './staff-form.component';

/**
 * Page d'administration du staff avec drag & drop pour réordonner
 */
@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [CommonModule, DragDropModule, StaffFormComponent],
  templateUrl: './staff-list.component.html',
  styleUrls: ['./staff-list.component.scss']
})
export class StaffListComponent implements OnInit {
  readonly staffService = inject(StaffService);

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);
  readonly selectedCategory = signal<StaffCategory>(StaffCategory.ADMIN);
  readonly showModal = signal<boolean>(false);
  readonly editingMember = signal<StaffMember | undefined>(undefined);

  readonly StaffCategory = StaffCategory;

  // Computed pour les membres filtrés
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

    // Met à jour les positions
    const reorderData = members.map((member, index) => ({
      id: member.id,
      position: index
    }));

    this.staffService.reorderMembers(reorderData).subscribe({
      error: (err) => {
        this.error.set('Erreur lors de la réorganisation');
        console.error('Reorder error:', err);
        this.loadStaff(); // Recharge en cas d'erreur
      }
    });
  }

  /**
   * Ouvre le modal de création
   */
  openCreateModal(): void {
    this.editingMember.set(undefined);
    this.showModal.set(true);
  }

  /**
   * Ouvre le modal d'édition
   */
  openEditModal(member: StaffMember): void {
    this.editingMember.set(member);
    this.showModal.set(true);
  }

  /**
   * Ferme le modal
   */
  closeModal(): void {
    this.showModal.set(false);
    this.editingMember.set(undefined);
  }

  /**
   * Callback après sauvegarde
   */
  onMemberSaved(): void {
    this.closeModal();
    this.loadStaff();
  }

  /**
   * Supprime un membre
   */
  deleteMember(member: StaffMember): void {
    if (!window.confirm(`Voulez-vous vraiment supprimer ${member.name} ?`)) {
      return;
    }

    this.staffService.deleteMember(member.id).subscribe({
      error: (err) => {
        this.error.set('Erreur lors de la suppression');
        console.error('Delete error:', err);
      }
    });
  }

  /**
   * Change la catégorie affichée
   */
  selectCategory(category: StaffCategory): void {
    this.selectedCategory.set(category);
  }
}
