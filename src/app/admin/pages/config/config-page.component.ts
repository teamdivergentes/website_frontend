import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfigService } from '../../../shared/services';
import { ConfigResponse } from '../../../shared/models';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';

/**
 * Page d'administration de la configuration
 */
@Component({
  selector: 'app-config-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageUploadComponent],
  templateUrl: './config-page.component.html',
  styleUrls: ['./config-page.component.scss']
})
export class ConfigPageComponent implements OnInit {
  private readonly configService = inject(ConfigService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);
  readonly success = signal<string | undefined>(undefined);

  configForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadConfigs();
  }

  /**
   * Initialise le formulaire
   */
  private initForm(): void {
    this.configForm = this.fb.group({
      youtube_link: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      site_name: ['', Validators.required],
      contact_email: ['', [Validators.email]],
      twitter_url: ['', Validators.pattern(/^https?:\/\/.+/)],
      instagram_url: ['', Validators.pattern(/^https?:\/\/.+/)],
      discord_url: ['', Validators.pattern(/^https?:\/\/.+/)],
      // Page visibility
      page_shop_visible: ['true'],
      page_contact_visible: ['true'],
      page_equipes_visible: ['true'],
      page_sponsors_visible: ['true'],
      page_recrutement_visible: ['true'],
      // Contact notifications
      contact_smtp_host: [''],
      contact_smtp_port: ['587'],
      contact_smtp_user: [''],
      contact_smtp_pass: [''],
      contact_discord_webhook: ['', Validators.pattern(/^https:\/\/discord\.com\/api\/webhooks\/.+/)],
      // Recruitment notifications
      recruitment_discord_webhook: ['', Validators.pattern(/^https:\/\/discord\.com\/api\/webhooks\/.+/)],
      // Open Graph
      og_title: [''],
      og_description: [''],
      og_image: ['']
    });
  }

  /**
   * Charge les configurations
   */
  loadConfigs(): void {
    this.loading.set(true);
    this.error.set(undefined);

    this.configService.loadConfigs().subscribe({
      next: (configs) => {
        this.loading.set(false);
        this.populateForm(configs);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Erreur lors du chargement de la configuration');
        console.error('Load configs error:', err);
      }
    });
  }

  /**
   * Remplit le formulaire avec les configs existantes
   */
  private populateForm(configs: ConfigResponse[]): void {
    configs.forEach(config => {
      if (this.configForm.contains(config.key)) {
        this.configForm.patchValue({ [config.key]: config.value });
      }
    });
  }

  /**
   * Sauvegarde les configurations
   */
  saveConfigs(): void {
    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(undefined);
    this.success.set(undefined);

    const formValue = this.configForm.value;
    const updates = Object.keys(formValue).map(key =>
      this.configService.updateConfig(key, { value: formValue[key] })
    );

    // Attendre que tous les updates soient terminés
    let completed = 0;
    updates.forEach(update => {
      update.subscribe({
        next: () => {
          completed++;
          if (completed === updates.length) {
            this.saving.set(false);
            this.success.set('Configuration sauvegardée avec succès');
            window.setTimeout(() => this.success.set(undefined), 3000);
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set('Erreur lors de la sauvegarde de la configuration');
          console.error('Save config error:', err);
        }
      });
    });
  }

  onOgImageUploaded(url: string): void {
    this.configForm.get('og_image')?.setValue(url);
    this.configForm.get('og_image')?.markAsDirty();
  }

  onOgImageRemoved(): void {
    this.configForm.get('og_image')?.setValue('');
    this.configForm.get('og_image')?.markAsDirty();
  }

  /**
   * Vérifie si un champ a une erreur
   */
  hasError(field: string, error: string): boolean {
    const control = this.configForm.get(field);
    return !!(control && control.hasError(error) && control.touched);
  }
}
