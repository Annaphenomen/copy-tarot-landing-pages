import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import QRCode from "qrcode";
import { CheckCircle2, Loader2, QrCode, Smartphone } from "lucide-react";

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

type Step = "contacts" | "qr" | "done";

export type OrderContacts = {
  name: string;
  contact: string;
  city: string;
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

  useEffect(() => {
    if (open) return undefined;

    const timer = setTimeout(() => {
      setStep("contacts");
      setQrDataUrl("");
      setChecking(false);
      setConsent(false);

    }, 250);
    return () => clearTimeout(timer);
  }, [open]);

  const startPayment = async (contacts: OrderContacts) => {
    const id = makeOrderId();
    setOrderId(id);
    const url = await QRCode.toDataURL(buildPaymentLink(id, total), {
      width: 512,
      margin: 1,
      color: { dark: "#0d1026", light: "#ffffff" },
    });
    setQrDataUrl(url);
    setStep("qr");
    void contacts;
  };

  const confirmPayment = () => {
    setChecking(true);
    // Проверка статуса заказа появится, когда подключим вебхук Сбера.
    setTimeout(() => {
      setChecking(false);
      setStep("done");
      onPaid();
    }, 1400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {step === "contacts" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Оформление заказа</DialogTitle>
              <DialogDescription>
                Заполните контакты — дальше оплатите по QR-коду через СберБанк Онлайн или СБП.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                void startPayment({
                  name: String(data.get("name") ?? ""),
                  contact: String(data.get("contact") ?? ""),
                  city: String(data.get("city") ?? ""),
                });
              }}
            >
              <Input required name="name" placeholder="Ваше имя" aria-label="Ваше имя" />
              <Input
                required
                name="contact"
                type="tel"
                placeholder="Телефон или e-mail"
                aria-label="Контакт"
              />
              <Input name="city" placeholder="Город доставки" aria-label="Город доставки" />

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
                Перейти к оплате — {total} ₽
              </Button>
            </form>

          </>
        )}

        {step === "qr" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Оплата по QR</DialogTitle>
              <DialogDescription>
                Заказ №{orderId} на {total} ₽. Отсканируйте код камерой телефона или приложением
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
                  <a href={buildPaymentLink(orderId, total)}>
                    <Smartphone className="mr-2 h-4 w-4" />
                    Открыть СберБанк Онлайн
                  </a>
                </Button>
                <Button className="w-full" size="lg" disabled={checking} onClick={confirmPayment}>
                  {checking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Проверяем оплату…
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
                Заказ №{orderId} принят. Мы свяжемся с вами, чтобы согласовать доставку.
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
