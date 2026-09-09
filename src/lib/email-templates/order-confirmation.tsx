import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

export interface OrderConfirmationProps {
  customerName?: string
  orderNumber?: string
  total?: string
  pickupPoint?: string
  contactEmail?: string
}

export function OrderConfirmationEmail({
  customerName = 'Друг',
  orderNumber = 'RS-000000',
  total = '3333 ₽',
  pickupPoint = 'пункт выдачи Яндекс Доставки',
  contactEmail = 'taroroflan@ya.ru',
}: OrderConfirmationProps) {
  return (
    <Html lang="ru">
      <Head />
      <Preview>{`Заказ ${orderNumber} оформлен — Таро Рофлан`}</Preview>
      <Body style={{ backgroundColor: '#0d0b14', fontFamily: 'Arial, sans-serif', margin: 0 }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }}>
          <Heading style={{ color: '#e8c87a', fontSize: '22px', margin: '0 0 16px' }}>
            Заказ оформлен 🔮
          </Heading>
          <Text style={{ color: '#e7e3f0', fontSize: '15px', lineHeight: '24px' }}>
            Здравствуйте, {customerName}! Спасибо за заказ — мы уже готовим колоду к отправке.
          </Text>
          <Section style={{ backgroundColor: '#171327', borderRadius: '10px', padding: '16px' }}>
            <Text style={{ color: '#e7e3f0', fontSize: '14px', margin: '0 0 6px' }}>
              <strong>Номер заказа:</strong> {orderNumber}
            </Text>
            <Text style={{ color: '#e7e3f0', fontSize: '14px', margin: '0 0 6px' }}>
              <strong>Товар:</strong> Колода Таро Рофлан — 1 шт.
            </Text>
            <Text style={{ color: '#e7e3f0', fontSize: '14px', margin: '0 0 6px' }}>
              <strong>Сумма:</strong> {total} (доставка включена)
            </Text>
            <Text style={{ color: '#e7e3f0', fontSize: '14px', margin: 0 }}>
              <strong>Пункт выдачи:</strong> {pickupPoint}
            </Text>
          </Section>
          <Hr style={{ borderColor: '#2a2340', margin: '24px 0' }} />
          <Text style={{ color: '#b9b2cc', fontSize: '14px', lineHeight: '22px' }}>
            Яндекс Доставка пришлёт вам отдельное сообщение о том, что посылка передана и едет
            в выбранный пункт выдачи, а также код для получения.
          </Text>
          <Text style={{ color: '#b9b2cc', fontSize: '14px', lineHeight: '22px' }}>
            Любые вопросы — просто ответьте на это письмо или напишите на {contactEmail}.
          </Text>
          <Text style={{ color: '#e8c87a', fontSize: '14px', marginTop: '24px' }}>
            С теплом, команда Таро Рофлан
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: OrderConfirmationEmail,
  displayName: 'Подтверждение заказа (клиенту)',
  subject: (data: Record<string, any>) =>
    `Заказ ${data['orderNumber'] ?? ''} оформлен — Таро Рофлан`.replace('  ', ' '),
  previewData: {
    customerName: 'Анна',
    orderNumber: 'RS-123456',
    total: '3333 ₽',
    pickupPoint: 'Уфа, улица Бессонова, 3',
    contactEmail: 'taroroflan@ya.ru',
  },
} satisfies TemplateEntry
