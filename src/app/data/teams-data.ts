export interface Player {
  name: string;
  role?: string;
  image?: string;
  hasPhoto: boolean;
}

export interface TeamDetail {
  id: string;
  name: string;
  subtitle: string;
  logo: string;
  description: string;
  teamImage?: string;
  players: Player[];
}

export const teamsData: Record<string, TeamDetail> = {
  lol: {
    id: 'lol',
    name: 'League of Legends',
    subtitle: 'Nos joueurs',
    logo: 'assets/img/games/lol.png',
    teamImage: 'assets/img/equipe_ambassadeur/equipes/lol.png',
    description: `Nous sommes fiers de vous présenter notre équipe de joueurs League of Legends, une force redoutable sur la scène compétitive. Chaque membre de notre équipe apporte une combinaison unique de compétences, de stratégie et de passion pour le jeu, faisant de nous une équipe à surveiller de près.

Nos joueurs ne se contentent pas de jouer; ils vivent et respirent League of Legends. Leur dévouement à l'entraînement, leur esprit d'équipe et leur capacité à s'adapter à chaque situation de jeu les distinguent dans les tournois et les compétitions. Grâce à leur synergie et à leur compréhension approfondie du jeu, ils parviennent à transformer chaque match en une démonstration de stratégie et de coordination impeccables.

Nous sommes constamment inspirés par la détermination et le talent de nos joueurs. Leur engagement à exceller et à représenter fièrement notre organisation est inébranlable. Avec des victoires impressionnantes et des performances mémorables, notre équipe League of Legends continue de monter en puissance et de faire des vagues dans la communauté.

Suivez nos joueurs alors qu'ils affrontent les meilleurs et montrent au monde ce qu'ils peuvent accomplir. Ensemble, nous visons à atteindre de nouveaux sommets et à laisser une empreinte indélébile sur la scène e-sport.`,
    players: [
      { name: 'Joueur 1', role: 'Top', hasPhoto: true, image: 'assets/img/equipe_ambassadeur/equipes/lol.png' },
      { name: 'Joueur 2', role: 'Jungle', hasPhoto: false },
      { name: 'Joueur 3', role: 'Mid', hasPhoto: false },
      { name: 'Joueur 4', role: 'ADC', hasPhoto: false },
      { name: 'Joueur 5', role: 'Support', hasPhoto: false }
    ]
  },
  valorant: {
    id: 'valorant',
    name: 'Valorant',
    subtitle: 'Nos joueurs',
    logo: 'assets/img/games/valorant.png',
    teamImage: 'assets/img/equipe_ambassadeur/equipes/valo.png',
    description: `Notre équipe Valorant incarne la précision et la stratégie tactique. Chaque membre apporte une expertise unique dans ce FPS compétitif, combinant des réflexes aiguisés avec une communication parfaite.

Nos joueurs maîtrisent l'art du timing et du positionnement, transformant chaque round en une démonstration de coordination d'équipe. Leur connaissance approfondie des agents et des cartes leur permet d'adapter leurs stratégies à chaque situation.

L'équipe s'entraîne rigoureusement pour perfectionner leurs compétences individuelles tout en renforçant leur synergie collective. Cette combinaison de talent brut et de travail d'équipe fait d'eux des adversaires redoutables sur la scène compétitive.

Rejoignez-nous pour suivre leurs performances et célébrer leurs victoires dans l'arène Valorant.`,
    players: [
      { name: 'Joueur 1', role: 'Duelist', hasPhoto: false },
      { name: 'Joueur 2', role: 'Controller', hasPhoto: false },
      { name: 'Joueur 3', role: 'Sentinel', hasPhoto: false },
      { name: 'Joueur 4', role: 'Initiator', hasPhoto: false },
      { name: 'Joueur 5', role: 'Flex', hasPhoto: false }
    ]
  },
  rl: {
    id: 'rl',
    name: 'Rocket League',
    subtitle: 'Nos joueurs',
    logo: 'assets/img/games/rocket_league.png',
    teamImage: 'assets/img/equipe_ambassadeur/equipes/rl.png',
    description: `Notre équipe Rocket League combine vitesse, précision et créativité sur le terrain. Ces virtuoses du ballon motorisé repoussent les limites de ce qui est possible dans ce sport automobile unique.

Chaque joueur maîtrise l'art du vol aérien, des dribbles au sol et des passes millimétrées. Leur coordination en équipe leur permet de créer des combinaisons spectaculaires et des buts mémorables.

L'entraînement intensif et la passion pour le jeu font de notre équipe une force montante dans la communauté Rocket League. Leur détermination à s'améliorer constamment les pousse vers de nouveaux sommets.

Suivez leurs performances alors qu'ils défient les meilleures équipes et démontrent leur maîtrise du jeu.`,
    players: [
      { name: 'Joueur 1', hasPhoto: false },
      { name: 'Joueur 2', hasPhoto: false },
      { name: 'Joueur 3', hasPhoto: false }
    ]
  },
  cs: {
    id: 'cs',
    name: 'Counter-Strike',
    subtitle: 'Nos joueurs',
    logo: 'assets/img/games/csgo.png',
    teamImage: 'assets/img/equipe_ambassadeur/equipes/cs.png',
    description: `Notre équipe Counter-Strike représente l'élite du FPS tactique. Ces joueurs chevronnés allient précision chirurgicale et sens tactique aiguisé pour dominer leurs adversaires.

Chaque membre de l'équipe excelle dans son rôle, que ce soit en entry fragger, AWPer, support ou IGL. Leur communication fluide et leur lecture du jeu leur permettent d'anticiper et de contrer les stratégies adverses.

Des années d'expérience et d'entraînement ont forgé une équipe capable de performer sous pression. Leur sang-froid dans les moments cruciaux fait souvent la différence entre la victoire et la défaite.

Rejoignez-nous pour vivre l'intensité de leurs matchs et célébrer leurs accomplissements sur la scène CS.`,
    players: [
      { name: 'Joueur 1', role: 'Entry', hasPhoto: false },
      { name: 'Joueur 2', role: 'AWP', hasPhoto: false },
      { name: 'Joueur 3', role: 'Support', hasPhoto: false },
      { name: 'Joueur 4', role: 'Lurker', hasPhoto: false },
      { name: 'Joueur 5', role: 'IGL', hasPhoto: false }
    ]
  },
  tft: {
    id: 'tft',
    name: 'Teamfight Tactics',
    subtitle: 'Nos joueurs',
    logo: 'assets/img/games/tft.png',
    teamImage: 'assets/img/equipe_ambassadeur/equipes/tft.png',
    description: `Notre équipe Teamfight Tactics excelle dans l'art de la stratégie et de l'adaptation. Ces maîtres de l'auto-battler savent transformer chaque partie en une démonstration de génie tactique.

Nos joueurs possèdent une connaissance encyclopédique des compositions, des synergies et du méta actuel. Leur capacité à lire le lobby et à pivoter au bon moment leur donne un avantage décisif.

L'économie, le positionnement et le timing sont les clés de leur succès. Chaque décision est calculée pour maximiser leurs chances de victoire, round après round.

Suivez nos joueurs alors qu'ils grimpent les classements et affrontent les meilleurs tacticiens de la scène compétitive TFT.`,
    players: [
      { name: 'Joueur 1', hasPhoto: false },
      { name: 'Joueur 2', hasPhoto: false }
    ]
  }
};
