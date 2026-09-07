import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number;
  color?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = 'w-6 h-6',
  size,
  color = 'currentColor',
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 600 500"
      width={size}
      height={size}
      fill={color}
      className={className}
      aria-label="StorySpark Logo"
    >
      {/* Sunburst / Radiant Spark above Book */}
      <path d="
        M 300,202
        C 278,172 242,160 218,158
        L 242,138
        L 194,124
        L 232,106
        L 204,78
        L 252,84
        L 246,44
        L 278,72
        L 300,12
        L 322,72
        L 354,44
        L 348,84
        L 396,78
        L 368,106
        L 406,124
        L 358,138
        L 382,158
        C 358,160 322,172 300,202 Z
      " />

      {/* Left Book Page */}
      <path d="
        M 290,210
        C 234,152 165,142 116,160
        C 92,168 76,182 70,200
        L 40,282
        C 36,294 42,306 54,310
        C 64,313 80,310 100,302
        C 160,278 232,280 286,318
        C 290,321 294,318 294,312
        L 294,214
        C 294,211 292,209 290,210 Z
      " />

      {/* Right Book Page */}
      <path d="
        M 310,210
        C 366,152 435,142 484,160
        C 508,168 524,182 530,200
        L 560,282
        C 564,294 558,306 546,310
        C 536,313 520,310 500,302
        C 440,278 368,280 314,318
        C 310,321 306,318 306,312
        L 306,214
        C 306,211 308,209 310,210 Z
      " />

      {/* Bottom Arc / Spine Ribbon */}
      <path d="
        M 24,338
        C 105,338 190,344 258,376
        C 278,386 290,402 300,424
        C 310,402 322,386 342,376
        C 410,344 495,338 576,338
        C 586,338 594,345 594,354
        C 594,363 586,370 576,370
        C 495,370 416,376 352,406
        C 334,415 320,436 310,456
        C 306,464 294,464 290,456
        C 280,436 266,415 248,406
        C 184,376 105,370 24,370
        C 14,370 6,363 6,354
        C 6,345 14,338 24,338 Z
      " />
    </svg>
  );
};
