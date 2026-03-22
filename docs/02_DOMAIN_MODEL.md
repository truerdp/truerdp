# Domain Model

## User

id
email
password_hash
discount_percent
discount_flat

## Server

id
ip_address
username
password
cpu
ram
storage
status

## Plan

id
name
cpu
ram
storage
price
duration_days

## Instance

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

## Transaction

id
user_id
plan_id
amount
method
status
reference

## Ticket

id
user_id
subject
status

## Message

id
ticket_id
sender_type
message
