import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Parcel Data API - Cincinnati Metro (7 Counties)
// Integrations with county auditor/PVA systems

interface ParcelData {
  parcelId: string;
  address?: string;
  owner?: string;
  ownerAddress?: string;
  lotSize?: number;
  lotSizeAcres?: number;
  yearBuilt?: number;
  buildingArea?: number;
  stories?: number;
  bedrooms?: number;
  bathrooms?: number;
  assessedValue?: number;
  marketValue?: number;
  landValue?: number;
  improvementValue?: number;
  taxYear?: number;
  propertyClass?: string;
  propertyType?: string;
  subdivision?: string;
  neighborhood?: string;
  schoolDistrict?: string;
  taxDistrict?: string;
  lastSaleDate?: string;
  lastSalePrice?: number;
  deedBook?: string;
  deedPage?: string;
  legalDescription?: string;
  source?: string;
  sourceUrl?: string;
}

// County auditor data sources for all 7 Cincinnati metro counties
const COUNTY_SOURCES: Record<string, {
  name: string;
  state: string;
  fips: string;
  getUrl: (parcelId: string) => string;
  getSearchUrl: (address: string) => string;
  fetchParcel: (parcelId: string, address: string) => Promise<ParcelData | null>;
}> = {
  // ============================================
  // OHIO COUNTIES
  // ============================================
  'Hamilton': {
    name: 'Hamilton County Auditor (CAGIS)',
    state: 'OH',
    fips: '39061',
    getUrl: (parcelId: string) => `https://wedge1.hcauditor.org/view/re/${parcelId.replace(/-/g, '')}`,
    getSearchUrl: (address: string) => `https://wedge1.hcauditor.org/search?address=${encodeURIComponent(address)}`,
    fetchParcel: fetchHamiltonCountyParcel,
  },
  'Butler': {
    name: 'Butler County Auditor',
    state: 'OH',
    fips: '39017',
    getUrl: (parcelId: string) => `https://www.butlercountyauditor.org/Data.aspx?ParcelID=${parcelId}`,
    getSearchUrl: (address: string) => `https://www.butlercountyauditor.org/Search.aspx`,
    fetchParcel: fetchButlerCountyParcel,
  },
  'Warren': {
    name: 'Warren County Auditor',
    state: 'OH',
    fips: '39165',
    getUrl: (parcelId: string) => `https://www.co.warren.oh.us/auditor/parcel/?parcelid=${parcelId}`,
    getSearchUrl: (address: string) => `https://www.co.warren.oh.us/auditor/search/`,
    fetchParcel: fetchWarrenCountyParcel,
  },
  'Clermont': {
    name: 'Clermont County Auditor',
    state: 'OH',
    fips: '39025',
    getUrl: (parcelId: string) => `https://auditor.clermontcountyohio.gov/parcel/${parcelId}`,
    getSearchUrl: (address: string) => `https://auditor.clermontcountyohio.gov/search`,
    fetchParcel: fetchClermontCountyParcel,
  },
  // ============================================
  // KENTUCKY COUNTIES (PVA - Property Valuation Administrator)
  // ============================================
  'Boone': {
    name: 'Boone County PVA',
    state: 'KY',
    fips: '21015',
    getUrl: (parcelId: string) => `https://boonecountypva.com/property-search/?parcel=${parcelId}`,
    getSearchUrl: (address: string) => `https://boonecountypva.com/property-search/`,
    fetchParcel: fetchBooneCountyParcel,
  },
  'Kenton': {
    name: 'Kenton County PVA',
    state: 'KY',
    fips: '21117',
    getUrl: (parcelId: string) => `https://www.kentoncounty.org/pva/property/?parcel=${parcelId}`,
    getSearchUrl: (address: string) => `https://www.kentoncounty.org/pva/search/`,
    fetchParcel: fetchKentonCountyParcel,
  },
  'Campbell': {
    name: 'Campbell County PVA',
    state: 'KY',
    fips: '21037',
    getUrl: (parcelId: string) => `https://www.campbellcountyky.gov/pva/property/${parcelId}`,
    getSearchUrl: (address: string) => `https://www.campbellcountyky.gov/pva/search/`,
    fetchParcel: fetchCampbellCountyParcel,
  },
};

