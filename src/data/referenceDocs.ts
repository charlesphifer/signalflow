export interface ReferenceDoc {
  id: string;
  category: 'Work Instructions' | 'Device Specifications' | 'Network Guidelines';
  title: string;
  docNum: string;
  lastUpdated: string;
  sections: {
    title: string;
    keywords: string[];
    content: string;
  }[];
}

export const REFERENCE_DOCS: ReferenceDoc[] = [
  {
    id: 'sop-011',
    category: 'Work Instructions',
    title: 'Wireless Assessment Site Survey SOP',
    docNum: 'SOP-011-REV4',
    lastUpdated: '2026-03-12',
    sections: [
      {
        title: 'Target Signal Strength and SNR Guidelines',
        keywords: ['signal strength', 'dbm', 'snr', 'signal-to-noise', 'roaming', 'coverage'],
        content: 'For patient telemetry coverage, engineers must verify a target signal strength of -65 dBm or better throughout all patient-care areas. The Signal-to-Noise Ratio (SNR) must maintain a minimum of 25 dB to prevent telemetry dropouts. Seamless roaming requires a secondary AP overlap of at least -75 dBm from an adjacent access point in all hallways, transitions, and elevator lobbies.'
      },
      {
        title: 'Hospital Wall Attenuation Loss Reference Table',
        keywords: ['attenuation', 'wall loss', 'drywall', 'concrete', 'glass', 'door', 'decibel', 'db'],
        content: 'When planning predictive designs or verifying active surveys, use these baseline attenuation loss values:\n- Standard Drywall with Metal Studs: 3 dB\n- Solid Concrete / Structural Shear Walls: 12 dB\n- Lead-Shielded Glass (X-ray, CT Scan, Cath Labs): 8 dB\n- Heavy Fire-Rated Wood/Hollow Doors: 4 dB\n- Double-Pane Patient Room Privacy Glass: 6 dB\n- Brick or Heavy Stone masonry: 8-10 dB.'
      },
      {
        title: 'Ekahau Sidekick Survey Speed & Walk Procedures',
        keywords: ['ekahau', 'sidekick', 'survey speed', 'walk', 'surveying', 'active survey', 'passive survey'],
        content: 'Ensure your Ekahau Sidekick device is fully charged (minimum 50% battery) before initiating the site walk. Maintain a slow, deliberate walking pace of approximately 1 to 2 miles per hour. Moving too quickly causes the Sidekick to miss critical beacons, resulting in inaccurate channel sampling. Keep the Sidekick centered on your hip or strapped correctly to prevent your body from absorbing or blocking the RF signals.'
      }
    ]
  },
  {
    id: 'tx-specs',
    category: 'Device Specifications',
    title: 'Telemaster WMTS Transmitter Technical Specs',
    docNum: 'SPEC-WMTS-8000',
    lastUpdated: '2025-08-30',
    sections: [
      {
        title: 'Frequency Spectrum & WMTS Allocation',
        keywords: ['frequency', 'spectrum', 'wmts', 'band', '608', '614', 'mhz', 'channels'],
        content: 'Nihon Kohden telemetry transmitters operate exclusively within the Wireless Medical Telemetry Service (WMTS) band, spanning from 608 MHz to 614 MHz. It utilizes FCC-allocated channels from 8001 up to 8192. Channel spacing is set at exactly 25 kHz. Interference from cell towers, Wi-Fi, or public safety radio is virtually non-existent because this band is strictly protected by the FCC for medical telemetry applications.'
      },
      {
        title: 'Power Output & Battery Guidelines',
        keywords: ['power', 'erp', 'battery', 'aa', 'transmitting', 'fcc', 'milliwatt', 'mw'],
        content: 'The transmitter outputs a standard 1.0 mW Effective Radiated Power (ERP) to satisfy FCC Part 95 rules and ensure safe patient monitoring. Each transmitter is powered by a single standard AA alkaline battery, providing approximately 3 to 4 days of continuous transmitting life. Lithium AA batteries can be used to extend operation to 5-6 days. Avoid using rechargeable NiMH batteries as their lower 1.2V profile will trigger premature low-battery alerts on central screens.'
      },
      {
        title: 'Antenna Integrity & Patient Placement',
        keywords: ['antenna', 'helical', 'interference', 'placement', 'pocket', 'foil', 'shielding'],
        content: 'Transmitters employ a highly durable, rubberized helical antenna factory-tuned precisely to 611 MHz. To ensure optimal radiation patterns: 1) Never bend, crimp, or tape down the antenna. 2) Never wrap transmitters in metallic foil or plastic sheets containing metal linings. 3) When placing the transmitter in the patient pocket, ensure the antenna points straight up and away from the body.'
      }
    ]
  },
  {
    id: 'net-402',
    category: 'Network Guidelines',
    title: 'Patient Monitor Network Multicast & QoS Guide',
    docNum: 'NET-402-V2',
    lastUpdated: '2026-01-15',
    sections: [
      {
        title: 'Multicast Network Requirements & IGMP Snooping',
        keywords: ['multicast', 'igmp', 'snooping', 'vlan', 'querier', 'flooding', 'network', 'switches'],
        content: 'All Nihon Kohden patient monitors communicate bedside status to central servers via multicast packets. A dedicated medical telemetry VLAN must be allocated. IGMP Snooping (v2 or v3) must be enabled on all access layer switches to prevent multicast packet flooding across standard IT network ports. An active IGMP Querier is mandatory on the VLAN (typically hosted on the Core Switch) with a query interval configured to exactly 60 seconds.'
      },
      {
        title: 'Wireless Quality of Service (QoS) & WMM Tags',
        keywords: ['qos', 'wmm', 'dscp', 'priority', 'ef', 'cs5', 'class 46', 'voice', 'packet drop'],
        content: 'To protect vital signs transmission from packet drops during periods of high hospital network load, Wireless QoS must be configured. Patient monitors tag outbound wireless packets with DSCP Expedited Forwarding (EF / Class 46) or DSCP CS5 (Class 40). Ensure Wi-Fi Multimedia (WMM) is enabled on your wireless LAN controllers, and verify that telemetry packets are correctly mapped into the Voice (AC_VO) high-priority category.'
      },
      {
        title: 'WLAN Security and SSID Configurations',
        keywords: ['ssid', 'wpa2', 'wpa3', 'psk', 'enterprise', '802.1x', 'eap-tls', 'roaming delay'],
        content: 'For telemetry security, Nihon Kohden patient monitors support WPA2-Personal (PSK) or WPA2-Enterprise (802.1X, using PEAP-MSCHAPv2 or EAP-TLS). A dedicated, hidden SSID is highly recommended to prevent unauthorized device connections. Ensure fast transition roaming (802.11r) is enabled to keep handoff times under 50 milliseconds, eliminating telemetry disconnect alarms during patient transit between wings.'
      }
    ]
  }
];
