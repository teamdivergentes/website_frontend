import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface TeamCard {
  name: string;
  game: string;
  image: string;
  logo: string;
}

interface Ambassador {
  name: string;
  image: string;
  hasPhoto: boolean;
}

@Component({
  selector: 'app-equipes',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './equipes.html',
  styleUrls: ['./equipes.scss']
})
export class EquipesComponent {
  teams: TeamCard[] = [
    {
      name: 'League of Legends',
      game: 'lol',
      image: 'assets/img/equipe_ambassadeur/equipes/lol.png',
      logo: 'assets/img/games/lol.png'
    },
    {
      name: 'Valorant',
      game: 'valorant',
      image: 'assets/img/equipe_ambassadeur/equipes/valo.png',
      logo: 'assets/img/games/valorant.png'
    },
    {
      name: 'Rocket League',
      game: 'rl',
      image: 'assets/img/equipe_ambassadeur/equipes/rl.png',
      logo: 'assets/img/games/rocket_league.png'
    },
    {
      name: 'Counter-Strike',
      game: 'cs',
      image: 'assets/img/equipe_ambassadeur/equipes/cs.png',
      logo: 'assets/img/games/csgo.png'
    },
    {
      name: 'Teamfight Tactics',
      game: 'tft',
      image: 'assets/img/equipe_ambassadeur/equipes/tft.png',
      logo: 'assets/img/games/tft.png'
    }
  ];

  ambassadors: Ambassador[] = [
    {
      name: 'Tamaroush',
      image: 'assets/img/equipe_ambassadeur/ambassadeur/Tamaroush 2.png',
      hasPhoto: true
    },
    {
      name: 'À venir',
      image: 'assets/logos/logoTD.svg',
      hasPhoto: false
    },
    {
      name: 'À venir',
      image: 'assets/logos/logoTD.svg',
      hasPhoto: false
    }
  ];
}
