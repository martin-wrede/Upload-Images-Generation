import { onRequest as __ai_js_onRequest } from "C:\\Users\\FUJITSU\\Documents\\JAVASCRIPT\\JS\\Upload-Images-Form\\functions\\ai.js"
import { onRequest as __airtable_js_onRequest } from "C:\\Users\\FUJITSU\\Documents\\JAVASCRIPT\\JS\\Upload-Images-Form\\functions\\airtable.js"
import { onRequest as __upload_images_js_onRequest } from "C:\\Users\\FUJITSU\\Documents\\JAVASCRIPT\\JS\\Upload-Images-Form\\functions\\upload_images.js"

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