export function DuotoneFilters() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Dark color: aubergine #422b65 (0.259, 0.169, 0.396)
            Light color: warm cream #faf7f2 (0.98, 0.97, 0.95) */}
        <filter id="duotone-aubergine" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.299 0.587 0.114 0 0
                    0.299 0.587 0.114 0 0
                    0.299 0.587 0.114 0 0
                    0     0     0     1 0"
          />
          <feComponentTransfer>
            <feFuncR tableValues="0.259 0.98" />
            <feFuncG tableValues="0.169 0.97" />
            <feFuncB tableValues="0.396 0.95" />
          </feComponentTransfer>
        </filter>

        {/* Dark color: near-black #0a0810 (0.04, 0.03, 0.06)
            Light color: mint #b4ecdd (0.71, 0.93, 0.87) */}
        <filter id="duotone-mint" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.299 0.587 0.114 0 0
                    0.299 0.587 0.114 0 0
                    0.299 0.587 0.114 0 0
                    0     0     0     1 0"
          />
          <feComponentTransfer>
            <feFuncR tableValues="0.04 0.71" />
            <feFuncG tableValues="0.03 0.93" />
            <feFuncB tableValues="0.06 0.87" />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  );
}
