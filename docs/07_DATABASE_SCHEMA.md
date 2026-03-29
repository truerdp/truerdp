# Database Schema (PostgreSQL Only)

## Rules

- PostgreSQL only
- Use constraints
- Use foreign keys

## users

id
email
password_hash
discount_percent
discount_flat

## servers

id
ip_address
username
password
cpu
ram
storage
status

## plans

id
name
cpu
ram
storage
price
duration_days

## instances

id
user_id
server_id
plan_id
status
ip_address
username
password
start_date
expiry_date
terminated_at

## transactions

id
user_id
plan_id
amount
method
status
reference
confirmed_at

## tickets

id
user_id
subject
status

## messages

id
ticket_id
sender_type
message
