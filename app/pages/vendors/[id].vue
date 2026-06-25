<script setup lang="ts">
import { EXPENSE_TYPE_LABEL } from '~/utils/constants'

const route = useRoute()
const id = computed(() => String(route.params.id))
const vendors = useVendorsStore()
const dashboard = useDashboardStore()
const reports = useReportsStore()
const { currency, date } = useFormat()

await useAsyncData(`vendor-${id.value}`, () => vendors.fetchOne(id.value).then(() => true))
const detail = computed(() => vendors.current)
const s = computed(() => detail.value?.summary)

useHead(() => ({ title: `${detail.value?.vendor.name ?? 'Vendor'} — CINEASTA` }))

const tab = ref<'summary' | 'bills' | 'payments'>('summary')
const paying = ref(false)

async function onPaid() {
  paying.value = false
  await Promise.all([vendors.fetchOne(id.value), dashboard.fetch(true), reports.fetchAll(true)])
}
</script>

<template>
  <div class="space-y-4">
    <NuxtLink to="/finance?tab=vendors" class="inline-flex items-center gap-1 text-sm text-gray-500">
      <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
      Vendors
    </NuxtLink>

    <StateBlock :loading="vendors.detailLoading && !detail" :error="vendors.error" :rows="5" @retry="vendors.fetchOne(id)">
      <template v-if="detail && s">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-bold text-gray-900">{{ detail.vendor.name }}</h1>
            <span v-if="detail.vendor.category" class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">{{ detail.vendor.category }}</span>
          </div>
          <p class="text-sm text-gray-400">{{ detail.vendor.phone || detail.vendor.email || '—' }}</p>
        </div>

        <!-- summary cards -->
        <section class="grid grid-cols-3 gap-2">
          <div class="card p-3 text-center"><p class="text-[10px] uppercase tracking-wide text-gray-400">Billed</p><p class="mt-0.5 text-sm font-bold">{{ currency(s.totalBilled) }}</p></div>
          <div class="card p-3 text-center"><p class="text-[10px] uppercase tracking-wide text-gray-400">Paid</p><p class="mt-0.5 text-sm font-bold">{{ currency(s.totalPaid) }}</p></div>
          <div class="card p-3 text-center"><p class="text-[10px] uppercase tracking-wide text-gray-400">Due</p><p class="mt-0.5 text-sm font-bold" :class="s.due > 0 ? 'text-amber-600' : 'text-brand-600'">{{ currency(s.due) }}</p></div>
        </section>

        <button class="btn-primary w-full" @click="paying = true">+ Pay vendor</button>

        <!-- tabs -->
        <div class="flex rounded-xl bg-gray-100 p-1 text-sm font-medium">
          <button v-for="t in (['summary', 'bills', 'payments'] as const)" :key="t" class="flex-1 rounded-lg py-2.5 capitalize transition" :class="tab === t ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500'" @click="tab = t">{{ t }}</button>
        </div>

        <SectionCard v-if="tab === 'summary'" title="Summary">
          <dl class="divide-y divide-gray-100 text-sm">
            <div class="flex justify-between py-2"><dt class="text-gray-500">Total billed</dt><dd class="font-semibold">{{ currency(s.totalBilled) }}</dd></div>
            <div class="flex justify-between py-2"><dt class="text-gray-500">Total paid</dt><dd class="font-semibold">{{ currency(s.totalPaid) }}</dd></div>
            <div class="flex justify-between py-2"><dt class="text-gray-500">Outstanding due</dt><dd class="font-semibold" :class="s.due > 0 ? 'text-amber-600' : 'text-brand-600'">{{ currency(s.due) }}</dd></div>
            <div class="flex justify-between py-2"><dt class="text-gray-500">Bills</dt><dd class="font-semibold">{{ s.billCount }}</dd></div>
            <div class="flex justify-between py-2"><dt class="text-gray-500">Payments</dt><dd class="font-semibold">{{ s.paymentCount }}</dd></div>
          </dl>
        </SectionCard>

        <SectionCard v-else-if="tab === 'bills'" :title="`Bills (${detail.bills.length})`">
          <ul v-if="detail.bills.length" class="divide-y divide-gray-100">
            <li v-for="b in detail.bills" :key="b.id" class="py-2.5">
              <div class="flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-gray-800">{{ b.category }}</p>
                  <p class="text-xs text-gray-400">{{ EXPENSE_TYPE_LABEL[b.type] }} · {{ date(b.expense_date) }}</p>
                </div>
                <div class="shrink-0 text-right">
                  <p class="text-sm font-semibold text-gray-800">{{ currency(b.amount) }}</p>
                  <p class="text-[11px]" :class="b.due > 0 ? 'text-amber-600' : 'text-brand-600'">
                    {{ b.due > 0 ? `Due ${currency(b.due)}` : 'Paid' }}
                  </p>
                </div>
              </div>
              <AttachmentChips :items="b.attachments" />
            </li>
          </ul>
          <p v-else class="py-6 text-center text-sm text-gray-400">No bills from this vendor.</p>
        </SectionCard>

        <SectionCard v-else :title="`Payments (${detail.payments.length})`">
          <ul v-if="detail.payments.length" class="divide-y divide-gray-100">
            <li v-for="p in detail.payments" :key="p.id" class="py-2.5">
              <div class="flex items-center justify-between gap-2">
                <div><p class="text-sm font-medium text-gray-800">{{ date(p.payment_date) }}</p><p class="text-xs text-gray-400 capitalize">{{ p.payment_method }}<span v-if="p.notes"> · {{ p.notes }}</span></p></div>
                <div class="flex shrink-0 items-center gap-3">
                  <span class="text-sm font-semibold text-brand-600">{{ currency(p.amount) }}</span>
                  <NuxtLink :to="`/vendors/${id}/receipt/${p.id}`" class="text-xs font-medium text-gray-400 underline-offset-2 hover:underline">Receipt</NuxtLink>
                </div>
              </div>
              <AttachmentChips :items="p.attachments" />
            </li>
          </ul>
          <p v-else class="py-6 text-center text-sm text-gray-400">No payments yet.</p>
        </SectionCard>

        <AppModal v-if="paying" title="Pay Vendor" @close="paying = false">
          <VendorPaymentForm :vendor-id="id" :bills="detail.bills" @saved="onPaid" @cancel="paying = false" />
        </AppModal>
      </template>
    </StateBlock>
  </div>
</template>
