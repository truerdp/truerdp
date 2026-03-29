# Backend Contract

## POST /purchase/initiate

- Create transaction (pending)

## PATCH /admin/transaction/:id/confirm

- Mark confirmed
- Assign server (available → reserved)
- Create instance (pending)

## PATCH /admin/instance/:id/start-provisioning

- status: pending → provisioning

## PATCH /admin/instance/:id/activate

- provisioning → active
- Set credentials
- server.status = assigned

## Expiry Job

- expiry_date < now → expired

## PATCH /admin/instance/:id/terminate

- terminated
- server.status = available

## Tickets

POST /tickets
POST /tickets/:id/messages
PATCH /tickets/:id/close
