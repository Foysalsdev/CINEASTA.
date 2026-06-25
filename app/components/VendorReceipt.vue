<script setup lang="ts">
import type { Vendor, VendorPayment } from '~/types'

const props = withDefaults(
  defineProps<{
    vendor: Vendor
    payment: VendorPayment
    projectName?: string
    billLabel?: string
    billTotal?: number
    paidToDate?: number
    dueAfter?: number
  }>(),
  { projectName: '', billLabel: '', billTotal: 0, paidToDate: 0, dueAfter: 0 },
)
const { currency, date } = useFormat()

const generatedOn = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
const receiptNo = computed(() => props.payment.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase())
const hasBill = computed(() => (props.billTotal ?? 0) > 0)
</script>

<template>
  <article class="print-page mx-auto w-full max-w-[800px] bg-white p-8 text-gray-900">
    <!-- Brand header -->
    <header class="print-keep flex items-start justify-between border-b-2 border-brand-600 pb-5">
      <BrandMark :size="64" />
      <div class="text-right">
        <p class="text-lg font-bold">Payment Voucher</p>
        <p class="text-xs text-gray-400">No. {{ receiptNo }} · {{ generatedOn }}</p>
      </div>
    </header>

    <!-- Parties -->
    <section class="print-keep mt-6 grid grid-cols-2 gap-4 text-sm">
      <div>
        <p class="text-xs uppercase tracking-wide text-gray-400">Paid To</p>
        <p class="font-semibold">{{ vendor.name }}</p>
        <p v-if="vendor.category" class="text-gray-500">{{ vendor.category }}</p>
        <p v-if="vendor.phone || vendor.email" class="text-gray-500">{{ vendor.phone || vendor.email }}</p>
      </div>
      <div class="text-right">
        <p class="text-xs uppercase tracking-wide text-gray-400">Payment</p>
        <p class="font-semibold">{{ date(payment.payment_date) }}</p>
        <p class="capitalize text-gray-500">Method: {{ payment.payment_method }}</p>
        <p v-if="projectName" class="text-gray-500">Project: {{ projectName }}</p>
      </div>
    </section>

    <!-- Amount -->
    <section class="print-keep mt-6 flex items-center justify-between rounded-xl bg-brand-50 px-5 py-4 ring-1 ring-brand-100">
      <p class="text-sm font-medium text-brand-700">Amount Paid</p>
      <p class="text-2xl font-extrabold text-brand-700">{{ currency(payment.amount) }}</p>
    </section>

    <!-- Against bill -->
    <section v-if="hasBill" class="print-keep mt-6">
      <h2 class="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Against Bill</h2>
      <table class="w-full text-sm">
        <tbody>
          <tr class="border-b border-gray-100">
            <td class="py-1.5 text-gray-500">Description</td>
            <td class="py-1.5 text-right font-medium">{{ billLabel || '—' }}</td>
          </tr>
          <tr class="border-b border-gray-100">
            <td class="py-1.5 text-gray-500">Total Bill</td>
            <td class="py-1.5 text-right">{{ currency(billTotal) }}</td>
          </tr>
          <tr class="border-b border-gray-100">
            <td class="py-1.5 text-gray-500">Paid to date</td>
            <td class="py-1.5 text-right text-brand-600">{{ currency(paidToDate) }}</td>
          </tr>
          <tr class="border-b border-gray-100">
            <td class="py-1.5 font-medium text-gray-700">Due after this payment</td>
            <td class="py-1.5 text-right font-bold" :class="(dueAfter ?? 0) > 0 ? 'text-amber-600' : 'text-brand-600'">{{ currency(dueAfter) }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <p v-if="payment.notes" class="mt-4 text-sm text-gray-500">Note: {{ payment.notes }}</p>

    <!-- Signatures -->
    <section class="print-keep mt-12 grid grid-cols-2 gap-8 text-sm">
      <div class="border-t border-gray-300 pt-2 text-center text-gray-500">Received by</div>
      <div class="border-t border-gray-300 pt-2 text-center text-gray-500">Authorised by</div>
    </section>

    <footer class="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
      System-generated voucher from CINEASTA. · {{ generatedOn }}
    </footer>
  </article>
</template>
