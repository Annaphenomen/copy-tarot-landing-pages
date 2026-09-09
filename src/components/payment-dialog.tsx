import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, MapPin, Package, QrCode, Search, Smartphone } from "lucide-react";

import sberQr from "@/assets/sber-pay-qr.png.asset.json";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  PICKUP_CITIES,
  calculateDeliveryPrice,
  createDeliveryOrder,
  searchPickupPoints,
} from "@/lib/yandex-delivery.functions";

type Step = "contacts" | "point" | "delivery" | "qr" | "done";


export type PickupPoint = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

export type OrderContacts = {
  name: string;
  contact: string;
  email: string;
};

function makeOrderId() {
  return `RS-${Date.now().toString().slice(-6)}`;
}

// Статический QR «Плати QR» от Сбера (СБП). Сумма вводится покупателем вручную.
const SBER_PAY_LINK = "https://qr.nspk.ru/AS2A007NG12ADJQV9RGR7RJ50PPHEO9M";

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  onPaid,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onPaid: () => void;
}) {
  const [step, setStep] = useState<Step>("contacts");
  const [orderId, setOrderId] = useState("");
  const [checking, setChecking] = useState(false);
  const [consent, setConsent] = useState(false);
  const [contacts, setContacts] = useState<OrderContacts | null>(null);
  const [, setBasePrice] = useState<number | null>(null);
  const [calculatingDelivery, setCalculatingDelivery] = useState(false);

  const [city, setCity] = useState<{ geoId: number; name: string }>({
    geoId: PICKUP_CITIES[0]!.geoId,
    name: PICKUP_CITIES[0]!.name,
  });
  const cityGeoId = city.geoId;
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState<{ geoId: number; name: string }[]>([]);
  const [searchingCity, setSearchingCity] = useState(false);
  const [pointQuery, setPointQuery] = useState("");
  const [points, setPoints] = useState<PickupPoint[]>([]);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<PickupPoint | null>(null);

  const findPoints = useServerFn(searchPickupPoints);
  const findCities = useServerFn(searchCities);

  const lookupCity = async () => {
    const query = cityQuery.trim();
    if (query.length < 2) return;
    setSearchingCity(true);
    try {
      const result = await findCities({ data: { query } });
      setCityResults(result.cities);
      if (result.cities.length === 0) {
        toast.info("Такой населённый пункт не найден. Проверьте написание.");
      }
    } catch (err) {
      toast.error("Не удалось найти населённый пункт. Попробуйте ещё раз.");
      console.error(err);
    } finally {
      setSearchingCity(false);
    }
  };

  const pickCity = (variant: { geoId: number; name: string }) => {
    setCity(variant);
    setCityResults([]);
    setCityQuery("");
    setPoints([]);
    setPointQuery("");
    setSelectedPoint(null);
    setBasePrice(null);
  };
  const calcDelivery = useServerFn(calculateDeliveryPrice);
  const createOrder = useServerFn(createDeliveryOrder);

  useEffect(() => {
    if (open) return undefined;

    const timer = setTimeout(() => {
      setStep("contacts");
      setChecking(false);
      setConsent(false);
      setContacts(null);
      setBasePrice(null);
      setCalculatingDelivery(false);
      setPoints([]);
      setPointQuery("");
      setSelectedPoint(null);
    }, 250);
    return () => clearTimeout(timer);
  }, [open]);




  const loadPoints = async (geoId: number) => {
    setLoadingPoints(true);
    try {
      const result = await findPoints({ data: { geoId } });
      setPoints(result.points);
      if (result.points.length === 0) {
        toast.info("В этом городе пока нет пунктов выдачи.");
      }
    } catch (err) {
      toast.error("Не удалось загрузить пункты выдачи. Попробуйте позже.");
      console.error(err);
    } finally {
      setLoadingPoints(false);
    }
  };

  // Список ПВЗ подгружается сразу при входе на шаг и при смене города.
  useEffect(() => {
    if (step !== "point") return;
    void loadPoints(cityGeoId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, cityGeoId]);

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[^a-zа-я0-9]+/gi, " ")
      .trim();

  const queryTokens = normalize(pointQuery).split(" ").filter(Boolean);
  // Поиск по первым буквам слов: «бес 3» найдёт «улица Бессонова, 3».
  const visiblePoints = points.filter((point) => {
    if (queryTokens.length === 0) return true;
    const words = normalize(`${point.name} ${point.address}`).split(" ").filter(Boolean);
    return queryTokens.every((token) =>
      words.some((word) => word.startsWith(token) || (token.length >= 3 && word.includes(token)))
    );
  });

  const startDeliveryCalculation = async (point: PickupPoint) => {
    setSelectedPoint(point);
    setCalculatingDelivery(true);
    try {
      const base = await calcDelivery({ data: { pickupPoint: point, tariff: "standard" } });
      setBasePrice(base.price);
      setStep("delivery");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Не удалось рассчитать доставку в этот пункт выдачи."
      );
      console.error(err);
    } finally {
      setCalculatingDelivery(false);
    }
  };


  const startPayment = () => {
    setOrderId(makeOrderId());
    setStep("qr");
  };

  const confirmPayment = async () => {
    if (!contacts || !selectedPoint) return;
    setChecking(true);
    try {
      await createOrder({
        data: {
          customerName: contacts.name,
          customerPhone: contacts.contact,
          customerEmail: contacts.email || undefined,
          pickupPoint: selectedPoint,
          tariff: "standard",
          orderNumber: orderId || undefined,
        },
      });
      setChecking(false);
      setStep("done");
      onPaid();
    } catch (err) {
      setChecking(false);
      toast.error("Оплата принята, но не удалось создать заявку на доставку. Мы свяжемся с вами.");
      console.error(err);
      setStep("done");
      onPaid();
    }
  };

  const finalTotal = total;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        {step === "contacts" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Оформление заказа</DialogTitle>
              <DialogDescription>
                Доставка в пункт выдачи Яндекс Доставки. Сначала — ваши контакты.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                setContacts({
                  name: String(data.get("name") ?? ""),
                  contact: String(data.get("contact") ?? ""),
                  email: String(data.get("email") ?? ""),
                });
                setStep("point");
              }}
            >
              <Input required name="name" placeholder="Ваше имя" aria-label="Ваше имя" />
              <Input
                required
                name="contact"
                type="tel"
                placeholder="Телефон"
                aria-label="Контактный телефон"
              />
              <Input name="email" type="email" placeholder="E-mail" aria-label="E-mail" />

              <label className="flex items-start gap-3 text-xs leading-relaxed text-muted-foreground">
                <Checkbox
                  className="mt-0.5"
                  checked={consent}
                  onCheckedChange={(value) => setConsent(value === true)}
                  aria-label="Согласие на обработку персональных данных"
                />
                <span>
                  Настоящим я, действуя свободно, своей волей и в своём интересе, даю согласие
                  Обществу с ограниченной ответственностью «ФЕНОМЕН» (ООО «ФЕНОМЕН»), ИНН
                  0800041461, на обработку (сбор, запись, систематизацию, накопление, хранение,
                  уточнение, извлечение, использование, обезличивание, блокирование, удаление,
                  уничтожение) своих персональных данных: фамилии, имени, отчества, контактного
                  телефона, адреса электронной почты и адреса доставки, — в целях оформления и
                  исполнения заказов и договоров купли-продажи. Согласие действует до его отзыва. Я
                  проинформирован о том, что могу отозвать своё согласие путём подачи письменного
                  заявления по адресу электронной почты Оператора. Я принимаю условия{" "}
                  <Link to="/offer" className="text-primary hover:underline">
                    публичной оферты
                  </Link>{" "}
                  и{" "}
                  <Link to="/privacy" className="text-primary hover:underline">
                    политики обработки персональных данных
                  </Link>
                  .
                </span>
              </label>

              <Button type="submit" className="w-full" size="lg" disabled={!consent}>
                Выбрать пункт выдачи
              </Button>
            </form>
          </>
        )}

        {step === "point" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Пункт выдачи</DialogTitle>
              <DialogDescription>
                Выберите город и найдите удобный ПВЗ — там вы заберёте колоду.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="rounded-xl border border-border/40 bg-secondary/30 p-3">
                <span className="block text-sm font-medium text-foreground">Базовая доставка</span>
                <span className="block text-xs text-muted-foreground">
                  Входит в стоимость заказа
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={cityQuery}
                    onChange={(e) => setCityQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void lookupCity();
                      }
                    }}
                    placeholder="Город, посёлок или село — например «Сысерть»"
                    aria-label="Населённый пункт"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void lookupCity()}
                    disabled={searchingCity || cityQuery.trim().length < 2}
                    aria-label="Найти населённый пункт"
                  >
                    {searchingCity ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {cityResults.length > 0 && (
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-border/40 p-1">
                    {cityResults.map((variant) => (
                      <button
                        key={variant.geoId}
                        type="button"
                        onClick={() => pickCity(variant)}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary/60"
                      >
                        {variant.name}
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Выбран пункт доставки: <span className="text-foreground">{city.name}</span>
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  value={pointQuery}
                  onChange={(e) => setPointQuery(e.target.value)}
                  placeholder="Начните вводить улицу, например «Бес»"
                  aria-label="Фильтр пунктов выдачи"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void loadPoints(cityGeoId)}
                  disabled={loadingPoints}
                  aria-label="Обновить список пунктов выдачи"
                >
                  {loadingPoints ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                {loadingPoints
                  ? "Загружаем пункты выдачи…"
                  : `Найдено пунктов: ${visiblePoints.length}`}
              </p>

              <div className="max-h-64 space-y-2 overflow-y-auto">
                {visiblePoints.slice(0, 100).map((point) => (
                  <button
                    key={point.id}
                    type="button"
                    disabled={calculatingDelivery}
                    onClick={() => void startDeliveryCalculation(point)}
                    className="flex w-full items-start gap-3 rounded-xl border border-border/40 p-3 text-left transition-colors hover:border-primary disabled:opacity-60"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-foreground">{point.name}</span>
                      <span className="block text-xs text-muted-foreground">{point.address}</span>
                    </span>
                  </button>
                ))}
                {visiblePoints.length > 100 && (
                  <p className="py-2 text-center text-xs text-muted-foreground">
                    Показаны первые 100 — уточните поиск по улице или дому.
                  </p>
                )}
                {visiblePoints.length === 0 && !loadingPoints && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Ничего не найдено — очистите фильтр или выберите другой город.
                  </p>
                )}
              </div>

              {calculatingDelivery && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Рассчитываем доставку…
                </p>
              )}

              <Button variant="outline" className="w-full" onClick={() => setStep("contacts")}>
                Назад
              </Button>
            </div>
          </>
        )}

        {step === "delivery" && selectedPoint && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Доставка в ПВЗ</DialogTitle>
              <DialogDescription>Стоимость доставки рассчитана до пункта выдачи.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3 rounded-xl border border-border/40 bg-secondary/30 p-4 text-sm">
              <div className="flex items-start gap-3">
                <Package className="mt-0.5 h-4 w-4 text-gold" />
                <div className="flex-1 space-y-1">
                  <p className="text-muted-foreground">Пункт выдачи</p>
                  <p className="font-medium text-foreground">{selectedPoint.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedPoint.address}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Товары</span>
                <span className="font-medium text-foreground">{total} ₽</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Доставка в ПВЗ</span>
                <span className="font-medium text-foreground">включена</span>
              </div>

              <div className="flex items-center justify-between text-base">
                <span className="font-medium text-foreground">Итого</span>
                <span className="font-display text-xl font-semibold text-foreground">
                  {finalTotal} ₽
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("point")}>
                Другой ПВЗ
              </Button>
              <Button className="flex-1" size="lg" onClick={startPayment}>
                Перейти к оплате
              </Button>
            </div>
          </>
        )}

        {step === "qr" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Оплата по QR</DialogTitle>
              <DialogDescription>
                Заказ №{orderId} на {finalTotal} ₽. Отсканируйте код камерой телефона или
                приложением банка.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-4">
              <a
                href={SBER_PAY_LINK}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Открыть оплату по QR"
                className="rounded-xl bg-white p-3"
              >
                <img
                  src={sberQr.url}
                  alt={`QR-код для оплаты заказа ${orderId}`}
                  className="h-52 w-52"
                />
              </a>

              <ol className="w-full space-y-2 rounded-xl border border-border/40 bg-secondary/30 p-4 text-xs leading-relaxed text-muted-foreground">
                <li>
                  <span className="font-medium text-foreground">1.</span> Наведите камеру телефона
                  на QR-код или откройте его в приложении банка.
                </li>
                <li>
                  <span className="font-medium text-foreground">2.</span> Введите сумму{" "}
                  <span className="font-medium text-foreground">{finalTotal} ₽</span> — код
                  универсальный, сумма не подставляется автоматически.
                </li>
                <li>
                  <span className="font-medium text-foreground">3.</span> В комментарии к платежу
                  укажите номер заказа{" "}
                  <span className="font-medium text-foreground">№{orderId}</span>.
                </li>
                <li>
                  <span className="font-medium text-foreground">4.</span> Подтвердите оплату и
                  нажмите «Я оплатил» — мы оформим доставку в выбранный ПВЗ.
                </li>
              </ol>

              <div className="flex w-full flex-col gap-2">
                <Button asChild variant="outline" className="w-full sm:hidden">
                  <a href={SBER_PAY_LINK} target="_blank" rel="noopener noreferrer">
                    <Smartphone className="mr-2 h-4 w-4" />
                    Открыть приложение банка
                  </a>
                </Button>
                <Button className="w-full" size="lg" disabled={checking} onClick={confirmPayment}>
                  {checking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Создаём заявку на доставку…
                    </>
                  ) : (
                    "Я оплатил"
                  )}
                </Button>
              </div>

              <Separator />
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <QrCode className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Оплата проходит через СБП на счёт ООО «ФЕНОМЕН». Мы проверим поступление по номеру
                заказа и сумме.
              </p>
            </div>
          </>
        )}

        {step === "done" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Спасибо за заказ!</DialogTitle>
              <DialogDescription>
                Заказ №{orderId} принят. Мы отправим колоду в выбранный пункт выдачи и пришлём код
                получения, как только посылка приедет.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle2 className="h-12 w-12 text-primary" />
              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  onOpenChange(false);
                  toast.success("Заказ оформлен");
                }}
              >
                Готово
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
