import { jsPDF } from "jspdf";

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	PDF_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
}

async function retrievePDF(filename: string, env: Env): Promise<Response> {
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

async function createPDF(filename: string, content: string, env: Env): Promise<Response> {
	const document = new jsPDF();
	document.text(content, 10, 10);
	await env.PDF_BUCKET.put(filename, document.output("arraybuffer"));
	return new Response(`${filename} saved successfully!`);
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		// const doc = new jsPDF();
		// doc.text("Hello world!", 10, 10);
		// const res = doc.output("arraybuffer")
		// return new Response(res);
		const url = new URL(request.url);
		const filename = url.pathname.slice(1)
		console.log(`${request.method} request made for ${filename}`)

		if (filename.split('.').pop() !== 'pdf') {
			return new Response('You must provide a filename ending in .pdf in the request URL', {
				status: 400
			})
		}

		switch (request.method) {
			case 'POST':
				const content =  await request.text();
				return await createPDF(filename, content, env);
			case 'GET':
				return await retrievePDF(filename, env)
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