// Hamilton County CAGIS integration
// Uses their REST API for property data
async function fetchHamiltonCountyParcel(parcelId: string, address: string): Promise<ParcelData | null> {
  try {
    // Clean parcel ID - CAGIS uses format like 123-0001-0001-00
    const cleanParcelId = parcelId.replace(/[^0-9]/g, '');

    // Try CAGIS REST API for parcel data
    // The CAGIS API provides property data including owner, values, and building info
    const cagisUrl = `https://cagisonline.hamilton-co.org/arcgis/rest/services/CAGIS/CAGIS_ParcelandBuildings/MapServer/0/query?where=PARCELID='${cleanParcelId}'&outFields=*&f=json`;

    const response = await fetch(cagisUrl, {
      headers: {
        'User-Agent': 'Civix/2.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.log('CAGIS API response not OK:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      console.log('No CAGIS features found for parcel:', parcelId);
      return null;
    }

    const attrs = data.features[0].attributes;

    // Parse the CAGIS response
    return {
      parcelId: attrs.PARCELID || parcelId,
      address: attrs.SITEADDR || address,
      owner: attrs.OWNER || attrs.OWNERNAME,
      ownerAddress: formatOwnerAddress(attrs),
      lotSize: attrs.ACREAGE ? Math.round(attrs.ACREAGE * 43560) : undefined, // Convert acres to sq ft
      lotSizeAcres: attrs.ACREAGE,
      yearBuilt: attrs.YEARBUILT || attrs.YRBLT,
      buildingArea: attrs.SQFEET || attrs.TOTSQFT,
      assessedValue: attrs.APPRTOTL || attrs.TOTALVAL,
      marketValue: attrs.MKTTOTL || attrs.MKTVAL,
      landValue: attrs.APPRLAND || attrs.LANDVAL,
      improvementValue: attrs.APPRIMPR || attrs.IMPRVAL,
      taxYear: attrs.TAXYEAR || new Date().getFullYear(),
      propertyClass: attrs.CLASS || attrs.CLASSDESC || attrs.PROPCLASS,
      subdivision: attrs.SUBDIV || attrs.SUBDNAME,
      lastSaleDate: attrs.SALEDATE ? formatDate(attrs.SALEDATE) : undefined,
      lastSalePrice: attrs.SALEPRICE,
      deedBook: attrs.DEEDBOOK,
      deedPage: attrs.DEEDPAGE,
      source: 'Hamilton County Auditor (CAGIS)',
      sourceUrl: `https://wedge1.hcauditor.org/view/re/${cleanParcelId}`,
    };
  } catch (error) {
    console.error('Error fetching Hamilton County parcel:', error);
    return null;
  }
}

// ============================================
// BUTLER COUNTY, OHIO
// Uses county GIS/Auditor API
// ============================================
async function fetchButlerCountyParcel(parcelId: string, address: string): Promise<ParcelData | null> {
  try {
    // Butler County uses an ArcGIS-based system
    const cleanParcelId = parcelId.replace(/[^0-9A-Za-z]/g, '');

    // Try Butler County GIS REST API
    const apiUrl = `https://gis.bcohio.gov/arcgis/rest/services/Auditor/ParcelData/MapServer/0/query?where=PARCELID='${cleanParcelId}'&outFields=*&f=json`;

    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Civix/2.0', 'Accept': 'application/json' },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.features || data.features.length === 0) return null;

    const attrs = data.features[0].attributes;

    return {
      parcelId: attrs.PARCELID || parcelId,
      address: attrs.SITEADDRESS || attrs.ADDRESS || address,
      owner: attrs.OWNER || attrs.OWNERNAME,
      ownerAddress: [attrs.MAILADDR1, attrs.MAILADDR2, attrs.MAILCITY, attrs.MAILSTATE, attrs.MAILZIP].filter(Boolean).join(', ') || undefined,
      lotSize: attrs.ACRES ? Math.round(attrs.ACRES * 43560) : undefined,
      lotSizeAcres: attrs.ACRES,
      yearBuilt: attrs.YEARBUILT || attrs.YRBLT,
      buildingArea: attrs.SQFT || attrs.TOTSQFT || attrs.BLDGSQFT,
      assessedValue: attrs.TOTALVALUE || attrs.APPRTOTAL,
      marketValue: attrs.MARKETVALUE || attrs.MKTTOTAL,
      landValue: attrs.LANDVALUE || attrs.APPRLAND,
      improvementValue: attrs.IMPROVEMENTVALUE || attrs.APPRIMPR,
      taxYear: attrs.TAXYEAR || new Date().getFullYear(),
      propertyClass: attrs.CLASSCD || attrs.PROPCLASS,
      propertyType: attrs.PROPTYPE || attrs.USEDESC,
      subdivision: attrs.SUBDIVISION || attrs.SUBDIV,
      neighborhood: attrs.NEIGHBORHOOD || attrs.NBHD,
      schoolDistrict: attrs.SCHOOLDIST || attrs.SCHOOLDISTRICT,
      taxDistrict: attrs.TAXDIST || attrs.TAXDISTRICT,
      lastSaleDate: attrs.SALEDATE ? formatDate(attrs.SALEDATE) : undefined,
      lastSalePrice: attrs.SALEPRICE || attrs.SALEAMOUNT,
      deedBook: attrs.DEEDBOOK || attrs.BOOK,
      deedPage: attrs.DEEDPAGE || attrs.PAGE,
      legalDescription: attrs.LEGALDESC || attrs.LEGAL,
      source: 'Butler County Auditor',
      sourceUrl: `https://www.butlercountyauditor.org/Data.aspx?ParcelID=${cleanParcelId}`,
    };
  } catch (error) {
    console.error('Error fetching Butler County parcel:', error);
    return null;
  }
}

// ============================================
// WARREN COUNTY, OHIO
// Uses county auditor GIS system
// ============================================
async function fetchWarrenCountyParcel(parcelId: string, address: string): Promise<ParcelData | null> {
  try {
    const cleanParcelId = parcelId.replace(/[^0-9A-Za-z-]/g, '');

    // Warren County GIS API
    const apiUrl = `https://gis.co.warren.oh.us/arcgis/rest/services/Auditor/Parcels/MapServer/0/query?where=PARCELID='${cleanParcelId}'&outFields=*&f=json`;

    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Civix/2.0', 'Accept': 'application/json' },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.features || data.features.length === 0) return null;

    const attrs = data.features[0].attributes;

    return {
      parcelId: attrs.PARCELID || attrs.PARCEL || parcelId,
      address: attrs.SITEADDR || attrs.PROPADDR || address,
      owner: attrs.OWNER || attrs.OWNERNAME || attrs.OWNER1,
      ownerAddress: [attrs.OWNERADDR, attrs.OWNERCITY, attrs.OWNERSTATE, attrs.OWNERZIP].filter(Boolean).join(', ') || undefined,
      lotSize: attrs.ACREAGE ? Math.round(attrs.ACREAGE * 43560) : undefined,
      lotSizeAcres: attrs.ACREAGE || attrs.ACRES,
      yearBuilt: attrs.YEARBUILT || attrs.YRBLT || attrs.EFFYEAR,
      buildingArea: attrs.SQFEET || attrs.TOTSQFT || attrs.SQFT,
      assessedValue: attrs.TOTALVAL || attrs.APPRTOTAL,
      marketValue: attrs.MKTVALUE || attrs.MKTTOTAL,
      landValue: attrs.LANDVAL || attrs.APPRLAND,
      improvementValue: attrs.IMPRVAL || attrs.APPRIMPR,
      taxYear: attrs.TAXYEAR || new Date().getFullYear(),
      propertyClass: attrs.PROPCLASS || attrs.CLASSCD,
      propertyType: attrs.PROPTYPE || attrs.USETYPE,
      subdivision: attrs.SUBDIV || attrs.SUBDIVISION,
      schoolDistrict: attrs.SCHOOLDIST,
      taxDistrict: attrs.TAXDIST,
      lastSaleDate: attrs.SALEDATE ? formatDate(attrs.SALEDATE) : undefined,
      lastSalePrice: attrs.SALEPRICE,
      deedBook: attrs.DEEDBOOK,
      deedPage: attrs.DEEDPAGE,
      legalDescription: attrs.LEGALDESC,
      source: 'Warren County Auditor',
      sourceUrl: `https://www.co.warren.oh.us/auditor/parcel/?parcelid=${cleanParcelId}`,
    };
  } catch (error) {
    console.error('Error fetching Warren County parcel:', error);
    return null;
  }
}

// ============================================
// CLERMONT COUNTY, OHIO
// Uses county auditor GIS system
// ============================================
async function fetchClermontCountyParcel(parcelId: string, address: string): Promise<ParcelData | null> {
  try {
    const cleanParcelId = parcelId.replace(/[^0-9A-Za-z-]/g, '');

    // Clermont County GIS API
    const apiUrl = `https://gis.clermontcountyohio.gov/arcgis/rest/services/Auditor/Parcels/MapServer/0/query?where=PARCELID='${cleanParcelId}'&outFields=*&f=json`;

    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Civix/2.0', 'Accept': 'application/json' },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.features || data.features.length === 0) return null;

    const attrs = data.features[0].attributes;

    return {
      parcelId: attrs.PARCELID || parcelId,
      address: attrs.SITEADDR || attrs.ADDRESS || address,
      owner: attrs.OWNER || attrs.OWNERNAME,
      ownerAddress: [attrs.MAILADDR, attrs.MAILCITY, attrs.MAILSTATE, attrs.MAILZIP].filter(Boolean).join(', ') || undefined,
      lotSize: attrs.ACREAGE ? Math.round(attrs.ACREAGE * 43560) : undefined,
      lotSizeAcres: attrs.ACREAGE,
      yearBuilt: attrs.YEARBUILT || attrs.YRBLT,
      buildingArea: attrs.SQFEET || attrs.TOTSQFT,
      assessedValue: attrs.TOTALVAL || attrs.APPRTOTAL,
      marketValue: attrs.MKTVALUE || attrs.MKTTOTAL,
      landValue: attrs.LANDVAL,
      improvementValue: attrs.IMPRVAL,
      taxYear: attrs.TAXYEAR || new Date().getFullYear(),
      propertyClass: attrs.PROPCLASS || attrs.CLASSCD,
      propertyType: attrs.PROPTYPE,
      subdivision: attrs.SUBDIV || attrs.SUBDIVISION,
      schoolDistrict: attrs.SCHOOLDIST,
      taxDistrict: attrs.TAXDIST,
      lastSaleDate: attrs.SALEDATE ? formatDate(attrs.SALEDATE) : undefined,
      lastSalePrice: attrs.SALEPRICE,
      deedBook: attrs.DEEDBOOK,
      deedPage: attrs.DEEDPAGE,
      legalDescription: attrs.LEGALDESC,
      source: 'Clermont County Auditor',
      sourceUrl: `https://auditor.clermontcountyohio.gov/parcel/${cleanParcelId}`,
    };
  } catch (error) {
    console.error('Error fetching Clermont County parcel:', error);
    return null;
  }
}

// ============================================
// BOONE COUNTY, KENTUCKY
// Uses Kentucky PVA system
// ============================================
async function fetchBooneCountyParcel(parcelId: string, address: string): Promise<ParcelData | null> {
  try {
    const cleanParcelId = parcelId.replace(/[^0-9A-Za-z-]/g, '');

    // Try Boone County PVA GIS API
    const apiUrl = `https://gis.boonecountyky.org/arcgis/rest/services/PVA/Parcels/MapServer/0/query?where=PARCELID='${cleanParcelId}'&outFields=*&f=json`;

    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Civix/2.0', 'Accept': 'application/json' },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.features || data.features.length === 0) return null;

    const attrs = data.features[0].attributes;

    return {
      parcelId: attrs.PARCELID || attrs.PVA_PARCEL || parcelId,
      address: attrs.SITEADDR || attrs.PROPADDR || attrs.ADDRESS || address,
      owner: attrs.OWNER || attrs.OWNERNAME || attrs.NAME,
      ownerAddress: [attrs.MAILADDR, attrs.MAILCITY, attrs.MAILSTATE, attrs.MAILZIP].filter(Boolean).join(', ') || undefined,
      lotSize: attrs.ACREAGE ? Math.round(attrs.ACREAGE * 43560) : undefined,
      lotSizeAcres: attrs.ACREAGE || attrs.ACRES,
      yearBuilt: attrs.YEARBUILT || attrs.YRBLT || attrs.BUILTYR,
      buildingArea: attrs.SQFEET || attrs.TOTSQFT || attrs.SQFT,
      stories: attrs.STORIES || attrs.NUMSTORIES,
      bedrooms: attrs.BEDROOMS || attrs.BEDS,
      bathrooms: attrs.BATHROOMS || attrs.BATHS || attrs.FULLBATHS,
      assessedValue: attrs.TOTALVAL || attrs.ASSESSMENT,
      marketValue: attrs.FAIRMARKET || attrs.MARKETVAL,
      landValue: attrs.LANDVAL || attrs.LANDVALUE,
      improvementValue: attrs.IMPRVAL || attrs.IMPROVEMENTVAL,
      taxYear: attrs.TAXYEAR || new Date().getFullYear(),
      propertyClass: attrs.PROPCLASS || attrs.CLASSCD || attrs.CLASS,
      propertyType: attrs.PROPTYPE || attrs.USEDESC || attrs.LANDUSE,
      subdivision: attrs.SUBDIV || attrs.SUBDIVISION || attrs.SUBDNAME,
      neighborhood: attrs.NEIGHBORHOOD || attrs.NBHD,
      schoolDistrict: attrs.SCHOOLDIST,
      taxDistrict: attrs.TAXDIST || attrs.TAXCODE,
      lastSaleDate: attrs.SALEDATE ? formatDate(attrs.SALEDATE) : undefined,
      lastSalePrice: attrs.SALEPRICE || attrs.SALEAMT,
      deedBook: attrs.DEEDBOOK || attrs.BOOK,
      deedPage: attrs.DEEDPAGE || attrs.PAGE,
      legalDescription: attrs.LEGALDESC || attrs.LEGAL,
      source: 'Boone County PVA',
      sourceUrl: `https://boonecountypva.com/property-search/?parcel=${cleanParcelId}`,
    };
  } catch (error) {
    console.error('Error fetching Boone County parcel:', error);
    return null;
  }
}

// ============================================
// KENTON COUNTY, KENTUCKY
// Uses Kentucky PVA system
// ============================================
async function fetchKentonCountyParcel(parcelId: string, address: string): Promise<ParcelData | null> {
  try {
    const cleanParcelId = parcelId.replace(/[^0-9A-Za-z-]/g, '');

    // Try Kenton County PVA GIS API
    const apiUrl = `https://gis.kentoncounty.org/arcgis/rest/services/PVA/Parcels/MapServer/0/query?where=PARCELID='${cleanParcelId}'&outFields=*&f=json`;

    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Civix/2.0', 'Accept': 'application/json' },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.features || data.features.length === 0) return null;

    const attrs = data.features[0].attributes;

    return {
      parcelId: attrs.PARCELID || attrs.PVA_PARCEL || parcelId,
      address: attrs.SITEADDR || attrs.PROPADDR || attrs.ADDRESS || address,
      owner: attrs.OWNER || attrs.OWNERNAME || attrs.NAME,
      ownerAddress: [attrs.MAILADDR, attrs.MAILCITY, attrs.MAILSTATE, attrs.MAILZIP].filter(Boolean).join(', ') || undefined,
      lotSize: attrs.ACREAGE ? Math.round(attrs.ACREAGE * 43560) : undefined,
      lotSizeAcres: attrs.ACREAGE || attrs.ACRES,
      yearBuilt: attrs.YEARBUILT || attrs.YRBLT || attrs.BUILTYR,
      buildingArea: attrs.SQFEET || attrs.TOTSQFT || attrs.SQFT,
      stories: attrs.STORIES,
      bedrooms: attrs.BEDROOMS || attrs.BEDS,
      bathrooms: attrs.BATHROOMS || attrs.BATHS,
      assessedValue: attrs.TOTALVAL || attrs.ASSESSMENT,
      marketValue: attrs.FAIRMARKET || attrs.MARKETVAL,
      landValue: attrs.LANDVAL,
      improvementValue: attrs.IMPRVAL,
      taxYear: attrs.TAXYEAR || new Date().getFullYear(),
      propertyClass: attrs.PROPCLASS || attrs.CLASSCD,
      propertyType: attrs.PROPTYPE || attrs.USEDESC,
      subdivision: attrs.SUBDIV || attrs.SUBDIVISION,
      neighborhood: attrs.NEIGHBORHOOD,
      schoolDistrict: attrs.SCHOOLDIST,
      taxDistrict: attrs.TAXDIST,
      lastSaleDate: attrs.SALEDATE ? formatDate(attrs.SALEDATE) : undefined,
      lastSalePrice: attrs.SALEPRICE,
      deedBook: attrs.DEEDBOOK,
      deedPage: attrs.DEEDPAGE,
      legalDescription: attrs.LEGALDESC,
      source: 'Kenton County PVA',
      sourceUrl: `https://www.kentoncounty.org/pva/property/?parcel=${cleanParcelId}`,
    };
  } catch (error) {
    console.error('Error fetching Kenton County parcel:', error);
    return null;
  }
}

// ============================================
// CAMPBELL COUNTY, KENTUCKY
// Uses Kentucky PVA system
// ============================================
async function fetchCampbellCountyParcel(parcelId: string, address: string): Promise<ParcelData | null> {
  try {
    const cleanParcelId = parcelId.replace(/[^0-9A-Za-z-]/g, '');

    // Try Campbell County PVA GIS API
    const apiUrl = `https://gis.campbellcountyky.gov/arcgis/rest/services/PVA/Parcels/MapServer/0/query?where=PARCELID='${cleanParcelId}'&outFields=*&f=json`;

    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Civix/2.0', 'Accept': 'application/json' },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.features || data.features.length === 0) return null;

    const attrs = data.features[0].attributes;

    return {
      parcelId: attrs.PARCELID || attrs.PVA_PARCEL || parcelId,
      address: attrs.SITEADDR || attrs.PROPADDR || attrs.ADDRESS || address,
      owner: attrs.OWNER || attrs.OWNERNAME || attrs.NAME,
      ownerAddress: [attrs.MAILADDR, attrs.MAILCITY, attrs.MAILSTATE, attrs.MAILZIP].filter(Boolean).join(', ') || undefined,
      lotSize: attrs.ACREAGE ? Math.round(attrs.ACREAGE * 43560) : undefined,
      lotSizeAcres: attrs.ACREAGE || attrs.ACRES,
      yearBuilt: attrs.YEARBUILT || attrs.YRBLT || attrs.BUILTYR,
      buildingArea: attrs.SQFEET || attrs.TOTSQFT || attrs.SQFT,
      stories: attrs.STORIES,
      bedrooms: attrs.BEDROOMS || attrs.BEDS,
      bathrooms: attrs.BATHROOMS || attrs.BATHS,
      assessedValue: attrs.TOTALVAL || attrs.ASSESSMENT,
      marketValue: attrs.FAIRMARKET || attrs.MARKETVAL,
      landValue: attrs.LANDVAL,
      improvementValue: attrs.IMPRVAL,
      taxYear: attrs.TAXYEAR || new Date().getFullYear(),
      propertyClass: attrs.PROPCLASS || attrs.CLASSCD,
      propertyType: attrs.PROPTYPE || attrs.USEDESC,
      subdivision: attrs.SUBDIV || attrs.SUBDIVISION,
      neighborhood: attrs.NEIGHBORHOOD,
      schoolDistrict: attrs.SCHOOLDIST,
      taxDistrict: attrs.TAXDIST,
      lastSaleDate: attrs.SALEDATE ? formatDate(attrs.SALEDATE) : undefined,
      lastSalePrice: attrs.SALEPRICE,
      deedBook: attrs.DEEDBOOK,
      deedPage: attrs.DEEDPAGE,
      legalDescription: attrs.LEGALDESC,
      source: 'Campbell County PVA',
      sourceUrl: `https://www.campbellcountyky.gov/pva/property/${cleanParcelId}`,
    };
  } catch (error) {
    console.error('Error fetching Campbell County parcel:', error);
    return null;
  }
}

function formatOwnerAddress(attrs: Record<string, any>): string | undefined {
  const parts = [
    attrs.OWNERADDR || attrs.MAILADDR,
    attrs.OWNERCITY || attrs.MAILCITY,
    attrs.OWNERSTATE || attrs.MAILSTATE,
    attrs.OWNERZIP || attrs.MAILZIP,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : undefined;
}

function formatDate(dateValue: string | number): string {
  if (!dateValue) return '';

  // Handle epoch timestamp (milliseconds)
  if (typeof dateValue === 'number') {
    return new Date(dateValue).toISOString().split('T')[0];
  }

  // Handle string dates
  try {
    return new Date(dateValue).toISOString().split('T')[0];
  } catch {
    return String(dateValue);
  }
}

function normalizeCountyName(county: string | null | undefined): string | null {
  if (!county) return null;

  // Remove " County" suffix and normalize
  return county
    .replace(/\s+County$/i, '')
    .trim();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parcelId = searchParams.get('parcelId');
    const address = searchParams.get('address') || '';
    const county = searchParams.get('county');
    const state = searchParams.get('state');

    if (!parcelId) {
      return NextResponse.json(
        { success: false, error: 'Parcel ID is required' },
        { status: 400 }
      );
    }

    // Normalize county name
    const normalizedCounty = normalizeCountyName(county);

    // Find the county source
    const countySource = normalizedCounty ? COUNTY_SOURCES[normalizedCounty] : null;

    if (!countySource) {
      // County not supported - return helpful error
      return NextResponse.json({
        success: false,
        error: `Parcel data integration not yet available for ${county || 'this county'}`,
        parcel: {
          parcelId,
          source: county ? `${county} Auditor` : 'County Auditor',
          sourceUrl: null,
        },
      });
    }

    // Check state matches if provided
    if (state && countySource.state !== state.toUpperCase()) {
      return NextResponse.json({
        success: false,
        error: `County/state mismatch: ${county} is in ${countySource.state}, not ${state}`,
      });
    }

    // Fetch parcel data from county source
    const parcelData = await countySource.fetchParcel(parcelId, address);

    if (!parcelData) {
      // Couldn't fetch data - return link to county website
      return NextResponse.json({
        success: false,
        error: `Could not retrieve parcel data from ${countySource.name}. Try searching directly.`,
        parcel: {
          parcelId,
          source: countySource.name,
          sourceUrl: countySource.getUrl(parcelId),
        },
      });
    }

    return NextResponse.json({
      success: true,
      parcel: parcelData,
    });
  } catch (error) {
    console.error('Parcel data API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch parcel data' },
      { status: 500 }
    );
  }
}
