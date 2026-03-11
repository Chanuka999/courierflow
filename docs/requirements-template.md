# CourierFlow Requirement Document Template

## 1. Document Control

- Project Name:
- Version:
- Date:
- Prepared by:
- Approved by:

## 2. Project Overview

### 2.1 Purpose

### 2.2 Business Goals

### 2.3 In Scope

### 2.4 Out of Scope

## 3. Stakeholders

- Business Owner:
- Operations Manager:
- Branch Manager:
- Dispatcher:
- Rider:
- Finance:

## 4. User Roles and Permissions

| Role           | Main Responsibilities | Key Permissions |
| -------------- | --------------------- | --------------- |
| Super Admin    |                       |                 |
| Branch Manager |                       |                 |
| Dispatcher     |                       |                 |
| Rider          |                       |                 |
| Customer       |                       |                 |

## 5. Functional Requirements

| ID     | Requirement                      | Priority | Acceptance Criteria |
| ------ | -------------------------------- | -------- | ------------------- |
| FR-001 | User login and role-based access | High     |                     |
| FR-002 | Parcel create with tracking ID   | High     |                     |
| FR-003 | Rider assignment                 | High     |                     |
| FR-004 | Status updates and tracking      | High     |                     |
| FR-005 | Reports and dashboard metrics    | Medium   |                     |

## 6. Non-Functional Requirements

- Performance:
- Security:
- Availability:
- Scalability:
- Usability:
- Auditability:

## 7. Business Rules

- Unique tracking ID
- Status transition rules
- COD handling policy

## 8. Data Model Requirements

- User
- Parcel
- StatusLog
- Assignment
- Branch
- CODSettlement

## 9. Integrations

- SMS gateway:
- Email service:
- Maps service:

## 10. Reporting Requirements

- Daily parcel summary
- Delivery success rate
- Pending/failed list
- COD reconciliation report

## 11. UAT Checklist

| Test Case                          | Expected Result | Status |
| ---------------------------------- | --------------- | ------ |
| Login with valid credentials       | Success         |        |
| Create parcel with required fields | Success         |        |
| Update status in valid order       | Success         |        |
| Customer tracks by tracking ID     | Success         |        |

## 12. Risks and Mitigation

| Risk                  | Impact | Mitigation                  |
| --------------------- | ------ | --------------------------- |
| SMS provider downtime | High   | Retry queue                 |
| Wrong status updates  | Medium | Role validation + audit log |

## 13. Milestones

- M1: Requirements finalized
- M2: Backend MVP completed
- M3: Frontend MVP completed
- M4: UAT and go-live
