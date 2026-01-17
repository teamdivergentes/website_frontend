import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-test-index',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './test-index.html',
  styleUrl: './test-index.scss',
})
export class TestIndexComponent {

}
