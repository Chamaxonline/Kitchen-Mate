"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ChefHat, Minus, Plus, ShoppingBag } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import {
  confirmGuestPayment,
  createGuestPayment,
  demoGuestPay,
  fetchGuestOrder,
  getGuestMenu,
  syncGuestOrder,
  type GuestMenu,
  type GuestOrder,
} from "@/lib/publicApi";
import { CookTimeBadge } from "@/components/CookTimeBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { estimateOrderCookMinutes, formatCookTime } from "@/lib/cookTime";
import type { CartLine } from "@/lib/types";

function StripePayForm({
  tenantSlug,
  tableNumber,
  onPaid,
}: {
  tenantSlug: string;
  tableNumber: string;
  onPaid: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });
      if (result.error) throw new Error(result.error.message ?? "Payment failed.");
      const intentId = result.paymentIntent?.id;
      if (!intentId) throw new Error("Payment was not completed.");
      await confirmGuestPayment(tenantSlug, tableNumber, intentId);
      onPaid();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={!stripe || loading} fullWidth size="lg">
        {loading ? "Processing..." : "Pay bill"}
      </Button>
    </form>
  );
}

export default function GuestOrderPage() {
  const params = useParams();
  const tenantSlug = String(params.slug);
  const tableNumber = String(params.number);

  const [menu, setMenu] = useState<GuestMenu | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paidMessage, setPaidMessage] = useState<string | null>(null);
  const [placedMessage, setPlacedMessage] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(true);
  const [showPay, setShowPay] = useState(false);

  const stripePromise = useMemo(
    () =>
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
        : null,
    [],
  );

  useEffect(() => {
    Promise.all([getGuestMenu(tenantSlug, tableNumber), fetchGuestOrder(tenantSlug, tableNumber)])
      .then(([menuData, order]) => {
        setMenu(menuData);
        if (order) {
          setCart(
            order.items.map((item) => ({
              menuItemId: item.menuItemId,
              name: item.menuItemName,
              price: item.unitPrice,
              cookTimeMinutes: item.cookTimeMinutes,
              quantity: item.quantity,
            })),
          );
          setNotes(order.notes ?? "");
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tenantSlug, tableNumber]);

  function addItem(item: {
    id: string;
    name: string;
    price: number;
    cookTimeMinutes: number;
  }) {
    setPaidMessage(null);
    setPlacedMessage(null);
    setCart((prev) => {
      const existing = prev.find((line) => line.menuItemId === item.id);
      if (existing) {
        return prev.map((line) =>
          line.menuItemId === item.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          cookTimeMinutes: item.cookTimeMinutes,
          quantity: 1,
        },
      ];
    });
  }

  function updateQty(menuItemId: string, delta: number) {
    setPaidMessage(null);
    setPlacedMessage(null);
    setCart((prev) =>
      prev
        .map((line) =>
          line.menuItemId === menuItemId ? { ...line, quantity: line.quantity + delta } : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  const total = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const estCook = estimateOrderCookMinutes(cart);

  async function saveOrder(): Promise<GuestOrder | null> {
    if (cart.length === 0) {
      setError("Add at least one item.");
      return null;
    }
    setSyncing(true);
    setError(null);
    try {
      const order = await syncGuestOrder(tenantSlug, tableNumber, {
        items: cart.map((line) => ({ menuItemId: line.menuItemId, quantity: line.quantity })),
        notes: notes || null,
      });
      return order;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save order.");
      return null;
    } finally {
      setSyncing(false);
    }
  }

  async function handlePlaceOrder() {
    const saved = await saveOrder();
    if (!saved) return;
    setPlacedMessage("Order placed! Add more items anytime. Pay when you're ready to leave.");
  }

  async function handlePayBillClick() {
    const saved = await saveOrder();
    if (!saved) return;

    try {
      const payment = await createGuestPayment(tenantSlug, tableNumber);
      if (payment.demoMode) {
        setDemoMode(true);
        setShowPay(true);
        return;
      }
      setDemoMode(false);
      setClientSecret(payment.clientSecret);
      setShowPay(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment setup failed.");
    }
  }

  async function handleDemoPay() {
    try {
      await demoGuestPay(tenantSlug, tableNumber);
      setCart([]);
      setNotes("");
      setShowPay(false);
      setClientSecret(null);
      setPaidMessage("Payment received. Thank you! You can order again anytime.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed.");
    }
  }

  function handleStripePaid() {
    setCart([]);
    setNotes("");
    setShowPay(false);
    setClientSecret(null);
    setPaidMessage("Payment received. Thank you! You can order again anytime.");
  }

  if (loading) return <LoadingState label="Loading menu..." />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-light to-background">
      <header className="border-b border-border bg-surface/90 px-4 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white">
            <ChefHat className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-stone-900">{menu?.restaurantName}</p>
            <p className="text-sm text-muted">Table {tableNumber} · Order now, pay when you leave</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 px-4 py-6 pb-28">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {paidMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {paidMessage}
          </div>
        )}
        {placedMessage && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {placedMessage}
          </div>
        )}

        {menu?.categories.map((category) => (
          <Card key={category.id}>
            <h2 className="mb-3 text-lg font-bold text-stone-900">{category.name}</h2>
            <div className="space-y-2">
              {category.items
                .filter((item) => item.isAvailable)
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addItem(item)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-stone-50 p-3 text-left transition hover:border-brand"
                  >
                    <div>
                      <p className="font-semibold text-stone-900">{item.name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm font-bold text-brand">${item.price.toFixed(2)}</span>
                        <CookTimeBadge minutes={item.cookTimeMinutes} />
                      </div>
                    </div>
                    <Plus className="h-5 w-5 shrink-0 text-brand" />
                  </button>
                ))}
            </div>
          </Card>
        ))}

        {cart.length > 0 && (
          <Card className="sticky bottom-4 border-brand/30 shadow-lg">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-stone-900">
              <ShoppingBag className="h-5 w-5 text-brand" />
              Your order
            </h2>
            <ul className="space-y-2">
              {cart.map((line) => (
                <li key={line.menuItemId} className="flex items-center justify-between rounded-lg bg-stone-50 p-2">
                  <span className="text-sm font-medium">{line.name}</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => updateQty(line.menuItemId, -1)} className="rounded bg-white p-1">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-5 text-center font-bold">{line.quantity}</span>
                    <button type="button" onClick={() => updateQty(line.menuItemId, 1)} className="rounded bg-brand p-1 text-white">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {estCook > 0 && (
              <p className="mt-3 text-sm text-amber-800">Estimated kitchen time: {formatCookTime(estCook)}</p>
            )}

            <div className="mt-3 flex justify-between border-t border-border pt-3 font-bold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            {!showPay ? (
              <div className="mt-4 space-y-2">
                <Button fullWidth size="lg" onClick={handlePlaceOrder} disabled={syncing}>
                  {syncing ? "Saving..." : "Place order"}
                </Button>
                <Button variant="ghost" fullWidth onClick={handlePayBillClick} disabled={syncing}>
                  Pay when you leave
                </Button>
              </div>
            ) : demoMode ? (
              <Button className="mt-4" fullWidth size="lg" onClick={handleDemoPay}>
                Complete demo payment
              </Button>
            ) : clientSecret && stripePromise ? (
              <div className="mt-4">
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripePayForm
                    tenantSlug={tenantSlug}
                    tableNumber={tableNumber}
                    onPaid={handleStripePaid}
                  />
                </Elements>
              </div>
            ) : null}
          </Card>
        )}
      </main>
    </div>
  );
}
