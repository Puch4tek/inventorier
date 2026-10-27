import { registerHooks } from "node:module";
import { resolve } from "./ts-runtime-loader.mjs";

registerHooks({ resolve });
