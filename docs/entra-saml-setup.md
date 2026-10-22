# Microsoft Entra SAML setup

## What is supported today

The sign-in page supports the configured local username/password credential
and Microsoft Entra ID through Auth.js OpenID Connect (OIDC). It does not
currently implement a SAML service provider (SP), ACS endpoint, assertion
validation, or SAML session exchange. Do not configure the Entra button as SAML
or label an OIDC login as SAML.

If the organization requires SAML, choose one of these integration paths:

1. **Recommended for this application:** use an organization-approved identity
   broker that accepts Entra SAML and exposes OIDC to this Next.js app. Configure
   the Entra Enterprise Application as a SAML identity provider for the broker,
   then configure Auth.js with the broker's OIDC issuer/client values. The app's
   Auth.js provider must be configured for the broker before switching the
   Entra button.
2. **Direct SAML:** implement and security-review a SAML SP for the app before
   configuring Entra. The SP must validate signed assertions against the
   tenant signing certificate, issuer, audience, recipient, destination,
   `InResponseTo`, time conditions and NameID; enforce one-time request/replay
   state in shared persistent storage; and exchange the validated identity into
   the application's Auth.js session. An in-memory state store is not suitable
   for multiple Vercel instances or serverless cold starts.

## Entra configuration steps

Do this after the chosen broker or SP provides the final SP metadata, **Entity
ID**, **ACS/Reply URL**, and (if required) logout URL. These values are
environment-specific; do not invent them or use an OIDC callback URL as the
SAML ACS URL.

1. In Microsoft Entra admin center, create or select the Enterprise Application
   for the broker/SP and open **Single sign-on → SAML**.
2. In **Basic SAML Configuration**, set the Identifier to the SP Entity ID and
   the Reply URL to the SP ACS URL. Add the Sign-on URL and Logout URL only
   when the SP/broker supplies them.
3. In **Attributes & Claims**, release only the required stable identifier and
   email/display-name attributes. Prefer a stable immutable user identifier
   for account linking; do not use an unverified email claim as the sole
   authorization check.
4. Download the Entra federation metadata XML and signing certificate through
   the approved organization process. Configure the broker/SP with the tenant
   issuer, SSO URL, metadata, and certificate. Pin and rotate certificates
   through the selected provider's supported process.
5. Test login/logout and negative cases in a non-production Vercel environment:
   invalid signature, wrong audience/issuer, expired assertion, reused
   assertion, and an unassigned user. Confirm the app never creates a session
   from an unvalidated assertion.
6. Only after the broker/SP implementation and tests are deployed should the
   Entra login action be switched from OIDC to SAML.

## Current supported Entra OIDC values

Until a broker or direct SAML SP is implemented, the existing Entra button uses
OIDC. In the app registration, add these Web redirect URIs:

- `http://localhost:3000/api/auth/callback/microsoft-entra-id`
- `https://<your-vercel-domain>/api/auth/callback/microsoft-entra-id`

Set `ENTRA_CLIENT_ID`, `ENTRA_CLIENT_SECRET`, `ENTRA_TENANT_ID`, and
`AUTH_SECRET` in the local secret store and Vercel project environment. Never
put credentials or certificates in GitHub source, issue comments, or this
document. Keep GitHub as the source repository, Vercel as the app host, and
Supabase as the data and file-storage service.
