function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function fmtDateLong(date: string | Date): string {
  const months = [
    'enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre',
  ]
  const iso = date instanceof Date ? date.toISOString().slice(0, 10) : date
  const [year, month, day] = iso.split('-')
  return `${parseInt(day!, 10)} de ${months[parseInt(month!, 10) - 1]} de ${year}`
}

export function buildContractHtml(data: {
  pawnId: number
  customerName: string
  customerIdNumber: string
  customerAddress: string | null
  startDate: string | Date
}): string {
  const name    = esc(data.customerName)
  const ci      = esc(data.customerIdNumber)
  const address = esc(data.customerAddress ?? 'Sin dirección registrada')
  const date    = fmtDateLong(data.startDate)

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Contrato Nº ${data.pawnId} — XTODOS S.R.L.</title>
<style>
@page { size: A4; margin: 12mm 12mm 15mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 7.8pt; color: #000; line-height: 1.32; }
.page-title { text-align: center; font-weight: bold; font-size: 9.5pt; text-decoration: underline; text-transform: uppercase; margin-bottom: 8px; }
.intro { text-align: justify; margin-bottom: 8px; font-size: 7.8pt; }
.columns { column-count: 2; column-gap: 5mm; text-align: justify; }
.clause { margin-bottom: 5px; break-inside: avoid-column; }
.clause-title { font-weight: bold; margin-bottom: 2px; }
p { margin-bottom: 3px; }
.footer { margin-top: 14px; }
.sig-row { display: flex; justify-content: space-around; margin-top: 32px; }
.sig-block { text-align: center; width: 160px; }
.sig-line { border-top: 1px solid #000; margin-bottom: 3px; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="page-title">CONTRATO PRIVADO DE PRÉSTAMO DE DINERO CON<br>GARANTIA PRENDARIA</div>
<p class="intro">Conste por el presente documento privado de préstamo de dinero con garantía prendaria, que suscriben las partes al tenor de las siguientes clausulas:</p>
<div class="columns">

<div class="clause">
<p class="clause-title">PRIMERA. - (PARTES)</p>
<p>Dirán las partes:</p>
<p>1.) XTODOS S.R.L. con matrícula de comercio y Domicilio Legal en Calle Serrudo N 8 casi esquina Bustillos, zona Central, representada por la persona que firma el presente contrato Representación Legal otorgado XTODOS SRL, quien en adelante se denominará "EL ACREEDOR"</p>
<p>2.) <strong>${name}</strong>, mayor de edad, hábil por derecho, con CI <strong>${ci}</strong> domiciliado en <strong>${address}</strong> quien en adelante se denominará "EL (LA)DEUDOR (A)"</p>
</div>

<div class="clause">
<p class="clause-title">SEGUNDA - DEFINICIÓN, NORMATIVA, JURISDICCIÓN, COMPETENCIAS ANEXOS</p>
<p>2.1. <strong>Definición de garantía Prendaria.</strong> La garantía prendaria, es un derecho real mediante el cual un deudor afecta un bien mueble al cumplimiento de una obligación, otorgando al acreedor la facultad de a) Retener al bien b) Tener preferencia en el cobro sobre este bien (en caso de incumplimiento) c) Incluso proceder a su ejecución conforme a ley. En términos jurídicos, es un derecho accesorio, indivisible y preferente.</p>
<p>2.2. <strong>Normativa Aplicable.</strong> La presente constituye en un contrato de préstamo de dinero, dejando una garantía prendaria con desplazamiento del mismo, y a su vez genera intereses, suscrito al amparo del Código Civil Boliviano en sus Art. 110, 450, 454, 455, 460, 467, 944, 1348, 1401, 1403, 1405, 1408 norma aplicable por ley y la legislación boliviana, normativas especiales aplicables. Declarando expresamente LAS PARTES que conocen dichas normas que rigen la vigencia del presente contrato por la que las partes intervinientes no podrán alegar desconocimiento de las mismas, error o vicios con respecto a su contenido y eficacia.</p>
<p>2.3. <strong>Gastos de conservación y cobro.</strong> Son aquellos gastos necesarios y razonables que realiza EL ACREEDOR para mantener, preservar o evitar el deterioro del bien prendado (Mantenimiento o reparación del bien, Custodia, depósito o almacenaje; Seguros cuando corresponda). Son los gastos en los que incurre el acreedor para hacer efectivo el crédito garantizado, especialmente en caso de incumplimiento (Honorarios de abogado, Costos judiciales, Tasas judiciales, Avalúos periciales, Publicaciones para remate).</p>
<p>2.4. <strong>Jurisdicción y competencia.</strong> Las autoridades de la ciudad donde operan la agencia oficial del ACREEDOR, señalada en el presente documento, serán las únicas que tengan competencia para conocer todos los trámites y/o procesos judiciales emergentes de este contrato, por lo que las partes pertinentes acuerdan someterse a la jurisdicción del departamento de Potosí.</p>
<p>2.5. <strong>Anexos.</strong> El presente Contrato adjunta anexos ligados al mismo, emo ser, COMPROBANTE DE DESEMBOLSO, DETALLE DE LA GARANTIA PRENDARIA, AMORTIZACIÓN AL PRÉSTAMO Y/O AMPLIACIÓN DE PLAZO, DE LOS INTERESES Y GASTOS DE CONSERVACIÓN SOBRE LA GARANTIA PRENDARIA U OTRO, que se necesite, debidamente identificado(s) con el número del contrato principal, documentos que forman parte integrante o indisolubles del presente contrato, por lo que están plenamente identificados y numerados con el número de contrato principal.</p>
</div>

