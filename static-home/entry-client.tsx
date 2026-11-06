import { createElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { JournalHome } from "../app/components/JournalHome";
import { siteProps } from "./site-data";

const root = document.getElementById("root");
if (root) hydrateRoot(root, createElement(JournalHome, siteProps));
