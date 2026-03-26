# CoMapeo KML Generator

This project allows you to generate KML files from [CoMapeo](https://comapeo.app/) data shared on WhatsApp (or other applications). The generated KML files can be used in applications like Google Earth to visualize the data. 

This is a new version of the [Mapeo KML Generator](https://github.com/rudokemper/mapeo-kml-generator) project, which supports exporting Mapeo messages.

## Features

- Parse UTM coordinates from WhatsApp messages.
- Convert UTM coordinates to latitude and longitude using the `proj4` library.
- Extract and format timestamp, CoMapeo category and description from messages.
- Embed images in the KML file.
- Generate a downloadable KML file with the extracted data.

## Tests

Install dependencies:

```bash
pnpm install
```

Run the test suite:

```bash
pnpm test
```

## Updating fixtures

Fixtures live in `test/fixtures/messages.js`.

Each fixture has:

- `id`: unique test case name
- `raw`: the shared CoMapeo message text
- `expected`: expected parsed fields/assertions

To add a fixture:

1. Copy an existing fixture object.
2. Update `raw` with your new message sample.
3. Update `expected.title`, `expected.category`, `expected.timestamp`, `expected.location`.
4. Add metadata checks in:
   - `metadataIncludes` for lines that must appear
   - `metadataExcludes` for lines that must not appear (optional)

After changes, run:

```bash
pnpm test
```

If tests fail, adjust `expected` values to match the intended output format.