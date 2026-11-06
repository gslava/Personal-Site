export interface MotifPoint {
  x: number;
  y: number;
  radius: number;
}

// Fixed seeds keep the static illustration and its interactive version identical.
export const constellation: MotifPoint[] = [
  { x: 82, y: 115, radius: 4 },
  { x: 181, y: 70, radius: 4.5 },
  { x: 281, y: 126, radius: 4 },
  ...Array.from({ length: 105 }, (_, i) => {
    const cluster = i % 3;
    const angle = i * 2.399963;
    const distance = 8 + Math.sqrt((i + 0.5) / 105) * 44;
    return {
      x: [82, 181, 281][cluster] + Math.cos(angle) * distance,
      y: [115, 70, 126][cluster] + Math.sin(angle) * distance * 0.78,
      radius: i % 7 === 0 ? 1.9 : 1.1,
    };
  }),
];

export const constellationLinks = [
  { from: 0, to: 1 },
  { from: 1, to: 2 },
  { from: 2, to: 0 },
  ...constellation.flatMap((point, i) =>
    constellation.slice(i + 1).flatMap((other, j) => {
      const distance = Math.hypot(point.x - other.x, point.y - other.y);
      return distance < 22 && (i + j) % 2 === 0 ? [{ from: i, to: i + j + 1 }] : [];
    }),
  ),
];

// Follow the existing decorative wires; these are visual metaphors, not live data.
export const motifFlowRoutes: Record<string, string[]> = {
  'inventory-management': [
    'M96 54H120V110H148',
    'M96 166H120V110H148',
    'M212 110H240V54H264',
    'M212 110H240V166H264',
    'M180 62V90',
    'M180 130V158',
  ],
  'order-processing': [
    'M48 44H70V100H88',
    'M48 174H70V116H88',
    'M124 108H144',
    'M188 108H210V47H232',
    'M270 47H291V100H310',
    'M188 108H210V171H232',
    'M252 151V125H166V139',
  ],
  'company-knowledge-assistant': [
    'M48 108H74V68H104',
    'M70 178H104V105',
    'M125 142V166H143',
    'M293 54H320V153H290',
    'M180 164H218',
  ],
  'amazon-ads': [
    'M55 55H81V103H108',
    'M55 153H81V117H108',
    'M158 110H190',
    'M230 110H254V48H282',
    'M230 110H282',
    'M230 110H254V172H282',
    'M314 192V210H133V140',
  ],
  'product-content-creation': [
    'M45 72Q95 18 150 50T280 80',
    'M62 132Q128 175 185 120T292 134',
    'M125 38Q168 62 185 120',
  ],
};
