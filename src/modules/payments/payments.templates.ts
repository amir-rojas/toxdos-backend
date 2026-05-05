function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function fmtShort(isoDatetime: string): string {
  const d = new Date(isoDatetime)
  const day   = String(d.getUTCDate()).padStart(2, '0')
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const year  = String(d.getUTCFullYear()).slice(2)
  return `${day}/${month}/${year}`
}

function addOneMonth(isoDatetime: string): string {
  const d = new Date(isoDatetime)
  d.setUTCMonth(d.getUTCMonth() + 1)
  return fmtShort(d.toISOString())
}

export function buildVoucherHtml(data: {
  customerName: string
  customerIdNumber: string
  paidAt: string
}): string {
  const name  = esc(data.customerName)
  const ci    = esc(data.customerIdNumber)
  const since = fmtShort(data.paidAt)
  const until = addOneMonth(data.paidAt)

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Comprobante de Renovación</title>
<style>
@page { size: 105mm 135mm; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  font-family: Arial, Helvetica, sans-serif;
}
.outer {
  background: #F5C525;
  border-radius: 14px;
  padding: 14px 14px 10px;
  width: 90mm;
}
.inner {
  background: #C8D9E8;
  border-radius: 10px;
  padding: 14px 14px 16px;
}
.title-sm { font-size: 10.5pt; font-weight: 600; color: #1a1a1a; }
.title-lg { font-size: 25pt; font-weight: 900; color: #1a1a1a; line-height: 1; margin-bottom: 9px; }
.badge {
  display: inline-block;
  background: #F5C525;
  border-radius: 5px;
  padding: 2px 12px;
  font-weight: 900;
  font-size: 11.5pt;
  color: #1a1a1a;
  letter-spacing: 0.3px;
  margin-bottom: 12px;
}
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 16px;
}
.label { font-weight: 700; font-size: 8.5pt; color: #1a1a1a; }
.value { font-size: 8.5pt; color: #1a1a1a; line-height: 1.4; margin-top: 1px; }
.firma { text-align: center; font-weight: 900; font-size: 12pt; color: #1a1a1a; padding-top: 6px; }
.footer { text-align: center; padding-top: 8px; }
.footer p { font-size: 6.5pt; color: #1a1a1a; letter-spacing: 0.4px; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="outer">
  <div class="inner">
    <p class="title-sm">Datos de</p>
    <p class="title-lg">pago</p>
    <div><span class="badge">RENOVACION</span></div>
    <div class="info-grid">
      <div>
        <p class="label">Beneficiario</p>
        <p class="value">${name}</p>
        <p class="value" style="margin-top:5px;"><strong>CI: ${ci}</strong></p>
      </div>
      <div>
        <p class="label">desde:</p>
        <p class="value">${since}</p>
        <p class="label" style="margin-top:8px;">hasta:</p>
        <p class="value">${until}</p>
      </div>
    </div>
    <p class="firma">FIRMA</p>
  </div>
  <div class="footer">
    <p>GUARDE ESTE COMPROBANTE</p>
    <p style="margin-top:3px;">@XTODOSPRESTAMOS</p>
  </div>
</div>
<script>window.onload = function () { window.print() }</script>
</body>
</html>`
}
