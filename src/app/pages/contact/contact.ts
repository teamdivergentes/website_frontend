import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContactService, ContactRequest } from '../../shared/services/contact.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './contact.html',
  styleUrls: ['./contact.scss']
})
export class ContactComponent {
  private readonly contactService = inject(ContactService);

  games = [
    "eSport",
    "Collaboration",
    "Divers"
  ];

  selectedGame: string | null = null;
  name = '';
  email = '';
  request = '';

  // États du formulaire
  isSubmitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal<string | null>(null);

  onSubmit() {
    if (!this.selectedGame) return;

    // Reset des états
    this.submitError.set(null);
    this.isSubmitting.set(true);

    const contactData: ContactRequest = {
      subject: this.selectedGame,
      name: this.name,
      email: this.email,
      message: this.request
    };

    this.contactService.sendContact(contactData).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        if (response.success) {
          this.submitSuccess.set(true);
          // Reset du formulaire
          this.selectedGame = null;
          this.name = '';
          this.email = '';
          this.request = '';
        } else {
          this.submitError.set(response.message);
        }
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.submitError.set(
          error.error?.message || "Une erreur est survenue. Veuillez réessayer plus tard."
        );
      }
    });
  }

  resetForm() {
    this.submitSuccess.set(false);
    this.submitError.set(null);
  }
}
