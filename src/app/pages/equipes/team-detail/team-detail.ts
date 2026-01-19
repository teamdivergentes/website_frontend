import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { teamsData, TeamDetail, Player } from '../../../data/teams-data';

@Component({
  selector: 'app-team-detail',
  standalone: true,
  templateUrl: './team-detail.html',
  styleUrls: ['./team-detail.scss']
})
export class TeamDetailComponent implements OnInit {
  team: TeamDetail | null = null;
  logoPath = 'assets/logos/logoTD.svg';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const teamId = this.route.snapshot.paramMap.get('teamId');
    if (teamId && teamsData[teamId]) {
      this.team = teamsData[teamId];
    } else {
      this.router.navigate(['/structure/equipes']);
    }
  }

  goBack(): void {
    this.router.navigate(['/structure/equipes']);
  }

  trackByPlayer(index: number, player: Player): string {
    return player.name;
  }
}
