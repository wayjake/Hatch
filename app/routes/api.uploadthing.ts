import { createRouteHandler } from "uploadthing/server";
import { uploadRouter } from "~/lib/uploadthing.server";

const handler = createRouteHandler({ router: uploadRouter });

export const loader = handler;
export const action = handler;
