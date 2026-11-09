import type { Instrumentation } from "next";
import { operationalEvent } from "./lib/monitoring/events";
export const onRequestError: Instrumentation.onRequestError = async (
  _error,
  request,
) => {
  operationalEvent("server_request_failure", {
    route: request.path,
    status: 500,
  });
};
