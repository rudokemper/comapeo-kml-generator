const proj4Lib =
  typeof proj4 !== "undefined"
    ? proj4
    : typeof require !== "undefined"
      ? require("proj4")
      : null;

function isFooterLine(line) {
  return /^—.*?—$/.test(line.trim());
}

function parseHeaderLine(line) {
  const parts = line
    .split(" - ")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 3) {
    return {
      title: line.trim() || "Unknown Title",
      category: "Unknown Category",
      timestamp: "Unknown Date",
    };
  }

  return {
    title: parts.slice(0, -2).join(" - "),
    category: parts[parts.length - 2] || "Unknown Category",
    timestamp: parts[parts.length - 1] || "Unknown Date",
  };
}

function parseLabelValueLine(line) {
  const separatorIdx = line.indexOf(":");
  if (separatorIdx === -1) {
    return null;
  }
  const label = line.slice(0, separatorIdx).trim();
  const value = line.slice(separatorIdx + 1).trim();
  return { label, value };
}

function parseBracketDescriptionLine(line) {
  const match = line.match(/^\[(.+?):\s*(.*)\]$/);
  if (!match) {
    return null;
  }
  return { label: match[1].trim(), value: match[2].trim() };
}

function parseUTMFromText(location) {
  const utmRegex = /UTM\s+(\d{1,2}[A-Z])\s+(\d{6,7})\s+(\d{7,8})/i;
  const match = location.match(utmRegex);
  if (!match) {
    return null;
  }

  return {
    zone: match[1].toUpperCase(),
    easting: Number.parseFloat(match[2]),
    northing: Number.parseFloat(match[3]),
  };
}

function normalizeMessage(message) {
  const lines = message
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return {
      title: "Unknown Title",
      category: "Unknown Category",
      timestamp: "Unknown Date",
      location: "Unknown Location",
      precision: null,
      description: null,
      metadata: [],
    };
  }

  if (isFooterLine(lines[lines.length - 1])) {
    lines.pop();
  }

  const header = parseHeaderLine(lines[0]);
  const metadata = [];
  let location = "Unknown Location";
  let precision = null;
  let description = null;

  const locationLine = lines[1];
  const precisionLine = lines[2];
  const descriptionLine = lines[3];

  const parsedLocation = locationLine ? parseLabelValueLine(locationLine) : null;
  if (parsedLocation && parsedLocation.value) {
    location = parsedLocation.value;
  }

  const parsedPrecision = precisionLine ? parseLabelValueLine(precisionLine) : null;
  if (parsedPrecision && parsedPrecision.value) {
    precision = parsedPrecision.value;
    metadata.push(`${parsedPrecision.label}: ${parsedPrecision.value}`);
  }

  const parsedDescription = descriptionLine
    ? parseBracketDescriptionLine(descriptionLine)
    : null;
  if (parsedDescription && parsedDescription.value) {
    description = parsedDescription.value;
    metadata.push(`${parsedDescription.label}: ${parsedDescription.value}`);
  }

  for (const line of lines.slice(4)) {
    if (!isFooterLine(line)) {
      metadata.push(line);
    }
  }

  return { ...header, location, precision, description, metadata };
}

function utmToLatLng(zone, easting, northing) {
  if (!proj4Lib) {
    throw new Error("proj4 is not available.");
  }

  const zoneNumber = Number.parseInt(zone.slice(0, -1), 10);
  const isNorthernHemisphere = zone.slice(-1).toUpperCase() >= "N";
  const utmProjString = `+proj=utm +zone=${zoneNumber} ${
    isNorthernHemisphere ? "+north" : "+south"
  } +datum=WGS84 +units=m +no_defs`;

  const [lng, lat] = proj4Lib(utmProjString, "WGS84", [easting, northing]);
  return { lat, lng };
}

function buildKML(messages) {
  let kmlContent = `
    <?xml version="1.0" encoding="UTF-8"?>
    <kml xmlns="http://www.opengis.net/kml/2.2">
      <Document>`;

  messages.forEach(
    ({ title, category, lat, lng, base64Image, timestamp, metadata }) => {
      kmlContent += `
      <Placemark>
        <name>${title} - ${category}</name>
        <description><![CDATA[`;

      if (base64Image) {
        kmlContent += `<img src="${base64Image}" width="400"/><br/><br/>`;
      }

      kmlContent += `Category: ${category}<br/>
        Timestamp: ${timestamp}<br/>
        ${title} - ${category}<br/>`;

      if (metadata.length > 0) {
        kmlContent += `${metadata.join("<br/>")}<br/>`;
      }

      kmlContent += `]]></description>
        <ExtendedData>
          <Data name="Category">
            <value>${category}</value>
          </Data>
          <Data name="Timestamp">
            <value>${timestamp}</value>
          </Data>`;

      if (metadata.length > 0) {
        kmlContent += `<Data name="Metadata">
            <value>${metadata.join("<br/>")}</value>
          </Data>`;
      }

      kmlContent += `</ExtendedData>
        <Point>
          <coordinates>${lng},${lat},0</coordinates>
        </Point>
      </Placemark>`;
    },
  );

  kmlContent += `
      </Document>
    </kml>`;

  return kmlContent.replace(/\n\s+/g, "").replace(/>\s+</g, "><");
}

let messages = [];

function addToKML() {
  const rawMessage = document.getElementById("message").value;
  const messageObject = normalizeMessage(rawMessage);
  const utmData = parseUTMFromText(messageObject.location);

  if (!utmData) {
    alert("UTM coordinates not found in the input text.");
    return;
  }

  const { zone, easting, northing } = utmData;
  const { lat, lng } = utmToLatLng(zone, easting, northing);
  const image = document.getElementById("image").files[0];

  if (image) {
    const reader = new FileReader();
    reader.onload = function (e) {
      messages.push({
        ...messageObject,
        lat,
        lng,
        base64Image: e.target.result,
      });
      updateUI();
    };
    reader.readAsDataURL(image);
    return;
  }

  messages.push({ ...messageObject, lat, lng, base64Image: null });
  updateUI();
}

function updateUI() {
  document.getElementById("message").value = "";
  document.getElementById("image").value = "";

  const downloadLabel = document.getElementById("downloadLabel");
  downloadLabel.innerHTML = `Generated KML output: <span style="font-weight: normal">${messages.length} message${messages.length !== 1 ? "s" : ""}</span>`;
  downloadLabel.style.display = "block";

  const link = document.getElementById("downloadLink");
  link.style.display = "block";
  link.textContent = "Download KML";
}

function downloadKML() {
  const kmlContent = buildKML(messages);
  const blob = new Blob([kmlContent], {
    type: "application/vnd.google-earth.kml+xml",
  });
  const link = document.getElementById("downloadLink");
  link.href = URL.createObjectURL(blob);
  link.download = "CoMapeo data.kml";
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    normalizeMessage,
    parseUTMFromText,
    utmToLatLng,
    buildKML,
  };
}
