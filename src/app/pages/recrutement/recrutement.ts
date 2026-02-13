import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Poste {
  id: number;
  logo: string;
  title: string;
  type: string;
  description: string;
  link: string;
  active: boolean;
}

@Component({
  selector: 'app-recrutement',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './recrutement.html',
  styleUrls: ['./recrutement.scss']
})
export class RecrutementComponent {
  postes: Poste[] = [
    {
      id: 1,
      logo: "assets/img/recrutement/coach.png",
      title: "Coach eSport",
      type: "Bénévole",
      description: "A mettre a jour. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      link: "/structure/recrutement/1",
      active: true
    },
    {
      id: 2,
      logo: "assets/img/recrutement/community-manager.png",
      title: "Community Manager",
      type: "Bénévole",
      description: "A mettre a jour. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      link: "/structure/recrutement/2",
      active: true
    },
    {
      id: 3,
      logo: "assets/img/recrutement/tresorier.png",
      title: "Trésorier",
      type: "Bénévole",
      description: "A mettre a jour. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      link: "/structure/recrutement/3",
      active: true
    },
    {
      id: 4,
      logo: "assets/img/recrutement/developpeur.png",
      title: "Développeur Web",
      type: "Bénévole",
      description: "A mettre a jour. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      link: "/structure/recrutement/4",
      active: false
    }
  ];

  get activePostes(): Poste[] {
    return this.postes.filter(p => p.active);
  }
}
