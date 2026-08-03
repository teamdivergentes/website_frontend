import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RecruitmentService } from '../../shared/services';
import { SeoService } from '../../shared/services/seo.service';
import { PageHeaderComponent } from '../../shared/components/layout/page-header.component';
import { PageComponent } from '../../shared/components/layout/page.component';

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, PageComponent],
  templateUrl: './application-form.component.html',
  styleUrls: ['./application-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApplicationFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly seoService = inject(SeoService);

  postTitle = '';
  postType = '';

  name = '';
  email = '';
  message = '';
  cvFile: File | null = null;
  cvFileName = '';
  cvTouched = false;
  coverLetterFile: File | null = null;
  coverLetterFileName = '';

  isSubmitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal<string | null>(null);

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Postuler',
      description: 'Formulaire de candidature pour rejoindre Team Divergentes',
      url: '/structure/recrutement/postuler',
      noIndex: true,
    });

    this.route.queryParams.subscribe(params => {
      this.postTitle = params['postTitle'] || '';
      this.postType = params['postType'] || '';

      // Si pas de titre, rediriger vers la page recrutement
      if (!this.postTitle) {
        this.router.navigate(['/structure/recrutement']);
      }
    });
  }

  /**
   * Gestion de la sélection de fichier CV
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.cvFile = input.files[0];
      this.cvFileName = this.cvFile.name;
      this.cvTouched = false;
    }
  }

  /**
   * Gestion de la sélection de lettre de motivation
   */
  onCoverLetterSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.coverLetterFile = input.files[0];
      this.coverLetterFileName = this.coverLetterFile.name;
    }
  }

  /**
   * Soumission du formulaire
   */
  onSubmit(): void {
    if (this.isSubmitting()) return;

    if (!this.cvFile) {
      this.cvTouched = true;
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const formData = new FormData();
    formData.append('name', this.name);
    formData.append('email', this.email);
    if (this.message) {
      formData.append('message', this.message);
    }
    formData.append('postTitle', this.postTitle);
    formData.append('postType', this.postType);
    if (this.cvFile) {
      formData.append('cv', this.cvFile);
    }
    if (this.coverLetterFile) {
      formData.append('coverLetter', this.coverLetterFile);
    }

    this.recruitmentService.applyToPost(formData).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        if (response.success) {
          this.submitSuccess.set(true);
          // Reset du formulaire
          this.name = '';
          this.email = '';
          this.message = '';
          this.cvFile = null;
          this.cvFileName = '';
          this.coverLetterFile = null;
          this.coverLetterFileName = '';
        } else {
          this.submitError.set(response.message);
        }
      },
      error: () => {
        this.isSubmitting.set(false);
        this.submitError.set("Erreur lors de l'envoi. Veuillez réessayer.");
      }
    });
  }

  /**
   * Retour à la page recrutement
   */
  goBack(): void {
    this.router.navigate(['/structure/recrutement']);
  }
}
