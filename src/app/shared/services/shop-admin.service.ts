import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminDiscountCode,
  AdminShopProduct,
  ShopSettings,
  UpdateShopSettingsDto,
  UpsertDiscountCodeDto,
  UpsertShopProductDto,
} from '../models/shop-admin.model';

@Injectable({ providedIn: 'root' })
export class ShopAdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/admin/shop`;

  findAll(): Observable<AdminShopProduct[]> {
    return this.http.get<AdminShopProduct[]>(`${this.baseUrl}/products`);
  }

  create(dto: UpsertShopProductDto): Observable<AdminShopProduct> {
    return this.http.post<AdminShopProduct>(`${this.baseUrl}/products`, dto);
  }

  update(id: number, dto: UpsertShopProductDto): Observable<AdminShopProduct> {
    return this.http.patch<AdminShopProduct>(`${this.baseUrl}/products/${id}`, dto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/products/${id}`);
  }

  getSettings(): Observable<ShopSettings> {
    return this.http.get<ShopSettings>(`${this.baseUrl}/settings`);
  }

  updateSettings(dto: UpdateShopSettingsDto): Observable<ShopSettings> {
    return this.http.patch<ShopSettings>(`${this.baseUrl}/settings`, dto);
  }

  // --- Bons de réduction --------------------------------------------------

  findDiscountCodes(): Observable<AdminDiscountCode[]> {
    return this.http.get<AdminDiscountCode[]>(`${this.baseUrl}/discount-codes`);
  }

  /**
   * Demande un code libre au serveur.
   *
   * La génération n'est pas faite ici : elle doit éviter les caractères qui se
   * confondent à la lecture **et** vérifier qu'aucun code identique n'existe.
   * Le second point demande la base ; les séparer donnerait un générateur
   * capable de proposer un code déjà pris.
   */
  suggestDiscountCode(): Observable<{ code: string }> {
    return this.http.get<{ code: string }>(`${this.baseUrl}/discount-codes/suggestion`);
  }

  createDiscountCode(dto: UpsertDiscountCodeDto): Observable<AdminDiscountCode> {
    return this.http.post<AdminDiscountCode>(`${this.baseUrl}/discount-codes`, dto);
  }

  updateDiscountCode(id: number, dto: UpsertDiscountCodeDto): Observable<AdminDiscountCode> {
    return this.http.patch<AdminDiscountCode>(`${this.baseUrl}/discount-codes/${id}`, dto);
  }

  removeDiscountCode(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/discount-codes/${id}`);
  }
}
