import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  AdminDiscountCode,
  DiscountType,
  UpsertDiscountCodeDto,
} from '../../../shared/models/shop-admin.model';
import { ShopAdminService } from '../../../shared/services/shop-admin.service';
import { eurosToCents } from './boutique-admin.component';

interface DiscountCodeDialogData {
  discount: AdminDiscountCode | null;
}

/**
 * Création et modification d'un bon de réduction.
 *
 * Huit contrôles, aucun sous-éditeur, aucune liste enfant : le dialogue `md`
 * est conforme à la règle du panel. Le bouton de génération n'est pas un
 * contrôle, il remplit celui du code.
 */
@Component({
  selector: 'app-discount-code-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatSlideToggleModule],
  templateUrl: './discount-code-dialog.component.html',
  styleUrls: ['./discount-code-dialog.component.scss'],
})
export class DiscountCodeDialogComponent {
  private readonly shopAdmin = inject(ShopAdminService);
  private readonly dialogRef = inject(MatDialogRef<DiscountCodeDialogComponent>);
  readonly data = inject<DiscountCodeDialogData>(MAT_DIALOG_DATA);

  readonly isEdit = this.data.discount !== null;
  readonly saving = signal(false);
  readonly generating = signal(false);
  readonly error = signal<string | undefined>(undefined);

  readonly code = signal(this.data.discount?.code ?? '');
  readonly type = signal<DiscountType>(this.data.discount?.type ?? 'FIXED');

  /**
   * La valeur change de nature avec le type : des euros pour un montant fixe,
   * des points de pourcentage sinon. Un seul champ, deux lectures — d'où le
   * libellé et l'aide qui suivent le type plutôt qu'un second champ qui serait
   * vide la moitié du temps.
   */
  readonly value = signal(initialValue(this.data.discount));

  readonly minSubtotalEuros = signal(
    this.data.discount?.minSubtotalCents == null
      ? ''
      : (this.data.discount.minSubtotalCents / 100).toFixed(2),
  );
  readonly startsAt = signal(toDateInput(this.data.discount?.startsAt));
  readonly endsAt = signal(toDateInput(this.data.discount?.endsAt));
  readonly maxUses = signal(this.data.discount?.maxUses?.toString() ?? '');
  readonly active = signal(this.data.discount?.active ?? true);

  /**
   * Points d'entrée des deux champs numériques.
   *
   * ⚠️ **`<input type="number">` fait remonter un `number` par `ngModel`, pas
   * une chaîne** — et `null` quand le champ est vidé. Les signaux, eux, portent
   * du texte : c'est ce qui permet de distinguer « champ vide » de « zéro », et
   * la convention « vide = pas de limite » repose entièrement sur cette
   * distinction.
   *
   * Sans conversion, le premier `trim()` sur la valeur saisie casse le
   * formulaire — ce qui est arrivé en recette sur le quota. Le template ne
   * touche donc plus aux signaux directement : il passe par ces méthodes, qui
   * sont le seul endroit où la conversion peut être oubliée.
   */
  setValue(raw: unknown): void {
    this.value.set(asText(raw));
  }

  setMaxUses(raw: unknown): void {
    this.maxUses.set(asText(raw));
  }

  /**
   * Le libellé se fige à la première utilisation, alors que les conditions
   * restent modifiables : la commande garde le libellé du code, pas une
   * référence, et renommer un code déjà servi rendrait ses ventes passées
   * irrattachables à l'opération.
   */
  readonly codeLocked = computed(() => (this.data.discount?.usedCount ?? 0) > 0);

  readonly isPercentage = computed(() => this.type() === 'PERCENTAGE');

  readonly validationError = computed(() => {
    const code = this.code().trim().toUpperCase();
    if (!/^[A-Z0-9-]{3,32}$/.test(code)) {
      return 'Le code ne peut contenir que des lettres, chiffres et tirets (3 à 32 caractères).';
    }

    const value = Number(this.value());
    if (!Number.isInteger(value) || value <= 0) {
      return 'La valeur de la remise doit être un entier supérieur à zéro.';
    }
    if (this.isPercentage() && value > 100) {
      return 'Une remise en pourcentage ne peut pas dépasser 100 %.';
    }
    if (this.minSubtotalEuros().trim() && eurosToCents(this.minSubtotalEuros()) === null) {
      return 'Le panier minimum doit être un montant valide.';
    }
    if (this.maxUses().trim() && !/^[1-9]\d*$/.test(this.maxUses().trim())) {
      return 'Le quota doit être un entier supérieur à zéro, ou vide pour illimité.';
    }
    if (this.startsAt() && this.endsAt() && this.endsAt() <= this.startsAt()) {
      return 'La date de fin doit être postérieure à la date de début.';
    }
    return undefined;
  });

