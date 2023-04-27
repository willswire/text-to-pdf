import { jsPDF } from "jspdf";
import { v4 as uuidv4 } from 'uuid';

export interface Env {
	PDF_BUCKET: R2Bucket;
}

async function retrievePDF(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const filename = url.pathname.slice(1)
	const object = await env.PDF_BUCKET.get(filename);

	if (object === null) {
	  return new Response('Object Not Found', { status: 404 });
	}

	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set('etag', object.httpEtag);

	return new Response(object.body, {
	  headers,
	});
}

async function createPDF(request: Request, env: Env): Promise<string> {
	const document = new jsPDF();
	const content = await request.text();
	document.text(content, 10, 10);
	const value = document.output("arraybuffer");
	const key = uuidv4() + '.pdf';
	await env.PDF_BUCKET.put(key, value);
	return key;
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		const url = new URL(request.url);

		switch (request.method) {
			case 'POST':
				const filename = await createPDF(request, env);
				return new Response(`Success! Your PDF is available at ${url.hostname}/${filename}\n`);
			case 'GET':
				return await retrievePDF(request, env)
			default:
				return new Response('Method Not Allowed', {
					status: 405,
					headers: {
						allow: 'PUT, GET, DELETE'
					}
				})
		}
	},
};
