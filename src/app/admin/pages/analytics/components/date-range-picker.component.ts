import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  output,
  signal,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { DateRange, DateRangePreset } from '../../../../shared/models';

interface Preset {
  key: DateRangePreset;
  label: string;
}

/**
 * Sélecteur de plage de dates avec presets prédéfinis et mode personnalisé.
 * Emet un DateRange à chaque changement de sélection.
 * FIX BETA-012 : ViewEncapsulation.None remplace ::ng-deep pour surcharger les styles Material
 * sans polluer le scope global (les styles sont préfixés par le sélecteur hôte via le CSS).
 */
@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule
  ],
  template: `
    <div class="date-range-picker">
      <mat-button-toggle-group
        [value]="selectedPreset()"
        (change)="onPresetChange($event.value)"
        class="preset-group"
      >
        @for (preset of presets; track preset.key) {
          <mat-button-toggle [value]="preset.key">{{ preset.label }}</mat-button-toggle>
        }
      </mat-button-toggle-group>

      @if (selectedPreset() === 'custom') {
        <div class="custom-range" [formGroup]="customRangeForm">
          <mat-form-field appearance="outline" class="date-field">
            <mat-label>Date de début</mat-label>
            <input matInput [matDatepicker]="pickerStart" formControlName="startDate" />
            <mat-datepicker-toggle matIconSuffix [for]="pickerStart" />
            <mat-datepicker #pickerStart />
          </mat-form-field>

          <mat-form-field appearance="outline" class="date-field">
            <mat-label>Date de fin</mat-label>
            <input matInput [matDatepicker]="pickerEnd" formControlName="endDate" />
            <mat-datepicker-toggle matIconSuffix [for]="pickerEnd" />
            <mat-datepicker #pickerEnd />
          </mat-form-field>

          <button
            mat-flat-button
            class="apply-btn"
            (click)="applyCustomRange()"
            [disabled]="customRangeForm.invalid"
          >
            Appliquer
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .date-range-picker {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1rem;
    }

    /* FIX BETA-012 : ViewEncapsulation.None injecte ces styles dans le <head> global.
       Le préfixage manuel par app-date-range-picker assure l'isolation. */
    app-date-range-picker .mat-button-toggle {
      font-size: 0.8125rem;
      color: var(--gray);
    }

    app-date-range-picker .mat-button-toggle-checked {
      background: rgba(50, 210, 153, 0.15);
      color: var(--green);
    }

    .custom-range {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
    }

    .date-field {
      width: 170px;
    }

    .apply-btn {
      background: var(--green) !important;
      color: var(--darkBackground) !important;
      font-weight: 600;
    }
  `]
})
export class DateRangePickerComponent implements OnInit {
  readonly rangeChange = output<DateRange>();

  readonly presets: Preset[] = [
    { key: 'today', label: "Aujourd'hui" },
    { key: '7days', label: '7 derniers jours' },
    { key: '30days', label: '30 derniers jours' },
    { key: '3months', label: '3 derniers mois' },
    { key: 'custom', label: 'Personnalisé' }
  ];

  readonly selectedPreset = signal<DateRangePreset>('7days');

  readonly customRangeForm = new FormGroup({
    startDate: new FormControl<Date | null>(null, Validators.required),
    endDate: new FormControl<Date | null>(null, Validators.required)
  });

  ngOnInit(): void {
    // Emet la plage par défaut au démarrage
    this.rangeChange.emit(this.computePresetRange('7days'));
  }

  onPresetChange(preset: DateRangePreset): void {
    this.selectedPreset.set(preset);
    if (preset !== 'custom') {
      this.rangeChange.emit(this.computePresetRange(preset));
    }
  }

  applyCustomRange(): void {
    const { startDate, endDate } = this.customRangeForm.value;
    if (startDate && endDate) {
      // FIX BETA-021 : si les dates sont inversées, les intervertir pour garantir startDate <= endDate
      const [start, end] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
      this.rangeChange.emit({
        startDate: this.formatDate(start),
        endDate: this.formatDate(end)
      });
    }
  }

  private computePresetRange(preset: DateRangePreset): DateRange {
    const now = new Date();
    const endDate = this.formatDate(now);

    switch (preset) {
      case 'today': {
        return { startDate: endDate, endDate };
      }
      case '7days': {
        const start = new Date(now);
        start.setDate(start.getDate() - 6);
        return { startDate: this.formatDate(start), endDate };
      }
      case '30days': {
        const start = new Date(now);
        start.setDate(start.getDate() - 29);
        return { startDate: this.formatDate(start), endDate };
      }
      case '3months': {
        const start = new Date(now);
        start.setMonth(start.getMonth() - 3);
        return { startDate: this.formatDate(start), endDate };
      }
      default:
        return { startDate: endDate, endDate };
    }
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
