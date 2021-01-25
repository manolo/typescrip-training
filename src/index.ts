const url = 'https://bad-api-assignment.reaktor.com';
const categories = ['jackets', 'shirts', 'accessories'];
let fields: string[];

const table = document.createElement('table');
const body = table.createTBody();
document.body.appendChild(table);
interface Product {
  id: string;
  availability: string;
  manufacturer: string;
}
interface Availability {
  id: string;
  DATAPAYLOAD: any;
}

async function fetchWithRtry(url: string, ms = 500): Promise<Response> {
    return fetch(url).catch(error => new Promise((resolve) => setTimeout(() => resolve(fetchWithRtry(url, ms)), ms)));
}

function parseAva(payload: string): string {
  return new DOMParser().parseFromString(payload, 'application/xml').querySelector('INSTOCKVALUE')?.textContent || '';
}

async function fetchManufacturer(manufacturer: string) : Promise<any> {
  const avas = (await (await fetchWithRtry(`${url}/availability/${manufacturer}`)).json()).response as Availability[];
  if (!(avas instanceof Array)) { // retry, because some times returns a non array
    return fetchManufacturer(manufacturer);
  }
  avas.filter(a => a.id).forEach(a => {
    const row = document.getElementById(a.id.toLowerCase()) as HTMLTableRowElement;
    if (row && row.lastElementChild) { // set availability text
      row.lastElementChild.textContent = parseAva(a.DATAPAYLOAD);
    }
  });
}

async function fetchProduct(product: string): Promise<Product[]> {
  const prods = (await (await fetchWithRtry(`${url}/products/${product}`)).json()) as Product[];
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
  await Promise.all(manufacturers.map(fetchManufacturer))
}

main();