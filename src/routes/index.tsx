import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShoppingCart,
  Star,
  Sparkles,
  Shield,
  Truck,
  BookOpen,
  ArrowRight,
  Minus,
  Plus,
  X,
  Quote,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PaymentDialog } from "@/components/payment-dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

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


const PRICE = 3333; // с доставкой

const CARDS = [
  { src: encodeURI(wands8.url), title: "Восьмёрка жезлов", caption: "Surprise, surprise" },
  { src: encodeURI(wandsPage.url), title: "Паж жезлов", caption: "Не пидиди — делай" },
  { src: encodeURI(cups5.url), title: "Пятёрка кубков", caption: "Страшно, очень страшно" },
  { src: encodeURI(cups4.url), title: "Четвёрка кубков", caption: "Пацан к успеху шёл" },
  {
    src: encodeURI(cupsPage.url),
    title: "Паж кубков",
    caption: "Мужчина определяется делом, а не словом",
  },
  { src: encodeURI(swords5.url), title: "Пятёрка мечей", caption: "Всё херня, давай по новой" },
  { src: encodeURI(pentacles9.url), title: "Девятка пентаклей", caption: "Намана" },
  { src: encodeURI(pentaclesAce.url), title: "Туз пентаклей", caption: "Охтыжнеможитбыть" },
  {
    src: encodeURI(temperance.url),
    title: "Умеренность",
    caption: "Я свою меру знаю: упал, значит хватит",
  },
  { src: encodeURI(star.url), title: "Звезда", caption: "А ты в шоке?" },
  { src: encodeURI(moon.url), title: "Луна", caption: "Лунная призма, дай мне силу" },
  { src: encodeURI(sun.url), title: "Солнце", caption: "И если есть порох, дай огня" },
  { src: encodeURI(world.url), title: "Мир", caption: "Покоя, умиротворения и вот этой гармонии" },
];


const HERO_CARD = CARDS[0]!;


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Рофлан Судьбы — авторская колода с иллюстрациями" },
      {
        name: "description",
        content:
          "Авторская колода Таро с ручными иллюстрациями и мемными подписями. Плотный картон, подарочная коробка, инструкция в комплекте. Цена 3333 ₽ с доставкой.",
      },
      { property: "og:title", content: "Рофлан Судьбы — авторская колода с иллюстрациями" },
      {
        property: "og:description",
        content:
          "Авторская колода Таро с ручными иллюстрациями и мемными подписями. Подарочная коробка и инструкция в комплекте.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: LandingPage,
});

const FAQS = [
  {
    question: "Какие карты входят в колоду Таро Рофлан Судьбы?",
    answer:
      "В нашей колоде таро 78 карт, включая все старшие арканы таро и младшие арканы. Это полноценная колода карт таро для гаданий, самопознания и весёлых вечеринок.",
  },
  {
    question: "Подойдёт ли эта колода для начинающих?",
    answer:
      "Да! Таро для начинающих — идеальный вариант, потому что к каждой карте идёт подробная инструкция со значением карт таро и примерами раскладов таро. А мемный стиль делает обучение лёгким и увлекательным.",
  },
  {
    question: "Можно ли использовать колоду для гадания на отношения?",
    answer:
      "Конечно! Таро на отношения — одно из главных направлений. Карты помогут разобраться в чувствах, мыслях партнёра и перспективах вашего союза. Отличный повод для вечеринки ведьмочек!",
  },
  {
    question: "Чем ваша колода отличается от классического Таро Уэйта?",
    answer:
      "В отличие от классического таро Уэйта, наша колода выполнена в современном мемном стиле. Это необычные карты таро, которые подходят для тех, кто устал от пафоса и хочет добавить юмор в эзотерику.",
  },
  {
    question: "Из чего сделаны карты?",
    answer:
      "Плотный картон с матовым покрытием — карты хорошо тасуются и не залипают. Иллюстрации нарисованы вручную.",
  },
  {
    question: "Сколько стоит и как оплатить?",
    answer:
      "Колода стоит 3333 ₽ с доставкой. Оставьте заказ на сайте — мы свяжемся с вами и согласуем оплату и доставку.",
  },
  {
    question: "Как быстро отправляете?",
    answer: "Отправляем в течение 1–2 рабочих дней после подтверждения заказа.",
  },
];

