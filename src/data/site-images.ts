import cardCover from "@/assets/card-cover.png.asset.json";
import tarotBox from "@/assets/product/tarot-box.jpg.asset.json";
import tarotSpread from "@/assets/product/tarot-spread.jpg.asset.json";
import tarotInHand from "@/assets/product/tarot-in-hand.jpg.asset.json";
import tarotFriends from "@/assets/product/tarot-friends.jpg.asset.json";
import tgQr from "@/assets/tg-qr-mystic.png.asset.json";
import wands8 from "@/assets/cards/wands-8.jpg.asset.json";
import wandsPage from "@/assets/cards/wands-page.jpg.asset.json";
import cups5 from "@/assets/cards/cups-5.jpg.asset.json";
import cupsPage from "@/assets/cards/cups-page.jpg.asset.json";
import cups4 from "@/assets/cards/cups-4.jpg.asset.json";
import swords5 from "@/assets/cards/swords-5.jpg.asset.json";
import star from "@/assets/cards/star.jpg.asset.json";
import moon from "@/assets/cards/moon.jpg.asset.json";
import world from "@/assets/cards/world.jpg.asset.json";
import sun from "@/assets/cards/sun.jpg.asset.json";
import pentacles9 from "@/assets/cards/pentacles-9.jpg.asset.json";
import pentaclesAce from "@/assets/cards/pentacles-ace.jpg.asset.json";
import temperance from "@/assets/cards/temperance.jpg.asset.json";
import { FULL_DECK } from "@/data/full-deck";

export interface SiteImage {
  url: string;
  title: string;
  caption: string;
}

const named: SiteImage[] = [
  {
    url: tarotBox.url,
    title: "Подарочная коробка колоды таро «Рофлан Судьбы»",
    caption: "Колода карт таро 78 арканов в подарочной коробке с инструкцией",
  },
  {
    url: tarotSpread.url,
    title: "Расклад таро колодой «Рофлан Судьбы»",
    caption: "Расклад таро на отношения авторской колодой из 78 карт",
  },
  {
    url: tarotInHand.url,
    title: "Карта таро в руках",
    caption: "Карты таро с ручными иллюстрациями — плотный картон, матовое покрытие",
  },
  {
    url: tarotFriends.url,
    title: "Гадание на таро в компании",
    caption: "Толкование карт таро для начинающих в компании друзей",
  },
  {
    url: cardCover.url,
    title: "Рубашка колоды таро «Рофлан Судьбы»",
    caption: "Обложка (рубашка) карт авторской колоды таро",
  },
  {
    url: tgQr.url,
    title: "QR-код Telegram-канала Таро Рофлан",
    caption: "QR-код на канал с толкованиями карт таро",
  },
  { url: wands8.url, title: "Восьмёрка жезлов", caption: "Значение карты таро Восьмёрка жезлов" },
  { url: wandsPage.url, title: "Паж жезлов", caption: "Значение карты таро Паж жезлов" },
  { url: cups5.url, title: "Пятёрка кубков", caption: "Значение карты таро Пятёрка кубков" },
  { url: cups4.url, title: "Четвёрка кубков", caption: "Значение карты таро Четвёрка кубков" },
  { url: cupsPage.url, title: "Паж кубков", caption: "Значение карты таро Паж кубков" },
  { url: swords5.url, title: "Пятёрка мечей", caption: "Значение карты таро Пятёрка мечей" },
  { url: pentacles9.url, title: "Девятка пентаклей", caption: "Значение карты таро Девятка пентаклей" },
  { url: pentaclesAce.url, title: "Туз пентаклей", caption: "Значение карты таро Туз пентаклей" },
  { url: temperance.url, title: "Умеренность", caption: "Значение карты таро Умеренность" },
  { url: star.url, title: "Звезда", caption: "Значение карты таро Звезда" },
  { url: moon.url, title: "Луна", caption: "Значение карты таро Луна" },
  { url: sun.url, title: "Солнце", caption: "Значение карты таро Солнце" },
  { url: world.url, title: "Мир", caption: "Значение карты таро Мир" },
];

const deck: SiteImage[] = FULL_DECK.map((card, index) => ({
  url: card.src,
  title: `${card.title} колоды таро «Рофлан Судьбы»`,
  caption: `Карта таро №${index + 1} из полной колоды 78 арканов «Рофлан Судьбы»`,
}));

const seen = new Set<string>();
export const SITE_IMAGES: SiteImage[] = [...named, ...deck].filter((image) => {
  const url = encodeURI(image.url);
  if (seen.has(url)) return false;
  seen.add(url);
  return true;
});

export const PRIMARY_IMAGES = named.slice(0, 5).map((image) => encodeURI(image.url));