<div class="clause">
<p class="clause-title">TERCERA (OBJETO)</p>
<p>En mérito a lo mencionado en la cláusula anterior, LAS PARTES, suscriben el presente contrato de préstamo de dinero, el mismo que genera interés y la entrega de garantía prendaria con desplazamiento, en virtud del cual EL ACREEDOR entrega al CLIENTE en calidad de préstamo, una suma de dinero en efectivo (Valor acordado) descrito en el ANEXO (Comprobante de Desembolso) y (Detalle de Garantía prendaria) que es:</p>
</div>

<div class="clause">
<p class="clause-title">CUARTA. (INTERESES CONVENCIONALES)</p>
<p>Las PARTES convienen expresamente que el préstamo de dinero devengará un interés convencional máximo establecido por ley del 3% mensual descrito en el ANEXO (Comprobante De Desembolso) y (Detalle De Garantía Prendaria) (núm. 4), el cual será calculado de manera mensual sobre saldos adeudados.</p>
</div>

<div class="clause">
<p class="clause-title">QUINTA DE LOS PLAZONES Y MODALIDADES DE PAGO.</p>
<p>5.1.- <strong>PLAZO OTORGADO.</strong> LAS PARTES convienen expresamente que el CLIENTE deberá devolver El Capital o el valor otorgado en el plazo vencido en el ANEXO (núm 3) que el ACREEDOR tal como se establece en los ANEXOS (Detalle de Garantía prendaria) a computarse desde la fecha suscrita de los ANEXOS y del presente contrato, plazo que se podrá modificar únicamente por el ACREEDOR con su ANEXO como amortización, pago de intereses y gastos de conservación que amplíen expresamente, la vigencia del presente contrato principal.</p>
<p>5.2.- <strong>PLAZO VENCIDO.</strong> Plazo se declara vencido al incumplimiento del pago del capital, intereses y gastos de conservación estipulados en el ANEXO (Detalle de garantía prendaria) (núm 3) declarándose que a su incumplimiento se tendrá como plazo vencido sin necesidad de requerimiento judicial y extra judicial alguno, salvo ampliación del plazo expreso por ANEXO firmado entre partes.</p>
<p>5.3 Las partes acuerdan expresamente que el presente contrato tiene <strong>fuerza coactiva</strong> constituyéndose en título suficiente para iniciar <strong>proceso coactivo civil</strong> conforme a la normativa vigente.</p>
<p>5.4. En eventual caso de que EL CLIENTE fueran sujetos de Juicio Ejecutivo o de embargo por cualquier juicio EL ACREEDOR se reserva el derecho de declarar el préstamo como líquido, exigible y de plazo vencido.</p>
<p>5.5 <strong>Pago anticipado total.</strong> Excepcionalmente en caso que el CLIENTE cancele totalmente su operación antes del vencimiento del presente contrato, el mismo se tendrá por concluido. En ese sentido EL ACREEDOR cobra la tasa de interés mensual establecido, los gastos de la deuda y conservación del (de los) bien(es) otorgados en prenda señalados en el ANEXO.</p>
<p>5.6 <strong>Pagos parciales del préstamo.</strong> EL CLIENTE deberá efectuar hasta antes del vencimiento del plazo, en primera instancia, el pago de los Intereses convencionales devengados, gastos de la deuda y conservación del (de los) bien(es) otorgado(s) en calidad de prenda firmando ANEXOS correspondientes.</p>
<p>5.7 En cualquiera de los casos anotados en el presente numeral, EL ACREEDOR retendrá la garantía y/o documento principal y/o anexos, debiendo aplicarse a dicho monto el interés convencional, gastos de conservación mensual de la garantía y/o prenda.</p>
<p>5.8 Se autoriza pagos realizados por QR Autorizado por la empresa. EL CLIENTE deberá enviar el comprobante al Telf WhatsApp de la oficina N° 68426335 y en cuanto se tenga la confirmación de la entidad bancaria se le generará un ANEXO o comprobante de depósito.</p>
</div>