const REVIEWS = [
  {
    name: "Марина",
    role: "Таролог",
    text: "Беру эту колоду на консультации: таро на отношения заходит клиентам на ура. Сначала смеются над мемами, потом задумываются — и расклад получается честнее, чем на классике.",
  },
  {
    name: "Илья",
    role: "Купил в подарок",
    text: "Отличный вариант, если вы в таро для начинающих: инструкция объясняет значение карт таро простым языком. Полвечера читали подписи вслух, вторую половину — реально раскладывали.",
  },
  {
    name: "Катя",
    role: "Коллекционер колод",
    text: "Полные 78 карт таро, ручная иллюстрация, плотный картон и приятная коробка. Из всех необычных карт таро в моей коллекции эта — самая живая. Стоит своих денег.",
  },
  {
    name: "Ольга",
    role: "Вечеринки ведьмочек",
    text: "Давно хотела купить карты таро, но все колоды казались слишком серьезными. Таро Рофлан судьбы — это бомба! Мемы в каждой карте, удобная колода таро в красивой коробке. Отлично подходит для начинающих. С подругами устраиваем вечеринки ведьмочек — смех и магия одновременно! Рекомендую всем, кто ищет необычные карты таро!",
  },
  {
    name: "Алина",
    role: "Подарила подруге",
    text: "Отличная авторская колода таро! Я давно хотела купить колоду таро, но чтобы она была не скучной. Таро Рофлан судьбы — идеальный подарок для всех, кто интересуется эзотерикой с юмором. Карты классные, упаковка красивая. Всем советую!",
  },
  {
    name: "Настя",
    role: "Гадаем с друзьями",
    text: "Купила карты таро для себя и подруги. Это лучшее, что я видела! Значение карт таро написано понятно, даже если ты начинающий. А главное — мемы в каждой карте. Теперь на вечеринках мы гадаем и ржем. Спасибо создателям!",
  },
];

