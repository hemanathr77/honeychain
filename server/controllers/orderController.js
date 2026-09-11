const { pool } = require('../config/db');

// ── Valid status transitions per role ─────────────────────────────────────
const VALID_TRANSITIONS = {
  SELLER: {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['READY_FOR_PICKUP', 'CANCELLED'],
  },
  COLLECTOR: {
    READY_FOR_PICKUP: ['PICKED_UP'],
    PICKED_UP: ['SHIPPED'],
    SHIPPED: ['OUT_FOR_DELIVERY'],
    OUT_FOR_DELIVERY: ['DELIVERED'],
  },
  ADMIN: {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['READY_FOR_PICKUP', 'CANCELLED'],
    READY_FOR_PICKUP: ['PICKED_UP', 'CANCELLED'],
    PICKED_UP: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['OUT_FOR_DELIVERY', 'CANCELLED'],
    OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
    DELIVERED: [],
    CANCELLED: [],
  },
};

function generateOrderNumber() {
  const seq = String(Math.floor(Math.random() * 900000) + 100000);
  return `HC-ORD-${new Date().getFullYear()}-${seq}`;
}

// ── POST /api/orders ─────────────────────────────────────────────────────
// CUSTOMER only. Creates an order with status = PENDING.
const createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const { items, shipping_address, shipping_name, shipping_phone, payment_method } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item.' });
    }

    await client.query('BEGIN');

    let total_amount = 0;
    const resolvedItems = [];

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Each item must have a valid product_id and quantity.' });
      }

      const product = await client.query(
        `SELECT id, name, price_per_kg, available_quantity, seller_id
         FROM honey_products WHERE id = $1 AND status = 'ACTIVE'`,
        [item.product_id]
      );
      if (product.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `Product not found or not available: ${item.product_id}` });
      }
      const p = product.rows[0];

      // Customers cannot order from themselves (if they happen to be sellers)
      if (p.seller_id === req.user.id) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'You cannot order your own products.' });
      }

      const qty = parseFloat(item.quantity);
      if (p.available_quantity < qty) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Insufficient stock for "${p.name}". Available: ${p.available_quantity} kg, Requested: ${qty} kg.`
        });
      }

      // Price is always calculated on the backend — never trusted from frontend
      const itemTotal = parseFloat(p.price_per_kg) * qty;
      total_amount += itemTotal;
      resolvedItems.push({
        product_id: item.product_id,
        batch_id: item.batch_id || null,
        product_name: p.name,
        quantity: qty,
        price: itemTotal,
      });
    }

    const order_number = generateOrderNumber();

    // Create order with status = PENDING
    const orderResult = await client.query(`
      INSERT INTO orders (order_number, customer_id, total_amount, shipping_address, shipping_name, shipping_phone, order_status, payment_status)
      VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', 'PENDING')
      RETURNING *
    `, [order_number, req.user.id, total_amount, shipping_address || null, shipping_name || null, shipping_phone || null]);

    const order = orderResult.rows[0];

    // Create order items
    for (const item of resolvedItems) {
      await client.query(`
        INSERT INTO order_items (order_id, product_id, batch_id, product_name, quantity, price)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [order.id, item.product_id, item.batch_id, item.product_name, item.quantity, item.price]);

      // Reduce available stock
      await client.query(
        `UPDATE honey_products SET available_quantity = available_quantity - $1, updated_at = NOW() WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // Record initial status history
    await client.query(`
      INSERT INTO order_status_history (order_id, status, changed_by, changed_by_name, changed_by_role, notes)
      VALUES ($1, 'PENDING', $2, $3, $4, 'Order placed by customer')
    `, [order.id, req.user.id, req.user.name, req.user.role]);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Order placed successfully.',
      order: { ...order, order_status: 'PENDING' },
      order_number,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createOrder error:', err.message);
    res.status(500).json({ error: 'Failed to place order.' });
  } finally {
    client.release();
  }
};

// ── GET /api/orders/mine ─────────────────────────────────────────────────
// CUSTOMER only — their own orders with items and batch IDs
const getMyOrders = async (req, res) => {
  try {
    const orders = await pool.query(`
      SELECT o.*, json_agg(json_build_object(
        'id', oi.id,
        'product_id', oi.product_id,
        'product_name', oi.product_name,
        'quantity', oi.quantity,
        'price', oi.price,
        'batch_id', oi.batch_id,
        'batch_ref', hb.batch_id
      ) ORDER BY oi.id) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN honey_batches hb ON hb.id = oi.batch_id
      WHERE o.customer_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [req.user.id]);
    res.json({ orders: orders.rows });
  } catch (err) {
    console.error('getMyOrders error:', err.message);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
};

