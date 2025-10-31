import type { Orders, Course, Organization, OrderItems } from '$lib/utils/types';
import { supabase } from '$lib/utils/functions/supabase.server';
import Stripe from 'stripe';

export class OrderService {
  stripeSessionId: string;
  email: string;

  constructor(stripeSessionId: string, email: string) {
    this.stripeSessionId = stripeSessionId;
    this.email = email;
  }

  async createOrder(orderItems: OrderItems[]) {
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        stripe_checkout_session_id: this.stripeSessionId,
        email: this.email,
        status: 'pending',
        total_amount: orderItems.reduce((sum, c) => sum + c.price_at_purchase, 0),
        currency: 'USD'
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw new Error(`${orderError}`);
    }

    const { error: orderItemsError } = await supabase.from('order_items').insert(
      orderItems.map((item) => ({
        ...item,
        order_id: newOrder.id
      }))
    );

    if (orderItemsError) {
      console.error('Error creating order items:', orderItemsError);
      throw new Error(`${orderItemsError}`);
    }
  }

  async markOrderComplete(session: Stripe.Checkout.Session) {
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        stripe_payment_intent_id: session.payment_intent as string
      })
      .eq('stripe_checkout_session_id', session.id)
      .eq('status', 'pending');

    if (updateError) {
      console.error('Error updating order status:', updateError);

      throw new Error('Error updating order');
    }

    const order = await getOrderBySessionId(session.id);

    return order;
  }
}

async function getOrderBySessionId(sessionId: string): Promise<TransformedOrder | null> {
  const { data: viewData, error } = await supabase
    .from('orders_webhook_view')
    .select('*')
    .eq('stripe_checkout_session_id', sessionId);

  if (error) {
    console.error('Error fetching data from orders_webhook_view:', error.message);
    return null;
  }

  if (!viewData || viewData.length === 0) {
    console.warn(`No data found for session ID: ${sessionId}`);
    throw new Error(`No data found for session ID: ${sessionId}`);
  }

  const orderMap = new Map<string, TransformedOrder>();

  viewData.forEach((row: any) => {
    const currentOrderId = row.id;

    if (!orderMap.has(currentOrderId)) {
      orderMap.set(currentOrderId, {
        id: row.id,
        email: row.email,
        org: null,
        order_items: []
      });
    }

    const order = orderMap.get(currentOrderId)!;

    if (row.org_id && !order.org) {
      order.org = {
        id: row.org_id,
        name: row.org_name,
        siteName: row.org_sitename
      };
    }

    const newOrderItem: OrderWebhookViewItem = {
      id: row.order_item_id,
      order_id: row.order_item_order_id,
      type: row.order_item_type,
      course: row.course_id
        ? {
            id: row.course_id,
            title: row.course_title,
            group_id: row.course_group_id
          }
        : null
    };

    order.order_items.push(newOrderItem);
  });

  return orderMap.values().next().value || null;
}

type OrderWebhookViewItem = {
  id: OrderItems['id'];
  order_id: OrderItems['order_id'];
  type: OrderItems['type'];
  course: Pick<Course, 'id' | 'title' | 'group_id'> | null;
};

type OrderWebhookView = Orders & {
  created_at: string;
  updated_at: string;
  org: Pick<Organization, 'id' | 'name' | 'siteName'> | null;
  order_items: OrderWebhookViewItem[];
};

type TransformedOrder = Pick<OrderWebhookView, 'id' | 'org' | 'email' | 'order_items'>;
