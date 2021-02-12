import * as t from 'io-ts';
import * as v from './my-own-validation';
import * as Either from "fp-ts/lib/Either"
import {PathReporter} from 'io-ts/PathReporter'

const url = 'https://bad-api-assignment.reaktor.com';
const categories = ['jackets', 'shirts', 'accessories'];
let fields: string[];

const table = document.createElement('table');
const body = table.createTBody();
document.body.appendChild(table);

function DATAPAYLOAD(payload: any) {
  return new DOMParser().parseFromString(payload, 'application/xml').querySelector('INSTOCKVALUE')?.textContent || '';
}

const AvailabilityCodec = v.object({
  id: v.string,
  DATAPAYLOAD: DATAPAYLOAD
})
type Availability = ReturnType<typeof AvailabilityCodec>

const AvailabilityResponseCodec = v.object({
  response: v.array(AvailabilityCodec)
})
type AvailabilityResponse = ReturnType<typeof AvailabilityResponseCodec>

const ProductCodec = v.object({
  id: v.string,
  name: v.string,
  type: v.string,
  manufacturer: v.string,
  price: v.number
});
type Product = ReturnType<typeof ProductCodec>

async function fetchWithRtry(url: string, ms = 500): Promise<Response> {
    return fetch(url).catch(error => new Promise((resolve) => setTimeout(() => resolve(fetchWithRtry(url, ms)), ms)));
}

async function fetchJSON<T>(url: string, validator: v.Validator<T>): Promise<T> {
  return validator(await (await fetchWithRtry(url)).json());
}

async function fetchManufacturer(manufacturer: string) : Promise<any> {
  const avas = await (await fetchJSON(`${url}/availability/${manufacturer}`, AvailabilityResponseCodec)).response
  avas.filter(a => a.id).forEach(a => {
    const row = document.getElementById(a.id.toLowerCase()) as HTMLTableRowElement;
    if (row && row.lastElementChild) { // set availability text
      row.lastElementChild.textContent = a.DATAPAYLOAD;
    }
  });
}

async function fetchProduct(product: string): Promise<Product[]> {
  const prods = await fetchJSON(`${url}/products/${product}`, v.array(ProductCodec));

  if (!fields) { // create table headers
    fields = [...Object.keys(prods[0]), 'availability'];
    const tr = table.createTHead().insertRow();
    fields.forEach(f => tr.insertCell().textContent = f);
  }
  prods.forEach((p) => { // add content to the table
    const row = body.insertRow();
    fields.forEach(f => row.insertCell().textContent = (p as any)[f]);
    row.id = p.id;
  });
  return prods;
}

async function main() {
  const products = (await Promise.all(categories.map(fetchProduct))).flat();
  const manufacturers = Array.from(new Set(products.map((prd) => prd.manufacturer)));
  await Promise.all(manufacturers.map(fetchManufacturer));
}

main();