<div class="clause">
<p class="clause-title">SEXTA: GARANTIA Y CARACTERÍSTICAS DE LA PRENDA.</p>
<p>EL CLIENTE garantiza la presente obligación con todos sus bienes habidos y por haber, presentes y futuros y en especial con la garantía prendaria descrita en ANEXO "Detalle de garantía prendaria".</p>
<p>6.1 <strong>Descripción.</strong> La garantía o prenda entregada se encuentra descrita en el ANEXO "Detalle de garantía prendaria".</p>
<p>6.2 <strong>Tasación del (de los) Bien(es) otorgado(s) en prenda.</strong> LAS PARTES que suscriben, expresan su conformidad con la tasación efectuada del (de los) bien(es) otorgado(s) en prenda, el cual asciende a la suma señalada en el ANEXO "Comprobante de Desembolso y Detalle de Garantía prendaria" (Núm 9). Consecuentemente, para todos los efectos del presente contrato, se tomará en cuenta únicamente la totalidad de los valores tasados por EL ACREEDOR que son definitivos e irreversibles.</p>
<p>6.3. <strong>El Derecho propietario sobre el(los) bien(es) otorgado(s) en prenda.</strong> EL CLIENTE declara expresamente que es único y legítimo propietario y poseedor del (de los) bien(es) otorgado(s) en prenda que se detalla(n) en el ANEXO. En caso de no ser verdadera la presente declaración voluntaria EL ACREEDOR podrá ejecutar la universalidad de los bienes DEL CLIENTE, a través del proceso coactivo civil. EL CLIENTE asumirá en forma íntegra y exclusiva ante terceros y autoridades competentes las responsabilidades civiles y/o penales y/o de cualquier otra naturaleza que emerjan de dicha situación.</p>
<p>6.4 <strong>Descripción del (de los) Bien(es) otorgado(s) en prenda.</strong> EL CLIENTE declara estar conforme con la descripción del (de los) bien(es) otorgado(s) en prenda, que figura en el ANEXO "Detalle de Garantía Prendaria" que es parte del presente Contrato de Préstamo, por lo tanto, renuncia a todo reclamo futuro por este concepto. EL ACREEDOR no reconocerá adulteraciones, duplicaciones, borrones, enmendaduras, ni modificación alguna en la información asignada en este contrato. En caso de duda, prevalecerá el ejemplar que obra en poder de EL ACREEDOR.</p>
</div>

