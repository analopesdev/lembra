import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ptBR from "./pt-BR.json";

// pt-BR é o idioma padrão e único da v1 (RNF-10, ADR-0029).
if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    lng: "pt-BR",
    fallbackLng: "pt-BR",
    resources: { "pt-BR": { translation: ptBR } },
    interpolation: { escapeValue: false },
    initAsync: false,
  });
}

export default i18n;
