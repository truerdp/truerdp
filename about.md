# TrueRDP – Product & System Overview

## 1. Introduction

TrueRDP is a SaaS platform designed to provide affordable, reliable, and scalable Remote Desktop Protocol (RDP) services to users across the globe. The platform focuses on simplicity, fast provisioning, and transparent lifecycle management of virtual instances.

The system is designed with a modular monorepo architecture, enabling efficient development, scalability, and maintainability.

---

## 2. Vision & Goals

### Vision

To become a trusted global provider of cost-effective and instantly accessible RDP services.

### Goals

- Provide seamless RDP purchasing experience
- Enable fast and controlled provisioning
- Maintain clear lifecycle visibility for users and admins
- Support multiple pricing models and plan durations
- Build a flexible and scalable backend architecture

---

## 3. System Architecture

TrueRDP follows a monorepo architecture with multiple applications and shared packages.

### Applications

- **Web App**: Public-facing website for marketing and purchasing
- **Dashboard App**: User panel to manage RDP instances
- **Admin App**: Internal control panel for operations
- **Backend Service**: API layer and business logic

### Shared Packages

- UI component library
- Utility functions
- API clients
- Types and schemas

---

## 4. Core Features

### 4.1 Account System

- User registration and authentication
- Mandatory account creation before purchase

### 4.2 RDP Instance Lifecycle

Each RDP instance follows a defined lifecycle:

- **Pending** → Order created
- **Provisioning** → Manual/automated setup in progress
- **Active** → Instance ready for use
- **Expired** → Subscription ended
- **Terminated** → Instance deleted

### 4.3 Instance Management

- View instance details
- Extend subscription duration
- Track expiry and status

### 4.4 Admin Controls

- Approve and provision instances
- Extend or terminate instances
- Manage users and transactions

### 4.5 Pricing & Plans

- Multiple plan variants (e.g., duration-based pricing)
- Discounted pricing for longer durations
- Flexible pricing configuration

### 4.6 Payments

- Support for international users
- Payment methods:
  - Cryptocurrency
  - Cards (subject to integration feasibility)

- Internal currency handling in USD
- Display pricing in user-local currency

---

## 5. Email & Notification System (Planned)

### Requirements

- Transactional emails (purchase, activation, expiry reminders)
- Admin notifications
- Rich text email templates

### Architecture

- Abstract email service layer
- Initial provider: Resend
- Future provider: Amazon SES
- Easy provider switching via adapter pattern

### Additional Features

- Admin-managed email templates (rich text editor)
- Scheduled cron jobs for reminders

---

## 6. Backend Design

### Key Concepts

- Invoice-first approach
- Clear separation of concerns
- Scalable API design

### Core Modules

- Authentication
- Orders & Invoices
- Instance Management
- Plan & Pricing
- Payments
- Notifications

---

## 7. Frontend Strategy

### Tech Stack

- React.js
- React Query (data fetching & caching)
- Modern UI libraries (e.g., component-driven design system)

### Approach

- API-first development
- Mock APIs for parallel frontend development
- Modular and reusable UI components

---

## 8. Instance Provisioning Model

### Initial Approach

- Manual provisioning by admin

### Future Scope

- Automated provisioning system
- Integration with cloud providers

---

## 9. Security & Compliance

- Secure authentication mechanisms
- Data validation and sanitization
- Role-based access control (RBAC)
- Secure payment handling

---

## 10. Scalability Considerations

- Modular monorepo structure
- Stateless backend services
- Queue-based processing for provisioning (future)
- Provider-agnostic integrations

---

## 11. Future Enhancements

- Automated provisioning
- Advanced analytics dashboard
- Coupon and discount system
- Multi-region deployment
- Subscription auto-renewal

---

## 12. Conclusion

TrueRDP is designed as a scalable and flexible SaaS platform with a strong foundation in modular architecture, lifecycle clarity, and extensibility. The system prioritizes user experience, operational control, and future readiness for automation and global scaling.
