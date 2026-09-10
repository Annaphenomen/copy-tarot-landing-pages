import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Политика обработки персональных данных — Рофлан Судьбы" },
      {
        name: "description",
        content:
          "Политика обработки и защиты персональных данных пользователей сайта ООО «ФЕНОМЕН» согласно 152-ФЗ.",
      },
      { property: "og:title", content: "Политика обработки персональных данных — Рофлан Судьбы" },
      {
        property: "og:description",
        content: "Как ООО «ФЕНОМЕН» собирает, хранит и защищает персональные данные покупателей.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://mystic-market-page.lovable.app/privacy" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://mystic-market-page.lovable.app/privacy" }],
  }),
  staticData: { sitemap: true },
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
        ← На главную
      </Link>
      <h1 className="mt-6 font-display text-3xl text-gradient-gold sm:text-4xl">
        Политика обработки персональных данных
      </h1>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-2">
          <h2 className="font-display text-xl text-foreground">1. Общие положения</h2>
          <p>
            1.1. Настоящая Политика определяет порядок обработки и защиты персональных данных
            физических лиц, являющихся пользователями сайта, ООО «ФЕНОМЕН» (далее — Оператор).
          </p>
          <p>
            1.2. Политика разработана в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О
            персональных данных» и является общедоступным документом, размещённым на Сайте.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl text-foreground">
            2. Цели сбора и обработки персональных данных
          </h2>
          <p>2.1. Оператор обрабатывает персональные данные в следующих целях:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>регистрация и оформление заказов на Сайте;</li>
            <li>осуществление продажи и доставки товаров Покупателям;</li>
            <li>
              информирование о статусе заказа, новостях и специальных предложениях (при наличии
              отдельного согласия на рассылку);
            </li>
            <li>улучшение качества обслуживания и работы Сайта.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl text-foreground">
            3. Перечень обрабатываемых персональных данных
          </h2>
          <p>
            3.1. Для достижения целей Политики Оператор обрабатывает следующие категории персональных
            данных покупателей:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>фамилия, имя, отчество;</li>
            <li>номер контактного телефона;</li>
            <li>адрес электронной почты (e-mail);</li>
            <li>адрес доставки товара.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl text-foreground">4. Правовые основания обработки</h2>
          <p>4.1. Обработка осуществляется на основании:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных»;</li>
            <li>
              согласия Пользователя на обработку персональных данных, выраженного путём проставления
              отметки в соответствующей форме на Сайте или совершения действий, направленных на
              приобретение товара.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl text-foreground">5. Порядок и условия обработки</h2>
          <p>
            5.1. Обработка осуществляется смешанным способом (как с использованием средств
            автоматизации, так и без их использования) в течение срока, необходимого для достижения
            целей обработки, но не более 5 лет, если иное не предусмотрено договором или законом.
          </p>
          <p>
            5.2. Оператор вправе привлекать для обработки данных третьих лиц (платёжные системы,
            службы доставки, сервисы электронной почты), которые обязуются обеспечивать их
            конфиденциальность.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl text-foreground">
            6. Права субъектов персональных данных
          </h2>
          <p>6.1. Покупатель вправе:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>получить информацию, касающуюся обработки его персональных данных;</li>
            <li>
              требовать уточнения, блокирования или уничтожения своих персональных данных в случае,
              если они являются неполными, устаревшими, недостоверными или полученными незаконно.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl text-foreground">7. Контактная информация</h2>
          <p>
            По всем вопросам, связанным с обработкой персональных данных, можно обращаться по e-mail:{" "}
            <a className="text-primary hover:underline" href="mailto:taroroflan@ya.ru">
              taroroflan@ya.ru
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
