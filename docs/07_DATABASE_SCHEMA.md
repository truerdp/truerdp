# Database Schema

PostgreSQL is the only supported database.

## Users

- `id`
- `email`
- `password_hash`
- `first_name`
- `last_name`
- `role`
- `discount_percent`
- `discount_flat`

## Servers

- `id`
- `ip_address`
- `username`
- `password`
- `cpu`
- `ram`
- `storage`
- `status`

## Plans

- `id`
- `name`
- `cpu`
- `ram`
- `storage`
- `price`
- `duration_days`

## Orders

- `id`
- `user_id`
- `plan_id`
- `plan_name`
- `plan_price`
- `duration_days`
- `status`

## Invoices

- `id`
- `order_id`
- `invoice_number`
- `subtotal`
- `discount`
- `total_amount`
- `currency`
- `coupon_id`
- `status`
- `expires_at`
- `paid_at`

## Coupon Usages

- `id`
- `coupon_id`
- `user_id`
- `invoice_id`

## Transactions

- `id`
- `user_id`
- `invoice_id`
- `amount`
- `method`
- `gateway`
- `status`
- `reference`
- `failure_reason`
- `metadata`
- `confirmed_at`

## Instances

- `id`
- `user_id`
- `server_id`
- `plan_id`
- `status`
- `ip_address`
- `username`
- `password`
- `start_date`
- `expiry_date`
- `terminated_at`

## Support

### Tickets

- `id`
- `user_id`
- `subject`
- `status`

### Messages

- `id`
- `ticket_id`
- `sender_type`
- `message`
