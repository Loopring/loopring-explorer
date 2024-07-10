export const numberFormat = (
  number: string | number,
  format?: {
    fixed?: number;
    thousandthPlace?: boolean;
  }
) => {
  const numberStr1 = typeof number === 'number' ? number.toString() : number;
  const numberStr2 = format?.fixed !== undefined ? Number(numberStr1).toFixed(format?.fixed) : numberStr1;

  const numberStr3 = format?.thousandthPlace
    ? numberStr2.replace(/(?<!\..*)(\d)(?=(?:\d{3})+(?:\.|$))/g, '$1,')
    : numberStr2;

  return numberStr3;
};
