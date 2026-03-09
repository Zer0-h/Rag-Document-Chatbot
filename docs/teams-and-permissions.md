# Teams & Permissions

## Roles

TDP uses a role-based access control (RBAC) model. Every member of a project has exactly one role:

| Role | Description |
|---|---|
| **Viewer** | Read-only access to logs, metrics, deployments, and settings |
| **Developer** | Can deploy services, manage secrets, and view all resources |
| **Admin** | Full access including billing, team management, and project deletion |
| **Owner** | One per project; same as Admin but cannot be removed except by themselves |

The user who creates a project is automatically the Owner.

## Inviting Team Members

In the Console: **Project Settings → Team → Invite Member**.

Via API:

```
POST /projects/{projectId}/team/invitations
```

```json
{
  "email": "colleague@example.com",
  "role": "developer"
}
```

TDP sends an invitation email. The invitee must have or create a Trifork account. Invitations expire after 72 hours. You can resend or revoke them from **Project Settings → Team → Pending Invitations**.

## Changing a Member's Role

Only Admins and Owners can change roles. An Owner's role cannot be changed — the Owner must transfer ownership first.

```
PATCH /projects/{projectId}/team/{userId}
```

```json
{ "role": "admin" }
```

Role changes take effect immediately.

## Removing a Member

```
DELETE /projects/{projectId}/team/{userId}
```

Removing a member immediately revokes all their API keys scoped to this project. If the member had active deployments running under their identity, those are not affected — running services continue to operate.

## Transferring Ownership

To transfer project ownership:

1. The current Owner navigates to **Project Settings → Team**.
2. Selects **Transfer Ownership** next to another Admin's name.
3. Confirms the transfer.

The former Owner becomes an Admin. Ownership transfer is logged and cannot be undone without the new Owner's cooperation.

## Organisation-Level Teams (Pro & Enterprise)

On Pro and Enterprise plans you can create **Organisation Teams** — named groups of users that can be granted access to multiple projects at once:

```
POST /organisations/{orgId}/teams
```

```json
{
  "name": "backend-engineers",
  "members": ["user_abc", "user_def"],
  "projects": [
    { "projectId": "proj_123", "role": "developer" },
    { "projectId": "proj_456", "role": "viewer" }
  ]
}
```

Adding a user to an organisation team grants them access to all projects in the team with the specified role. Individual project-level role assignments override team-level assignments.

## Audit Log

All team and permission changes are recorded in the audit log, accessible via:

```
GET /projects/{projectId}/audit-log
```

Each entry includes the actor (user or API key), the action, the target resource, the timestamp, and the source IP address. Audit logs are retained for 90 days on Pro and Enterprise plans, and 14 days on Starter. Audit logs are not available on the Free plan.

## Single Sign-On (SSO)

Enterprise plans can enforce SSO via SAML 2.0. When SSO is enabled:

- Members must authenticate via your identity provider (Okta, Azure AD, Google Workspace, etc.)
- Local password login is disabled for the organisation
- Just-in-time (JIT) provisioning can automatically create TDP accounts for users who authenticate via SSO for the first time

Contact support to configure SSO for your organisation.