<div class="clause">
<p class="clause-title">SEPTIMA: DERECHO DE RETENCIÓN.</p>
<p>Durante la vigencia del presente contrato de préstamo y hasta que EL CLIENTE cumpla con la totalidad de las obligaciones que asume a través de la suscripción del mismo, EL ACREEDOR ejercerá su derecho de retención sobre el (los) bien(es) otorgado(s) en calidad de garantía prendaria conforme a Ley, debiendo restituirlo(s) únicamente una vez que EL CLIENTE hubiera cumplido con todas sus obligaciones pendientes.</p>
</div>

<div class="clause">
<p class="clause-title">OCTAVA: RESTITUCIÓN DE LA GARANTÍA PRENDARIA.</p>
<p>8.1 <strong>Requisitos para la devolución.</strong> Sólo EL CLIENTE o un representante debidamente autorizado mediante Mandato Especial que conste en escritura pública o Carta Notariada, podrán retirar el(los) bien(es) otorgado(s) en prenda, una vez cumplidas las obligaciones. El retiro se hará efectivo un día posterior de la cancelación del préstamo, dentro del horario de atención al público. Cumplido El Plazo, cualquier persona que acredite parentesco, podrá recuperar la prenda pagando el importe del interés, gastos de conservación y otros hasta la fecha del recojo con un máximo de 30 días calendario, caso contrario el ACREEDOR es libre de disponer de la prenda o garantía.</p>
<p>8.2. <strong>Extravío del contrato de préstamo.</strong> El presente contrato de préstamo es el único documento para solicitar la devolución del bien(es) otorgado(s) en prenda. Si este documento es extraviado por El CLIENTE, éste podrá acudir de inmediato a EL ACREEDOR, donde previa identificación se le emitirá la copia legalizada del contrato, bajo su entera responsabilidad y costo.</p>
<p>8.3 <strong>Imposibilidad de devolución.</strong> En caso que EL ACREEDOR por efecto de extravío, robo o daño irreparable durante el transporte o custodia, se vea imposibilitado de devolver los bien(es) otorgado(s) en prenda, repondrá un importe equivalente al Valor Acordado, con la deducción del capital adeudado, los intereses, gastos de la deuda y de conservación de la prenda. EL ACREEDOR garantiza el cuidado del bien otorgado en prenda mediante una póliza de seguros por el valor acordado.</p>
</div>

<div class="clause">
<p class="clause-title">NOVENA: GASTOS DE LA DEUDA Y CONSERVACIÓN DE LA COSA.</p>
<p>9.1 El presente contrato de préstamo genera gastos de conservación y/o cobro descritos y detallados en la cláusula segunda 2.4, por lo que EL CLIENTE acepta voluntariamente reembolsar a EL ACREEDOR los gastos de la deuda descritos en el ANEXO "Comprobante de desembolso y detalle de garantía prendaria" (núm. 5), en forma adicional a la devolución de El Capital y al pago de los intereses emergentes del presente contrato de préstamo.</p>
<p>9.2. EL CLIENTE reconoce en forma estrictamente voluntaria que el cobro de las costas establecidas en la presente clausula, constituyen un legítimo reembolso a favor de EL ACREEDOR, puesto que éste incurre en dichos gastos para posibilitar el presente contrato de préstamo de dinero a intereses y conservar el estado actual del (de los) bien(es) otorgado(s) en prenda.</p>
</div>

