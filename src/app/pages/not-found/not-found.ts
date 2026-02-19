import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { SeoService } from '../../shared/services/seo.service';

@Component({
  selector: 'app-not-found',
  imports: [
    CommonModule,
    RouterModule,
    MatIcon
  ],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss'
})
export class NotFound implements OnInit {
  private readonly router = inject(Router);
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Page non trouvée',
      description: "La page que vous recherchez n'existe pas ou a été déplacée.",
      url: '/404'
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  goBack(): void {
    window.history.back();
  }
}
