module.exports = [
  {
    id: "english",
    raw: `CoMapeo data sent from My Project - Clay - Mar 26, 2026, 2:00 PM
Location: UTM 18T 585000 4513500
Precision: 7.129000186920166m
[Description: My project's ceramics]

— Sent from CoMapeo —`,
    expected: {
      title: "CoMapeo data sent from My Project",
      category: "Clay",
      timestamp: "Mar 26, 2026, 2:00 PM",
      location: "UTM 18T 585000 4513500",
      metadataIncludes: [
        "Precision: 7.129000186920166m",
        "Description: My project's ceramics",
      ],
    },
  },
  {
    id: "portuguese",
    raw: `Alerta CoMapeo - Argila - 26 de mar. de 2026, 14:00
Localização: UTM 18T 585000 4513500
Precisão: 7.129000186920166m
[Descrição: My project's ceramics]

— Enviado pelo CoMapeo —`,
    expected: {
      title: "Alerta CoMapeo",
      category: "Argila",
      timestamp: "26 de mar. de 2026, 14:00",
      location: "UTM 18T 585000 4513500",
      metadataIncludes: [
        "Precisão: 7.129000186920166m",
        "Descrição: My project's ceramics",
      ],
    },
  },
  {
    id: "thai",
    raw: `CoMapeo Alert - ดินเหนียว - 26 มี.ค. 2026 14:00
Location: UTM 18T 585000 4513500
Precision: 7.129000186920166m
[รายละเอียด: My project's ceramics]

— Sent from CoMapeo —`,
    expected: {
      title: "CoMapeo Alert",
      category: "ดินเหนียว",
      timestamp: "26 มี.ค. 2026 14:00",
      location: "UTM 18T 585000 4513500",
      metadataIncludes: [
        "Precision: 7.129000186920166m",
        "รายละเอียด: My project's ceramics",
      ],
    },
  },
  {
    id: "no-description",
    raw: `CoMapeo data sent from My Project - Plants - Mar 27, 2026, 9:15 AM
Location: UTM 18T 585123 4513999
Precision: 3.5m

— Sent from CoMapeo —`,
    expected: {
      title: "CoMapeo data sent from My Project",
      category: "Plants",
      timestamp: "Mar 27, 2026, 9:15 AM",
      location: "UTM 18T 585123 4513999",
      metadataIncludes: ["Precision: 3.5m"],
      metadataExcludes: ["Description:"],
    },
  },
];
