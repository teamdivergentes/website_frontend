export interface ShopItem {
  id: string;
  itemName: string;
  img: string;
  imgBack?: string | null;
  imgFront?: string | null;
  price: string;
  adress: string;
  new: boolean;
  vip?: boolean;
  descKey: string;
}

export const shoppingList: ShopItem[] = [
  {
    id: 'maillotDvg',
    itemName: 'MAILLOT 2020',
    img: 'assets/img/shop/2020_maillot_front_light.png',
    imgBack: 'assets/img/shop/2020_maillot_back_light.png',
    price: '39.90',
    descKey: 'detailsMaillot',
    adress: 'https://eliminate.fr/produit/team-divergentes-jersey-2020/',
    new: false
  },
  {
    id: 'sweatDvg',
    itemName: 'HOODIE - TEAM DIVERGENTES',
    img: 'assets/img/shop/2020_hoodie_front_light.png',
    imgBack: 'assets/img/shop/2020_hoodie_back_light.png',
    price: '35.00',
    descKey: 'detailsSweat',
    adress: 'https://eliminate.fr/produit/team-divergentes-hoodie/',
    new: false
  },
  {
    id: 'T-shirtDvg',
    itemName: 'T-SHIRT - TEAM DIVERGENTES',
    img: 'assets/img/shop/2020_TShirt_front_light.png',
    imgBack: 'assets/img/shop/2023_TShirt_back_global_light.png',
    price: '20.90',
    descKey: 'detailsTshirt',
    adress: 'https://eliminate.fr/produit/team-divergentes-t-shirt/',
    new: false
  },
  {
    id: 'tapisSourisDvg',
    itemName: 'TAPIS DE SOURIS - TEAM DIVERGENTES',
    img: 'assets/img/shop/2020_tapis_front_light.png',
    imgBack: null,
    price: '17.50',
    descKey: 'detailsTDS',
    adress: 'https://eliminate.fr/produit/team-divergentes-tapis-m/',
    new: false
  },
  {
    id: 'maillotDvg_2023',
    itemName: 'MAILLOT 2023',
    img: 'assets/img/shop/2023_maillot_front_light.png',
    imgBack: 'assets/img/shop/2023_maillot_back_light.png',
    price: '39.90',
    descKey: 'detailsMaillot2023',
    adress: 'https://eliminate.fr/produit/team-divergentes-jersey-2023/',
    new: false
  },
  {
    id: 'tShirtMenpo_2023',
    itemName: 'T-SHIRT MENPŌ',
    img: 'assets/img/shop/shopTShirtMenpoLight.jpg',
    imgFront: 'assets/img/shop/2023_TShirt_front_Menpo_light.png',
    imgBack: 'assets/img/shop/2023_TShirt_back_global_light.png',
    price: '21.99',
    descKey: 'detailsMenpoTShirt',
    adress: 'https://eliminate.fr/produit/team-divergentes-t-shirt-menpo-2022/',
    new: true,
    vip: false
  },
  {
    id: 'tShirtYinYang_2023',
    itemName: 'T-SHIRT YIN YANG',
    img: 'assets/img/shop/shopTShirtYinYangLight.jpg',
    imgFront: 'assets/img/shop/2023_TShirt_front_YinYang_light.png',
    imgBack: 'assets/img/shop/2023_TShirt_back_global_light.png',
    price: '21.99',
    descKey: 'detailsYinYangTshirt',
    adress: 'https://eliminate.fr/produit/team-divergentes-t-shirt-yin-yang-2022/',
    new: true,
    vip: false
  },
  {
    id: 'tShirtKanji_2023',
    itemName: 'T-SHIRT KANJI',
    img: 'assets/img/shop/shopTShirtKanjiLight.jpg',
    imgFront: 'assets/img/shop/2023_TShirt_front_Kanji_light.png',
    imgBack: 'assets/img/shop/2023_TShirt_back_global_light.png',
    price: '21.99',
    descKey: 'detailsKanjiTshirt',
    adress: 'https://eliminate.fr/produit/team-divergentes-t-shirt-kanji-2022/',
    new: true,
    vip: false
  },
  {
    id: 'hoodieYinYang_2023',
    itemName: 'HOODIE YIN YANG',
    img: 'assets/img/shop/shopHoodieYinYangLight.jpg',
    imgFront: 'assets/img/shop/2023_hoodie_front_YinYang_light.png',
    imgBack: 'assets/img/shop/2023_hoodie_back_YinYang_light.png',
    price: '42.50',
    descKey: 'detailsHoodieYinYang',
    adress: 'https://eliminate.fr/produit/team-divergentes-hoodie-yin-yang-2022/',
    new: true,
    vip: false
  },
  {
    id: 'hoodieSnake_2023',
    itemName: 'HOODIE SNAKE',
    img: 'assets/img/shop/shopHoodieSnakeLight.jpg',
    imgFront: 'assets/img/shop/2023_hoodie_front_Snake_light.png',
    imgBack: 'assets/img/shop/2023_hoodie_back_Snake_light.png',
    price: '42.50',
    descKey: 'detailsHoodieSnake',
    adress: 'https://eliminate.fr/produit/team-divergentes-hoodie-snake-2022/',
    new: true,
    vip: false
  },
  {
    id: 'hoodieMenpo_2023',
    itemName: 'HOODIE MENPŌ',
    img: 'assets/img/shop/shopHoodieMenpoLight.jpg',
    imgFront: 'assets/img/shop/2023_hoodie_front_Menpo_light.png',
    imgBack: 'assets/img/shop/2023_hoodie_back_Menpo_light.png',
    price: '42.50',
    descKey: 'detailsHoodieMenpo',
    adress: 'https://eliminate.fr/produit/team-divergentes-hoodie-menpo-2022/',
    new: true,
    vip: false
  }
];
