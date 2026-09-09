# PCOS — SaveServe

**Patient-Centric Orchestration System for Healthcare Resource Equity Using Robin Hood Subsidization and Multi-Channel Access**

> BSc ICT Final Year Project · Department of ICT, School of Engineering · Information and Communication University (ICU) · 2026  
> **Author:** Patson Tembo

---

## Overview

PCOS is a hybrid USSD-Web hospital management system that connects patients with their hospital's medical officers — regardless of internet access or income level. The system is built around two core innovations:

- **Multi-Channel Access** — patients book appointments via a full Progressive Web App (PWA) *or* by dialling `*384#` from any feature phone on any mobile network, no internet required.
- **Robin Hood Subsidization Model** — premium-tier patient billing generates a surplus that the Policy Guardian engine automatically redistributes to fund community-tier consultations within the same hospital.

---

## Key Concepts

| Concept | Description |
|---|---|
| **Policy Guardian** | Automated engine that enforces hospital billing rules, calculates subsidy eligibility, and applies the Robin Hood model at every patient interaction |
| **Robin Hood Model** | Internal hospital cross-subsidization — premium fees fund community-tier care, encoded as software logic not manual administration |
| **USSD Channel** | `*384#` gateway via Africa's Talking API — works on any GSM network, zero internet required |
| **EHR Sync** | USSD-originated appointments create offline stubs that sync to the centralised cloud EHR on reconnection |

---
