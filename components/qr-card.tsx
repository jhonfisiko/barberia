"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";

function saveAs(href: string, name: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.click();
}

export function QrCard({ url, fileName }: { url: string; fileName: string }) {
  const [svg, setSvg] = useState("");

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(url, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then((s) => {
        if (!cancelled) setSvg(s);
      })
      .catch(() => {
        if (!cancelled) setSvg("");
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  const downloadSvg = () => {
    const href = URL.createObjectURL(
      new Blob([svg], { type: "image/svg+xml" })
    );
    saveAs(href, `${fileName}.svg`);
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  };

  const downloadPng = async () => {
    const href = await QRCode.toDataURL(url, {
      width: 1600,
      margin: 2,
      errorCorrectionLevel: "H",
    });
    saveAs(href, `${fileName}.png`);
  };

  return (
    <div className="space-y-5 rounded-2xl border border-line bg-surface p-6">
      <div
        className="mx-auto aspect-square w-full max-w-xs rounded-2xl bg-white p-3 [&>svg]:h-full [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />

      <p className="break-all text-center text-sm text-muted">{url}</p>

      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={downloadPng}
          disabled={!svg}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-60"
        >
          <Download size={16} /> Descargar PNG
        </button>
        <button
          type="button"
          onClick={downloadSvg}
          disabled={!svg}
          className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 text-sm transition hover:border-fg disabled:opacity-60"
        >
          <Download size={16} /> Descargar SVG
        </button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-line px-6 py-3 text-sm transition hover:border-fg"
        >
          Probar enlace ↗
        </a>
      </div>
    </div>
  );
}