function Header({ cartCount, openCart }: { cartCount: number; openCart: () => void }) {
  const navLinks = [
    { label: "Колода", href: "#deck" },
    { label: "Карты", href: "#cards" },
    { label: "Отзывы", href: "#reviews" },
    { label: "Вопросы", href: "#faq" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#" className="font-display text-2xl font-semibold tracking-tight text-gradient-gold">
          Рофлан Судьбы
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-foreground"
            onClick={openCart}
            aria-label="Открыть корзину"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <a href="#deck">Купить</a>
          </Button>
        </div>
      </div>
    </header>
  );
}

function HeroSection({ onAddToCart }: { onAddToCart: () => void }) {
  return (
    <section className="relative overflow-hidden bg-midnight-glow px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="order-2 lg:order-1">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-secondary/50 px-3 py-1 text-xs font-medium uppercase tracking-wider text-gold">
            <Sparkles className="h-3 w-3" />
            Авторская колода
          </span>
          <h1 className="mt-6 font-display text-5xl leading-[1.1] text-foreground sm:text-6xl lg:text-7xl">
            Таро, которое говорит на вашем языке
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            Классические архетипы, нарисованные вручную, и подписи, которые попадают в самое сердце.
            Колода для гаданий, вечеринок и подарков.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              onClick={onAddToCart}
              className="px-8 text-lg font-semibold shadow-lg shadow-primary/20"
            >
              В корзину — {PRICE} ₽
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" asChild className="border-gold/30 hover:bg-gold/10">
              <a href="#cards">Посмотреть карты</a>
            </Button>
          </div>
          <div className="mt-8 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-gold text-gold" />
              ))}
              <span className="ml-1 font-medium text-foreground">4.9</span>
            </div>
            <span className="h-1 w-1 rounded-full bg-muted-foreground" />
            <span>Ручная иллюстрация каждой карты</span>
          </div>
        </div>

        <div className="order-1 flex justify-center lg:order-2">
          <div className="relative w-full max-w-sm">
            <div className="absolute -inset-6 rounded-full bg-gold/10 blur-3xl" />
            <img
              src={HERO_CARD.src}
              alt={`Карта «${HERO_CARD.title}» — ${HERO_CARD.caption}`}
              className="relative w-full rounded-2xl border border-gold/20 glow-gold"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const items = [
    { icon: Truck, label: "Отправка за 1–2 дня" },
    { icon: Shield, label: "Плотный матовый картон" },
    { icon: BookOpen, label: "Инструкция в комплекте" },
    { icon: Sparkles, label: "Подарочная коробка" },
  ];

  return (
    <section className="border-y border-border/40 bg-secondary/30 py-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 px-4 sm:px-6 lg:px-8">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3 text-sm">
            <item.icon className="h-5 w-5 text-gold" />
            <span className="font-medium text-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CardsSection() {
  return (
    <section id="cards" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-medium uppercase tracking-wider text-gold">Карты колоды</span>
          <h2 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
            Знакомые сюжеты, новые смыслы
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Все 78 карт колоды — каждая нарисована вручную и снабжена своей подписью. На сайте
            приведены образцы 13 карт.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((card) => (
            <figure
              key={card.title}
              className="group overflow-hidden rounded-2xl border border-border/40 bg-card transition-all hover:border-gold/40"
            >
              <div className="overflow-hidden">
                <img
                  src={card.src}
                  alt={`Карта «${card.title}» — ${card.caption}`}
                  className="aspect-[2/3] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <figcaption className="p-5">
                <h3 className="font-display text-xl text-card-foreground">{card.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">«{card.caption}»</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function RandomizerSection() {
  const [drawn, setDrawn] = useState<{ index: number; reversed: boolean; key: number } | null>(null);
  const [drawing, setDrawing] = useState(false);

  const draw = () => {
    setDrawing(true);
    window.setTimeout(() => {
      setDrawn((prev) => {
        let index = Math.floor(Math.random() * CARDS.length);
        if (prev && CARDS.length > 1) {
          while (index === prev.index) index = Math.floor(Math.random() * CARDS.length);
        }
        return { index, reversed: Math.random() < 0.5, key: (prev?.key ?? 0) + 1 };
      });
      setDrawing(false);
    }, 450);
  };

  const card = drawn ? CARDS[drawn.index]! : null;

  return (
    <section id="randomizer" className="bg-secondary/30 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <span className="text-sm font-medium uppercase tracking-wider text-gold">
          Карта дня
        </span>
        <h2 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
          Дать карту
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Задумайте вопрос и нажмите кнопку — колода вытянет одну случайную карту. Прямое или
          перевёрнутое положение выпадает так же, как в настоящем раскладе.
        </p>

        <div className="mt-12 flex flex-col items-center">
          <div className="relative flex aspect-[2/3] w-56 items-center justify-center overflow-hidden rounded-2xl border border-gold/30 bg-card sm:w-64">
            {card && !drawing ? (
              <img
                key={drawn!.key}
                src={card.src}
                alt={`Карта «${card.title}»${drawn!.reversed ? " (перевёрнутая)" : ""}`}
                className={`h-full w-full animate-scale-in object-cover ${
                  drawn!.reversed ? "rotate-180" : ""
                }`}
              />
            ) : (
              <div
                className={`flex h-full w-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_center,hsl(var(--gold)/0.18),transparent_70%)] ${
                  drawing ? "animate-pulse" : ""
                }`}
              >
                <Sparkles className="h-10 w-10 text-gold" />
                <span className="px-6 text-sm text-muted-foreground">
                  {drawing ? "Тасуем колоду…" : "Рубашка вверх"}
                </span>
              </div>
            )}
          </div>

          {card && !drawing && (
            <div className="mt-6 animate-fade-in">
              <h3 className="font-display text-2xl text-foreground">{card.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">«{card.caption}»</p>
              <p className="mt-2 text-xs uppercase tracking-wider text-gold">
                {drawn!.reversed ? "Перевёрнутая" : "Прямая"}
              </p>
            </div>
          )}

          <Button
            size="lg"
            onClick={draw}
            disabled={drawing}
            className="mt-8 bg-gold text-background hover:bg-gold/90"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {drawn ? "Ещё раз" : "Дать карту"}
          </Button>

          <p className="mt-4 text-xs text-muted-foreground">
            Сейчас в рандомайзере 13 карт-образцов. В колоде — все 78.
          </p>
        </div>
      </div>
    </section>
  );
}



function ProductSection({
  onAddToCart,
  cartCount,
  openCart,
}: {
  onAddToCart: () => void;
  cartCount: number;
  openCart: () => void;
}) {
  return (
    <section id="deck" className="bg-secondary/30 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="grid grid-cols-2 gap-4">
          {CARDS.slice(9, 13).map((card) => (
            <img
              key={card.title}
              src={card.src}
              alt={`Карта «${card.title}»`}
              className="w-full rounded-xl border border-border/40"
              loading="lazy"
            />
          ))}
        </div>



        <div>
          <span className="text-sm font-medium uppercase tracking-wider text-gold">Колода</span>
          <h2 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
            Рофлан Судьбы
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Авторская колода с ручными иллюстрациями и подписями, которые запоминаются с первого
            расклада. В комплекте — инструкция с трактовками и подарочная коробка.
          </p>

          <div className="mt-8 flex items-baseline gap-3">
            <span className="font-display text-5xl font-semibold text-foreground">{PRICE} ₽</span>
            <span className="rounded-full bg-gold/10 px-2.5 py-0.5 text-xs font-semibold text-gold">
              Доставка по России
            </span>
          </div>

          <ul className="mt-8 space-y-3">
            {[
              "Авторские иллюстрации ручной работы",
              "Подписи-трактовки прямо на картах",
              "Печатная инструкция с раскладами",
              "Подарочная коробка",
              "Плотный матовый картон",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-muted-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap gap-4">
            <Button size="lg" onClick={onAddToCart} className="px-8 text-lg font-semibold">
              В корзину
            </Button>
            {cartCount > 0 && (
              <Button
                size="lg"
                variant="outline"
                onClick={openCart}
                className="border-gold/30 hover:bg-gold/10"
              >
                Корзина ({cartCount})
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function AuthorAdviceSection({ onAddToCart }: { onAddToCart: () => void }) {
  return (
    <section id="advice" className="bg-midnight-glow px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="relative rounded-3xl border border-gold/20 bg-card/50 p-8 text-center sm:p-12 lg:p-16">
          <div className="absolute -top-6 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-gold/30 bg-background">
            <Quote className="h-5 w-5 text-gold" />
          </div>

          <span className="text-sm font-medium uppercase tracking-wider text-gold">От автора</span>
          <h2 className="mt-4 font-display text-4xl text-foreground sm:text-5xl">Батин совет</h2>
          <blockquote className="mt-8">
            <p className="font-display text-2xl leading-relaxed text-foreground sm:text-3xl">
              «Берите карту и смотрите в глаза — колода сама скажет, что к чему. Главное не
              переборщить: если выпал Король мечей, значит, ты не пройдёшь. Но ничего, другой раз
              точно зайдёт.»
            </p>
          </blockquote>
          <p className="mt-6 text-muted-foreground">— Создатель колоды «Рофлан Судьбы»</p>

          <div className="mt-10">
            <Button
              size="lg"
              onClick={onAddToCart}
              className="px-8 text-lg font-semibold shadow-lg shadow-primary/20"
            >
              Забрать колоду — {PRICE} ₽
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewsSection() {
  return (
    <section id="reviews" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl text-foreground sm:text-5xl">Что говорят владельцы</h2>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((review) => (
            <div key={review.name} className="rounded-2xl border border-border/40 bg-card p-6">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                ))}
              </div>
              <p className="mt-4 text-foreground">{review.text}</p>
              <div className="mt-6">
                <p className="font-display text-lg font-semibold text-foreground">{review.name}</p>
                <p className="text-sm text-muted-foreground">{review.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section id="faq" className="bg-secondary/30 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center font-display text-4xl text-foreground sm:text-5xl">
          Частые вопросы
        </h2>
        <Accordion type="single" collapsible className="mt-12">
          {FAQS.map((faq) => (
            <AccordionItem key={faq.question} value={faq.question}>
              <AccordionTrigger className="text-left font-display text-lg">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/40 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="font-display text-xl text-gradient-gold">Рофлан Судьбы</span>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <Link to="/offer" className="text-muted-foreground transition-colors hover:text-primary">
              Публичная оферта
            </Link>
            <Link
              to="/privacy"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Политика конфиденциальности
            </Link>
            <a
              href="mailto:phenomen.ooo@yandex.ru"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              phenomen.ooo@yandex.ru
            </a>
          </nav>
        </div>
        <div className="space-y-1 text-center text-xs text-muted-foreground sm:text-left">
          <p>ООО «ФЕНОМЕН», ОГРН 1260800005399, ИНН 0800041461</p>
          <p>
            359231, Республика Калмыкия, Черноземельский р-н, Артезианское с.п., п. Артезиан,
            пл. Торговая, д. 2, помещ. 8
          </p>
          <p>© {new Date().getFullYear()} Рофлан Судьбы. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}


function LandingPage() {
  const [quantity, setQuantity] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const addToCart = () => {
    setQuantity((q) => q + 1);
    setCartOpen(true);
    toast.success("Колода добавлена в корзину");
  };

  const total = quantity * PRICE;

  return (
    <div className="min-h-screen bg-background">
      <Header cartCount={quantity} openCart={() => setCartOpen(true)} />
      <main>
        <HeroSection onAddToCart={addToCart} />
        <TrustBar />
        <CardsSection />
        <ProductSection
          onAddToCart={addToCart}
          cartCount={quantity}
          openCart={() => setCartOpen(true)}
        />
        <AuthorAdviceSection onAddToCart={addToCart} />
        <ReviewsSection />
        <FaqSection />
      </main>
      <Footer />

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl">Корзина</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4">
            {quantity === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Корзина пуста</p>
            ) : (
              <div className="flex gap-4 py-4">
                <img
                  src={HERO_CARD.src}
                  alt="Рофлан Судьбы"
                  className="h-28 w-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Рофлан Судьбы</p>
                  <p className="text-sm text-muted-foreground">{PRICE} ₽</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setQuantity((q) => Math.max(0, q - 1))}
                      aria-label="Уменьшить"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setQuantity((q) => q + 1)}
                      aria-label="Увеличить"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto h-8 w-8"
                      onClick={() => setQuantity(0)}
                      aria-label="Удалить"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <SheetFooter>
            <Separator className="mb-4" />
            <div className="mb-4 flex items-center justify-between">
              <span className="text-muted-foreground">Итого</span>
              <span className="font-display text-2xl text-foreground">{total} ₽</span>
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={quantity === 0}
              onClick={() => {
                setCartOpen(false);
                setCheckoutOpen(true);
              }}
            >
              Оформить заказ
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <PaymentDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        total={total}
        onPaid={() => setQuantity(0)}
      />
    </div>
  );
}