// ── GET /api/orders/:id ──────────────────────────────────────────────────
// Customer sees own order. Seller sees orders with their products. Admin sees any.
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const orderResult = await pool.query(`
      SELECT o.*,
        u.name AS customer_name, u.email AS customer_email,
        json_agg(json_build_object(
          'id', oi.id,
          'product_id', oi.product_id,
          'product_name', oi.product_name,
          'quantity', oi.quantity,
          'price', oi.price,
          'batch_id', oi.batch_id,
          'batch_ref', hb.batch_id,
          'seller_id', hp.seller_id
        ) ORDER BY oi.id) AS items
      FROM orders o
      JOIN users u ON u.id = o.customer_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN honey_products hp ON hp.id = oi.product_id
      LEFT JOIN honey_batches hb ON hb.id = oi.batch_id
      WHERE o.id = $1
      GROUP BY o.id, u.name, u.email
    `, [id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orderResult.rows[0];

    // Enforce access control
    if (role === 'CUSTOMER' && order.customer_id !== userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    if (role === 'SELLER') {
      const hasProduct = (order.items || []).some(item => item && item.seller_id === userId);
      if (!hasProduct) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    }

    // Get status history
    const history = await pool.query(`
      SELECT osh.*, u.name AS actor_name
      FROM order_status_history osh
      LEFT JOIN users u ON u.id = osh.changed_by
      WHERE osh.order_id = $1
      ORDER BY osh.created_at ASC
    `, [id]);

    res.json({ order, status_history: history.rows });
  } catch (err) {
    console.error('getOrderById error:', err.message);
    res.status(500).json({ error: 'Failed to fetch order.' });
  }
};

// ── GET /api/orders/seller/mine ──────────────────────────────────────────
// SELLER only — orders that contain products belonging to this seller
const getSellerOrders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT o.id, o.order_number, o.order_status, o.total_amount, o.created_at,
        o.shipping_name, o.shipping_address, o.shipping_phone,
        u.name AS customer_name, u.email AS customer_email,
        json_agg(DISTINCT jsonb_build_object(
          'product_name', oi.product_name,
          'quantity', oi.quantity,
          'price', oi.price,
          'batch_ref', hb.batch_id
        )) FILTER (WHERE oi.id IS NOT NULL) AS items
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN honey_products hp ON hp.id = oi.product_id
      JOIN users u ON u.id = o.customer_id
      LEFT JOIN honey_batches hb ON hb.id = oi.batch_id
      WHERE hp.seller_id = $1
      GROUP BY o.id, o.order_number, o.order_status, o.total_amount, o.created_at,
               o.shipping_name, o.shipping_address, o.shipping_phone,
               u.name, u.email
      ORDER BY o.created_at DESC
    `, [req.user.id]);
    res.json({ orders: result.rows });
  } catch (err) {
    console.error('getSellerOrders error:', err.message);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
};

// ── PUT /api/orders/:id/status ───────────────────────────────────────────
// SELLER, COLLECTOR, ADMIN — update order status with validated transitions
const updateOrderStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status: newStatus, notes } = req.body;
    const { role, id: userId, name: userName } = req.user;

    if (!newStatus) {
      return res.status(400).json({ error: 'New status is required.' });
    }

    // Fetch order
    const orderResult = await client.query(`
      SELECT o.*, array_agg(DISTINCT hp.seller_id) AS seller_ids
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN honey_products hp ON hp.id = oi.product_id
      WHERE o.id = $1
      GROUP BY o.id
    `, [id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orderResult.rows[0];
    const currentStatus = order.order_status;

    // SELLER can only update orders containing their products
    if (role === 'SELLER' && !order.seller_ids.includes(userId)) {
      return res.status(403).json({ error: 'Access denied. This order does not contain your products.' });
    }

    // Validate transition
    const transitions = VALID_TRANSITIONS[role];
    if (!transitions) {
      return res.status(403).json({ error: 'Your role cannot update order status.' });
    }

    const allowed = transitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      return res.status(400).json({
        error: `Invalid status transition: ${currentStatus} → ${newStatus}. Allowed next statuses: ${allowed.join(', ') || 'none'}.`
      });
    }

    await client.query('BEGIN');

    // Update order status
    await client.query(
      `UPDATE orders SET order_status = $1, updated_at = NOW() WHERE id = $2`,
      [newStatus, id]
    );

    // Record history
    await client.query(`
      INSERT INTO order_status_history (order_id, status, changed_by, changed_by_name, changed_by_role, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [id, newStatus, userId, userName, role, notes || null]);

    await client.query('COMMIT');

    res.json({
      message: `Order status updated to ${newStatus}.`,
      order_id: id,
      previous_status: currentStatus,
      new_status: newStatus,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('updateOrderStatus error:', err.message);
    res.status(500).json({ error: 'Failed to update order status.' });
  } finally {
    client.release();
  }
};

// ── GET /api/orders (admin) ──────────────────────────────────────────────
// ADMIN only — all platform orders with filtering
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where = '';

    if (status) {
      params.push(status);
      where = `WHERE o.order_status = $${params.length}`;
    }

    params.push(parseInt(limit), offset);

    const result = await pool.query(`
      SELECT o.id, o.order_number, o.order_status, o.total_amount, o.created_at,
        u.name AS customer_name, u.email AS customer_email,
        COUNT(oi.id) AS item_count
      FROM orders o
      JOIN users u ON u.id = o.customer_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      ${where}
      GROUP BY o.id, o.order_number, o.order_status, o.total_amount, o.created_at, u.name, u.email
      ORDER BY o.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    res.json({ orders: result.rows });
  } catch (err) {
    console.error('getAllOrders error:', err.message);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
};

module.exports = { createOrder, getMyOrders, getOrderById, getSellerOrders, updateOrderStatus, getAllOrders };
