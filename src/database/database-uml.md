# Maskank Database UML

This diagram represents the current database structure defined in
[`schema.sql`](./schema.sql). Historical migrations that add and later remove
property contact fields are not represented because `contact_phone` and
`whatsapp_phone` are no longer part of the active schema.

```mermaid
erDiagram
    USERS ||--o{ PROPERTIES : owns
    USERS ||--o{ FAVORITES : saves
    PROPERTIES ||--o{ FAVORITES : receives
    GOVERNORATES ||--o{ CITIES : contains
    GOVERNORATES ||--o{ PROPERTIES : locates
    CITIES ||--o{ PROPERTIES : locates
    PROPERTIES ||--o{ PROPERTY_IMAGES : has
    PROPERTIES ||--o{ PROPERTY_FEATURES : defines
    PROPERTIES ||--o{ PROPERTY_VIEWS : receives
    USERS o|--o{ PROPERTY_VIEWS : creates
    USERS ||--o{ MESSAGES : sends
    USERS ||--o{ MESSAGES : receives
    PROPERTIES ||--o{ MESSAGES : concerns
    PROPERTIES ||--o{ PROPERTY_REPORTS : receives
    USERS ||--o{ PROPERTY_REPORTS : submits
    USERS o|--o{ PROPERTY_REPORTS : resolves
    USERS o|--o{ PROPERTIES : approves

    USERS {
        BIGINT id PK
        VARCHAR full_name
        VARCHAR email UK
        VARCHAR phone UK
        TEXT password_hash
        user_role role
        TEXT avatar_url
        BOOLEAN is_active
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    GOVERNORATES {
        BIGINT id PK
        VARCHAR name_ar
        VARCHAR name_en UK
        TIMESTAMPTZ created_at
    }

    CITIES {
        BIGINT id PK
        BIGINT governorate_id FK
        VARCHAR name_ar
        VARCHAR name_en
        TIMESTAMPTZ created_at
        UNIQUE governorate_id_name_en UK
    }

    PROPERTIES {
        BIGINT id PK
        BIGINT owner_id FK
        VARCHAR title
        TEXT description
        VARCHAR property_type
        property_purpose purpose
        NUMERIC price
        currency_code currency
        NUMERIC area_sqm
        SMALLINT bedrooms
        SMALLINT bathrooms
        SMALLINT floor
        BOOLEAN furnished
        SMALLINT construction_year
        BIGINT governorate_id FK
        BIGINT city_id FK
        VARCHAR address
        NUMERIC latitude
        NUMERIC longitude
        property_status status
        TEXT rejection_reason
        BIGINT approved_by FK
        TIMESTAMPTZ approved_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    PROPERTY_IMAGES {
        BIGINT id PK
        BIGINT property_id FK
        TEXT file_path
        TEXT cloudinary_public_id
        VARCHAR original_name
        VARCHAR mime_type
        INTEGER file_size_bytes
        INTEGER display_order
        BOOLEAN is_main
        TIMESTAMPTZ created_at
    }

    PROPERTY_FEATURES {
        BIGINT id PK
        BIGINT property_id FK
        VARCHAR feature_name
        VARCHAR feature_value
        UNIQUE property_id_feature_name UK
    }

    FAVORITES {
        BIGINT user_id PK, FK
        BIGINT property_id PK, FK
        TIMESTAMPTZ created_at
    }

    PROPERTY_VIEWS {
        BIGINT id PK
        BIGINT property_id FK
        BIGINT user_id FK
        INET ip_address
        TIMESTAMPTZ viewed_at
    }

    MESSAGES {
        BIGINT id PK
        BIGINT sender_id FK
        BIGINT receiver_id FK
        BIGINT property_id FK
        TEXT message
        TIMESTAMPTZ created_at
        TIMESTAMPTZ read_at
    }

    PROPERTY_REPORTS {
        BIGINT id PK
        BIGINT property_id FK
        BIGINT reporter_id FK
        report_reason reason
        TEXT details
        BOOLEAN resolved
        BIGINT resolved_by FK
        TIMESTAMPTZ resolved_at
        TIMESTAMPTZ created_at
        UNIQUE property_id_reporter_id_reason UK
    }
```

## Relationship and deletion rules

- Deleting a governorate is restricted while cities or properties reference it.
- Deleting a city is restricted while properties reference it.
- Deleting a property cascades to its images, features, favorites, views,
  messages, and reports.
- Deleting a user cascades to favorites and reports submitted by that user.
- A deleted user remains referenced as `NULL` for optional property views,
  approved properties, and report resolutions.
- Messages require different sender and receiver users.
- A property can have at most one image marked as the main image.
- A property's latitude and longitude are either both present or both absent.

## PostgreSQL enum types

- `user_role`: `USER`, `OWNER`, `BROKER`, `ADMIN`
- `property_purpose`: `sale`, `rent`
- `property_status`: `pending`, `approved`, `rejected`, `sold`, `rented`
- `currency_code`: `EGP`
- `report_reason`: `fake_property`, `incorrect_information`,
  `wrong_price`, `duplicate_listing`, `inappropriate_content`, `other`
