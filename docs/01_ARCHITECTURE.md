# TrueRDP Architecture

## System Type

Manual-first RDP provisioning system (automation-ready)

## Database

PostgreSQL (mandatory)

Reason:

- Strong relational integrity
- Supports constraints and enums for lifecycle enforcement

## Core Principle

System controls state. Human executes provisioning.

## Components

- Frontend (React)
- Backend (Fastify)
- Database (PostgreSQL)
- Infrastructure (manual servers)

## Flow

User Purchase → Transaction Confirmed → Instance (pending)
→ Provisioning → Active → Expired → Terminated
