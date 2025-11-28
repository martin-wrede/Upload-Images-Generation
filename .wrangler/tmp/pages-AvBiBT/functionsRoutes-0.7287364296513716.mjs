import { onRequest as __ai_js_onRequest } from "C:\\Users\\FUJITSU\\Documents\\JAVASCRIPT\\JS\\react-image-creator-airtable-main\\functions\\ai.js"
import { onRequest as __airtable_js_onRequest } from "C:\\Users\\FUJITSU\\Documents\\JAVASCRIPT\\JS\\react-image-creator-airtable-main\\functions\\airtable.js"
import { onRequest as __upload_images_js_onRequest } from "C:\\Users\\FUJITSU\\Documents\\JAVASCRIPT\\JS\\react-image-creator-airtable-main\\functions\\upload_images.js"

export const routes = [
    {
      routePath: "/ai",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__ai_js_onRequest],
    },
  {
      routePath: "/airtable",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__airtable_js_onRequest],
    },
  {
      routePath: "/upload_images",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__upload_images_js_onRequest],
    },
  ]