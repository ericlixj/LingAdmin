import { I18nProvider } from "@refinedev/core";
import zh from "./locale/zh";
import en from "./locale/en";

const translations = {
  zh,
  en,
};

let currentLocale: "zh" | "en" = (localStorage.getItem("locale") as "zh" | "en") ||
  (navigator.language.startsWith("zh") ? "zh" : "en");

// console.log("i18nProvider initialized, default locale:", currentLocale);

const i18nProvider: I18nProvider = {
    translate: (key, params) => {
    const keys = key.split(".");
    let result: any = translations[currentLocale];

    for (const k of keys) {
        result = result?.[k];
        if (result === undefined) {
        // 尝试 fallback 到英文
        result = translations["en"];
        for (const k2 of keys) {
            result = result?.[k2];
            if (result === undefined) return key;
        }
        break;
        }
    }

    if (params) {
        Object.keys(params).forEach((param) => {
        result = result.replace(`:${param}`, params[param]);
        });
    }

    return result;
    },

    changeLocale: (lang: string) => {
    currentLocale = lang as "zh" | "en";
    localStorage.setItem("locale", currentLocale);
    return Promise.resolve();
    },
  getLocale: () => {
    // console.log("[getLocale] Current locale is", currentLocale);
    return currentLocale;
  },
};

export default i18nProvider;
