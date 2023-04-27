# Cloudflare PDF Worker

This is a Cloudflare Worker that allows you to create and retrieve PDFs using HTTP GET and POST requests. It uses the jsPDF library to create PDFs and the `uuid` library to generate unique names for each PDF. The PDFs are stored in an R2 bucket.

## Requirements

- Node.js v14.0.0 or later
- Yarn or npm
- Cloudflare account
- Wrangler CLI installed globally (`npm install @cloudflare/wrangler -g`)

## Usage

### Create a PDF

Make a POST request with the text you want to be in the PDF. 

Curl example:

```bash
curl -X POST -H "Content-Type: text/plain" -d "Your text here" https://<your-worker-name>.<account_id>.workers.dev
```

The response will contain a URL where your generated PDF can be retrieved.

### Retrieve a PDF

Make a GET request to the URL provided when you created the PDF.

Curl example:

```bash
curl -X GET https://<your-worker-name>.<account_id>.workers.dev/<pdf-id>
```

The response will be the requested PDF file.

## Testing

You can test your worker locally using Wrangler.

```bash
wrangler dev
```

This will start a local server where you can send requests to your worker.

## Contributing

Feel free to fork this repository and make any changes you like. If you think your changes could be beneficial to others, please make a pull request.

## License

This project is licensed under the MIT License.