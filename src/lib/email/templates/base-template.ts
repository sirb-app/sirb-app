// Brand colors (converted from OKLCH to hex for email compatibility)
export const COLORS = {
  primary: "#6d28d9", // Purple - main CTA buttons
  success: "#16a34a", // Green - approval notifications
  destructive: "#dc2626", // Red - rejection notifications
  foreground: "#18181b", // Dark text
  mutedForeground: "#71717a", // Muted text
  background: "#f4f4f5", // Page background
  cardBackground: "#ffffff", // Card/container background
  border: "#e4e4e7", // Borders
  lightGray: "#fafafa", // Footer background
} as const;

// Logo SVG extracted from src/components/logo.tsx
const LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" fill="#18181b" width="120" height="60" style="display:block;margin:0 auto;">
  <g transform="translate(400 300) scale(2) translate(-320 -235)">
    <path d="M0 0 C7.63423181 4.31081228 12.56046626 10.75755311 17.85546875 17.60546875 C21.73524507 22.38119342 24.0185508 24.64997903 30.3125 25.3125 C36.94125777 25.16681302 42.45553282 22.25900635 47.0703125 17.58984375 C48.56407195 15.86447352 50.04593004 14.12872672 51.515625 12.3828125 C56.27020641 7.17937201 61.8067519 3.40486164 68.8984375 2.734375 C73.90877831 2.62889414 77.49890435 2.96173304 81.75 5.9375 C82.8125 7.9375 82.8125 7.9375 82.75 9.9375 C81.6328125 11.515625 81.6328125 11.515625 79.75 12.9375 C76.89453125 13.421875 76.89453125 13.421875 73.5625 13.6875 C65.43405802 14.79592391 61.9655792 18.16016299 56.8046875 24.22265625 C49.37776305 32.94565183 41.81682706 37.20415209 30.3125 38.25 C21.60093415 37.48582756 15.63806431 34.37823461 9.75 27.9375 C7.87583231 25.57244508 6.06654943 23.15943589 4.25 20.75 C0.27597423 15.51179059 -2.71203033 11.82132177 -9.25 9.9375 C-14.21935374 9.9375 -16.7053443 11.56575434 -20.25 14.9375 C-21.29681966 16.18318778 -22.33794397 17.43367217 -23.375 18.6875 C-31.09319257 27.64462153 -39.83271232 32.86381469 -51.49609375 34.3515625 C-63.02526329 35.04562622 -72.12491793 30.7287286 -80.8125 23.3125 C-81.97613861 22.20592682 -83.12416344 21.08251139 -84.25 19.9375 C-85.1575 19.03 -86.065 18.1225 -87 17.1875 C-87.7425 16.445 -88.485 15.7025 -89.25 14.9375 C-93.20258757 11.4429376 -96.17618351 11.35281782 -101.31640625 11.55078125 C-109.02579761 12.56706586 -113.70690112 15.8988818 -118.35913086 21.9387207 C-119.2368547 23.13552885 -120.09754394 24.34503939 -120.93969727 25.56713867 C-121.98161348 27.06854015 -123.11014933 28.50902659 -124.25 29.9375 C-125.24 29.9375 -126.23 29.9375 -127.25 29.9375 C-126.64265848 20.62493007 -122.28625203 12.92424487 -115.47265625 6.6328125 C-107.42692985 0.49600185 -98.89952845 -0.00810592 -89.1328125 1.19921875 C-84.01054956 2.52760644 -80.9324004 6.09926435 -77.375 9.8125 C-70.54326961 16.93310525 -64.84078938 21.10833763 -54.625 21.4375 C-47.1440868 21.36212556 -41.5905904 19.56557835 -36.25 14.28515625 C-34.90360562 12.86907544 -33.57041509 11.44033561 -32.25 10 C-23.0893014 0.06099986 -13.57133714 -6.22878999 0 0 Z" transform="translate(343.25 213.0625)"/>
    <path d="M0 0 C4.42750456 1.39150143 7.1523841 3.31485002 10 7 C10.3125 9.875 10.3125 9.875 9 13 C6.51496328 15.57861551 3.83517775 17.81710688 1 20 C-0.2989839 19.09373216 -1.58893167 18.17450463 -2.875 17.25 C-3.59429687 16.73953125 -4.31359375 16.2290625 -5.0546875 15.703125 C-7.08570565 13.92496453 -7.97855012 12.47298393 -9 10 C-7.8758824 8.70756532 -6.75067408 7.41607925 -5.625 6.125 C-4.99851563 5.40570313 -4.37203125 4.68640625 -3.7265625 3.9453125 C-2.52573166 2.5923402 -1.2791655 1.2791655 0 0 Z" transform="translate(244 243)"/>
    <path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C-2.46449795 6.22441249 -7.08301411 11.19977631 -12 16 C-12.66 16.66 -13.32 17.32 -14 18 C-14.66 17.34 -15.32 16.68 -16 16 C-10.72 10.72 -5.44 5.44 0 0 Z" transform="translate(319 215)"/>
    <path d="M0 0 C1.41377341 2.63904371 2.37240135 5.07120629 3 8 C1.68 8.99 0.36 9.98 -1 11 C-2.26264601 6.70700357 -1.62950412 4.12168689 0 0 Z" transform="translate(218 233)"/>
  </g>
</svg>
`;

type BaseTemplateOptions = {
  title: string;
  preheader?: string;
  content: string;
};

export function baseTemplate({
  title,
  preheader,
  content,
}: BaseTemplateOptions): string {
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
    }
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      height: 100% !important;
    }
    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .content-padding {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif,'IBM Plex Sans Arabic';direction:rtl;">
  ${preheader ? `<div style="display:none;font-size:1px;color:${COLORS.background};line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ""}

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.background};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" class="email-container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:${COLORS.cardBackground};border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.07);">

          <!-- Header with Logo -->
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid ${COLORS.border};">
              ${LOGO_SVG}
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content-padding" style="padding:32px;direction:rtl;text-align:right;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background-color:${COLORS.lightGray};border-top:1px solid ${COLORS.border};border-radius:0 0 12px 12px;">
              <p style="margin:0;font-size:13px;color:${COLORS.mutedForeground};text-align:center;line-height:1.6;">
                &copy; ${currentYear} سرب. جميع الحقوق محفوظة.
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:${COLORS.mutedForeground};text-align:center;line-height:1.6;">
                منصة تعليمية تجمع طلاب الجامعات لمشاركة المعرفة
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Helper function to create a CTA button
export function ctaButton(
  text: string,
  url: string,
  color: string = COLORS.primary
): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
      <tr>
        <td style="border-radius:8px;background-color:${color};">
          <a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

// Helper function to create an info box
export function infoBox(
  items: Array<{ label: string; value: string }>
): string {
  const rows = items
    .map(
      item => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid ${COLORS.border};">
          <p style="margin:0 0 4px;font-size:13px;color:${COLORS.mutedForeground};">${item.label}</p>
          <p style="margin:0;font-size:15px;font-weight:500;color:${COLORS.foreground};">${item.value}</p>
        </td>
      </tr>
    `
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;background-color:${COLORS.background};border-radius:8px;overflow:hidden;">
      ${rows}
    </table>
  `;
}

// Helper function to create a rejection reason box
export function rejectionBox(reason: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;">
      <tr>
        <td style="padding:16px;">
          <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:${COLORS.destructive};">سبب الرفض:</p>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#7f1d1d;">${reason}</p>
        </td>
      </tr>
    </table>
  `;
}