  readonly canSave = computed(() => this.validationError() === undefined && !this.saving());

  /**
   * Demande un code libre au serveur.
   *
   * La génération vit côté serveur parce qu'elle doit éviter les caractères
   * ambigus **et** vérifier qu'aucun code identique n'existe : le second point
   * demande la base. Le code proposé reste modifiable — c'est une proposition,
   * pas une imposition.
   */
  generate(): void {
    this.generating.set(true);
    this.shopAdmin.suggestDiscountCode().subscribe({
      next: ({ code }) => {
        this.code.set(code);
        this.generating.set(false);
      },
      error: () => {
        this.generating.set(false);
        this.error.set("La génération a échoué. Saisissez un code à la main.");
      },
    });
  }

  save(): void {
    if (!this.canSave()) {
      return;
    }

    const dto: UpsertDiscountCodeDto = {
      type: this.type(),
      value: Number(this.value()),
      // `null` explicite et non champ omis : c'est ce qui retire une borne.
      minSubtotalCents: this.minSubtotalEuros().trim()
        ? eurosToCents(this.minSubtotalEuros())
        : null,
      startsAt: fromDateInput(this.startsAt()),
      endsAt: fromDateInput(this.endsAt(), 'end'),
      maxUses: this.maxUses().trim() ? Number(this.maxUses()) : null,
      active: this.active(),
    };

    // Le code n'est transmis que s'il peut changer : l'envoyer sur un code
    // verrouillé ferait échouer l'enregistrement d'une simple modification de
    // conditions.
    if (!this.codeLocked()) {
      dto.code = this.code().trim().toUpperCase();
    }

    this.saving.set(true);
    this.error.set(undefined);

    const request = this.isEdit
      ? this.shopAdmin.updateDiscountCode(this.data.discount!.id, dto)
      : this.shopAdmin.createDiscountCode(dto);

    request.subscribe({
      next: () => this.dialogRef.close(true),
      error: (err: { error?: { message?: string | string[] } }) => {
        this.saving.set(false);
        const message = err?.error?.message;
        this.error.set(
          Array.isArray(message) ? message.join(' — ') : (message ?? "L'enregistrement a échoué."),
        );
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}

/** Euros pour un montant fixe, points de pourcentage sinon. */
function initialValue(discount: AdminDiscountCode | null): string {
  if (!discount) {
    return '';
  }
  return discount.type === 'FIXED'
    ? Math.round(discount.value).toString()
    : discount.value.toString();
}

/**
 * Ce que `ngModel` renvoie, ramené à du texte.
 *
 * `null` et `undefined` deviennent la chaîne vide, qui est la façon dont ce
 * formulaire écrit « pas de limite ». Un nombre devient sa représentation
 * décimale. Tout le reste est laissé tel quel : la validation s'en charge, et
 * la conversion n'a pas à trancher ce qu'elle ne comprend pas.
 */
function asText(raw: unknown): string {
  if (raw === null || raw === undefined) {
    return '';
  }
  return typeof raw === 'string' ? raw : String(raw);
}

function toDateInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : '';
}

/**
 * ⚠️ **La fin tombe en fin de journée, pas à son début.** Qui saisit
 * « jusqu'au 31 août » veut que le code marche pendant le 31 ; le borner à
 * `00:00` l'arrêterait la veille au soir, et le défaut ne se verrait que le
 * jour dit — sur un code annoncé publiquement, c'est une journée d'opération
 * perdue.
 */
function fromDateInput(value: string, edge: 'start' | 'end' = 'start'): string | null {
  const day = value.trim();
  if (day.length === 0) {
    return null;
  }
  return `${day}T${edge === 'end' ? '23:59:59.999' : '00:00:00.000'}Z`;
}
