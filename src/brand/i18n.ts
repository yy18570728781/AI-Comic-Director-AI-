import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { brandCodes, brandResources, type BrandCode } from './resources';

function resolveBrandCode(): BrandCode {
  const envBrand = import.meta.env.VITE_BRAND?.trim().toLowerCase();
  if (envBrand && brandCodes.includes(envBrand as BrandCode)) {
    return envBrand as BrandCode;
  }
  return 'ss';
}

export const currentBrand = resolveBrandCode();

i18n.use(initReactI18next).init({
  resources: brandResources,
  lng: currentBrand,
  fallbackLng: 'ss',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
