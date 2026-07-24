import type { CarrierApiProvider, NormalizedTracking } from "./types";
import { CarrierApiError } from "./types";
import { fetchUpsTracking } from "./ups";
import { fetchFedexTracking } from "./fedex";
import { fetchDhlTracking } from "./dhl";
import { fetchShip24Tracking } from "./ship24";

export { CarrierApiError, mapToInternalStatus, mapShip24Milestone, formatCourierName } from "./types";
export type { NormalizedTracking, CarrierApiProvider, NormalizedCarrierEvent } from "./types";

const TRACKABLE_PROVIDERS: CarrierApiProvider[] = ["UPS", "FedEx", "DHL", "Ship24"];

export function isTrackableProvider(provider: string): provider is CarrierApiProvider {
  return (TRACKABLE_PROVIDERS as string[]).includes(provider);
}

export async function fetchCarrierTracking(
  provider: CarrierApiProvider,
  trackingNumber: string,
  options?: { courierCode?: string }
): Promise<NormalizedTracking> {
  switch (provider) {
    case "UPS":
      return fetchUpsTracking(trackingNumber);
    case "FedEx":
      return fetchFedexTracking(trackingNumber);
    case "DHL":
      return fetchDhlTracking(trackingNumber);
    case "Ship24":
      return fetchShip24Tracking(trackingNumber, options?.courierCode);
    default:
      throw new CarrierApiError(provider, `Unsupported carrier provider: ${provider}`);
  }
}
