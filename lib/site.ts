/**
 * Datos del negocio que se muestran en el sitio.
 * COMPLETAR antes de publicar.
 */

/** Datos para transferencia (se muestran al confirmar el pedido y van en el mail al cliente). */
export const TRANSFER_INFO = {
  alias: 'baul.arq',
  /** CBU o CVU (22 dígitos). */
  cuenta: '0000069707000570399031',
  /** 'CBU' para bancos, 'CVU' para billeteras virtuales. */
  tipoCuenta: 'CVU' as 'CBU' | 'CVU',
  entidad: 'ARQ (Garpa S.A.)',
  /** Nombre del titular de la cuenta (opcional, pero ayuda a que el cliente confirme que transfiere bien). */
  titular: 'Patricio Paez',
};

/** Filas a mostrar, en orden, sin las vacías. */
export const transferRows = () =>
  (
    [
      ['Alias', TRANSFER_INFO.alias],
      [TRANSFER_INFO.tipoCuenta, TRANSFER_INFO.cuenta],
      ['Titular', TRANSFER_INFO.titular],
      ['Entidad', TRANSFER_INFO.entidad],
    ] as const
  ).filter(([, v]) => v.trim() !== '');

/**
 * WhatsApp del negocio. Formato internacional para wa.me:
 * 54 (Argentina) + 9 (celular) + 3541 (característica, sin 0) + número (sin 15).
 */
export const WHATSAPP_NUMBER = '5493541614759';
export const WHATSAPP_DISPLAY = '3541 61-4759';
const WHATSAPP_GREETING = 'Hola! Les escribo desde la web de El Baul de los Libros.';

export const whatsappUrl = (text = WHATSAPP_GREETING) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

/**
 * Redes sociales: solo el nombre de usuario, sin @. Si está vacío, el link no aparece.
 */
export const SOCIAL_HANDLES = {
  instagram: 'elbauldeloslibros.ok',
  tiktok: 'elbauldeloslibros.ok',
};

export const SOCIAL_LINKS = [
  { label: 'Instagram', handle: SOCIAL_HANDLES.instagram, url: `https://www.instagram.com/${SOCIAL_HANDLES.instagram}` },
  { label: 'TikTok', handle: SOCIAL_HANDLES.tiktok, url: `https://www.tiktok.com/@${SOCIAL_HANDLES.tiktok}` },
].filter((s) => s.handle.trim() !== '');

/** A dónde el cliente manda el comprobante de la transferencia. */
export const RECEIPT_CONTACT = `WhatsApp ${WHATSAPP_DISPLAY}`;

/** Alcanza con alias o CBU/CVU para poder transferir. */
export const transferInfoComplete = () => TRANSFER_INFO.alias.trim() !== '' || TRANSFER_INFO.cuenta.trim() !== '';

export const PROVINCIAS = [
  'Buenos Aires',
  'Ciudad Autónoma de Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
] as const;

/**
 * Datos del responsable para las páginas legales (términos, privacidad, arrepentimiento).
 * COMPLETAR el CUIT y el email antes de publicar: si están vacíos, no se muestran.
 */
export const LEGAL = {
  titular: 'Patricio Paez',
  cuit: '',
  /** Ciudad y provincia (no hace falta la dirección exacta). */
  domicilio: 'Córdoba, Argentina',
  email: '',
  /** Jurisdicción para conflictos. */
  jurisdiccion: 'la ciudad de Córdoba',
};

/** Formulario oficial de reclamos (Ventanilla Única Federal, Res. SCI 274/2021). */
export const CONSUMER_DEFENSE_URL = 'https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario';

/** Días corridos para arrepentirse de una compra online (Ley 24.240 art. 34; CCyC art. 1110). */
export const WITHDRAWAL_DAYS = 10;
