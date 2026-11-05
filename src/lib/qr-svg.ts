import QRCode from "qrcode";

/** Server-side QR as SVG markup (no client `qrcode` import). */
export async function qrSvgMarkup(
  href: string,
  opts?: { width?: number; margin?: number },
): Promise<string> {
  return QRCode.toString(href, {
    type: "svg",
    margin: opts?.margin ?? 1,
    width: opts?.width ?? 96,
    errorCorrectionLevel: "M",
  });
}
