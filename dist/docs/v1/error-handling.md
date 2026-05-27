# Deprecated version

> [!WARNING]
> You are reading v1 documentation. Migrate to v2 for new features.

# Error Handling

Handle API errors deterministically with retry and fallback strategies.

## Overview

This section explains how to work with **Error Handling** in the Tech Pulse platform.

> [!INFO]
> This page is optimized for backend engineers and API integrators.

## When to Use This

Use this when:
- Use this when designing resilient client behavior.
- You need stable integration behavior across environments.

Avoid this when:
- You are testing with mock credentials only.
- You are bypassing server-side validation.

Common mistakes:
- Missing authorization headers.
- Ignoring retry behavior on `429`.
- Logging sensitive tokens.

## Example Request

```bash
curl -X POST https://api.example.com/v1/projects \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Project",
    "visibility": "public"
  }'
```

## Example Response

```json
{
  "id": "proj_123456",
  "name": "My Project",
  "visibility": "public",
  "created_at": "2026-02-25T10:00:00Z"
}
```

## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| name | string | Yes | Name of the project |
| visibility | string | Yes | public or private |

## Error Responses

| Code | Meaning |
| --- | --- |
| 400 | Bad request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 429 | Rate limit exceeded |

## Best Practices

- Rotate API keys regularly.
- Handle retries for 429 responses.
- Never expose private keys in frontend code.

## Related Guides

- Authentication Guide
- Upload Project Guide
- Subscription Handling

## Last Updated

2026-02-25

