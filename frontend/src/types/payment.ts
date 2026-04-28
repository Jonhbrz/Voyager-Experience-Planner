/** Discriminated union for POST /api/payment/simulate — matches Laravel validation. */
export type PaymentPayload =
  | {
      method: 'card'
      payment_data: {
        holder_name: string
        card_number: string
        expiry: string
        cvv: string
      }
    }
  | {
      method: 'transfer'
      payment_data: {
        iban: string
        holder_name: string
        amount: string
      }
    }
