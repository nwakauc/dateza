import { landingMarkup } from "./landingMarkup.ts";

// Landing page markup ported from the DateZA Landing design (Claude Design).
// Rendered as static HTML: the design is presentation-only until photo
// slots are wired up to real DateZA media.
export default function LandingPage() {
  return <main dangerouslySetInnerHTML={{ __html: landingMarkup }} />;
}
