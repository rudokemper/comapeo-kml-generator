const test = require("node:test");
const assert = require("node:assert/strict");
const fixtures = require("./fixtures/messages");
const {
  normalizeMessage,
  parseUTMFromText,
  utmToLatLng,
  buildKML,
} = require("../script/kmlGenerator");

test("normalizeMessage parses new CoMapeo formats", () => {
  fixtures.forEach((fixture) => {
    const parsed = normalizeMessage(fixture.raw);

    assert.equal(parsed.title, fixture.expected.title, `${fixture.id}: title`);
    assert.equal(
      parsed.category,
      fixture.expected.category,
      `${fixture.id}: category`,
    );
    assert.equal(
      parsed.timestamp,
      fixture.expected.timestamp,
      `${fixture.id}: timestamp`,
    );
    assert.equal(
      parsed.location,
      fixture.expected.location,
      `${fixture.id}: location`,
    );

    fixture.expected.metadataIncludes.forEach((fragment) => {
      assert.ok(
        parsed.metadata.includes(fragment),
        `${fixture.id}: missing metadata fragment "${fragment}"`,
      );
    });

    (fixture.expected.metadataExcludes || []).forEach((fragment) => {
      assert.ok(
        !parsed.metadata.some((item) => item.includes(fragment)),
        `${fixture.id}: unexpected metadata fragment "${fragment}"`,
      );
    });
  });
});

test("parseUTMFromText extracts zone/easting/northing", () => {
  const parsed = parseUTMFromText("UTM 18T 585000 4513500");
  assert.deepEqual(parsed, {
    zone: "18T",
    easting: 585000,
    northing: 4513500,
  });
});

test("utmToLatLng returns expected coordinates shape", () => {
  const { lat, lng } = utmToLatLng("18T", 585000, 4513500);
  assert.ok(Number.isFinite(lat));
  assert.ok(Number.isFinite(lng));
  assert.ok(lat > 0 && lat < 90);
  assert.ok(lng > -180 && lng < 180);
});

test("buildKML outputs expected format", () => {
  const parsed = fixtures.map((fixture) => {
    const normalized = normalizeMessage(fixture.raw);
    const utm = parseUTMFromText(normalized.location);
    const { lat, lng } = utmToLatLng(utm.zone, utm.easting, utm.northing);
    return { ...normalized, lat, lng, base64Image: null };
  });

  const kml = buildKML(parsed);
  assert.ok(kml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(kml.includes('<kml xmlns="http://www.opengis.net/kml/2.2">'));
  assert.ok(kml.includes("<Document>"));
  assert.ok(kml.includes("<Placemark>"));
  assert.ok(kml.includes("<ExtendedData>"));
  assert.ok(kml.includes('<Data name="Metadata">'));

  fixtures.forEach((fixture) => {
    assert.ok(
      kml.includes(`${fixture.expected.title} - ${fixture.expected.category}`),
      `missing placemark name for ${fixture.id}`,
    );
    assert.ok(
      kml.includes(fixture.expected.timestamp),
      `missing timestamp for ${fixture.id}`,
    );
  });
});

test("buildKML aggregates multiple messages like HTML flow", () => {
  const selected = fixtures.slice(0, 2).map((fixture) => {
    const normalized = normalizeMessage(fixture.raw);
    const utm = parseUTMFromText(normalized.location);
    const { lat, lng } = utmToLatLng(utm.zone, utm.easting, utm.northing);
    return { ...normalized, lat, lng, base64Image: null };
  });

  const kml = buildKML(selected);
  const placemarkCount = (kml.match(/<Placemark>/g) || []).length;

  assert.equal(placemarkCount, 2);
  assert.ok(
    kml.includes(
      `${fixtures[0].expected.title} - ${fixtures[0].expected.category}`,
    ),
  );
  assert.ok(
    kml.includes(
      `${fixtures[1].expected.title} - ${fixtures[1].expected.category}`,
    ),
  );
});

test("buildKML includes image block when message has base64 image", () => {
  const normalized = normalizeMessage(fixtures[0].raw);
  const utm = parseUTMFromText(normalized.location);
  const { lat, lng } = utmToLatLng(utm.zone, utm.easting, utm.northing);
  const base64Image = "data:image/jpeg;base64,FAKEIMAGEBASE64";

  const kml = buildKML([{ ...normalized, lat, lng, base64Image }]);

  assert.ok(kml.includes(`<img src="${base64Image}" width="400"/><br/><br/>`));
  assert.ok(kml.includes("<Placemark>"));
  assert.ok(
    kml.includes(`${normalized.title} - ${normalized.category}`),
    "placemark name should still be present when image is attached",
  );
});
