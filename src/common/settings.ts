import i18n from "~/i18n/i18nConfig";
import type { SettingsStorage } from "~/types";

import { CURRENCIES } from "./constants";

export const DEFAULT_SETTINGS: SettingsStorage = {
  browserNotifications: true,
  websiteEnhancements: true,
  legacyLnurlAuth: false,
  isUsingLegacyLnurlAuthKey: false,
  userName: "",
  userEmail: "",
  locale: i18n.resolvedLanguage,
  theme: "system",
  showFiat: true,
  currency: CURRENCIES.USD,
  exchange: "alby",
  liquidEnabled: false,
  nostrEnabled: false,
  closedTips: [],
  bitcoinNetwork: "bitcoin",
};
