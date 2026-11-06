import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { JournalHome } from "../app/components/JournalHome";
import { siteProps } from "./site-data";

export function render() {
  return renderToString(createElement(JournalHome, siteProps));
}
