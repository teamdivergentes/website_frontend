import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.html',
  styleUrls: ['./contact.scss']
})
export class ContactComponent {

  games = [
    "League of Legends",
    "Valorant",
    "CSGO",
    "Rocket League",
    "TFT",
    "Demande de sponsoring",
    "Autre"
  ];

  selectedGame: string | null = null;

  onSubmit() {
    console.log("Selected Game:", this.selectedGame);
  }
}
