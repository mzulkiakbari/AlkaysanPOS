import Image from "next/image";

export default function Loader({ text = null }) {
  return (
    <div className="flex h-screen items-center justify-center bg-white w-full">
      <div className="flex flex-col items-center text-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        {text && (
          <span>{text}</span>
        )}
      </div>
    </div>
  );
};

export function CatLoader({ text = '', loading = "100%" }) {
  return (
    <div className="relative max-w-full w-full flex items-center justify-center overflow-hidden">
      <div className="flex flex-col items-center gap-y-20">
        <div className="flex flex-col items-center text-center">
          <div>
            <span className="text-black font-semibold uppercase tracking-widest">{text}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1833.06 1823.52" className="w-32 h-32">
              <defs>
                <clipPath id="fill-animate">
                  <rect x="0%" y={loading} height="100%" width="100%"></rect>
                </clipPath>
              </defs>

              <g>
                <path fill="#e5e7eb" d="M664.85 1310.65c59.45,-39.8 103.55,-94.18 161.46,-132.94 121.37,64.19 265.99,104.47 408.4,104.47 57.51,0 118.78,-14.66 170.96,-19.03 46.41,69.31 179.1,196.87 189.94,237.46 -97.55,8.12 -233.39,89.18 -534.66,31.3 -152.15,-29.23 -326.13,-116.79 -396.1,-221.26zm104.47 -256.42c0,67.41 8.3,39.56 18.99,85.49l-439.15 377.61c-29.23,26.27 -29.51,46.09 -73.71,49.78 -9.54,-35.7 -70.8,-89.62 -116.25,-216.17 -80.54,-224.31 -72.32,-461.45 38.03,-669.36 5.96,-11.22 13.75,-26.51 19.78,-37.2 50.62,-89.56 111.35,-130.36 143.91,-179.01 22.82,15.29 40.66,33.17 58.41,55.56 22.55,28.42 28.75,34.51 53.26,60.72 22.75,24.29 27.25,36.86 52.11,61.84 26.35,26.49 33.18,40.74 57.06,66.44 22.9,24.6 31.38,38.11 52.31,61.66l163.74 187.66c-10.21,38.24 -28.49,38.09 -28.49,94.97zm636.35 -360.91c0,-22.36 29.93,-39.82 69.34,-73.13 52.87,-44.75 54.73,-56.73 92.13,-59.83 8.42,31.64 10.29,22.46 28.32,47.64 12.6,17.57 18,27.08 29.28,46.7 99.8,173.98 139.63,435.75 73.06,634.69 -11.67,34.86 -18.71,57.02 -32,91.46 -13.08,33.87 -26.51,53.11 -41.68,81.78l-125.68 -140.24c-18.83,-21.11 -22.63,-29.94 -43.35,-52.08 -73.08,-78.09 70.46,-147.55 -2.44,-443.48l-46.97 -133.49zm-997.25 -275.43c17.95,-4.79 402.01,-320.03 861.25,-91.93 75.52,37.49 201.52,114.54 249.97,186.9 -22.73,15.22 -36.51,31.15 -62.44,51.53 -24.21,19.03 -38.72,32.4 -62.43,51.55l-378.51 324.31c-23.09,-12.22 -48.29,-27.65 -81.31,-33.2 -89.11,-15.01 -50.86,88.24 -199.62,-103.77 -60.27,-77.78 -290.72,-316.51 -326.93,-385.38zm-408.41 -389.4l0 1766.53c0,21.9 6.63,28.5 28.5,28.5l1510.12 0c30.07,0 188.87,-175.13 235.09,-220.8 25.8,-25.48 59.34,-46.18 59.34,-92.61l0 -1481.62c0,-21.9 -6.61,-28.49 -28.49,-28.49l-1776.06 0c-21.87,0 -28.5,6.6 -28.5,28.49z"></path>
              </g>

              <g>
                <path clipPath="url(#fill-animate)" fill="#ec3036" d="M664.85 1310.65c59.45,-39.8 103.55,-94.18 161.46,-132.94 121.37,64.19 265.99,104.47 408.4,104.47 57.51,0 118.78,-14.66 170.96,-19.03 46.41,69.31 179.1,196.87 189.94,237.46 -97.55,8.12 -233.39,89.18 -534.66,31.3 -152.15,-29.23 -326.13,-116.79 -396.1,-221.26zm104.47 -256.42c0,67.41 8.3,39.56 18.99,85.49l-439.15 377.61c-29.23,26.27 -29.51,46.09 -73.71,49.78 -9.54,-35.7 -70.8,-89.62 -116.25,-216.17 -80.54,-224.31 -72.32,-461.45 38.03,-669.36 5.96,-11.22 13.75,-26.51 19.78,-37.2 50.62,-89.56 111.35,-130.36 143.91,-179.01 22.82,15.29 40.66,33.17 58.41,55.56 22.55,28.42 28.75,34.51 53.26,60.72 22.75,24.29 27.25,36.86 52.11,61.84 26.35,26.49 33.18,40.74 57.06,66.44 22.9,24.6 31.38,38.11 52.31,61.66l163.74 187.66c-10.21,38.24 -28.49,38.09 -28.49,94.97zm636.35 -360.91c0,-22.36 29.93,-39.82 69.34,-73.13 52.87,-44.75 54.73,-56.73 92.13,-59.83 8.42,31.64 10.29,22.46 28.32,47.64 12.6,17.57 18,27.08 29.28,46.7 99.8,173.98 139.63,435.75 73.06,634.69 -11.67,34.86 -18.71,57.02 -32,91.46 -13.08,33.87 -26.51,53.11 -41.68,81.78l-125.68 -140.24c-18.83,-21.11 -22.63,-29.94 -43.35,-52.08 -73.08,-78.09 70.46,-147.55 -2.44,-443.48l-46.97 -133.49zm-997.25 -275.43c17.95,-4.79 402.01,-320.03 861.25,-91.93 75.52,37.49 201.52,114.54 249.97,186.9 -22.73,15.22 -36.51,31.15 -62.44,51.53 -24.21,19.03 -38.72,32.4 -62.43,51.55l-378.51 324.31c-23.09,-12.22 -48.29,-27.65 -81.31,-33.2 -89.11,-15.01 -50.86,88.24 -199.62,-103.77 -60.27,-77.78 -290.72,-316.51 -326.93,-385.38zm-408.41 -389.4l0 1766.53c0,21.9 6.63,28.5 28.5,28.5l1510.12 0c30.07,0 188.87,-175.13 235.09,-220.8 25.8,-25.48 59.34,-46.18 59.34,-92.61l0 -1481.62c0,-21.9 -6.61,-28.49 -28.49,-28.49l-1776.06 0c-21.87,0 -28.5,6.6 -28.5,28.49z"></path>
              </g>
            </svg>
          </div>

          <div>
            <div id="rope">
              <div id="rope">
                <div id="rope">
                  <div id="rope">
                    <div id="rope">
                      <div id="rope">
                        <div id="rope">
                          <div id="ball">
                            <Image
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" alt="Ball yarn"
                              fill
                              src="https://cdn.alkaysan.co.id/file/VEhmelNObk0xT1Nn"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative w-80 h-44">
          <Image
            fill
            alt="cat"
            src="https://cdn.alkaysan.co.id/file/RDl1aUdMWWw1a1Ja"
            sizes="100vw"
            objectFit="contain"
          />
          <div className="object-shadow absolute left-1/2 top-[70%] z-[-1] h-14 w-[250px] translate-x-[-50%] bg-slate-800/50"></div>
        </div>
      </div>
    </div>
  )
}

export const shimmer = (w, h) => `
  <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs>
      <linearGradient id="g">
        <stop stop-color="#333" offset="20%" />
        <stop stop-color="#222" offset="50%" />
        <stop stop-color="#333" offset="70%" />
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="#333" />
    <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
    <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
  </svg>`;

export const toBase64 = (str) =>
  typeof window === "undefined"
    ? Buffer.from(str).toString("base64")
    : window.btoa(str);

const keyStr =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

const triplet = (e1, e2, e3) =>
  keyStr.charAt(e1 >> 2) +
  keyStr.charAt(((e1 & 3) << 4) | (e2 >> 4)) +
  keyStr.charAt(((e2 & 15) << 2) | (e3 >> 6)) +
  keyStr.charAt(e3 & 63);

export const rgbDataURL = (r, g, b) =>
  `data:image/gif;base64,R0lGODlhAQABAPAA${triplet(0, r, g) + triplet(b, 255, 255)
  }/yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==`;
