import { Fragment } from "react";
import { Link } from "react-router-dom";
import { parseRichText } from "./richText.ts";

export function RichText({ text }: { text: string }) {
  return (
    <>
      {parseRichText(text).map((part, index) => {
        if (part.type === "text") {
          return <Fragment key={index}>{part.value}</Fragment>;
        }
        return (
          <Link key={index} to={part.href}>
            {part.label}
          </Link>
        );
      })}
    </>
  );
}
