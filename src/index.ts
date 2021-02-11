import * as t from 'io-ts';
import * as Either from "fp-ts/lib/Either"
import {PathReporter} from 'io-ts/PathReporter'

const url = 'https://bad-api-assignment.reaktor.com';
const categories = ['jackets', 'shirts', 'accessories'];
let fields: string[];

const table = document.createElement('table');
const body = table.createTBody();
document.body.appendChild(table);

const AvailabilityCodec = t.type({
  id: t.string,
  DATAPAYLOAD: t.string
}, "Availability")
type Availability = t.TypeOf<typeof AvailabilityCodec>

const AvailabilityResponseCodec = t.type({
  response: t.array(AvailabilityCodec)
}, "Availability")
type AvailabilityResponse = t.TypeOf<typeof AvailabilityResponseCodec>

const ProductCodec = t.type({
  id: t.string,
  name: t.string,
  type: t.string,
  manufacturer: t.string,
  price: t.number
}, "Product");
type Product = t.TypeOf<typeof ProductCodec>

async function fetchWithRtry(url: string, ms = 500): Promise<Response> {
    return fetch(url).catch(error => new Promise((resolve) => setTimeout(() => resolve(fetchWithRtry(url, ms)), ms)));
}

async function fetchJSON<T>(url: string, codec: t.Type<T>): Promise<T> {
  const result = codec.decode(await (await fetchWithRtry(url)).json());
  if (Either.isRight(result)) {
      return result.right
  } else {
      throw Error(PathReporter.report(result).join("\n"))
  }
}

function parseAva(payload: string): string {
  return new DOMParser().parseFromString(payload, 'application/xml').querySelector('INSTOCKVALUE')?.textContent || '';
}

async function fetchManufacturer(manufacturer: string) : Promise<any> {
  const avas = await (await fetchJSON(`${url}/availability/${manufacturer}`, AvailabilityResponseCodec)).response
  avas.filter(a => a.id).forEach(a => {
    const row = document.getElementById(a.id.toLowerCase()) as HTMLTableRowElement;
    if (row && row.lastElementChild) { // set availability text
      row.lastElementChild.textContent = parseAva(a.DATAPAYLOAD);
    }
  });
}

async function fetchProduct(product: string): Promise<Product[]> {
  const prods = await fetchJSON(`${url}/products/${product}`, t.array(ProductCodec));

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
