import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import QRCode from "qrcode";
import { CheckCircle2, Loader2, MapPin, Package, QrCode, Search, Smartphone } from "lucide-react";

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

type Tariff = "standard" | "express";

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

// Заглушка платёжной ссылки СБП: заменится на ответ API «Плати QR» от Сбера,
// когда будут получены ключи мерчанта.
function buildPaymentLink(orderId: string, amount: number) {
  return `https://qr.nspk.ru/demo?order=${orderId}&sum=${amount * 100}&cur=RUB`;
}

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
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [checking, setChecking] = useState(false);
  const [consent, setConsent] = useState(false);
  const [contacts, setContacts] = useState<OrderContacts | null>(null);
  const [basePrice, setBasePrice] = useState<number | null>(null);
  const [expressPrice, setExpressPrice] = useState<number | null>(null);
  const [tariff, setTariff] = useState<Tariff>("standard");
  const [calculatingDelivery, setCalculatingDelivery] = useState(false);

  const [cityGeoId, setCityGeoId] = useState<number>(PICKUP_CITIES[0]!.geoId);
  const [pointQuery, setPointQuery] = useState("");
  const [points, setPoints] = useState<PickupPoint[]>([]);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<PickupPoint | null>(null);

  const findPoints = useServerFn(searchPickupPoints);
  const calcDelivery = useServerFn(calculateDeliveryPrice);
  const createOrder = useServerFn(createDeliveryOrder);

  useEffect(() => {
    if (open) return undefined;

    const timer = setTimeout(() => {
      setStep("contacts");
      setQrDataUrl("");
      setChecking(false);
      setConsent(false);
      setContacts(null);
      setBasePrice(null);
      setExpressPrice(null);
      setCalculatingDelivery(false);
      setPoints([]);
      setPointQuery("");
      setSelectedPoint(null);
    }, 250);
    return () => clearTimeout(timer);
  }, [open]);

  const loadPoints = async () => {
    setLoadingPoints(true);
    try {
      const result = await findPoints({ data: { geoId: cityGeoId, query: pointQuery } });
      setPoints(result.points);
      if (result.points.length === 0) {
        toast.info("Пункты выдачи не найдены. Попробуйте другой адрес или город.");
      }
    } catch (err) {
      toast.error("Не удалось загрузить пункты выдачи. Попробуйте позже.");
      console.error(err);
    } finally {
      setLoadingPoints(false);
    }
  };

  const startDeliveryCalculation = async (point: PickupPoint) => {
    setSelectedPoint(point);
    setCalculatingDelivery(true);
    try {
      const base = await calcDelivery({ data: { pickupPoint: point, tariff: "standard" } });
      setBasePrice(base.price);
      let express: number | null = null;
      try {
        const fast = await calcDelivery({ data: { pickupPoint: point, tariff: "express" } });
        express = fast.price;
      } catch {
        express = null;
      }
      setExpressPrice(express);
      if (express === null && tariff === "express") setTariff("standard");
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


  const startPayment = async () => {
    const id = makeOrderId();
    setOrderId(id);
    const nextTotal = total + (deliveryPrice ?? 0);
    const url = await QRCode.toDataURL(buildPaymentLink(id, nextTotal), {
      width: 512,
      margin: 1,
      color: { dark: "#0d1026", light: "#ffffff" },
    });
    setQrDataUrl(url);
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
          tariff,
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

  const finalTotal = total + (deliveryPrice ?? 0);

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
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: "standard", title: "Базовая", hint: "Дешевле, 2–7 дней" },
                    { id: "express", title: "Экспресс", hint: "Быстрее, дороже" },
                  ] as { id: Tariff; title: string; hint: string }[]
                ).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTariff(option.id)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      tariff === option.id
                        ? "border-primary bg-primary/10"
                        : "border-border/40 hover:border-primary/50"
                    }`}
                  >
                    <span className="block text-sm font-medium text-foreground">{option.title}</span>
                    <span className="block text-xs text-muted-foreground">{option.hint}</span>
                  </button>
                ))}
              </div>


              <select
                value={cityGeoId}
                onChange={(e) => {
                  setCityGeoId(Number(e.target.value));
                  setPoints([]);
                }}
                aria-label="Город"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                {PICKUP_CITIES.map((city) => (
                  <option key={city.geoId} value={city.geoId}>
                    {city.name}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <Input
                  value={pointQuery}
                  onChange={(e) => setPointQuery(e.target.value)}
                  placeholder="Улица или название ПВЗ"
                  aria-label="Поиск пункта выдачи"
                />
                <Button type="button" variant="outline" onClick={loadPoints} disabled={loadingPoints}>
                  {loadingPoints ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="max-h-64 space-y-2 overflow-y-auto">
                {points.map((point) => (
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
                {points.length === 0 && !loadingPoints && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Нажмите поиск, чтобы увидеть пункты выдачи в выбранном городе.
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
                <span className="text-muted-foreground">
                  {tariff === "express" ? "Экспресс-доставка" : "Базовая доставка"}
                </span>
                <span className="font-medium text-foreground">
                  {deliveryPrice !== null ? `${deliveryPrice} ₽` : "—"}
                </span>
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
                Заказ №{orderId} на {finalTotal} ₽. Отсканируйте код камерой телефона или приложением
                СберБанк Онлайн.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-4">
              <div className="rounded-xl bg-white p-3">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt={`QR-код для оплаты заказа ${orderId}`} className="h-52 w-52" />
                ) : (
                  <div className="flex h-52 w-52 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex w-full flex-col gap-2">
                <Button asChild variant="outline" className="w-full sm:hidden">
                  <a href={buildPaymentLink(orderId, finalTotal)}>
                    <Smartphone className="mr-2 h-4 w-4" />
                    Открыть СберБанк Онлайн
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
                Сейчас это тестовый QR: реальные платежи заработают после подключения «Плати QR» от
                Сбера и ключей мерчанта.
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
