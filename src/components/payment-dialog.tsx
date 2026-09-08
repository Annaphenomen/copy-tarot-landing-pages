import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import QRCode from "qrcode";
import { CheckCircle2, Loader2, QrCode, Smartphone, Truck } from "lucide-react";

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
import { calculateDeliveryPrice, createDeliveryOrder } from "@/lib/yandex-delivery.functions";

type Step = "contacts" | "delivery" | "qr" | "done";

export type DeliveryMethod = "courier" | "express";

export type OrderContacts = {
  name: string;
  contact: string;
  city: string;
  addressFrom: string;
  addressTo: string;
  deliveryMethod: DeliveryMethod;
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
  const [deliveryPrice, setDeliveryPrice] = useState<number | null>(null);
  const [calculatingDelivery, setCalculatingDelivery] = useState(false);

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
      setDeliveryPrice(null);
      setCalculatingDelivery(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [open]);

  const startDeliveryCalculation = async (values: OrderContacts) => {
    setCalculatingDelivery(true);
    try {
      const result = await calcDelivery({
        data: {
          addressFrom: values.addressFrom,
          addressTo: values.addressTo,
        },
      });
      setContacts(values);
      setDeliveryPrice(result.price);
      setStep("delivery");
    } catch (err) {
      toast.error("Не удалось рассчитать доставку. Проверьте адреса и попробуйте снова.");
      console.error(err);
    } finally {
      setCalculatingDelivery(false);
    }
  };

  const startPayment = async () => {
    if (!contacts) return;
    const id = makeOrderId();
    setOrderId(id);
    const finalTotal = total + (deliveryPrice ?? 0);
    const url = await QRCode.toDataURL(buildPaymentLink(id, finalTotal), {
      width: 512,
      margin: 1,
      color: { dark: "#0d1026", light: "#ffffff" },
    });
    setQrDataUrl(url);
    setStep("qr");
  };

  const confirmPayment = async () => {
    if (!contacts) return;
    setChecking(true);
    try {
      await createOrder({
        data: {
          customerName: contacts.name,
          customerPhone: contacts.contact,
          customerEmail: contacts.city.includes("@") ? contacts.city : undefined,
          addressFrom: contacts.addressFrom,
          addressTo: contacts.addressTo,
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
      <DialogContent>
        {step === "contacts" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Оформление заказа</DialogTitle>
              <DialogDescription>
                Заполните контакты и адреса — рассчитаем стоимость доставки Яндекс Доставкой.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                void startDeliveryCalculation({
                  name: String(data.get("name") ?? ""),
                  contact: String(data.get("contact") ?? ""),
                  city: String(data.get("city") ?? ""),
                  addressFrom: String(data.get("addressFrom") ?? ""),
                  addressTo: String(data.get("addressTo") ?? ""),
                });
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
              <Input name="city" placeholder="Город доставки" aria-label="Город доставки" />
              <Input
                required
                name="addressFrom"
                placeholder="Адрес отправителя (откуда забирать)"
                aria-label="Адрес отправителя"
              />
              <Input
                required
                name="addressTo"
                placeholder="Адрес получателя (куда доставить)"
                aria-label="Адрес получателя"
              />

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

              <Button type="submit" className="w-full" size="lg" disabled={!consent || calculatingDelivery}>
                {calculatingDelivery ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Рассчитываем доставку…
                  </>
                ) : (
                  "Рассчитать доставку"
                )}
              </Button>
            </form>
          </>
        )}

        {step === "delivery" && contacts && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Доставка</DialogTitle>
              <DialogDescription>
                Стоимость доставки рассчитана по маршруту.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 rounded-xl border border-border/40 bg-secondary/30 p-4 text-sm">
              <div className="flex items-start gap-3">
                <Truck className="mt-0.5 h-4 w-4 text-gold" />
                <div className="flex-1 space-y-1">
                  <p className="text-muted-foreground">Откуда</p>
                  <p className="font-medium text-foreground">{contacts.addressFrom}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Truck className="mt-0.5 h-4 w-4 text-gold" />
                <div className="flex-1 space-y-1">
                  <p className="text-muted-foreground">Куда</p>
                  <p className="font-medium text-foreground">{contacts.addressTo}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Товары</span>
                <span className="font-medium text-foreground">{total} ₽</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Доставка</span>
                <span className="font-medium text-foreground">
                  {deliveryPrice !== null ? `${deliveryPrice} ₽` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-base">
                <span className="font-medium text-foreground">Итого</span>
                <span className="font-display text-xl font-semibold text-foreground">{finalTotal} ₽</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("contacts")}>
                Назад
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
                Заказ №{orderId} принят. Заявка на доставку создана — мы пришлём трек-номер, как только
                курьер заберёт посылку.
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
