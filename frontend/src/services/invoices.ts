import api from '@/services/api'

export interface UserInvoice {
  id: number
  amount: number
  plan: 'premium' | 'free'
  created_at: string
}

export async function fetchMyInvoices(): Promise<UserInvoice[]> {
  const res = await api.get('/invoices')
  return res.data.data.invoices as UserInvoice[]
}

export async function downloadInvoicePdf(invoiceId: number): Promise<void> {
  const res = await api.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' })
  const blob = res.data as Blob
  const disposition = res.headers['content-disposition'] as string | undefined
  let filename = `invoice-${invoiceId}.pdf`
  if (disposition) {
    const m = /filename[^;=\n]*=(?:"([^"\n]*)"|([^;\n]*))/.exec(disposition)
    const raw = (m?.[1] ?? m?.[2] ?? '').trim()
    if (raw) filename = raw
  }
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}
