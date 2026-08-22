/**
 * Shapes copied from the verified D8N OpenAPI contract
 * (`d8n/docs/api/openapi.yaml`, MeResponse / BrandSummary / ErrorResponse /
 * PasswordAuthSessionResponse). Do not extend these with client-invented fields.
 */

export type BrandSummary = {
  slug: string;
  name: string;
};

export type MeResponse = {
  user_id: number;
  brand: BrandSummary;
  session: {
    id: number;
    expires_at: string;
  };
};

export type ErrorBody = {
  error: string;
};

export type MessageResponse = {
  message: string;
};

export type PasswordAuthRequest = {
  identifier: string;
  password: string;
  device_name?: string;
};

export type PasswordAuthSessionResponse = {
  token: string;
  token_type: "Bearer";
  expires_at: string;
  user_id: number;
  brand: BrandSummary;
};

export type PasswordResetAuthorization = {
  reset_token: string;
  expires_at: string;
};
