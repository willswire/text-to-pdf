import { jsPDF } from "jspdf";
import { v4 as uuidv4 } from 'uuid';

export interface Env {
	PDF_BUCKET: R2Bucket;
}

async function retrievePDF(request: Request, env: Env): Promise<Response> {
	try {
		const url = new URL(request.url);
		const filename = url.pathname.slice(1)
		const pdfObject = await env.PDF_BUCKET.get(filename);

		if (!pdfObject) {
			return new Response('Object Not Found', { status: 404 });
		}

		const headers = new Headers();
		pdfObject.writeHttpMetadata(headers);
		headers.set('etag', pdfObject.httpEtag);

		return new Response(pdfObject.body, { headers });
	} catch (error) {
		console.error(error);
		return new Response('Server Error', { status: 500 });
	}
}

async function createPDF(request: Request, env: Env): Promise<string> {
	try {
		const pdfDocument = new jsPDF();
		const content = await request.text();
		pdfDocument.text(content, 10, 10);
		const pdfArrayBuffer = pdfDocument.output("arraybuffer");
		const pdfKey = `${uuidv4()}.pdf`;
		await env.PDF_BUCKET.put(pdfKey, pdfArrayBuffer);
		return pdfKey;
	} catch (error) {
		console.error(error);
		return '';
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		switch (request.method) {
			case 'POST':
				try {
					const filename = await createPDF(request, env);
					return new Response(`Success! Your PDF is available at ${url.hostname}/${filename}\n`);
				} catch (error) {
					return new Response('Failed to create PDF', { status: 500 });
				}
			case 'GET':
				return await retrievePDF(request, env)
			default:
				return new Response('Method Not Allowed', {
					status: 405,
					headers: {
						allow: 'POST, GET'
					}
				})
		}
	},
};
