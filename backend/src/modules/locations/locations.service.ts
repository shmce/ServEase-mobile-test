import { Injectable } from '@nestjs/common';

const PSGC_BASE_URL = 'https://psgc.cloud/api/v2';
const NCR_CODE = '1300000000';
const NCR_LABEL = 'National Capital Region (NCR)';
const MANILA_CITY_CODE = '1380600000';
const MANILA_PREFIX = '13806';

type LocationOption = {
  code: string;
  name: string;
};

const NCR_CITIES: LocationOption[] = [
  { code: MANILA_CITY_CODE, name: 'City of Manila' },
  { code: '1381300000', name: 'Quezon City' },
  { code: '1380300000', name: 'City of Makati' },
  { code: '1381200000', name: 'City of Pasig' },
  { code: '1381500000', name: 'City of Taguig' },
  { code: '1380500000', name: 'City of Mandaluyong' },
  { code: '1380700000', name: 'City of Marikina' },
  { code: '1381100000', name: 'City of Pasay' },
  { code: '1381000000', name: 'City of Paranaque' },
  { code: '1380400000', name: 'City of Las Pinas' },
  { code: '1380800000', name: 'City of Muntinlupa' },
  { code: '1381400000', name: 'City of San Juan' },
  { code: '1380100000', name: 'City of Caloocan' },
  { code: '1380200000', name: 'City of Malabon' },
  { code: '1380900000', name: 'City of Navotas' },
  { code: '1381600000', name: 'City of Valenzuela' },
  { code: '1381700000', name: 'Pateros' },
];

const FALLBACK_PROVINCES: LocationOption[] = [
  { code: NCR_CODE, name: NCR_LABEL },
  { code: '0402100000', name: 'Cavite' },
  { code: '0702200000', name: 'Cebu' },
  { code: '1102400000', name: 'Davao del Sur' },
  { code: '0300800000', name: 'Bulacan' },
  { code: '0403400000', name: 'Laguna' },
  { code: '0405800000', name: 'Rizal' },
];

@Injectable()
export class LocationsService {
  async getProvinces(): Promise<LocationOption[]> {
    try {
      const data = await this.fetchOptions(`${PSGC_BASE_URL}/provinces`);
      if (!Array.isArray(data) || data.length === 0) {
        return FALLBACK_PROVINCES;
      }

      const provinces = data
        .filter((item) => item?.name && item?.code)
        .map((item) => ({ code: item.code, name: item.name }))
        .sort((left, right) => left.name.localeCompare(right.name));

      return [{ code: NCR_CODE, name: NCR_LABEL }, ...provinces];
    } catch {
      return FALLBACK_PROVINCES;
    }
  }

  async getCities(provinceCode: string): Promise<LocationOption[]> {
    const endpoint =
      provinceCode === NCR_CODE
        ? `${PSGC_BASE_URL}/regions/${provinceCode}/cities-municipalities`
        : `${PSGC_BASE_URL}/provinces/${provinceCode}/cities-municipalities`;

    try {
      const data = await this.fetchOptions(endpoint);
      if (!Array.isArray(data) || data.length === 0) {
        return provinceCode === NCR_CODE ? NCR_CITIES : [];
      }

      return data
        .filter((item) => item?.name && item?.code)
        .map((item) => ({ code: item.code, name: item.name }))
        .sort((left, right) => left.name.localeCompare(right.name));
    } catch {
      return provinceCode === NCR_CODE ? NCR_CITIES : [];
    }
  }

  async getBarangays(cityCode: string): Promise<LocationOption[]> {
    const isManila = cityCode === MANILA_CITY_CODE;
    const endpoint = isManila
      ? `${PSGC_BASE_URL}/regions/${NCR_CODE}/barangays`
      : `${PSGC_BASE_URL}/cities-municipalities/${cityCode}/barangays`;

    try {
      let data = await this.fetchOptions(endpoint);
      if (!Array.isArray(data) || data.length === 0) {
        return [];
      }

      if (isManila) {
        data = data.filter((item) => item?.code?.startsWith(MANILA_PREFIX));
      }

      return data
        .filter((item) => item?.name && item?.code)
        .map((item) => ({ code: item.code, name: item.name }))
        .sort((left, right) => left.name.localeCompare(right.name));
    } catch {
      return [];
    }
  }

  private async fetchOptions(endpoint: string): Promise<LocationOption[]> {
    const response = await fetch(endpoint);
    const json = (await response.json()) as
      | LocationOption[]
      | { data?: LocationOption[] };

    if (Array.isArray(json)) {
      return json;
    }

    if (Array.isArray((json as { data?: LocationOption[] }).data)) {
      return (json as { data: LocationOption[] }).data;
    }

    return [];
  }
}
