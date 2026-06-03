/**
 * Configuration des éléments du menu dropdown "Structure"
 */
export interface StructureMenuItem {
  id: number;
  link: string;
  alt: string;
  width: number;
  height: number;
  path: string;
  active: boolean;
}

export const structureMenuItems: StructureMenuItem[] = [
  {
    id: 0,
    link: 'assets/img/header/structure.png',
    alt: 'la structure',
    width: 3058,
    height: 2335,
    path: '/structure',
    active: true
  },
  {
    id: 1,
    link: 'assets/img/header/palmares.png',
    alt: 'palmarès',
    width: 3058,
    height: 2335,
    path: '/structure/palmares',
    active: true
  },
  {
    id: 2,
    link: 'assets/img/header/equipes_ambassadeurs.png',
    alt: 'équipes',
    width: 3058,
    height: 2335,
    path: '/structure/equipes',
    active: true
  },
  {
    id: 3,
    link: 'assets/img/header/sponsors.png',
    alt: 'nos sponsors',
    width: 3060,
    height: 2335,
    path: '/structure/sponsors',
    active: true
  },
  {
    id: 4,
    link: 'assets/img/header/recrutement.png',
    alt: 'recrutement',
    width: 3057,
    height: 2335,
    path: '/structure/recrutement',
    active: true
  }
];
