import Svg, { Path } from 'react-native-svg';

/** Calendar artwork supplied for appointment stat surfaces. */
export default function CalendarStatIcon({ size = 14 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path
        d="M3.49984 2.33301H10.4998C11.7885 2.33301 12.8332 3.37768 12.8332 4.66634V10.4997C12.8332 11.7883 11.7885 12.833 10.4998 12.833H3.49984C2.21117 12.833 1.1665 11.7883 1.1665 10.4997V4.66634C1.1665 3.37768 2.21117 2.33301 3.49984 2.33301Z"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4.6665 1.1665V3.49984M9.33317 1.1665V3.49984M1.1665 5.83317H12.8332"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
