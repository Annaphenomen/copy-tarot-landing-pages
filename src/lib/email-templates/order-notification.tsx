import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'
import { ORDER_NOTIFICATION_EMAIL } from '@/lib/email-config'

export interface OrderNotificationProps {
  orderNumber?: string
  orderSeq?: string
  orderId?: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  pickupPoint?: string
  dropoffPoint?: string
  total?: string
  deliveryPrice?: string
  comment?: string
  claimId?: string
  createdAt?: string
}

const cell: React.CSSProperties = {
  border: '1px solid #d8d3e6',
  padding: '6px 10px',
  fontSize: '13px',
  color: '#191527',
}

function TRow({ label, value }: { label: string; value: string }) {
  return (
    <Row>
      <Column style={{ ...cell, background: '#f4f1fa', width: '35%' }}>{label}</Column>
      <Column style={cell}>{value}</Column>
    </Row>
  )
}

export function OrderNotificationEmail({
  orderNumber = 'RS-000',
  orderSeq = '—',
  orderId = '—',
  customerName = '—',
  customerPhone = '—',
  customerEmail = '—',
  pickupPoint = '—',
  dropoffPoint = '—',
  total = '3333 ₽',
  deliveryPrice = '—',
  comment = '—',
  claimId = '—',
  createdAt = '—',
}: OrderNotificationProps) {
  const tsv = [
    orderNumber,
    orderSeq,
    createdAt,
    customerName,
    customerPhone,
    customerEmail,
    pickupPoint,
    dropoffPoint,
    total,
    deliveryPrice,
    claimId,
    comment,
  ].join('\t')

  return (
    <Html lang="ru">
      <Head />
      <Preview>{`Новый заказ ${orderNumber} — ${total}`}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0 }}>
        <Container style={{ maxWidth: '640px', margin: '0 auto', padding: '24px' }}>
          <Heading style={{ fontSize: '18px', margin: '0 0 16px' }}>
            Новый заказ {orderNumber}
          </Heading>
          <Section>
            <TRow label="Номер заказа" value={orderNumber} />
            <TRow label="Заказ по счёту" value={orderSeq} />
            <TRow label="Дата" value={createdAt} />
            <TRow label="Клиент" value={customerName} />
            <TRow label="Телефон" value={customerPhone} />
            <TRow label="Email" value={customerEmail} />
            <TRow label="Пункт выдачи" value={pickupPoint} />
            <TRow label="Сдаём посылку" value={dropoffPoint} />
            <TRow label="Сумма заказа" value={total} />
            <TRow label="Стоимость доставки" value={deliveryPrice} />
            <TRow label="Заявка Яндекс" value={claimId} />
            <TRow label="Комментарий" value={comment} />
            <TRow label="ID в базе" value={orderId} />
          </Section>
          <Text style={{ fontSize: '12px', color: '#6b6580', marginTop: '20px' }}>
            Строка для вставки в Excel (скопируйте и вставьте — разложится по столбцам):
          </Text>
          <Text
            style={{
              fontFamily: 'monospace',
              fontSize: '12px',
              background: '#f4f1fa',
              padding: '10px',
              whiteSpace: 'pre',
            }}
          >
            {tsv}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: OrderNotificationEmail,
  displayName: 'Новый заказ (владельцу)',
  to: ORDER_NOTIFICATION_EMAIL,
  subject: (data: Record<string, any>) =>
    `Новый заказ ${data['orderNumber'] ?? ''} — ${data['total'] ?? ''}`,
  previewData: {
    orderNumber: 'RS-137',
    orderSeq: '1',
    orderId: '7f3c1e2a-0000-4000-8000-000000000000',
    customerName: 'Анна Феномен',
    customerPhone: '+7 900 000-00-00',
    customerEmail: 'client@example.com',
    pickupPoint: 'Уфа, улица Бессонова, 3',
    dropoffPoint: 'Пермь, улица Революции, 52',
    total: '3333 ₽',
    deliveryPrice: '386 ₽',
    comment: '—',
    claimId: 'claim-123',
    createdAt: '09.09.2026 20:15',
  },
} satisfies TemplateEntry
