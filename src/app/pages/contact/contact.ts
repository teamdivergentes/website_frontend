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
  name: string = '';
  email: string = '';
  request: string = '';

  onSubmit() {
    console.log("Selected Game:", this.selectedGame);
    console.log("Name:", this.name);
    console.log("Email:", this.email);
    console.log("Request:", this.request);
  }
}
