import { Component } from '@angular/core';

interface StaffMember {
  name: string;
  role: string;
  photo: string;
}

@Component({
  selector: 'app-structure',
  standalone: true,
  imports: [],
  templateUrl: './structure.html',
  styleUrls: ['./structure.scss']
})
export class StructureComponent {
  scrollToVideo(): void {
    document.getElementById('video')?.scrollIntoView({ behavior: 'smooth' });
  }

  administration: StaffMember[] = [
    {
      name: "Vilvi",
      role: "Président",
      photo: "assets/img/structure/no_photo.png"
    },
    {
      name: "Ficello",
      role: "Co-Président",
      photo: "assets/img/structure/no_photo.png"
    },
    {
      name: "Julien",
      role: "Trésorier",
      photo: "assets/img/structure/no_photo.png"
    },
    {
      name: "Ianis",
      role: "Secrétaire",
      photo: "assets/img/structure/no_photo.png"
    },
    {
      name: "Tano",
      role: "Membre",
      photo: "assets/img/structure/no_photo.png"
    },
    {
      name: "Choko",
      role: "Membre",
      photo: "assets/img/structure/no_photo.png"
    },
    {
      name: "Hugo",
      role: "Membre",
      photo: "assets/img/structure/no_photo.png"
    }
  ];

  headStaff: StaffMember[] = [
    {
      name: "Ianis",
      role: "Directeur Général",
      photo: "assets/img/structure/no_photo.png"
    },
    {
      name: "Choko",
      role: "Responsable Dev Web",
      photo: "assets/img/structure/no_photo.png"
    },
    {
      name: "En recherche",
      role: "Responsable Artistique",
      photo: "assets/img/structure/no_photo.png"
    },
    {
      name: "GE0TANK",
      role: "Directeur Esport",
      photo: "assets/img/structure/no_photo.png"
    },
    {
      name: "Emerode",
      role: "Responsable Communication",
      photo: "assets/img/structure/no_photo.png"
    },
    {
      name: "En recherche",
      role: "Responsable Marketing",
      photo: "assets/img/structure/no_photo.png"
    },
    {
      name: "En recherche",
      role: "Responsable RH",
      photo: "assets/img/structure/no_photo.png"
    }
  ];
}
