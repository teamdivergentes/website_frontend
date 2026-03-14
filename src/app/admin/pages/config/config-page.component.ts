import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
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
  styleUrls: ['./config-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigPageComponent implements OnInit {
  private readonly configService = inject(ConfigService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);
  readonly success = signal<string | undefined>(undefined);

  /** Ensemble des clés de sections actuellement ouvertes. Par défaut : toutes fermées. */
  private readonly openSections = signal<Set<string>>(new Set());

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
      contact_phone: ['', Validators.pattern(/^[+\d\s\-().]*$/)],
      twitter_url: ['', Validators.pattern(/^https?:\/\/.+/)],
      instagram_url: ['', Validators.pattern(/^https?:\/\/.+/)],
      discord_url: ['', Validators.pattern(/^https?:\/\/.+/)],
      youtube_url: ['', Validators.pattern(/^https?:\/\/.+/)],
      twitch_url: ['', Validators.pattern(/^https?:\/\/.+/)],
      mail_url: [''],
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
      og_image: [''],
      // SEO - données structurées JSON-LD
      social_urls: ['']
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

    forkJoin(updates).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set('Configuration sauvegardée avec succès');
        window.setTimeout(() => this.success.set(undefined), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set('Erreur lors de la sauvegarde de la configuration');
        console.error('Save config error:', err);
      }
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
   * Ouvre ou ferme une section collapsible
   */
  toggleSection(key: string): void {
    const current = this.openSections();
    const next = new Set(current);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.openSections.set(next);
  }

  /**
   * Retourne true si la section identifiée par key est ouverte
   */
  isSectionOpen(key: string): boolean {
    return this.openSections().has(key);
  }

  /**
   * Vérifie si un champ a une erreur
   */
  hasError(field: string, error: string): boolean {
    const control = this.configForm.get(field);
    return !!(control && control.hasError(error) && control.touched);
  }
}
