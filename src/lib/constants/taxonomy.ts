export const DOMAINS = [
  "Artificial Intelligence",
  "Cybersecurity",
  "Healthcare",
  "Agriculture",
  "Education",
  "FinTech",
  "Climate & Environment",
  "Smart Cities",
  "Transportation",
  "Energy",
  "Manufacturing",
  "IoT",
  "Robotics",
  "Web & Software",
  "Mobile Technology",
  "Government & Civic Technology",
  "Social Innovation",
  "Accessibility",
  "Defence & Aerospace",
  "Other"
] as const;

export const SDGs = [
  { id: 1, name: "No Poverty", color: "#E5243B" },
  { id: 2, name: "Zero Hunger", color: "#DDA63A" },
  { id: 3, name: "Good Health and Well-being", color: "#4C9F38" },
  { id: 4, name: "Quality Education", color: "#C5192D" },
  { id: 5, name: "Gender Equality", color: "#FF3A21" },
  { id: 6, name: "Clean Water and Sanitation", color: "#26BDE2" },
  { id: 7, name: "Affordable and Clean Energy", color: "#FCC30B" },
  { id: 8, name: "Decent Work and Economic Growth", color: "#A21942" },
  { id: 9, name: "Industry, Innovation and Infrastructure", color: "#FD6925" },
  { id: 10, name: "Reduced Inequality", color: "#DD1367" },
  { id: 11, name: "Sustainable Cities and Communities", color: "#FD9D24" },
  { id: 12, name: "Responsible Consumption and Production", color: "#BF8B2E" },
  { id: 13, name: "Climate Action", color: "#3F7E44" },
  { id: 14, name: "Life Below Water", color: "#0A97D9" },
  { id: 15, name: "Life on Land", color: "#56C02B" },
  { id: 16, name: "Peace and Justice Strong Institutions", color: "#00689D" },
  { id: 17, name: "Partnerships to achieve the Goal", color: "#19486A" }
];

export const SKILL_TAXONOMY = {
  Programming: [
    { id: "python", name: "Python" },
    { id: "java", name: "Java" },
    { id: "cpp", name: "C++" },
    { id: "javascript", name: "JavaScript" },
    { id: "typescript", name: "TypeScript" },
  ],
  "AI/ML": [
    { id: "machine-learning", name: "Machine Learning" },
    { id: "deep-learning", name: "Deep Learning" },
    { id: "computer-vision", name: "Computer Vision" },
    { id: "nlp", name: "NLP" },
    { id: "generative-ai", name: "Generative AI" },
  ],
  Cybersecurity: [
    { id: "network-security", name: "Network Security" },
    { id: "web-security", name: "Web Security" },
    { id: "penetration-testing", name: "Penetration Testing" },
    { id: "cryptography", name: "Cryptography" },
    { id: "soc", name: "SOC" },
  ],
  Development: [
    { id: "react", name: "React" },
    { id: "nextjs", name: "Next.js" },
    { id: "nodejs", name: "Node.js" },
    { id: "android", name: "Android" },
    { id: "flutter", name: "Flutter" },
  ],
  Data: [
    { id: "sql", name: "SQL" },
    { id: "data-analysis", name: "Data Analysis" },
    { id: "data-visualization", name: "Data Visualization" },
  ],
  Hardware: [
    { id: "arduino", name: "Arduino" },
    { id: "raspberry-pi", name: "Raspberry Pi" },
    { id: "embedded-systems", name: "Embedded Systems" },
    { id: "iot", name: "IoT" },
  ],
  Design: [
    { id: "ui-ux", name: "UI/UX" },
    { id: "product-design", name: "Product Design" },
  ],
} as const;
