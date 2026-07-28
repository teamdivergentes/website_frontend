import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminShopProduct,
  ShopSettings,
  UpdateShopSettingsDto,
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
}
