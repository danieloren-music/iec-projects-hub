# Microsoft Entra SAML setup

The application now acts as a SAML 2.0 Service Provider (SP) using Node-SAML.
It verifies Entra response and assertion signatures, issuer, audience,
timestamps, request correlation, and one-time relay state. Request state is
stored in Supabase, not memory, so sign-in works across Vercel instances.

## Exact values for this application

In **Microsoft Entra admin center → Enterprise applications → New application
→ Create your own application → Set up single sign-on → SAML**, configure:

| Entra SAML field | Value |
| --- | --- |
| **Identifier (Entity ID)** | `https://iec-projects-hub.vercel.app/api/auth/saml/metadata` |
| **Reply URL (Assertion Consumer Service URL)** | `https://iec-projects-hub.vercel.app/api/auth/saml/acs` |
| **Sign on URL** | `https://iec-projects-hub.vercel.app/api/auth/saml/login` |
| **Relay State** | Leave blank |
| **Logout URL** | Leave blank; SAML single logout is not implemented |

The Entity ID and Reply URL are case-sensitive. Do not put the site's root URL
or an OIDC callback URL into these fields. The app's public SP metadata is also
available at
[`https://iec-projects-hub.vercel.app/api/auth/saml/metadata`](https://iec-projects-hub.vercel.app/api/auth/saml/metadata)
after its SAML environment values and Supabase storage migration are set.

## Entra signing and claims

1. Under **SAML Signing Certificate**, set **Signing Option** to **Sign SAML
   response and assertion**, then save. The SP requires both signatures.
2. Under **Attributes & Claims**, set the **Unique User Identifier (Name ID)**
   source to `user.objectid` and the Name ID format to **Persistent**, if
   available in your tenant. This keeps the application's account ID stable if
   a user's email address changes.
3. Ensure the assertion releases an email-address claim (standard
   `emailaddress` or `mail`) and preferably a `name`/display-name claim. The
   app uses these for display and task assignment; the immutable Name ID is used
   as the identity key.
4. Save the Entra SAML configuration. Copy the **Microsoft Entra Identifier**
   (IdP issuer), **Login URL** (IdP SSO URL), and download the **Certificate
   (Base64)** file. Do not use the App Federation Metadata URL as the issuer or
   Login URL. Metadata is an XML document; the app settings below expect its
   individual values, not the whole XML file.

## Configure Vercel and Supabase

1. In the Supabase SQL Editor for the same project used by the app, run
   [`supabase/migrations/20261022162000_saml_auth_state.sql`](../supabase/migrations/20261022162000_saml_auth_state.sql).
   The app uses this protected table for request IDs, RelayState, and short-lived
   one-time session handoffs. No RLS access is granted to `anon` or
   `authenticated`.
2. In Vercel **Project → Settings → Environment Variables**, add these for the
   Production environment:

   | Name | Value |
   | --- | --- |
   | `ENTRA_SAML_BASE_URL` | `https://iec-projects-hub.vercel.app` |
   | `ENTRA_SAML_ENTRY_POINT` | The Entra **Login URL** |
   | `ENTRA_SAML_IDP_ISSUER` | The Entra **Microsoft Entra Identifier** |
   | `ENTRA_SAML_IDP_CERT` | The complete Base64 body from the downloaded `.cer` file, or its PEM certificate |
   | `AUTH_SECRET` | A new random secret generated for Auth.js |
   | `NEXT_PUBLIC_SUPABASE_URL` | The app's Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | The service-role key for that same Supabase project |

   The certificate is a public signing certificate, not a private key. Store it
   as an environment variable for easier rotation; do not commit it or the XML
   metadata to GitHub. The Supabase service-role key and `AUTH_SECRET` are
   secrets and must never be exposed to browser code.
3. Set the existing Supabase anon-key variable as already required for the app.
   Generate `AUTH_SECRET` locally with
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   and enter the output directly in Vercel; do not put the value in source
   control. **Redeploy** after adding/updating Vercel variables.
4. After deployment, open the SP metadata URL above and confirm it returns XML
   with the exact Entity ID and `/api/auth/saml/acs` POST endpoint. In Entra,
   use **Test single sign-on** and then test the actual application's **התחבר
   עם Entra ID** button.
5. Test failure cases too: a changed/wrong signing certificate, wrong audience,
   expired assertion, and submitting the same SAML response twice must not
   create a session.

For local `admin` / `admin`, run `npm run dev`; the fallback is enabled only
outside production and only when no local-admin environment credentials have
been supplied. It is intentionally disabled for Vercel/production.
