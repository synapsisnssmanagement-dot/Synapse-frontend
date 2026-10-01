"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, HandCoins, Lock, MapPin } from "lucide-react";
import { toast } from "sonner";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DateBlock from "@/components/ui/DateBlock";
import { Modal } from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Progress from "@/components/ui/Progress";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import cx from "@/lib/cx";
import { formatCurrency, formatDate } from "@/lib/format";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) : null;
const PRESETS = [500, 1000, 2500, 5000];
const MIN = 50;

const CARD_OPTIONS = {
  hidePostalCode: true,
  style: {
    base: { fontSize: "15px", color: "#0f172a", fontFamily: "system-ui, sans-serif", "::placeholder": { color: "#94a3b8" } },
    invalid: { color: "#dc2626" },
  },
};

function PaymentForm({ event, onDone }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [amount, setAmount] = useState("1000");
  const [message, setMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  const pay = async (e) => {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value < MIN) {
      toast.error(`The minimum donation is ${formatCurrency(MIN)}.`);
      return;
    }
    if (!stripe || !elements) return;
    setProcessing(true);
    try {
      const intent = await api.post("/api/donations/create-intent", { amount: value, eventId: event._id });
      const result = await stripe.confirmCardPayment(intent.data.clientSecret, { payment_method: { card: elements.getElement(CardElement) } });
      if (result.error) {
        toast.error(result.error.message);
        return;
      }
      if (result.paymentIntent?.status === "succeeded") {
        // amount and eventId are ignored by current servers (they read them from Stripe) but
        // are still sent so older backend deployments keep recording donations.
        await api.post("/api/donations/save", { eventId: event._id, amount: value, paymentId: result.paymentIntent.id, message: message.trim() });
        onDone();
        router.push(`/alumnilayout/success-donation?amount=${encodeURIComponent(value)}&eventName=${encodeURIComponent(event.title)}`);
      }
    } catch (error) {
      toast.error(errorMessage(error, "The payment didn't go through. You haven't been charged twice — try again."));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form id="donation-form" onSubmit={pay} className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-[13px] font-semibold text-fg">Amount</legend>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setAmount(String(p))}
              aria-pressed={Number(amount) === p}
              className={cx(
                "tabular h-11 rounded-lg border text-[14px] font-semibold transition-colors",
                Number(amount) === p ? "border-ink bg-ink text-white" : "border-line bg-paper text-fg hover:border-line-strong"
              )}
            >
              {formatCurrency(p)}
            </button>
          ))}
        </div>
        <label className="mt-3 flex h-11 items-center gap-2 rounded-lg border border-line bg-paper px-3.5 focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand/15">
          <span className="text-[15px] font-semibold text-muted">₹</span>
          <span className="sr-only">Custom amount</span>
          <input type="number" min={MIN} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} className="tabular h-full flex-1 bg-transparent text-[15px] outline-none" />
        </label>
        <p className="mt-1.5 text-[12.5px] text-muted">Minimum {formatCurrency(MIN)}.</p>
      </fieldset>
      <Textarea label="Message" rows={2} placeholder="A note for the volunteers (optional)" value={message} onChange={(e) => setMessage(e.target.value)} />
      <div>
        <p className="mb-2 text-[13px] font-semibold text-fg">Card</p>
        <div className="rounded-lg border border-line bg-paper px-3.5 py-3.5">
          <CardElement options={CARD_OPTIONS} />
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-muted">
          <Lock aria-hidden="true" className="size-3.5" /> Processed securely by Stripe. Card details never touch Synapsis.
        </p>
      </div>
      <Button type="submit" fullWidth size="lg" icon={HandCoins} loading={processing} disabled={!stripe}>
        {processing ? "Processing" : `Donate ${Number(amount) >= MIN ? formatCurrency(Number(amount)) : ""}`}
      </Button>
    </form>
  );
}

export default function Donation() {
  const events = useResource(() => api.get("/api/alumni/getalleventsalumniinstituition").then((res) => res.data?.events || []), []);
  const [giving, setGiving] = useState(null);

  const open = (events.data || []).filter((e) => e.donationOpen && e.status !== "Cancelled");
  const raised = (events.data || []).reduce((sum, e) => sum + (Number(e.totalCollected) || 0), 0);

  return (
    <>
      <PageHeader
        eyebrow="Giving"
        title="Support a drive"
        description="Give directly to an event your unit is running. Every rupee goes to that drive."
        meta={raised ? <span className="tabular font-semibold text-fg">{formatCurrency(raised)} raised across your institution</span> : null}
      />

      {!stripePromise ? (
        <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13.5px] text-amber-800">Online payments aren&apos;t configured yet. Please try again later.</p>
      ) : null}

      {events.loading ? (
        <CardGridSkeleton count={3} />
      ) : events.status === "error" ? (
        <ErrorState error={events.error} onRetry={events.reload} />
      ) : open.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {open.map((event) => (
            <li key={event._id} className="flex flex-col rounded-xl border border-line bg-paper p-5">
              <div className="flex items-start gap-3">
                <DateBlock date={event.date} size="sm" />
                <div className="min-w-0 flex-1">
                  <StatusBadge status={event.status} label={event.status === "Ongoing" ? "Live" : undefined} size="sm" />
                  <p className="mt-2 text-[15px] font-semibold leading-snug text-fg">{event.title}</p>
                </div>
              </div>
              {event.description ? <p className="mt-3 line-clamp-3 text-[14px] leading-relaxed text-fg-2">{event.description}</p> : null}
              <ul className="mt-3 space-y-1.5 text-[13px] text-muted">
                <li className="flex items-center gap-2">
                  <CalendarDays aria-hidden="true" className="size-3.5" /> {formatDate(event.date)}
                </li>
                <li className="flex items-center gap-2">
                  <MapPin aria-hidden="true" className="size-3.5" /> {event.location || "—"}
                </li>
              </ul>
              <div className="mt-auto pt-5">
                <p className="tabular text-xl font-semibold text-fg">{formatCurrency(Number(event.totalCollected) || 0)}</p>
                {event.donationGoal ? (
                  <Progress
                    value={Number(event.totalCollected) || 0}
                    max={event.donationGoal}
                    size="sm"
                    valueLabel={`of ${formatCurrency(event.donationGoal)} goal`}
                    className="mt-2"
                  />
                ) : (
                  <p className="text-[12.5px] text-muted">raised so far</p>
                )}
                <Button fullWidth className="mt-4" icon={HandCoins} disabled={!stripePromise} onClick={() => setGiving(event)}>
                  Donate
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={HandCoins} title="No drives are accepting donations" description="When a coordinator opens an event to donations, it will appear here." />
      )}

      <Modal open={Boolean(giving)} onClose={() => setGiving(null)} eyebrow="Donation" title={giving?.title || ""} description="Your gift goes to this drive.">
        {giving && stripePromise ? (
          <Elements stripe={stripePromise}>
            <PaymentForm event={giving} onDone={() => setGiving(null)} />
          </Elements>
        ) : null}
      </Modal>
    </>
  );
}
