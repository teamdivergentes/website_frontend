import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

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
export class NotFound {

  constructor(private router: Router) {}

  goHome(): void {
    console.log("fanfjainfjknakfn")
    this.router.navigate(['/']);
  }

  goBack(): void {
    window.history.back();
  }
}