<div class="clause">
<p class="clause-title">DECIMA: CESIÓN DE CREDITO, COBRO JUDICIAL, EXTRAJUDICIAL Y PRESCRIPCIÓN.</p>
<p>10.1. Al amparo de los artículos 384 al 394 y normas concordantes del Código Civil, mediante el presente instrumento, EL CLIENTE autoriza expresamente a EL ACREEDOR a ceder a favor de terceros y a cualquier título, el crédito objeto de este contrato, con todos sus accesorios, componentes y prendas pudiendo para el efecto EL ACREEDOR, suscribir los documentos legales que correspondan sin necesidad de aceptación ni notificación del al CLIENTE.</p>
<p>10.2.- Al amparo de los Arts. 404 al 428 del Código Procesal Civil y renunciando al proceso ejecutivo, las partes acuerdan expresamente que el Presente contrato tiene <strong>fuerza coactiva</strong>, constituyéndose en título suficiente para iniciar <strong>proceso coactivo civil</strong>, conforme a la normativa vigente. En caso de incumplimiento, EL ACREEDOR queda plenamente facultado para: 10.2.1 Ejecutar judicialmente el presente contrato exigiendo el pago del capital, intereses, daños y perjuicios. 10.2.2. Disponer de la garantía prendaria, procediendo a su venta directa o judicial, sin necesidad de trámite previo adicional. 10.2.3 Solicitar medidas precautorias como embargo o secuestro del bien dado en garantía. EL CLIENTE renuncia expresamente a cualquier excepción que no sea la de pago documentado.</p>
<p>10.3.- De las gestiones legales, EL CLIENTE se obliga al pago de los honorarios profesionales facturados del abogado que tome EL ACREEDOR para el cobro extrajudicial, sea mediante cartas, reuniones, conciliación, renovación o tasación, anexos de documentos de préstamo o transacción.</p>
<p>10.4.- Al amparo del Art. 446 inc. 3), Art. 1493 del Código Civil EL CLIENTE renuncia expresamente a la prescripción de la presente deuda.</p>
</div>

<div class="clause">
<p class="clause-title">DÉCIMA PRIMERA PAGOS IMPOSITIVOS Y COSTOS DE GRAVAMENES.</p>
<p>EL CLIENTE se obliga voluntariamente al pago de todos los impuestos que genere la presente relación contractual ante las entidades correspondientes, servicio de Impuestos Nacionales y Derechos Reales, sean por EL CLIENTE Y EL ACREEDOR, y liberación de cuentas bancarias.</p>
</div>

<div class="clause">
<p class="clause-title">DECIMO SEGUNDA DOMICILIOS ESPECIAL Y PERSONERÍA.</p>
<p>12.1. Las partes establecen expresamente que los domicilios reales, laboral y número Telf/WhatsApp, señalados en el ANEXO la Solicitud de Crédito y en el Comprobante de Desembolso y Descripción de Garantía Prendarias (núm. 7) tendrán validez de domicilio especial de conformidad al art. 29, parágrafo II del Código Civil. La parte que modifique su domicilio o teléfono durante la vigencia del presente contrato de préstamo, deberá informar a la otra por escrito vía WhatsApp indicando número, domicilio y croquis. Hasta entonces, el domicilio designado en el ANEXO, permanecerá vigente para todos los efectos legales del presente contrato. Asimismo, EL CLIENTE deberá comunicar a EL ACREEDOR sobre cualquier modificación de los datos proporcionados en un plazo máximo de 5 días hábiles de su modificación.</p>
<p>12.2. A los fines del cumplimiento del presente contrato, EL CLIENTE reconoce expresamente la personería de la representante legal de EL ACREEDOR que figura en el presente constancia.</p>
</div>

<div class="clause">
<p class="clause-title">LAS DECIMO TERCERA ACEPTACIÓN Y SUSCRIPCIÓN.</p>
<p>LAS PARTES señaladas en la cláusula primera del presente documento y ANEXO "Comprobante de desembolso y detalle de garantía prendaria", expresan su plena conformidad con todas y cada una de las cláusulas del presente contrato sin reserva ni limitación alguna, por lo que, en señal de conformidad, le suscriben en el lugar y fecha establecidos en el presente documento.</p>
</div>

</div>

<div class="footer">
<p>Fecha: ${date}</p>
<div class="sig-row">
  <div class="sig-block">
    <div class="sig-line"></div>
    <p>XTODOS S.R.L.</p>
  </div>
  <div class="sig-block">
    <div class="sig-line"></div>
    <p>DEUDOR</p>
  </div>
</div>
</div>
<script>window.onload = function () { window.print() }</script>
</body>
</html>`
}
