/**
 * D8N Place catalogue item from `GET /api/v1/places`.
 * Hierarchy is whatever the API returns (`has_children`); DateZA does not
 * invent levels. `kind` is an opaque server value — never shown to members.
 */
export type Place = {
  id: number;
  kind: string;
  name: string;
  code: string;
  has_children: boolean;
};
